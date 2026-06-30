"use client";
import React from "react";
import {
  Drawer,
  Box,
  Typography,
  Chip,
  Divider,
  useTheme,
  IconButton,
  Grid,
} from "@mui/material";
import { IconX } from "@tabler/icons-react";
import moment from "moment";

const STATUS_CONFIG = {
  vuotNguong: { label: "Vượt ngưỡng", color: "#f44336", bg: "#fff5f5" },
  trongNguong: { label: "Trong ngưỡng", color: "#4CAF50", bg: "#f1fff4" },
  matTinHieu: { label: "Mất tín hiệu", color: "#9E9E9E", bg: "#f5f5f5" },
};

function getParamStatus(item) {
  if (item.value === null || item.value === undefined || item.value === "###")
    return "gray";
  if (item.value < item.min_value || item.value > item.max_value)
    return "#f44336";
  return "#4CAF50";
}

export default function StationInfoDrawer({
  open,
  onClose,
  stationInfo,
  dataTram,
  stationStatusMap,
  statusMqtt,
}) {
  const theme = useTheme();

  if (!stationInfo) return null;

  const stationId = stationInfo?.id;
  const statusKey = stationStatusMap?.[stationId] || "matTinHieu";
  const statusCfg = STATUS_CONFIG[statusKey] || STATUS_CONFIG.matTinHieu;

  const mqttStatus =
    stationInfo?.mqtt_status === true
      ? statusMqtt?.[stationId] || "Chờ kết nối"
      : null;

  const displayStatus =
    mqttStatus ||
    (stationInfo?.status === "active" ? "Đang hoạt động" : "Mất tín hiệu");

  const timeStr = dataTram?.time
    ? moment.utc(dataTram.time).utcOffset(7).format("DD/MM/YYYY HH:mm:ss")
    : "Đang cập nhật";

  const params = Array.isArray(dataTram?.data) ? dataTram.data : [];

  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          maxHeight: "50vh",
          minHeight: "50vh",
          pb: 3,
          zIndex: 2000,
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 2,
          py: 1.5,
          background: `linear-gradient(135deg, #255883 0%, #1a3f5f 100%)`,
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
        }}
      >
        <Box>
          <Typography
            variant="subtitle1"
            fontWeight={700}
            color="white"
            lineHeight={1.2}
          >
            {stationInfo?.name || "Trạm quan trắc"}
          </Typography>
          {stationInfo?.address && (
            <Typography
              variant="caption"
              color="rgba(255,255,255,0.75)"
              sx={{ display: "block", mt: 0.3 }}
            >
              {stationInfo.address}
            </Typography>
          )}
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ color: "white" }}>
          <IconX size={20} />
        </IconButton>
      </Box>

      {/* Status & Time Row */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 2,
          py: 1.2,
          backgroundColor: statusCfg.bg,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box
            sx={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              backgroundColor: statusCfg.color,
              flexShrink: 0,
            }}
          />
          <Typography variant="body2" fontWeight={600} color={statusCfg.color}>
            {statusCfg.label}
          </Typography>
          {mqttStatus && (
            <Chip
              label={`MQTT: ${mqttStatus}`}
              size="small"
              sx={{
                fontSize: "10px",
                height: 20,
                backgroundColor:
                  mqttStatus === "Đang hoạt động" ? "#e8f5e9" : "#fce4ec",
                color: mqttStatus === "Đang hoạt động" ? "#2e7d32" : "#c62828",
              }}
            />
          )}
        </Box>
        <Typography variant="caption" color="text.secondary">
          {timeStr}
        </Typography>
      </Box>

      {/* Parameters Grid */}
      <Box sx={{ overflowY: "auto", px: 2, pt: 1.5 }}>
        {params.length === 0 ? (
          <Typography
            variant="body2"
            color="text.secondary"
            textAlign="center"
            py={3}
          >
            Không có dữ liệu thông số
          </Typography>
        ) : (
          <Grid container spacing={1.5}>
            {params.map((item, idx) => {
              const paramColor = getParamStatus(item);
              const paramName =
                item.chiTieu ||
                item.parameter_name ||
                item.parameter_code ||
                `Thông số ${idx + 1}`;
              const paramValue = item.giaTri ?? item.value;
              const paramUnit = item.donVi || item.unit || "";

              return (
                <Grid item size={{ xs: 4}} key={idx}>
                  <Box
                    sx={{
                      border: `1.5px solid ${paramColor}22`,
                      borderRadius: 2,
                      p: 1.2,
                      backgroundColor: `${paramColor}08`,
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      gap: 0.3,
                    }}
                  >
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      fontWeight={500}
                      sx={{ lineHeight: 1.3, fontSize: "10px" }}
                    >
                      {paramName}
                    </Typography>
                    <Box
                      sx={{ display: "flex", alignItems: "baseline", gap: 0.5 }}
                    >
                      <Typography
                        variant="h6"
                        fontWeight={700}
                        color={paramColor}
                        sx={{ fontSize: "18px", lineHeight: 1 }}
                      >
                        {paramValue ?? "—"}
                      </Typography>
                      {paramUnit && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ fontSize: "10px" }}
                        >
                          {paramUnit}
                        </Typography>
                      )}
                    </Box>
                    {/* Ngưỡng min/max */}
                    {(item.min_value !== undefined ||
                      item.max_value !== undefined) && (
                      <Typography
                        variant="caption"
                        color="text.disabled"
                        sx={{ fontSize: "9px" }}
                      >
                        [{item.min_value ?? "?"} – {item.max_value ?? "?"}]
                      </Typography>
                    )}
                  </Box>
                </Grid>
              );
            })}
          </Grid>
        )}
      </Box>
    </Drawer>
  );
}
