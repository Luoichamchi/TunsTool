"use client";
import React from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import {
  Grid,
  Box,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  CircularProgress,
} from "@mui/material";
import Link from "next/link";
import moment from "moment";
import { getFetcher } from "@/app/api/globalFetcher";
import api from "@/app/api/api";
import { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import mqtt from "mqtt";
import { useRuntimeConfig } from "@/app/utils/hooks/useRuntimeConfig";
import { a } from "react-spring";
import { useContext } from 'react';
import { useTenantFilterVersion } from "@/app/context/TenantFilterContext";
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

const stationData = () => {
  const { mqttServer } = useRuntimeConfig();
  const filterVersion = useTenantFilterVersion();
  const [dataQuanTrac, setDataQuanTrac] = useState([]);
  const [stationDataMap, setStationDataMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [statusMqtt, setStatusMqtt] = useState({});
  const [received, setReceived] = useState({});
  const clientRef = useRef(null);
  const intervalRef = useRef({});
  const timeoutRef = useRef({});
  const stationDataMapRef = useRef(null)
  const handleMessage = async (topic, message) => {
    try {
      const dataMqtt = JSON.parse(message.toString());
      const matchedStation = Object.values(stationDataMapRef.current).find(
        (st) => st.station_code === topic.split("/")[1]
      );
      if (topic !== "VIPiLOG/Station/Status" && matchedStation) {
        setStationDataMap((prev) => {
          const updatedMap = { ...prev };
          Object.keys(updatedMap).forEach((stationKey) => {
            const station = updatedMap[stationKey];
            if (station.station_code === dataMqtt.station_code) {
              setReceived((prevReceived) => ({
                ...prevReceived,
                [stationKey]: true,
              }));
              setStatusMqtt((prevStatus) => ({
                ...prevStatus,
                [stationKey]: "Đang hoạt động",
              }));
  
              if (intervalRef.current[`interval_${stationKey}`]) {
                clearInterval(intervalRef.current[`interval_${stationKey}`]);
              }
              if (timeoutRef.current[stationKey]) {
                clearTimeout(timeoutRef.current[stationKey]);
              }
  
              const newData = station.data.map((item) => {
                const key = Object.keys(dataMqtt).find(
                  (k) => k.toLowerCase() === item.parameter_code.toLowerCase()
                );
                return {
                  ...item,
                  value: key ? dataMqtt[key] : "###",
                  color: key ? item.original_color || item.color : "gray",
                };
              });
  
              updatedMap[stationKey] = {
                ...station,
                data: newData,
                time: dataMqtt.timestamp || station.time,
                status_realtime: "active",
              };
            }
          });
          return updatedMap;
        });
      }
      else if (topic === "VIPiLOG/Station/Status") {
        const data = dataMqtt;
        const matchedStation = Object.values(stationDataMapRef.current).find(
          (st) => st.station_code === data.clientid
        );
  
        if (!matchedStation){
          return;
        } 
        else{
          if (data.event === "client.disconnected") {
            toast.warning(`Trạm ${matchedStation.station_name} đã ngắt kết nối`, {
              position: "top-right",
              autoClose: 3000,
            });
    
           await fetchStationData(matchedStation,clientRef.current)
            
          }
        }
      }
    } catch (err) {
      toast.error("Lỗi khi parse JSON MQTT",{
        position: "top-right",
        autoClose: 3000,
      })
    }
  };
  

  const fetchStationData = async (station, client) => {
    try {
      const data = await getFetcher(
        api.GET_STATION_DATA_BY_STATION_ID + `/${station.id}`,
      );
      setStationDataMap((prev) => {
        const updated = {
          ...prev,
          [station.id]: data,
        };
        stationDataMapRef.current = updated;
        return updated;
      });
      if (data && data.station_code && data.mqtt_status) {
        setStatusMqtt((prev) => ({
          ...prev,
          [station.id]: "Đang kết nối MQTT",
        }));
  
        setReceived((prev) => ({
          ...prev,
          [station.id]: false,
        }));
  
        client.subscribe(`VIPiLOG/${data.station_code}/data`, (err) => {
          if (err) {
            toast.error("Lỗi khi subscribe MQTT của trạm " + station.name, {
              position: "top-right",
              autoClose: 3000,
            });
          }
          else {
            timeoutRef.current[station.id] = setTimeout(() => {
              setReceived((prevReceived) => {
                if (!prevReceived[station.id]) {
                  setStatusMqtt((prevStatus) => ({
                    ...prevStatus,
                    [station.id]: "Mất tín hiệu MQTT",
                  }));
                  if(!intervalRef.current[`interval_${station.id}`]) {
                    intervalRef.current[`interval_${station.id}`] = setInterval(async () => {
                      await fetchStationData(station, clientRef.current);
                    }, 60000);
                  }
                }
                return prevReceived;
              });
            }, 10000);
          }
        });
      } else {
        if (!intervalRef.current[`interval_${station.id}`]) {
          intervalRef.current[`interval_${station.id}`] = setInterval(async () => {
            await fetchStationData(station, clientRef.current);
          }, 60000);
        }
      }
    } catch (error) {
      toast.error(`Không thể tải dữ liệu trạm ${station.name}`);
    }
  };
  


  useEffect(() => {
    if (!mqttServer) return;
    const mqttUrl = normalizeMqttUrl(mqttServer);
    setDataQuanTrac([]);
    setStationDataMap({});
    stationDataMapRef.current = {};
    setStatusMqtt({});
    setReceived({});
    setLoading(true);

    if (!mqttUrl) {
      console.warn("MQTT server không hợp lệ:", mqttServer);
      return;
    }
    const client = mqtt.connect(mqttUrl, { clean: true });
    client.subscribe("VIPiLOG/Station/Status")
    clientRef.current = client;
  
    getFetcher(`${api.GET_STATION_LIST}?page=0&page_size=100`)
      .then((data) => {
        setDataQuanTrac(data.data);
        data.data.forEach(async (station) => {
         await fetchStationData(station, clientRef.current);
        });
      })
      .catch((error) => {
        toast.error("Có lỗi xảy ra khi lấy danh sách trạm", {
          position: "top-right",
          autoClose: 3000,
        });
      })
      .finally(() => {
        setLoading(false);
      });
  
    client.on("message", handleMessage);
  
    return () => {
      client.off("message", handleMessage);
      client.end(true);
      Object.keys(timeoutRef.current).forEach((key) => {
        clearTimeout(timeoutRef.current[key]);
      });
      Object.keys(intervalRef.current).forEach((key) => {
        clearInterval(intervalRef.current[key]);
      });
    };
  }, [mqttServer,filterVersion]);
  

  if (loading) {
    return (
      <Grid item size={{ xs: 12, md: 6, lg: 4 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100%",
          }}
        >
          <CircularProgress />
        </div>
      </Grid>
    );
  }
  return (
    <>
      <Grid container spacing={2}>
        {dataQuanTrac.map((station) => {
          const stationLive = stationDataMap[station.id];
          const isConnected =
            station.mqtt_status !== true
              ? station.status === "active"
              : stationLive && stationLive.status_realtime === "active";
          const statusColor = isConnected ? "green" : "#ff6b6b";
          const borderColor = isConnected ? "#18a84a" : "#777";
          const statusText = isConnected ? "Kết nối" : "Mất kết nối";
          return (
          <Grid item key={station.id} size={{ xs: 12, md: 4, lg: 3 }}>
            <Box
              sx={{
                width: "100%",
                height: "100%",
                minHeight: "auto",
                display: "flex",
                flexDirection: "column",
                border: "2px solid",
                borderColor,
                borderRadius: "12px",
                backgroundColor: "background.paper",
                overflow: "hidden",
                transition: "all 0.2s ease-in-out",
                "&:hover": {
                  borderColor,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                  transform: "translateY(-2px)",
                },
              }}
            >
              <Link style={{ width: "100%", height: "100%" }} href={`/apps/overview/view/?idTram=${station.id}`}>
                <Card
                  sx={{
                    borderRadius: 2,
                    position: "relative",
                    cursor: "pointer",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    minHeight: "200px", 
                    width: "100%", 
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    overflow: "visible", 
                  }}
                >
                  <span
                    style={{
                      position: "absolute",
                      top: 16,
                      right: 16,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      color: statusColor,
                      fontWeight: 600,
                      fontSize: 14,
                      zIndex: 2,
                    }}
                    title={statusText}
                  >
                    <span
                      style={{
                        display: "inline-block",
                        width: 14,
                        height: 14,
                        borderRadius: "50%",
                        backgroundColor: statusColor,
                        border: "2px solid #fff",
                      }}
                    />
                    {statusText}
                  </span>
                  <CardContent
                    sx={{
                      p: 2,
                      color: statusColor,
                      flex: 1, 
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "flex-start", 
                      overflow: "visible", 
                      padding: 0,
                      "& .MuiTypography-root": {
                        mb: 1.5,
                      },
                      "& .MuiTypography-root:last-child": {
                        mb: 0,
                      },
                    }}
                  >
                    <div
                      style={{
                        overflowX: "auto",
                        overflowY: "visible",
                        width: "100%",
                      }}
                    >
                      <p
                        style={{
                          fontSize: "15px",
                          fontWeight: 600,
                          color: "#1f2937",
                          margin: "0 0 4px 0",
                        }}
                      >
                        {station.name || station.station_name || "N/A"}
                      </p>
                      {station.mqtt_status !== true && (
                        <p style={{ fontSize: "12px", margin: "0 0 2px 0", color: "#777" }}>
                        Trạng thái:{" "}
                        {statusText}
                        </p>
                      )}
                      {station.mqtt_status === true && (
                        <p style={{ fontSize: "12px", margin: "0 0 2px 0", color: "#777" }}>
                        Trạng thái MQTT:{" "} {statusText}
                        
                        </p>
                      )}
                      {/* <p style={{ fontSize: "12px", margin: "0 0 2px 0" }}>
                        Trạng thái:{" "}
                        {station.mqtt_status !== true? station.status === 'active' 
                          ? "Đang hoạt động"
                          : "Mất tín hiệu" :stationLive && stationLive.status === 'active'
                          ? "Đang hoạt động"
                          : "Mất tín hiệu"}
                      </p> */}
                      <p style={{ fontSize: "12px", margin: "0 0 8px 0", color: "#777" }}>
                        Thời gian: {" "}
                        {stationLive &&
                        stationLive.time != null
                          ? moment
                              .utc(stationLive.time).utcOffset(7)
                              .format("DD/MM/YYYY HH:mm:ss")
                          : "Đang cập nhật"}
                      </p>
                      <Table
                        size="small"
                        sx={{
                          width: "100%",
                          tableLayout: "auto",
                          
                          border: (theme) =>
                            `1px solid ${
                              theme.palette.mode === "dark"
                                ? theme.palette.divider
                                : "#e0e0e0"
                            }`,
                          "& .MuiTableCell-root": {
                            border: (theme) =>
                              `1px solid ${
                                theme.palette.mode === "dark"
                                  ? theme.palette.divider
                                  : "#e0e0e0"
                              }`,
                              textAlign: "center",
                              padding: "4px 8px",
                          },
                        }}
                      >
                        <TableHead>
                          <TableRow
                            sx={{
                              backgroundColor: (theme) => {
                                const isActive =
                                  station.mqtt_status !== true
                                    ? station.status === "active"
                                    : stationLive &&
                                      stationLive.status_realtime === "active";
                                if (isActive) {
                                  return theme.palette.mode === "dark"
                                    ? theme.palette.success.dark
                                    : "#d4f3e9";
                                } else {
                                  return theme.palette.mode === "dark"
                                    ? theme.palette.grey[800]
                                    : "#808080";
                                }
                              },
                            }}
                          >
                            <TableCell
                              sx={{
                                fontSize: 11,
                                padding: "4px 8px",
                                fontWeight: "bold",
                                color: (theme) =>
                                  theme.palette.mode === "dark"
                                    ? theme.palette.text.primary
                                    : theme.palette.text.primary,
                              }}
                            >
                              Thông số
                            </TableCell>
                            <TableCell
                              sx={{
                                fontSize: 11,
                                padding: "4px 8px",
                                fontWeight: "bold",
                                color: (theme) =>
                                  theme.palette.mode === "dark"
                                    ? theme.palette.text.primary
                                    : theme.palette.text.primary,
                              }}
                            >
                              Giá trị
                            </TableCell>
                            <TableCell
                              sx={{
                                fontSize: 11,
                                padding: "4px 8px",
                                fontWeight: "bold",
                                color: (theme) =>
                                  theme.palette.mode === "dark"
                                    ? theme.palette.text.primary
                                    : theme.palette.text.primary,
                              }}
                            >
                              Đơn vị
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {stationLive &&
                            Array.isArray(stationLive.data) &&
                            stationLive.data.map((row, idx) => (
                              <TableRow key={idx}>
                                <TableCell style={{ fontSize: 12, padding: 4 }}>
                                  {row.chiTieu}
                                </TableCell>
                                <TableCell style={{ fontSize: 12, padding: 4 }}>
                                  {row.value}
                                </TableCell>
                                <TableCell style={{ fontSize: 12, padding: 4 }}>
                                  {row.unit}
                                </TableCell>
                              </TableRow>
                            ))}
                          {(!stationLive ||
                            !Array.isArray(stationLive.data) ||
                            stationLive.data.length === 0) && (
                            <TableRow>
                              <TableCell
                                colSpan={3}
                                style={{
                                  fontSize: 12,
                                  padding: 4,
                                  textAlign: "center",
                                }}
                              >
                                Không có dữ liệu
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </Box>
          </Grid>
        );
        })}
      </Grid>
</>
  );
};

export default stationData;
