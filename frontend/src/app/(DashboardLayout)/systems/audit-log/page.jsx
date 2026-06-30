"use client";
import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Snackbar,
  TextField,
  Stack,
  Button,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import useIsMobile from "@/app/utils/hooks/useIsMobile";
import { getFetcher } from "@/app/api/globalFetcher";
import { useTenantFilterVersion } from "@/app/context/TenantFilterContext";
import AuditLogCard from "./mobile-view/AuditLogCard";

export default function AuditLogPage() {
  const filterVersion = useTenantFilterVersion();
  const theme = useTheme();
  const isMobile = useIsMobile();

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [filterVersion]);

  useEffect(() => {
    setLoading(true);
    getFetcher(
      `/api/audit-logs?page=${page}&page_size=${pageSize}&search=${encodeURIComponent(
        debouncedSearch,
      )}`,
    )
      .then((res) => {
        setLogs(res.data || []);
        setTotal(res.total || 0);
      })
      .catch((e) => {
        setSnackbar({
          open: true,
          message: e?.response?.data?.detail || e.message,
          severity: "error",
        });
      })
      .finally(() => setLoading(false));
  }, [page, pageSize, debouncedSearch, filterVersion]);

  return (
    <Box>
      {/* Thanh tìm kiếm mobile */}
      {isMobile && (
        <Box mb={1}>
          <TextField
            fullWidth
            placeholder="Tìm kiếm nhật ký..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{
              "& .MuiOutlinedInput-root": {
                backgroundColor:
                  theme.palette.mode === "dark" ? "#282828" : "#ffffff",
              },
            }}
          />
        </Box>
      )}

      <Box
        sx={{
          p: { xs: 1, sm: 2 },
          borderRadius: 2,
          border: (theme) =>
            `1px solid ${
              theme.palette.mode === "dark" ? theme.palette.divider : "#e0e0e0"
            }`,
          bgcolor: "background.paper",
        }}
      >
        {/* Desktop header với search */}
        {!isMobile && (
          <Stack
            direction="row"
            spacing={1}
            mb={2}
            alignItems="center"
            justifyContent="space-between"
          >
            <Typography variant="h6" fontWeight={600}>
              Nhật ký hệ thống
            </Typography>
            <Box width={500}>
              <TextField
                fullWidth
                placeholder="Tìm kiếm..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </Box>
          </Stack>
        )}

        {/* Mobile header */}
        {isMobile && (
          <Typography variant="h6" fontWeight={600} mb={1}>
            Nhật ký hệ thống
          </Typography>
        )}

        {isMobile ? (
          <AuditLogCard
            logs={logs}
            loading={loading}
            page={page}
            setPage={setPage}
            pageSize={pageSize}
            total={total}
          />
        ) : (
          <>
            {loading ? (
              <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress />
              </Box>
            ) : logs.length > 0 ? (
              <TableContainer>
                <Table
                  size="medium"
                  sx={{
                    minWidth: 650,
                    borderCollapse: "collapse",
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
                    <TableRow>
                      <TableCell>Thời gian</TableCell>
                      <TableCell>Người thực hiện</TableCell>
                      <TableCell>Hành động</TableCell>
                      <TableCell>Bảng</TableCell>
                      <TableCell>ID bản ghi</TableCell>
                      <TableCell>Giá trị cũ</TableCell>
                      <TableCell>Giá trị mới</TableCell>
                      <TableCell>Mô tả</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id} hover>
                        <TableCell>
                          {new Date(log.timestamp).toLocaleString()}
                        </TableCell>
                        <TableCell>{log.user?.username ?? "-"}</TableCell>
                        <TableCell>{log.action}</TableCell>
                        <TableCell>{log.table_name}</TableCell>
                        <TableCell>{log.record_id ?? "-"}</TableCell>
                        <TableCell>{log.old_value ?? ""}</TableCell>
                        <TableCell>{log.new_value ?? ""}</TableCell>
                        <TableCell>{log.description ?? ""}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Alert severity="info">Không có dữ liệu audit log.</Alert>
            )}

            {/* Desktop Pagination */}
            <Stack
              direction="row"
              justifyContent="flex-end"
              alignItems="center"
              spacing={2}
              mt={2}
            >
              <Typography>Trang:</Typography>
              <Button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Trước
              </Button>
              <Typography>{page}</Typography>
              <Button
                disabled={page * pageSize >= total}
                onClick={() => setPage((p) => p + 1)}
              >
                Sau
              </Button>
              <Typography>Tổng: {total}</Typography>
            </Stack>
          </>
        )}
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
      >
        <Alert severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
