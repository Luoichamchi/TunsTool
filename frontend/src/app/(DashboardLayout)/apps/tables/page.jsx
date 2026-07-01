"use client";

import React, { useState } from "react";
import useSWR from "swr";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { IconEdit, IconTrash } from "@tabler/icons-react";
import { toast } from "react-toastify";

import PageContainer from "@/app/components/container/PageContainer";
import api from "@/app/api/api";
import { deleteFetcher, getFetcher, postFetcher, putFetcher } from "@/app/api/globalFetcher";
import { useHasPermission } from "@/app/utils/auth/useHasPermission";

const emptyForm = {
  table_code: "",
  name: "",
  is_active: true,
};

const tableSx = {
  minWidth: 650,
  borderCollapse: "collapse",
  border: (theme) =>
    `1px solid ${theme.palette.mode === "dark" ? theme.palette.divider : "#e0e0e0"}`,
  "& .MuiTableCell-root": {
    border: (theme) =>
      `1px solid ${theme.palette.mode === "dark" ? theme.palette.divider : "#e0e0e0"}`,
    textAlign: "center",
    padding: "8px 12px",
  },
};

export default function TablesPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [dialog, setDialog] = useState({ open: false, item: null });
  const [form, setForm] = useState(emptyForm);

  const canCreate = useHasPermission("dining_table", "create");
  const canUpdate = useHasPermission("dining_table", "update");
  const canDelete = useHasPermission("dining_table", "delete");

  const url = `${api.GET_TABLE_LIST}?page=${page + 1}&page_size=${pageSize}&search=${encodeURIComponent(search)}`;
  const { data, mutate, isLoading } = useSWR(url, getFetcher);
  const rows = data?.data || [];
  const total = data?.total || 0;

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
    <PageContainer title="Quản lý bàn" description="Thêm, sửa và xoá danh mục bàn ăn">
      <Card variant="outlined">
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h5" fontWeight={700}>
              Danh mục bàn ăn
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

          <Box mb={2} maxWidth={400}>
            <TextField
              fullWidth
              placeholder="Tìm theo mã bàn hoặc tên bàn..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
            />
          </Box>

          <TableContainer>
            <Table sx={tableSx}>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Mã bàn</TableCell>
                  <TableCell>Tên bàn</TableCell>
                  <TableCell>Trạng thái</TableCell>
                  <TableCell>Thao tác</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <CircularProgress size={28} />
                    </TableCell>
                  </TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      Không có dữ liệu
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((item) => {
                    const isServing = item.status === "serving";
                    return (
                      <TableRow key={item.id} hover>
                        <TableCell>{item.id}</TableCell>
                        <TableCell>{item.table_code}</TableCell>
                        <TableCell>{item.name}</TableCell>
                        <TableCell>
                          <Chip
                            label={item.is_active ? "Hoạt động" : "Khoá"}
                            color={item.is_active ? "success" : "default"}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={0.5} justifyContent="center">
                            <IconButton
                              size="small"
                              onClick={() => openDialog(item)}
                              disabled={!canUpdate}
                            >
                              <IconEdit size={18} />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => removeTable(item.id)}
                              disabled={!canDelete || isServing}
                            >
                              <IconTrash size={18} />
                            </IconButton>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={total}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={pageSize}
            onRowsPerPageChange={(e) => {
              setPageSize(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[5, 10, 25, 50]}
            labelRowsPerPage="Số dòng:"
          />
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
    </PageContainer>
  );
}
