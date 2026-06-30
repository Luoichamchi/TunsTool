"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  CircularProgress,
} from "@mui/material";
import moment from "moment";

const severityConfig = {
  NGHIÊM_TRỌNG: { color: "error", label: "Vượt mức" },
};

export default function ExceedanceCard({
  rows: initialRows,
  loading,
  onLoadMore,
  hasMore,
  loadingMore,
}) {
  const [rows, setRows] = useState(initialRows || []);
  const sentinelRef = useRef(null);

  useEffect(() => {
    setRows(initialRows || []);
  }, [initialRows]);

  // IntersectionObserver để detect cuối danh sách
  const handleObserver = useCallback(
    (entries) => {
      const entry = entries[0];
      if (entry.isIntersecting && hasMore && !loadingMore && onLoadMore) {
        onLoadMore();
      }
    },
    [hasMore, loadingMore, onLoadMore],
  );

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: "0px",
      threshold: 0.1,
    });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [handleObserver]);

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
      {rows.map((item, idx) => {
        const sev = severityConfig[item.severity] || {
          color: "default",
          label: item.severity,
        };
        return (
          <Card
            key={idx}
            variant="outlined"
            sx={{ borderRadius: 2, position: "relative", px: 0, py: 0 }}
          >
            {/* Header: thời gian + severity */}
            <Box
              sx={{
                px: 2,
                pt: 1.5,
                pb: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderRadius: "8px 8px 0 0",
              }}
            >
              <Typography variant="subtitle1" fontWeight={700}>
                {moment(item.date_time).format("DD/MM/YYYY HH:mm:ss")}
              </Typography>
              <Chip
                label={sev.label}
                color={sev.color}
                size="small"
                variant="filled"
              />
            </Box>

            <CardContent sx={{ pt: 1.5, px: 2 }}>
              <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                <InfoRow label="Thông số" value={item.parameter_name} />
                <InfoRow
                  label="Giá trị"
                  value={`${item.value}${item.unit ? ` ${item.unit}` : ""}`}
                />
                <InfoRow label="Ngưỡng" value={item.threshold} />
                {item.station_name && (
                  <InfoRow label="Trạm" value={item.station_name} />
                )}
              </Box>
            </CardContent>
          </Card>
        );
      })}

      {/* Sentinel element để trigger load more */}
      <Box
        ref={sentinelRef}
        sx={{ py: 1, display: "flex", justifyContent: "center" }}
      >
        {loadingMore && <CircularProgress size={24} />}
        {!hasMore && rows.length > 0 && (
          <Typography variant="body2" color="text.secondary">
            Đã hiển thị tất cả {rows.length} bản ghi
          </Typography>
        )}
      </Box>
    </Box>
  );
}

// Helper nhỏ
function InfoRow({ label, value }) {
  return (
    <Typography
      variant="body2"
      color="text.secondary"
      fontWeight={500}
      minWidth={80}
    >
      {label} : {value}
    </Typography>
  );
}
