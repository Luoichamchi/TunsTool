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
  FormControlLabel,
  Grid,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { QRCode } from "antd";
import { IconEdit, IconTrash } from "@tabler/icons-react";
import { toast } from "react-toastify";

import PageContainer from "@/app/components/container/PageContainer";
import api from "@/app/api/api";
import { deleteFetcher, getFetcher, postFetcher, putFetcher } from "@/app/api/globalFetcher";
import { useHasPermission } from "@/app/utils/auth/useHasPermission";
import { useTenant } from "@/app/context/TenantContext";

const emptyForm = {
  table_code: "",
  name: "",
  is_active: true,
};

export default function DiningTablesPage() {
  const { tenantCode } = useTenant();
  const [search, setSearch] = useState("");
  const [dialog, setDialog] = useState({ open: false, item: null });
  const [form, setForm] = useState(emptyForm);
  const [qrDialog, setQrDialog] = useState({ open: false, item: null });

  const canCreate = useHasPermission("dining_table", "create");
  const canUpdate = useHasPermission("dining_table", "update");
  const canDelete = useHasPermission("dining_table", "delete");

  const url = `${api.GET_TABLE_LIST}?page=1&page_size=100&search=${encodeURIComponent(search)}`;
  const { data, mutate } = useSWR(url, getFetcher);
  const rows = data?.data || [];

  const qrBaseUrl = useMemo(() => {
    const fromEnv = process.env.NEXT_PUBLIC_QR_BASE_URL?.replace(/\/$/, "");
    if (fromEnv) return fromEnv;
    if (typeof window !== "undefined") return window.location.origin;
    return "";
  }, []);

  const openDialog = (item = null) => {
    setDialog({ open: true, item });
    setForm(
      item
        ? {
            table_code: item.table_code || "",
            name: item.name || "",
            is_active: item.is_active ?? true,
          }
        : emptyForm,
    );
  };

  const closeDialog = () => {
    setDialog({ open: false, item: null });
    setForm(emptyForm);
  };

  const saveTable = async () => {
    try {
      if (dialog.item) {
        await putFetcher(`${api.PUT_TABLE}/${dialog.item.id}`, form);
        toast.success("Đã cập nhật bàn ăn");
      } else {
        await postFetcher(api.POST_TABLE, form);
        toast.success("Đã tạo bàn ăn");
      }
      closeDialog();
      mutate();
    } catch (error) {
      toast.error(error.message || "Không thể lưu bàn ăn");
    }
  };

  const removeTable = async (id) => {
    if (!window.confirm("Xoá bàn ăn này?")) return;
    try {
      await deleteFetcher(`${api.DELETE_TABLE}${id}`);
      toast.success("Đã xoá bàn ăn");
      mutate();
    } catch (error) {
      toast.error(error.message || "Không thể xoá bàn ăn");
    }
  };

  return (
    <PageContainer title="Quản lý bàn ăn" description="Quản lý bàn và sinh QR code cho khách đặt món">
      <Card variant="outlined">
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h5" fontWeight={700}>
              Bàn ăn
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => openDialog()}
              disabled={!canCreate}
            >
              Thêm bàn
            </Button>
          </Stack>
          <TextField
            fullWidth
            placeholder="Tìm theo mã bàn hoặc tên bàn..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Grid container spacing={2}>
            {rows.map((item) => {
              const qrValue = `${qrBaseUrl}/order/${tenantCode || "default"}/${item.qr_token}`;
              return (
                <Grid key={item.id} size={{ xs: 12, md: 6, lg: 4 }}>
                  <Card variant="outlined">
                    <CardContent>
                      <Stack direction="row" justifyContent="space-between" alignItems="start">
                        <Box>
                          <Typography variant="h6" fontWeight={700}>
                            {item.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Mã bàn: {item.table_code}
                          </Typography>
                        </Box>
                        <Chip
                          label={item.is_active ? "Đang phục vụ" : "Khoá"}
                          color={item.is_active ? "success" : "default"}
                          size="small"
                        />
                      </Stack>
                      <Stack spacing={1} mt={2}>
                        <Button
                          variant="outlined"
                          onClick={() => setQrDialog({ open: true, item: { ...item, qrValue } })}
                        >
                          Xem QR
                        </Button>
                        <Stack direction="row" spacing={1}>
                          <Button
                            size="small"
                            startIcon={<IconEdit size={16} />}
                            onClick={() => openDialog(item)}
                            disabled={!canUpdate}
                          >
                            Sửa
                          </Button>
                          <Button
                            size="small"
                            color="error"
                            startIcon={<IconTrash size={16} />}
                            onClick={() => removeTable(item.id)}
                            disabled={!canDelete}
                          >
                            Xoá
                          </Button>
                        </Stack>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </CardContent>
      </Card>

      <Dialog open={dialog.open} onClose={closeDialog} fullWidth maxWidth="sm">
        <DialogTitle>{dialog.item ? "Cập nhật bàn ăn" : "Thêm bàn ăn"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField
              label="Mã bàn"
              value={form.table_code}
              onChange={(e) => setForm((prev) => ({ ...prev, table_code: e.target.value }))}
              fullWidth
            />
            <TextField
              label="Tên bàn"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              fullWidth
            />
            <FormControlLabel
              control={
                <Switch
                  checked={form.is_active}
                  onChange={(e) => setForm((prev) => ({ ...prev, is_active: e.target.checked }))}
                />
              }
              label="Cho phép khách đặt món"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Huỷ</Button>
          <Button variant="contained" onClick={saveTable}>
            Lưu
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={qrDialog.open}
        onClose={() => setQrDialog({ open: false, item: null })}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>QR bàn ăn</DialogTitle>
        <DialogContent>
          {qrDialog.item && (
            <Stack spacing={2} alignItems="center" mt={1}>
              <Typography fontWeight={700}>{qrDialog.item.name}</Typography>
              <QRCode value={qrDialog.item.qrValue} size={220} />
              <TextField fullWidth value={qrDialog.item.qrValue} InputProps={{ readOnly: true }} />
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setQrDialog({ open: false, item: null })}>Đóng</Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
}
