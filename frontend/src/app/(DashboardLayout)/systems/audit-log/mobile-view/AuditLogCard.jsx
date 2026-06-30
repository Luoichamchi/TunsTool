"use client";
import { useState } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Stack,
  Button,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Chip,
} from "@mui/material";
import {
  IconPlus,
  IconPencil,
  IconTrash,
  IconArrowDown,
  IconX,
  IconEye,
} from "@tabler/icons-react";
import { useTheme } from "@mui/material/styles";

// Icon + màu theo loại action
const getActionInfo = (action) => {
  switch (action?.toLowerCase()) {
    case "create":
      return {
        icon: <IconPlus size={18} />,
        color: "#4caf50",
        bgColor: "#e8f5e9",
      };
    case "update":
      return {
        icon: <IconPencil size={18} />,
        color: "#ff9800",
        bgColor: "#fff3e0",
      };
    case "delete":
      return {
        icon: <IconTrash size={18} />,
        color: "#f44336",
        bgColor: "#ffebee",
      };
    default:
      return {
        icon: <IconEye size={18} />,
        color: "#2196f3",
        bgColor: "#e3f2fd",
      };
  }
};

// Format JSON đẹp
const formatJsonValue = (value) => {
  if (!value) return null;
  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    return JSON.stringify(parsed, null, 2);
  } catch {
    return String(value);
  }
};

export default function AuditLogCard({ logs, loading, page, setPage, pageSize, total }) {
  const theme = useTheme();

  // Detail dialog state
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLog, setDetailLog] = useState(null);

  const handleViewDetail = (log) => {
    setDetailLog(log);
    setDetailOpen(true);
  };

  return (
    <>
      {loading ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      ) : logs.length === 0 ? (
        <Box display="flex" justifyContent="center" py={4}>
          <Typography color="text.secondary">Không có dữ liệu</Typography>
        </Box>
      ) : (
        <Box>
          {logs.map((log, idx) => {
            const { icon, color, bgColor } = getActionInfo(log.action);
            const time = new Date(log.timestamp);
            const timeStr = time.toLocaleTimeString("vi-VN");
            const dateStr = time.toLocaleDateString("vi-VN");

            return (
              <Box key={log.id}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 1.5,
                    py: 1.5,
                    px: 1,
                  }}
                >
                  {/* Icon hành động */}
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      bgcolor: bgColor,
                      color: color,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      mt: 0.25,
                    }}
                  >
                    {icon}
                  </Box>

                  {/* Nội dung */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="flex-start"
                    >
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ fontSize: "0.7rem" }}
                      >
                        {timeStr}, {dateStr}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="primary.main"
                        sx={{
                          cursor: "pointer",
                          fontWeight: 500,
                          flexShrink: 0,
                          ml: 1,
                          "&:hover": { textDecoration: "underline" },
                        }}
                        onClick={() => handleViewDetail(log)}
                      >
                        View Details
                      </Typography>
                    </Stack>

                    <Typography
                      variant="body2"
                      fontWeight={700}
                      sx={{
                        mt: 0.25,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {log.user?.username ?? "system"} {log.action}{" "}
                      {log.table_name} record
                    </Typography>

                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: "block", mt: 0.25 }}
                    >
                      {log.description || `${log.table_name} record ${log.action}d`}
                    </Typography>
                  </Box>
                </Box>

                {idx < logs.length - 1 && <Divider />}
              </Box>
            );
          })}

          {/* Pagination */}
          <Stack
            direction="row"
            justifyContent="flex-end"
            alignItems="center"
            spacing={2}
            mt={2}
          >
            <Typography variant="body2">Trang:</Typography>
            <Button
              size="small"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Trước
            </Button>
            <Typography variant="body2">{page}</Typography>
            <Button
              size="small"
              disabled={page * pageSize >= total}
              onClick={() => setPage((p) => p + 1)}
            >
              Sau
            </Button>
            <Typography variant="body2">Tổng: {total}</Typography>
          </Stack>
        </Box>
      )}

      {/* Detail Dialog */}
      <Dialog
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: 3,
            mx: 1,
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            pb: 1,
          }}
        >
          <Typography variant="h6" fontWeight={700} component="span">
            Chi tiết thay đổi
          </Typography>
          <IconButton onClick={() => setDetailOpen(false)} size="small">
            <IconX size={20} />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ px: 2, pb: 3 }}>
          {detailLog && (
            <Box>
              {/* Giá trị cũ */}
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                mb={1}
              >
                <Typography
                  variant="overline"
                  fontWeight={700}
                  color="text.secondary"
                >
                  GIÁ TRỊ CŨ
                </Typography>
                <Chip
                  label="BEFORE"
                  size="small"
                  sx={{
                    bgcolor: "#ffebee",
                    color: "#f44336",
                    fontWeight: 700,
                    fontSize: "0.65rem",
                    height: 22,
                  }}
                />
              </Stack>
              <Box
                sx={{
                  bgcolor:
                    theme.palette.mode === "dark" ? "#1e1e1e" : "#f5f5f5",
                  borderRadius: 2,
                  p: 2,
                  mb: 2,
                  overflow: "auto",
                  maxHeight: 250,
                }}
              >
                <Typography
                  component="pre"
                  variant="caption"
                  sx={{
                    fontFamily: "monospace",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    m: 0,
                    fontSize: "0.75rem",
                    lineHeight: 1.6,
                  }}
                >
                  {formatJsonValue(detailLog.old_value) || "—"}
                </Typography>
              </Box>

              {/* Mũi tên xuống */}
              <Box
                display="flex"
                justifyContent="center"
                my={1.5}
              >
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    bgcolor:
                      theme.palette.mode === "dark" ? "#333" : "#e0e0e0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <IconArrowDown size={20} color={theme.palette.text.secondary} />
                </Box>
              </Box>

              {/* Giá trị mới */}
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                mb={1}
              >
                <Typography
                  variant="overline"
                  fontWeight={700}
                  color="text.secondary"
                >
                  GIÁ TRỊ MỚI
                </Typography>
                <Chip
                  label="AFTER"
                  size="small"
                  sx={{
                    bgcolor: "#e8f5e9",
                    color: "#4caf50",
                    fontWeight: 700,
                    fontSize: "0.65rem",
                    height: 22,
                  }}
                />
              </Stack>
              <Box
                sx={{
                  bgcolor:
                    theme.palette.mode === "dark" ? "#1e1e1e" : "#f5f5f5",
                  borderRadius: 2,
                  p: 2,
                  overflow: "auto",
                  maxHeight: 250,
                }}
              >
                <Typography
                  component="pre"
                  variant="caption"
                  sx={{
                    fontFamily: "monospace",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    m: 0,
                    fontSize: "0.75rem",
                    lineHeight: 1.6,
                  }}
                >
                  {formatJsonValue(detailLog.new_value) || "—"}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
