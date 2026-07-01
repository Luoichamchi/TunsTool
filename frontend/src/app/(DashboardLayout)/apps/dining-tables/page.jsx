"use client";

import React, { useMemo, useState } from "react";
import useSWR from "swr";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { QRCode } from "antd";
import { toast } from "react-toastify";

import PageContainer from "@/app/components/container/PageContainer";
import api from "@/app/api/api";
import { getFetcher, postFetcher } from "@/app/api/globalFetcher";
import { useHasPermission } from "@/app/utils/auth/useHasPermission";
import { useTenant } from "@/app/context/TenantContext";

function buildQrValue(qrBaseUrl, tenantCode, sessionToken) {
  return `${qrBaseUrl}/order/${tenantCode || "default"}/${sessionToken}`;
}

export default function DiningTablesPage() {
  const { tenantCode } = useTenant();
  const [search, setSearch] = useState("");
  const [qrDialog, setQrDialog] = useState({ open: false, item: null, qrValue: "" });
  const [openingTableId, setOpeningTableId] = useState(null);
  const [closingTableId, setClosingTableId] = useState(null);

  const canUpdate = useHasPermission("dining_table", "update");

  const url = `${api.GET_TABLE_LIST}?page=1&page_size=100&search=${encodeURIComponent(search)}`;
  const { data, mutate } = useSWR(url, getFetcher, { refreshInterval: 5000 });
  const rows = data?.data || [];

  const qrBaseUrl = useMemo(() => {
    const fromEnv = process.env.NEXT_PUBLIC_QR_BASE_URL?.replace(/\/$/, "");
    if (fromEnv) return fromEnv;
    if (typeof window !== "undefined") return window.location.origin;
    return "";
  }, []);

  const openTable = async (item) => {
    setOpeningTableId(item.id);
    try {
      const result = await postFetcher(`${api.OPEN_TABLE}/${item.id}/open`, {});
      const sessionToken = result?.session?.session_token;
      if (!sessionToken) {
        toast.error("Không nhận được mã phiên");
        return;
      }
      const qrValue = buildQrValue(qrBaseUrl, tenantCode, sessionToken);
      setQrDialog({
        open: true,
        item: { ...item, name: result?.table?.name || item.name },
        qrValue,
      });
      toast.success("Đã nhận bàn — hiển thị QR cho khách quét");
      mutate();
    } catch (error) {
      toast.error(error.message || "Không thể nhận bàn");
    } finally {
      setOpeningTableId(null);
    }
  };

  const handleCloseTable = (item) => {
    if (
      !window.confirm(
        `Xác nhận trả bàn "${item.name}"? Phiên phục vụ sẽ kết thúc và khách không thể đặt món thêm.`,
      )
    ) {
      return;
    }
    closeTable(item);
  };

  const closeTable = async (item, force = false) => {
    setClosingTableId(item.id);
    try {
      await postFetcher(`${api.CLOSE_TABLE}/${item.id}/close`, { force });
      toast.success("Đã trả bàn");
      mutate();
    } catch (error) {
      if (!force && error.message?.includes("chưa thanh toán")) {
        if (window.confirm(`${error.message}. Trả bàn và huỷ đơn chưa thanh toán?`)) {
          await closeTable(item, true);
          return;
        }
      } else {
        toast.error(error.message || "Không thể trả bàn");
      }
    } finally {
      setClosingTableId(null);
    }
  };

  const showQrForServingTable = (item) => {
    const sessionToken = item.current_session?.session_token;
    if (!sessionToken) {
      toast.error("Không tìm thấy phiên đang mở");
      return;
    }
    setQrDialog({
      open: true,
      item,
      qrValue: buildQrValue(qrBaseUrl, tenantCode, sessionToken),
    });
  };

  return (
    <PageContainer title="Sơ đồ bàn" description="Theo dõi trạng thái bàn, nhận/trả bàn và phát QR cho khách đặt món">
      <Card variant="outlined">
        <CardContent>
          <Typography variant="h5" fontWeight={700} mb={2}>
            Sơ đồ bàn
          </Typography>
          <TextField
            fullWidth
            placeholder="Tìm theo mã bàn hoặc tên bàn..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Grid container spacing={2}>
            {rows.map((item) => {
              const isServing = item.status === "serving";
              const statusLabel = !item.is_active
                ? "Khoá"
                : isServing
                  ? "Đang phục vụ"
                  : "Trống";
              const statusColor = !item.is_active ? "default" : isServing ? "success" : "info";

              return (
                <Grid key={item.id} size={{ xs: 12, md: 6, lg: 4 }}>
                  <Card
                    variant="outlined"
                    sx={
                      isServing
                        ? {
                            borderWidth: 2,
                            borderColor: "success.main",
                          }
                        : undefined
                    }
                  >
                    <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="start">
                        <Box>
                          <Typography variant="h6" fontWeight={700}>
                            {item.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Mã bàn: {item.table_code}
                          </Typography>
                        </Box>
                        <Chip label={statusLabel} color={statusColor} size="small" />
                      </Stack>
                      <Stack spacing={1} mt={1.5}>
                        {!item.is_active ? null : isServing ? (
                          <Stack direction="row" spacing={1}>
                            <Button
                              variant="contained"
                              color="warning"
                              onClick={() => handleCloseTable(item)}
                              disabled={!canUpdate || closingTableId === item.id}
                              sx={{ flex: 1, color: "common.white" }}
                            >
                              {closingTableId === item.id ? "Đang trả..." : "Trả bàn"}
                            </Button>
                            <Button
                              variant="contained"
                              color="info"
                              onClick={() => showQrForServingTable(item)}
                              sx={{ flex: 1, color: "common.white" }}
                            >
                              Xem QR
                            </Button>
                          </Stack>
                        ) : (
                          <Button
                            variant="outlined"
                            onClick={() => openTable(item)}
                            disabled={!canUpdate || openingTableId === item.id}
                          >
                            {openingTableId === item.id ? "Đang nhận..." : "Nhận bàn"}
                          </Button>
                        )}
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </CardContent>
      </Card>

      <Dialog
        open={qrDialog.open}
        onClose={() => setQrDialog({ open: false, item: null, qrValue: "" })}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>QR phiên phục vụ</DialogTitle>
        <DialogContent>
          {qrDialog.item && (
            <Stack spacing={2} alignItems="center" mt={1}>
              <Typography fontWeight={700}>{qrDialog.item.name}</Typography>
              <Typography variant="body2" color="text.secondary" textAlign="center">
                Khách quét mã này để đặt món. QR chỉ có hiệu lực trong phiên hiện tại.
              </Typography>
              <QRCode value={qrDialog.qrValue} size={220} />
              <TextField fullWidth value={qrDialog.qrValue} InputProps={{ readOnly: true }} />
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setQrDialog({ open: false, item: null, qrValue: "" })}>Đóng</Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
}
