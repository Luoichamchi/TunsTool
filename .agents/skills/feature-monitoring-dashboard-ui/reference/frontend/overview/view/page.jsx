"use client";
import CardView from "./cardView";
import Grid from "@mui/material/Grid";
import {
  Box,
  Card,
  Tab,
  Tooltip,
  styled,
  tooltipClasses,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import api from "@/app/api/api";
import { getFetcher } from "@/app/api/globalFetcher";
import useSWR from "swr";
import { fetchFakeDuLieuQuanTrac } from "@/app/(DashboardLayout)/fakeData";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { CircularProgress } from "@mui/material";
import ChartOverview from "./chartOverview";
import { fetchFakeDataChartOverview } from "@/app/(DashboardLayout)/fakeData";
import { useSearchParams } from "next/navigation";
import moment from "moment";
import React from "react";
import { StationDataNotFound } from "./stationDataNotFound";
import { toast } from "react-toastify";
import { TabContext, TabList, TabPanel } from "@mui/lab";
import Camera from "./camera";
import mqtt from "mqtt";
import { postFetcher } from "@/app/api/globalFetcher";
import { useRuntimeConfig } from "@/app/utils/hooks/useRuntimeConfig";

import { useMediaQuery } from "@mui/material";
import { useTenantFilterVersion } from "@/app/context/TenantFilterContext";
const normalizeImageSrc = (img) => {
  if (!img) return null;
  return `data:image/jpeg;base64,${img}`;
};

const HtmlTooltip = styled(({ className, ...props }) => (
  <Tooltip {...props} classes={{ popper: className }} />
))(({ theme }) => ({
  [`& .${tooltipClasses.tooltip}`]: {
    backgroundColor: "#f5f5f9",
    color: "rgba(0, 0, 0, 0.87)",
    maxWidth: 220,
    fontSize: theme.typography.pxToRem(12),
    border: "1px solid #dadde9",
    margin: 0,
  },
}));
const normalizeMqttUrl = (value) => {
  if (!value || typeof value !== "string") return null;
  if (!/^(mqtt|ws|wss):\/\//.test(value)) {
    value = "mqtt://" + value;
  }
  try {
    new URL(value);
    return value;
  } catch {
    return null;
  }
};

const pageView = () => {
  const { mqttServer } = useRuntimeConfig();
  const clientRef = useRef(null);
  const [duLieuQuanTrac, setDuLieuQuanTrac] = useState([]);
  const [chartData, setChartData] = useState([]);
  const router = useSearchParams();
  const [isLoadingDuLieuQuanTrac, setIsLoadingDuLieuQuanTrac] = useState(true);
  const [isLoadingChartData, setIsLoadingChartData] = useState(true);
  const [value, setValue] = useState("1");
  const [received, setReceived] = useState(false);
  const handleChange = (event, newValue) => {
    setValue(newValue);
  };
  const theme = useTheme();
  const primaryColor = theme.palette.primary.main;
  const primaryContrastText = theme.palette.primary.contrastText;
  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);
  const stationCodeRef = useRef(null);
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const filterVersion = useTenantFilterVersion();

  const handleMessage = async (topic, message) => {
    try {
      const dataMqtt = JSON.parse(message.toString());

      // Nếu là topic dữ liệu quan trắc
      if (topic !== "VIPiLOG/Station/Status") {
        setReceived(true);
        if (intervalRef.current) clearInterval(intervalRef.current);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        setDuLieuQuanTrac((prev) => {
          const newConfigData = {
            ...prev,
            data: prev.data.map((item) => {
              const key = Object.keys(dataMqtt).find(
                (k) => k.toLowerCase() === item.parameter_code.toLowerCase(),
              );
              return {
                ...item,
                value: key ? dataMqtt[key] : "###",
                color: key ? item.original_color : "gray",
              };
            }),
            time: dataMqtt.timestamp,
          };
          return newConfigData;
        });
      } else if (topic === "VIPiLOG/Station/Status") {
        const data = dataMqtt;
        if (
          data.event === "client.disconnected" &&
          data.clientid === stationCodeRef.current
        ) {
          toast.warning(`Client ${data.clientid} đã ngắt kết nối`, {
            position: "top-right",
            autoClose: 3000,
          });
          await fetchData(clientRef.current);
          setReceived(false);
        }
      }
    } catch (err) {
      toast.error("Lỗi khi parse JSON MQTT", {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  const fetchData = async (client) => {
    try {
      const data = await getFetcher(
        api.GET_STATION_DATA_BY_STATION_ID + `/${router.get("idTram")}`,
      );
      for (const item of data.data) {
        item.original_color = item.color;
        if (item.value === null) {
          item.value = "###";
          item.color = "gray";
        }
      }

      if (data.station_code !== null && data.mqtt_status) {
        stationCodeRef.current = data.station_code;
        client.subscribe(`VIPiLOG/${data.station_code}/data`, (err) => {
          if (err) {
            toast.error("Lỗi khi subscribe MQTT", {
              position: "top-right",
              autoClose: 3000,
            });
          } else {
            timeoutRef.current = setTimeout(() => {
              if (!received) {
                toast.warning("Topic không có dữ liệu hoặc không tồn tại", {
                  position: "top-right",
                  autoClose: 4000,
                });
                if (!intervalRef.current) {
                  intervalRef.current = setInterval(async () => {
                    await fetchData(clientRef.current);
                  }, 60000);
                }
              }
            }, 10000);
          }
        });
        client.subscribe(`VIPiLOG/Station/Status`);
      } else {
        if (!intervalRef.current) {
          intervalRef.current = setInterval(async () => {
            await fetchData(clientRef.current);
          }, 60000);
        }
      }

      setDuLieuQuanTrac(data);
    } catch (error) {
      console.error(error);
      toast.error("Có lỗi xảy ra khi lấy dữ liệu quan trắc", {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setIsLoadingDuLieuQuanTrac(false);
    }
  };
  useEffect(() => {
    if (!mqttServer) return;
    const mqttUrl = normalizeMqttUrl(mqttServer);
    if (!mqttUrl) {
      console.warn("MQTT server không hợp lệ:", mqttServer);
      return;
    }

    const client = mqtt.connect(mqttUrl, {
      clean: true,
    });

    clientRef.current = client;

    client.on("message", handleMessage);
    fetchData(clientRef.current);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      client.off("message", handleMessage);
      client.end(true);
    };
  }, [mqttServer, router.get("idTram"),filterVersion]);

  useEffect(() => {
    let intervalId;
    const fetchData = async () => {
      try {
        const data = await getFetcher(
          api.GET_STATION_DATA_BY_STATION_ID_MAX_DATE +
          `/${router.get("idTram")}`,
        );
        setChartData(data);
      } catch (error) {
        toast.error("Có lỗi xảy ra khi lấy dữ liệu biểu đồ", {
          position: "top-right",
          autoClose: 3000,
        });
      } finally {
        setIsLoadingChartData(false);
      }
    };
    fetchData();
    intervalId = setInterval(fetchData, 60000);
    return () => clearInterval(intervalId);
  }, [router.get("idTram"), filterVersion]);

  // Memoize chart data để tránh tạo arrays mới mỗi lần render
  const memoizedChartData = useMemo(() => {
    return chartData.map((item) => ({
      ...item,
      xData: item.data_points.map((dp) => dp.time),
      yData: item.data_points.map((dp) => dp.value),
    }));
  }, [chartData]);

  const isDuLieuQuanTracEmpty =
    duLieuQuanTrac == null ||
    (Array.isArray(duLieuQuanTrac) && duLieuQuanTrac.length === 0) ||
    (typeof duLieuQuanTrac === "object" &&
      duLieuQuanTrac !== null &&
      Array.isArray(duLieuQuanTrac.data) &&
      duLieuQuanTrac.data.length === 0);
  const isChartDataEmpty =
    chartData == null || (Array.isArray(chartData) && chartData.length === 0);
  const isLoading = isLoadingDuLieuQuanTrac || isLoadingChartData;
  if (isLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="200px"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (isDuLieuQuanTracEmpty && isChartDataEmpty) {
    return <StationDataNotFound />;
  }

  return (
    <div>
      <div
        style={{
          textAlign: "center",
          fontSize: "24px",
          color: "primary.main",
          margin: 0,
          lineHeight: "1.5",
          marginBottom: "10px",
          fontFamily: "'Source Sans Pro', sans-serif",
          fontWeight: 500,
        }}
      >
        <div style={{ display: "inline-block", position: "relative" }}>
          TRẠM{" "}
          <span style={{ textTransform: "uppercase" }}>
            {duLieuQuanTrac.station_name}
          </span>{" "}
          {duLieuQuanTrac.time !== null && duLieuQuanTrac.time !== undefined ? (
            <span>
              (
              {moment
                .utc(duLieuQuanTrac.time)
                .utcOffset(7)
                .format("DD/MM/YYYY HH:mm:ss")}
              )
            </span>
          ) : (
            ""
          )}
          {((received !== true && duLieuQuanTrac.mqtt_status === true) ||
            duLieuQuanTrac.status !== "active") && (
              <HtmlTooltip
                title={
                  <React.Fragment>
                    {duLieuQuanTrac.mqtt_status === true && (
                      <p style={{ margin: 0, padding: 0 }}>
                        Trạng thái MQTT:{" "}
                        {received ? "Đang hoạt động" : "Mất tín hiệu"}
                      </p>
                    )}
                    <p style={{ margin: 0, padding: 0 }}>
                      Trạng thái dữ liệu:{" "}
                      {duLieuQuanTrac.status === "active"
                        ? "Đang hoạt động"
                        : "Mất tín hiệu"}
                    </p>
                  </React.Fragment>
                }
              >
                <span
                  style={{
                    position: "absolute",
                    top: isMobile ? 35 : 0,
                    right: isMobile ? 25 : -25,
                    display: "inline-block",
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    backgroundColor: "red",
                    border: "2px solid #fff",
                    zIndex: 2,
                  }}
                ></span>
              </HtmlTooltip>
            )}
        </div>
      </div>
      <div>
        <Card
          variant="outlined"
          sx={{
            backgroundColor:
              theme.palette.mode === "dark" ? "#1E1E1E" : "#FFFFFF",
            padding: isMobile ? "10px" : ""
          }}
        >
          <Grid container spacing={2}>
            {duLieuQuanTrac?.data &&
              duLieuQuanTrac.data.map((item, idx) => {
                return (
                  <Grid
                    key={idx}
                    size={{
                      xs: 6,
                      lg: 2,
                      md: 4,
                      sm: 6,
                    }}
                  >
                    <CardView
                      chiTieu={item.chiTieu}
                      trangThai={
                        item.value === "###"
                          ? "Không có dữ liệu"
                          : item.value < item.min_value || item.value > item.max_value
                            ? "Vượt ngưỡng"
                            : "Normal"
                      }
                      soLieu={item.value}
                      gioiHan={
                        item.min_value +
                        " - " +
                        item.max_value +
                        " " +
                        item.unit
                      }
                      color={item.color}
                      donVi={item.unit}
                    />
                  </Grid>
                );
              })}
          </Grid>
        </Card>
      </div>
      <div style={{ marginTop: "5px" }}>
        <TabContext value={value} sx={{ padding: 0 }}>
          <Box
            sx={{
              borderBottom: "none",
              padding: 0,
              position: "sticky",
              top: 0,
              zIndex: 10,
              backdropFilter: "blur(5px)",
              // backgroundColor:
              //   theme.palette.mode === "dark"
              //     ? "rgba(30,30,30,0.92)"
              //     : "rgba(255,255,255,0.92)",
            }}
          >
            <TabList
              onChange={handleChange}
              sx={{
                // borderBottom: "none",
                p: 0.5,
                "& .MuiTabs-indicator": { display: "none" },
                "& .MuiTab-root": {
                  textTransform: "none",
                  fontWeight: 500,
                  borderRadius: "8px",
                  minHeight: "40px",
                  color: "#6B7280",
                  fontSize: "0.95rem",
                  transition: "all 0.2s ease",
                },
                "& .Mui-selected": {
                  backgroundColor: "#E8F5E9",
                  color: "#2E7D32",
                  fontWeight: 600,
                },
                "& .MuiTab-root:hover": {
                  backgroundColor: "#F1F5F9",
                },
              }}
            >
              <Tab label="Dữ liệu" value="1" />
              <Tab label="Camera quan sát trạm" value="2" />
            </TabList>
          </Box>
          <TabPanel value="1" sx={{ padding: 0 }}>
            <Card
              variant="outlined"
              sx={{
                marginTop: "5px",
                backgroundColor:
                  isMobile ? theme.palette.mode === "dark" ? "#1E1E1E" : "#F3F8FB" :
                    theme.palette.mode === "dark" ? "#1E1E1E" : "#FFFFFF",
                padding: isMobile ? "0" : "",
                border: isMobile ? "none" : "",

              }}
            >
              <Grid container spacing={2}>
                {memoizedChartData.map((item, idx) => {
                  return (
                    <Grid
                      key={`${idx}`}
                      size={{
                        xs: 12,
                        lg: 6,
                        md: 12,
                        sm: 12,
                      }}
                    >
                      <div style={{ padding: "0" }}>
                        <ChartOverview
                          colorChart={item.color}
                          tenBieuDo={item.chiTieu}
                          donVi={item.unit}
                          xData={item.xData}
                          yData={item.yData}
                          primaryColor={primaryColor}
                          primaryContrastText={primaryContrastText}
                          showTime={true}
                          isMobile={isMobile}
                        />
                      </div>
                    </Grid>
                  );
                })}
              </Grid>
            </Card>
          </TabPanel>
          <TabPanel value="2" sx={{ padding: 0 }}>
            <CameraTabContent
              stationId={router.get("idTram")}
              primaryColor={primaryColor}
              primaryContrastText={primaryContrastText}
            />
          </TabPanel>
        </TabContext>
        <style jsx global>{`
          .mui-j4isg9-MuiCardContent-root {
            padding: 0;
          }
        `}</style>
      </div>

    </div>
  );
};

// Component lấy cameras từ API theo station_id — memo để tránh re-render khi parent update MQTT
const CameraTabContent = React.memo(({ stationId, primaryColor, primaryContrastText }) => {
  const { data, error, isLoading } = useSWR(
    stationId ? `${api.GET_CAMERA_LIST}?station_id=${stationId}&page=0` : null,
    getFetcher,
    { revalidateOnFocus: false, revalidateOnReconnect: false }
  );

  // Memoize camera sources để tránh tạo object mới mỗi lần render
  const cameraSources = useMemo(() => {
    const cameras = data?.data || [];
    return cameras.map((item) => ({
      id: item.id,
      link: item.rtsp_link,
      name: item.name,
    }));
  }, [data]);

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (cameraSources.length === 0) {
    return (
      <Card variant="outlined" sx={{ marginTop: "5px" }}>
        <Box sx={{ p: 4, textAlign: "center" }}>
          <Typography color="text.secondary">
            Chưa có camera nào cho trạm này
          </Typography>
        </Box>
      </Card>
    );
  }

  return (
    <Card variant="outlined" sx={{ marginTop: "5px" }}>
      <Grid container spacing={2}>
        {cameraSources.map((source) => (
          <Grid key={source.id} size={{ xs: 12, lg: 6, md: 12, sm: 12 }}>
            <Camera
              source={source}
              primaryColor={primaryColor}
              primaryContrastText={primaryContrastText}
            />
          </Grid>
        ))}
      </Grid>
    </Card>
  );
});

export default pageView;
