"use client";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Tooltip,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import React, {
  useRef,
  useEffect,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";
import { useMap } from "react-leaflet";
import { fetchFakeDuLieuQuanTrac } from "@/app/(DashboardLayout)/fakeData";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Grid,
  Box,
  Typography,
  CircularProgress,
  Button,
  useTheme,
} from "@mui/material";
import api from "@/app/api/api";
import { getFetcher } from "@/app/api/globalFetcher";
import moment from "moment";
import { toast } from "react-toastify";
import { Toast } from "@capacitor/toast";
import mqtt from "mqtt";
import StationInfoDrawer from "./mobile-view/StationInfoDrawer";
import { useTenantFilterVersion } from "@/app/context/TenantFilterContext";

// Fix Leaflet default icon — chỉ chạy trên client
if (typeof window !== "undefined") {
  const L = require("leaflet");
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png").default?.src || require("leaflet/dist/images/marker-icon-2x.png"),
    iconUrl: require("leaflet/dist/images/marker-icon.png").default?.src || require("leaflet/dist/images/marker-icon.png"),
    shadowUrl: require("leaflet/dist/images/marker-shadow.png").default?.src || require("leaflet/dist/images/marker-shadow.png"),
  });
}

const donVi = ["pH", "mg/l", "mg/l", "mg/l", "°C", "m3/h"];

// Component để điều khiển popup programmatically
const MarkerWithPopup = forwardRef(
  (
    {
      position,
      icon,
      stationData,
      stationInfo,
      stationStatusMap,
      statusMqtt,
      dataTram,
      isMobile,
      onMobileClick,
    },
    ref,
  ) => {
    const markerRef = useRef(null);

    useImperativeHandle(ref, () => ({
      openPopup: () => {
        if (markerRef.current) {
          markerRef.current.openPopup();
        }
      },
    }));

    return (
      <Marker ref={markerRef} position={position} icon={icon}>
        <Tooltip
          direction="bottom"
          offset={[0, 10]}
          permanent
          eventHandlers={{
            click: (e) => {
              e.originalEvent.stopPropagation();
              if (isMobile) {
                if (onMobileClick) onMobileClick(stationInfo, dataTram);
              } else {
                if (markerRef.current) markerRef.current.openPopup();
              }
            },
            mousedown: (e) => {
              e.originalEvent.stopPropagation();
            },
          }}
        >
          <div
            style={{
              color: "white",
              fontWeight: "bold",
              padding: "5px 10px",
              borderRadius: "4px",
              width: "100%",
              height: "100%",
              backgroundColor:
                stationStatusMap[stationInfo.id] === "vuotNguong"
                  ? "red"
                  : stationStatusMap[stationInfo.id] === "chuanBiVuot"
                    ? "#FFA500"
                    : stationStatusMap[stationInfo.id] === "trongNguong"
                      ? "green"
                      : "gray",
              cursor: "pointer",
              pointerEvents: "auto",
            }}
            onClick={(e) => {
              e.stopPropagation();
              if (isMobile) {
                if (onMobileClick) onMobileClick(stationInfo, dataTram);
              } else {
                if (markerRef.current) markerRef.current.openPopup();
              }
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
            }}
          >
            {stationInfo.name}
          </div>
        </Tooltip>
        {isMobile ? null : (
          <Popup style={{ margin: 0, padding: 0 }}>
            <div
              style={{
                overflowX: "hidden",
                minWidth: 220,
                maxWidth: 320,
              }}
            >
              <p
                style={{
                  fontSize: "15px",
                  fontWeight: 600,
                  margin: "0 0 4px 0",
                }}
              >
                {stationInfo.name}
              </p>
              <p style={{ fontSize: "12px", margin: "0 0 2px 0" }}>
                Toạ độ: {position[0]}, {position[1]}
              </p>
              <p style={{ fontSize: "12px", margin: "0 0 2px 0" }}>
                Địa chỉ: {stationInfo.address}
              </p>
              {stationInfo.mqtt_status !== true && (
                <p
                  style={{
                    fontSize: "12px",
                    margin: "0 0 2px 0",
                    color:
                      stationInfo.status === "active" ? "green" : "#f44336",
                  }}
                >
                  Trạng thái:{" "}
                  {stationInfo.status === "active"
                    ? "Đang hoạt động"
                    : "Mất tín hiệu"}
                </p>
              )}
              {stationInfo.mqtt_status === true && (
                <p
                  style={{
                    fontSize: "12px",
                    margin: "0 0 2px 0",
                    color:
                      statusMqtt[stationInfo.id] === "Đang hoạt động"
                        ? "green"
                        : "#f44336",
                  }}
                >
                  Trạng thái MQTT: {statusMqtt[stationInfo.id] || "Chờ kết nối"}
                </p>
              )}
              <p style={{ fontSize: "12px", margin: "0 0 8px 0" }}>
                Thời gian:
                {dataTram.time != null
                  ? moment
                      .utc(dataTram.time)
                      .utcOffset(7)
                      .format("DD/MM/YYYY HH:mm:ss")
                  : "Đang cập nhật"}
              </p>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: "#d4f3e9" }}>
                    <TableCell style={{ fontSize: 12, padding: 4 }}>
                      <strong>Thông số</strong>
                    </TableCell>
                    <TableCell style={{ fontSize: 12, padding: 4 }}>
                      <strong>Giá trị</strong>
                    </TableCell>
                    <TableCell style={{ fontSize: 12, padding: 4 }}>
                      <strong>Đơn vị</strong>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Array.isArray(dataTram.data) &&
                    dataTram.data.map((row, idx) => (
                      <TableRow key={idx}>
                        <TableCell style={{ fontSize: 12, padding: 4 }}>
                          {row.chiTieu ||
                            row.parameter_name ||
                            row.parameter_code}
                        </TableCell>
                        <TableCell style={{ fontSize: 12, padding: 4 }}>
                          {row.giaTri || row.value}
                        </TableCell>
                        <TableCell style={{ fontSize: 12, padding: 4 }}>
                          {row.donVi || row.unit}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          </Popup>
        )}
      </Marker>
    );
  },
);

function isRealisticLatLng(latNum, lngNum) {
  // Lat: -90 đến 90, Lng: -180 đến 180
  if (
    typeof latNum !== "number" ||
    typeof lngNum !== "number" ||
    isNaN(latNum) ||
    isNaN(lngNum)
  )
    return false;
  if (latNum < -90 || latNum > 90) return false;
  if (lngNum < -180 || lngNum > 180) return false;
  // Có thể kiểm tra thêm các vùng không thực tế nếu muốn (ví dụ: lat/lng = 0,0)
  // Loại bỏ các điểm ở (0,0) hoặc gần đó (thường là lỗi)
  if (Math.abs(latNum) < 0.0001 && Math.abs(lngNum) < 0.0001) return false;
  return true;
}

import useIsMobile from "@/app/utils/hooks/useIsMobile";

const MapContent = () => {
  const theme = useTheme();
  const isMobile = useIsMobile();
  const filterVersion = useTenantFilterVersion();
  const [dataQuanTrac, setDataQuanTrac] = useState([]);
  const [stationDataMap, setStationDataMap] = useState({});
  const [thongKe, setThongKe] = useState({});
  const [loading, setLoading] = useState(false);
  const clientRef = useRef(null);
  const intervalRef = useRef({});
  const timeoutRef = useRef({});
  const [statusMqtt, setStatusMqtt] = useState({});
  const [received, setReceived] = useState({});
  const [mapCenter, setMapCenter] = useState([19.808855, 105.7086527]);
  const [mapZoom, setMapZoom] = useState(13);
  const [stationStatusMap, setStationStatusMap] = useState({});
  const mapRef = useRef(null);
  const hasInitializedBounds = useRef(false);
  const popupRefs = useRef({});
  const [show, setShow] = useState(false);
  const stationDataMapRef = useRef(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedStation, setSelectedStation] = useState(null);
  const [L, setL] = useState(null);
  const [icons, setIcons] = useState({});
  const handleMobileMarkerClick = (stationInfo) => {
    setSelectedStation({ stationInfo });
    setDrawerOpen(true);
  };
useEffect(() => {
  import("leaflet").then((leaflet) => {
    const L = leaflet.default;

    delete L.Icon.Default.prototype._getIconUrl;

    L.Icon.Default.mergeOptions({
      iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
      iconUrl: require("leaflet/dist/images/marker-icon.png"),
      shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
    });

    const greenIcon = new L.Icon({
      iconUrl: "/images/mapsIcon/marker-icon-2x-green.png",
      shadowUrl: "/images/mapsIcon/marker-shadow.png",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
    });

    const redIcon = new L.Icon({
      iconUrl: "/images/mapsIcon/marker-icon-2x-red.png",
      shadowUrl: "/images/mapsIcon/marker-shadow.png",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
    });

    setL(L);
    setIcons({ greenIcon, redIcon });
  });
}, []);
  // Hàm để disable map interaction
  const disableMapInteraction = () => {
    if (mapRef.current) {
      mapRef.current.dragging.disable();
      mapRef.current.scrollWheelZoom.disable();
      mapRef.current.doubleClickZoom.disable();
      mapRef.current.boxZoom.disable();
      mapRef.current.keyboard.disable();
      mapRef.current.touchZoom.disable();
    }
  };

  // Hàm để enable map interaction
  const enableMapInteraction = () => {
    if (mapRef.current) {
      mapRef.current.dragging.enable();
      mapRef.current.scrollWheelZoom.enable();
      mapRef.current.doubleClickZoom.enable();
      mapRef.current.boxZoom.enable();
      mapRef.current.keyboard.enable();
      mapRef.current.touchZoom.enable();
    }
  };
  // useEffect(() => {
  //   getFetcher(api.GET_STATION_LIST).then((data) => {
  //     setDataQuanTrac(data.data);
  //   }).catch(error => {
  //     toast.error("Có lỗi xảy ra khi lấy dữ liệu trạm", {
  //       position: "top-right",
  //       autoClose: 3000,
  //     });
  //   });
  // }, []);
  // 👉 Hàm tách riêng logic tính thống kê
  const calculateThongKe = (stationDataMap, dataQuanTrac) => {
    const thongKe = {
      vuotNguong: 0,
      trongNguong: 0,
      matTinHieu: 0,
      tongTram: 0,
    };

    const newStationStatusMap = {};

    Object.keys(stationDataMap).forEach((stationId) => {
      const stationInfo = dataQuanTrac.find(
        (s) => s.id === parseInt(stationId),
      );
      if (!stationInfo || !stationInfo.coordinates) return;

      const [lat, lng] = stationInfo.coordinates.split(",");
      const latNum = parseFloat(lat);
      const lngNum = parseFloat(lng);
      if (!isRealisticLatLng(latNum, lngNum)) return;

      const stationData = stationDataMap[stationId];

      if (
        !stationData ||
        !Array.isArray(stationData.data) ||
        stationData.data.length === 0
      ) {
        thongKe.matTinHieu += 1;
        newStationStatusMap[stationId] = "matTinHieu";
        return;
      }

      thongKe.tongTram += 1;

      let isVuot = false;

      stationData.data.forEach((item) => {
        if (item.value < item.min_value || item.value > item.max_value) {
          isVuot = true;
        }
      });

      let status = "trongNguong";
      if (isVuot) {
        thongKe.vuotNguong += 1;
        status = "vuotNguong";
      } else {
        thongKe.trongNguong += 1;
      }

      newStationStatusMap[stationId] = status;
    });

    return { thongKe, stationStatusMap: newStationStatusMap };
  };

  const handleMessage = async (topic, message) => {
    try {
      const dataMqtt = JSON.parse(message.toString());
      if (topic !== "VIPiLOG/Station/Status") {
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
                  (k) => k.toLowerCase() === item.parameter_code.toLowerCase(),
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
                status: "active",
              };
            }
          });
          return updatedMap;
        });
      } else if (topic === "VIPiLOG/Station/Status") {
        const data = dataMqtt;
        const matchedStation = Object.values(stationDataMapRef.current).find(
          (st) => st.station_code === data.clientid,
        );

        if (!matchedStation) {
          return;
        } else {
          if (data.event === "client.disconnected") {
            isMobile
              ? await Toast.show({
                  text: `Trạm ${matchedStation.station_name} đã ngắt kết nối`,
                  duration: "short",
                  position: "bottom",
                })
              : toast.warning(
                  `Trạm ${matchedStation.station_name} đã ngắt kết nối`,
                  {
                    position: "top-right",
                    autoClose: 3000,
                  },
                );

            await fetchStationData(matchedStation, clientRef.current);
          }
        }
      }
    } catch (err) {
      isMobile
        ? await Toast.show({
            text: "Lỗi khi parse JSON MQTT",
            duration: "short",
            position: "bottom",
          })
        : toast.error("Lỗi khi parse JSON MQTT", {
            position: "top-right",
            autoClose: 3000,
          });
    }
  };

  const fetchStationData = async (station, client) => {
    if (!station.coordinates || station.coordinates === "null") {
      return;
    }
    const [lat, lng] = station.coordinates.split(",");
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    if (!isRealisticLatLng(latNum, lngNum)) {
      return;
    }
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

        client.subscribe(`VIPiLOG/${data.station_code}/data`, async (err) => {
          if (err) {
            isMobile
              ? await Toast.show({
                  text: "Lỗi khi subscribe MQTT của trạm " + station.name,
                  duration: "short",
                  position: "bottom",
                })
              : toast.error("Lỗi khi subscribe MQTT của trạm " + station.name, {
                  position: "top-right",
                  autoClose: 3000,
                });
          } else {
            timeoutRef.current[station.id] = setTimeout(() => {
              setReceived((prevReceived) => {
                if (!prevReceived[station.id]) {
                  setStatusMqtt((prevStatus) => ({
                    ...prevStatus,
                    [station.id]: "Mất tín hiệu MQTT",
                  }));
                  if (!intervalRef.current[`interval_${station.id}`]) {
                    intervalRef.current[`interval_${station.id}`] = setInterval(
                      () => {
                        fetchStationData(station, client);
                      },
                      60000,
                    );
                  }
                }

                return prevReceived;
              });
            }, 10000);
          }
        });
      } else {
        if (!intervalRef.current[`interval_${station.id}`]) {
          intervalRef.current[`interval_${station.id}`] = setInterval(() => {
            fetchStationData(station, client);
          }, 60000);
        }
      }
    } catch (error) {
      isMobile
        ? await Toast.show({
            text: `Không thể tải dữ liệu trạm ${station.name}`,
            duration: "short",
            position: "bottom",
          })
        : toast.error(`Không thể tải dữ liệu trạm ${station.name}`);
    }
  };

  useEffect(() => {
    setDataQuanTrac([]);
    setStationDataMap({});
    stationDataMapRef.current = {};
    setStatusMqtt({});
    setReceived({});
    hasInitializedBounds.current = false;

    const client = mqtt.connect("wss://mqtt.vpts.vn:8084/mqtt", {
      clean: true,
    });
    client.subscribe("VIPiLOG/Station/Status");
    clientRef.current = client;
    getFetcher(`${api.GET_STATION_LIST}?page=0&page_size=100`)
      .then((data) => {
        setDataQuanTrac(data.data);
        data.data.forEach((station) => {
          fetchStationData(station, client);
        });
      })
      .catch(async (error) => {
        isMobile
          ? await Toast.show({
              text: "Có lỗi xảy ra khi lấy danh sách trạm",
              duration: "short",
              position: "bottom",
            })
          : toast.error("Có lỗi xảy ra khi lấy danh sách trạm", {
              position: "top-right",
              autoClose: 3000,
            });
      });
    client.on("message", handleMessage);

    // cleanup
    return () => {
      client.off("message", handleMessage);
      client.end(true);
      Object.keys(timeoutRef.current).forEach((key) => {
        clearTimeout(timeoutRef.current[key]);
      });
      Object.keys(intervalRef.current).forEach((key) => {
        clearInterval(intervalRef.current[key]);
      });
      enableMapInteraction();
    };
  }, [filterVersion]);

  useEffect(() => {
    const { thongKe: newThongKe, stationStatusMap: newStationStatusMap } =
      calculateThongKe(stationDataMap, dataQuanTrac);
    setThongKe(newThongKe);
    setStationStatusMap(newStationStatusMap);
  }, [stationDataMap, dataQuanTrac]);

  useEffect(() => {
    if (!show) {
      enableMapInteraction();
    }
  }, [show]);

  const positions = (dataQuanTrac || []).filter((item) => {
    if (!item.coordinates) return false;
    const [lat, lng] = item.coordinates.split(",");
    if (
      !lat ||
      !lng ||
      lat === "null" ||
      lng === "null" ||
      lat === "" ||
      lng === ""
    ) {
      return false;
    }
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    if (isNaN(latNum) || isNaN(lngNum)) return false;
    if (!isRealisticLatLng(latNum, lngNum)) return false;
    return true;
  });

  // const greenIcon = new L.Icon({
  //   iconUrl: "/images/mapsIcon/marker-icon-2x-green.png",
  //   shadowUrl: "/images/mapsIcon/marker-shadow.png",
  //   iconSize: [25, 41],
  //   iconAnchor: [12, 41],
  //   popupAnchor: [1, -34],
  //   shadowSize: [41, 41],
  // });
  // const redIcon = new L.Icon({
  //   iconUrl: "/images/mapsIcon/marker-icon-2x-red.png",
  //   shadowUrl: "/images/mapsIcon/marker-shadow.png",
  //   iconSize: [25, 41],
  //   iconAnchor: [12, 41],
  //   popupAnchor: [1, -34],
  //   shadowSize: [41, 41],
  // });

  // Component riêng để xử lý fit bounds, tránh rerender không cần thiết
  const FitBoundsOnScroll = React.memo(({ positions, onMapReady }) => {
    const map = useMap();

    useEffect(() => {
      // Lưu map instance vào ref
      if (onMapReady) {
        onMapReady(map);
      }
    }, [map, onMapReady]);

    useEffect(() => {
      // Chỉ fit bounds lần đầu khi có dữ liệu
      if (hasInitializedBounds.current) return;

      const validPositions = positions.filter((item) => {
        if (!item.coordinates) return false;
        const [lat, lng] = item.coordinates.split(",");
        const latNum = parseFloat(lat);
        const lngNum = parseFloat(lng);
        return (
          lat &&
          lng &&
          lat !== "null" &&
          lng !== "null" &&
          lat !== "" &&
          lng !== "" &&
          !isNaN(latNum) &&
          !isNaN(lngNum) &&
          isRealisticLatLng(latNum, lngNum)
        );
      });

      if (validPositions.length > 0) {
        if (validPositions.length > 1) {
          const bounds = L.latLngBounds(
            validPositions.map((item) => {
              const [lat, lng] = item.coordinates.split(",");
              return [parseFloat(lat), parseFloat(lng)];
            }),
          );
          map.fitBounds(bounds, { padding: [50, 50] });
        } else {
          const [lat, lng] = validPositions[0].coordinates.split(",");
          const latNum = parseFloat(lat);
          const lngNum = parseFloat(lng);
          if (!isNaN(latNum) && !isNaN(lngNum)) {
            map.setView([latNum, lngNum], 16);
          }
        }
        hasInitializedBounds.current = true;
      }
    }, [map, positions]);

    return null;
  });

  // Callback để lưu trữ vị trí map hiện tại
  const handleMapReady = (map) => {
    mapRef.current = map;

    // Lưu vị trí hiện tại khi map thay đổi
    map.on("moveend", () => {
      const center = map.getCenter();
      const zoom = map.getZoom();

      setMapCenter((prev) => {
        if (
          Math.abs(prev[0] - center.lat) > 0.0001 ||
          Math.abs(prev[1] - center.lng) > 0.0001
        ) {
          return [center.lat, center.lng];
        }
        return prev;
      });

      setMapZoom((prev) => (prev !== zoom ? zoom : prev));
    });
  };

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "calc(100vh - 120px)",
      }}
    >
      {/* CSS cho responsive */}
      <style jsx>{`
        @media (max-width: 768px) {
          .legend-container {
            left: 5px !important;
            bottom: 5px !important;
            max-width: calc(100vw - 10px) !important;
          }
          .legend-content {
            flex-direction: column !important;
            gap: 4px !important;
            padding: 4px 8px !important;
            font-size: 10px !important;
          }
          .legend-item {
            font-size: 9px !important;
            padding: 1px 4px !important;
          }
          .legend-dot {
            width: 6px !important;
            height: 6px !important;
          }
        }
        @media (max-width: 480px) {
          .legend-content {
            font-size: 9px !important;
            padding: 3px 6px !important;
          }
          .legend-item {
            font-size: 8px !important;
            padding: 1px 3px !important;
          }
        }
      `}</style>
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%", borderRadius: "10px" }}
      >
        <TileLayer
          url="https://mt1.google.com/vt/lyrs=m&hl=vi&x={x}&y={y}&z={z}"
          attribution="© Google Maps"
        />
        {positions &&
          positions.length > 0 &&
          positions.map((item, index) => {
            const [lat, lng] = item.coordinates.split(",");
            const dataTram = stationDataMap[item.id] || {};
            const icon =
              item.mqtt_status !== true
                ? item.status === "active"
                  ? icons.greenIcon
                  : icons.redIcon
                : stationDataMap[item.id] &&
                    stationDataMap[item.id].status === "active"
                  ? icons.greenIcon
                  : icons.redIcon;

            return (
              <MarkerWithPopup
                key={item.id || index}
                ref={(ref) => {
                  if (ref) {
                    popupRefs.current[item.id] = ref;
                  }
                }}
                position={[parseFloat(lat), parseFloat(lng)]}
                icon={icon}
                stationData={stationDataMap[item.id]}
                stationInfo={item}
                stationStatusMap={stationStatusMap}
                statusMqtt={statusMqtt}
                dataTram={dataTram}
                isMobile={isMobile}
                onMobileClick={handleMobileMarkerClick}
              />
            );
          })}
        {positions && positions.length > 0 && (
          <FitBoundsOnScroll
            positions={positions}
            onMapReady={handleMapReady}
          />
        )}
        {/* Chú thích responsive cho mobile */}
        <div
          className="legend-container"
          style={{
            position: "absolute",
            left: "10px",
            bottom: "20px",
            zIndex: 1000,
            pointerEvents: "none",
            maxWidth: "calc(100vw - 20px)",
          }}
        >
          <div
            className="legend-content"
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "6px",
              border: "1px solid #ccc",
              padding: "6px 10px",
              borderRadius: 6,
              background: "rgba(255,255,255,0.95)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              pointerEvents: "auto",
              fontSize: "11px",
              alignItems: "center",
              maxWidth: "100%",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div
                className="legend-dot"
                style={{
                  width: 8,
                  height: 8,
                  backgroundColor: "green",
                  borderRadius: "50%",
                }}
              ></div>
              <span
                style={{ color: "var(--text-primary, #222)", fontSize: "10px" }}
              >
                Hoạt động
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div
                className="legend-dot"
                style={{
                  width: 8,
                  height: 8,
                  backgroundColor: "red",
                  borderRadius: "50%",
                }}
              ></div>
              <span
                style={{ color: "var(--text-primary, #222)", fontSize: "10px" }}
              >
                Mất tín hiệu
              </span>
            </div>
            <div
              className="legend-item"
              style={{
                backgroundColor: "#808080",
                color: "white",
                padding: "2px 6px",
                borderRadius: 4,
                fontSize: "9px",
              }}
            >
              Mất tín hiệu
            </div>
            <div
              className="legend-item"
              style={{
                backgroundColor: "red",
                color: "white",
                padding: "2px 6px",
                borderRadius: 4,
                fontSize: "9px",
              }}
            >
              Vượt ngưỡng
            </div>
            <div
              className="legend-item"
              style={{
                backgroundColor: "green",
                color: "white",
                padding: "2px 6px",
                borderRadius: 4,
                fontSize: "9px",
              }}
            >
              Trong ngưỡng
            </div>
          </div>
        </div>

        {/* Nút toggle để bật/tắt danh sách trạm */}
        <div
          style={{
            position: "absolute",
            right: 12,
            top: 12,
            zIndex: 1000,
            pointerEvents: "auto",
          }}
        >
          <Button
            variant="contained"
            onClick={(e) => {
              e.stopPropagation();
              setShow(!show);
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
            }}
            style={{
              backgroundColor: show ? "#255883" : "#f0f0f0",
              color: show ? "white" : "black",
              border: "1px solid #ccc",
              borderRadius: "4px",
              padding: "8px 12px",
              marginBottom: "8px",
              fontSize: "12px",
              fontWeight: "bold",
              minWidth: "120px",
              cursor: "pointer",
              pointerEvents: "auto",
            }}
          >
            {show ? "Ẩn dữ liệu trạm" : "Hiện dữ liệu trạm"}
          </Button>
        </div>

        {show && (
          <div
            style={{
              position: "absolute",
              right: 12,
              top: 60,
              zIndex: 1000,
              alignItems: "center",
              padding: 0,
              margin: 0,
              pointerEvents: "auto",
            }}
            onMouseEnter={disableMapInteraction}
            onMouseLeave={enableMapInteraction}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            onTouchStart={(e) => {
              e.stopPropagation();
              disableMapInteraction();
            }}
            onTouchEnd={(e) => {
              e.stopPropagation();
              enableMapInteraction();
            }}
          >
            {loading && <CircularProgress />}
            {!loading && (
              <div
                style={{
                  border: "1px solid #ccc",
                  padding: "6px",
                  borderRadius: "4px",
                  width: "200px",
                  background: "rgba(255,255,255,0.95)",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                  pointerEvents: "auto",
                }}
              >
                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: "bold",
                    marginBottom: "6px",
                    textAlign: "center",
                    backgroundColor: "#255883",
                    color: "white",
                    padding: "3px 6px",
                    borderRadius: "4px",
                  }}
                >
                  Trạng thái dữ liệu
                </div>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "6px",
                    width: "100%",
                  }}
                >
                  <div
                    style={{
                      backgroundColor: "#808080",
                      color: "white",
                      width: "calc(50% - 3px)",
                      padding: "3px 6px",
                      borderRadius: "4px",
                      textAlign: "center",
                    }}
                  >
                    <div style={{ fontSize: "15px" }}>{thongKe.matTinHieu}</div>
                    <div style={{ fontSize: "11px" }}>Mất tín hiệu</div>
                  </div>
                  <div
                    style={{
                      backgroundColor: "green",
                      color: "white",
                      width: "calc(50% - 3px)",
                      padding: "3px 6px",
                      borderRadius: "4px",
                      textAlign: "center",
                    }}
                  >
                    <div style={{ fontSize: "15px" }}>
                      {thongKe.trongNguong}
                    </div>
                    <div style={{ fontSize: "11px" }}>Trong ngưỡng</div>
                  </div>
                  <div
                    style={{
                      backgroundColor: "red",
                      color: "white",
                      width: "calc(50% - 3px)",
                      padding: "3px 6px",
                      borderRadius: "4px",
                      textAlign: "center",
                    }}
                  >
                    <div style={{ fontSize: "15px" }}>{thongKe.vuotNguong}</div>
                    <div style={{ fontSize: "11px" }}>Vượt ngưỡng</div>
                  </div>

                </div>
              </div>
            )}
            <div
              style={{
                border: "1px solid #ccc",
                padding: "6px",
                borderRadius: "4px",
                width: "200px",
                background: "rgba(255,255,255,0.95)",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                height: "300px",
                overflow: "auto",
                marginTop: "8px",
                pointerEvents: "auto",
              }}
              onMouseEnter={disableMapInteraction}
              onMouseLeave={enableMapInteraction}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              onTouchStart={(e) => {
                e.stopPropagation();
                disableMapInteraction();
              }}
              onTouchEnd={(e) => {
                e.stopPropagation();
                enableMapInteraction();
              }}
            >
              <div
                style={{
                  fontSize: "13px",
                  fontWeight: "bold",
                  marginBottom: "6px",
                  textAlign: "center",
                  backgroundColor: "#255883",
                  color: "white",
                  padding: "3px 6px",
                  borderRadius: "4px",
                }}
              >
                Danh sách trạm
              </div>
              <div style={{ fontSize: "12px", margin: "0 0 2px 0" }}>
                {positions.map((item, index) => (
                  <Button
                    key={index}
                    style={{
                      width: "100%",
                      marginBottom: "6px",
                      backgroundColor: "white",
                      color: "black",
                      border: "1px solid #ccc",
                      borderRadius: "4px",
                      padding: "3px 6px",
                    }}
                    variant="contained"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      const [lat, lng] = item.coordinates.split(",");
                      mapRef.current.setView(
                        [parseFloat(lat), parseFloat(lng)],
                        16,
                      );
                      // Mở popup của trạm được chọn
                      setTimeout(() => {
                        if (popupRefs.current[item.id]) {
                          popupRefs.current[item.id].openPopup();
                        }
                      }, 500); // Delay để đảm bảo map đã di chuyển xong
                    }}
                  >
                    {item.name}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}
      </MapContainer>

      {/* Mobile Bottom Drawer - Thông tin trạm (realtime) */}
      <StationInfoDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        stationInfo={selectedStation?.stationInfo}
        dataTram={
          selectedStation?.stationInfo
            ? stationDataMap[selectedStation.stationInfo.id] || {}
            : {}
        }
        stationStatusMap={stationStatusMap}
        statusMqtt={statusMqtt}
      />
</div>
  );
};

export default MapContent;
