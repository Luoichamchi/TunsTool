"use client";
import { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Switch,
  Chip,
  IconButton,
  CircularProgress,
  Divider,
  Stack,
} from "@mui/material";
import { IconDotsVertical } from "@tabler/icons-react";
import { postFetcher } from "@/app/api/globalFetcher";
import api from "@/app/api/api";
import { toast } from "react-toastify";
export default function StationCard({
  rows: initialRows,
  loading,
  onMenuClick,
}) {
  const [rows, setRows] = useState(initialRows || []);

  useEffect(() => {
    setRows(initialRows || []);
  }, [initialRows]);

  const onMqttStatusChange = async (e, id) => {
    try {
      const res = await postFetcher(`${api.POST_UPDATE_MQTT_STATUS}`, {
        station_id: id,
        mqtt_status: e.target.checked,
      });
      if (res) {
        toast.success(res);
        setRows((prev) =>
          prev.map((row) =>
            row.id === id ? { ...row, mqtt_status: e.target.checked } : row,
          ),
        );
      } else {
        toast.error("Cập nhật trạng thái MQTT thất bại");
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" py={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (rows.length === 0) {
    return (
      <Box display="flex" justifyContent="center" py={4}>
        <Typography color="text.secondary">Không có dữ liệu</Typography>
      </Box>
    );
  }

  return (
    <Box display="flex" flexDirection="column" gap={1}>
      {rows.map((row, idx) => (
        <Card
          key={row.id}
          variant="outlined"
          sx={{ borderRadius: 2, position: "relative" }}
        >
          {/* Header: số thứ tự + tên trạm + nút action */}
          <Box
            sx={{
              px: 2,
              pt: 1.5,
              pb: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              bgcolor: "primary.main",
              borderRadius: "8px 8px 0 0",
            }}
          >
            <Typography variant="subtitle1" fontWeight={700} color="white">
              #{idx + 1} — {row.name}
            </Typography>
            <IconButton
              size="small"
              onClick={(e) => onMenuClick(e, row)}
              sx={{ color: "white" }}
            >
              <IconDotsVertical width={20} />
            </IconButton>
          </Box>

          <CardContent sx={{ pt: 1.5, pb: "12px !important" }}>
            {/* Mã trạm */}
            <InfoRow label="Mã trạm" value={row.station_code} />
            <Divider sx={{ my: 0.75 }} />

            {/* Địa chỉ */}
            <InfoRow label="Địa chỉ" value={row.address || "—"} />
            <Divider sx={{ my: 0.75 }} />

            {/* Toạ độ */}
            <InfoRow label="Toạ độ" value={row.coordinates || "—"} />
            <Divider sx={{ my: 0.75 }} />

            {/* Trạng thái MQTT */}
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
            >
              <Typography
                variant="body2"
                color="text.secondary"
                fontWeight={500}
              >
                Trạng thái MQTT
              </Typography>
              <Switch
                size="small"
                checked={!!row.mqtt_status}
                onChange={(e) => onMqttStatusChange(e, row.id)}
              />
            </Stack>
            <Divider sx={{ my: 0.75 }} />

            {/* Trạng thái trạm */}
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
            >
              <Typography
                variant="body2"
                color="text.secondary"
                fontWeight={500}
              >
                Trạng thái trạm
              </Typography>
              <Chip
                label={row.status === "active" ? "Hoạt động" : "Mất tín hiệu"}
                size="small"
                color={row.status === "active" ? "success" : "error"}
                sx={{ fontWeight: 600 }}
              />
            </Stack>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
}

// Helper nhỏ
function InfoRow({ label, value }) {
  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      alignItems="flex-start"
      spacing={1}
    >
      <Typography
        variant="body2"
        color="text.secondary"
        fontWeight={500}
        minWidth={80}
      >
        {label}
      </Typography>
      <Typography
        variant="body2"
        textAlign="right"
        sx={{ wordBreak: "break-word" }}
      >
        {value}
      </Typography>
    </Stack>
  );
}
