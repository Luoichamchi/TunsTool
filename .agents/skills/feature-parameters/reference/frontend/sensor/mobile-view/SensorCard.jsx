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

export default function SensorCard({
  rows: initialRows,
  loading,
  onMenuClick,
}) {
  const [rows, setRows] = useState(initialRows || []);

  useEffect(() => {
    setRows(initialRows || []);
  }, [initialRows]);

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
              #{idx + 1} — {row.parameter_name}
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
            <InfoRow label="Mã thông số" value={row.parameter_code} />
            <Divider sx={{ my: 0.75 }} />

            {/* Địa chỉ */}
            <InfoRow label="Đơn vị" value={row.unit || "—"} />
            <Divider sx={{ my: 0.75 }} />
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
