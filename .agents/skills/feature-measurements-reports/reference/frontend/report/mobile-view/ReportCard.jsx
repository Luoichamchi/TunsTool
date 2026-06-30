"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  CircularProgress,
} from "@mui/material";
import moment from "moment";

export default function ReportCard({
  headerTable,
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

  const dataList = rows?.data ?? [];

  if (dataList.length === 0) {
    return (
      <Box display="flex" justifyContent="center" py={4}>
        <Typography color="text.secondary">Không có dữ liệu</Typography>
      </Box>
    );
  }

  return (
    <Box display="flex" flexDirection="column" gap={1}>
      {dataList.map((row, idx) => (
        <Card
          key={idx}
          variant="outlined"
          sx={{ borderRadius: 2, position: "relative", px: 0, py: 0 }}
        >
          {/* Header: thời gian */}
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
              {typeof row.time === "string" &&
              /^\d{4}-\d{2}-\d{2}$/.test(row.time)
                ? moment.utc(row.time).utcOffset(7).format("DD/MM/YYYY")
                : moment.utc(row.time).utcOffset(7).format("DD/MM/YYYY HH:mm")}
            </Typography>
          </Box>

          <CardContent sx={{ pt: 1.5, px: 2 }}>
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              {headerTable.slice(1).map((item, i) => (
                <InfoRow
                  key={i}
                  label={item.header}
                  value={row.parameters?.[item.key] ?? ""}
                />
              ))}
            </Box>
          </CardContent>
        </Card>
      ))}

      {/* Sentinel element để trigger load more */}
      <Box
        ref={sentinelRef}
        sx={{ py: 1, display: "flex", justifyContent: "center" }}
      >
        {loadingMore && <CircularProgress size={24} />}
        {!hasMore && dataList.length > 0 && (
          <Typography variant="body2" color="text.secondary">
            Đã hiển thị tất cả {dataList.length} bản ghi
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
