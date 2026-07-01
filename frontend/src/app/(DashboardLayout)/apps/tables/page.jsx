"use client";

import React, { useState } from "react";
import useSWR from "swr";
import {
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { IconDotsVertical, IconEdit, IconTrash } from "@tabler/icons-react";
import { toast } from "react-toastify";

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
    padding: "4px 8px",
  },
};

const listCardSx = {
  borderRadius: 2,
  border: (theme) =>
    `1px solid ${theme.palette.mode === "dark" ? theme.palette.divider : "#e0e0e0"}`,
  p: 2,
  bgcolor: "background.paper",
};

function getStatusChip(item) {
  if (!item.is_active) {
    return <Chip label="Khoá" size="small" />;
  }
  if (item.status === "serving") {
    return <Chip label="Đang phục vụ" color="warning" size="small" />;
  }
  return <Chip label="Hoạt động" color="success" size="small" />;
}

export default function TablesPage() {
  const [page, setPage] = useState(0);
  const [pageSize] = useState(10);
  const [dialog, setDialog] = useState({ open: false, item: null });
  const [form, setForm] = useState(emptyForm);
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuRow, setMenuRow] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const canCreate = useHasPermission("dining_table", "create");
  const canUpdate = useHasPermission("dining_table", "update");
  const canDelete = useHasPermission("dining_table", "delete");

  const url = `${api.GET_TABLE_LIST}?page=${page + 1}&page_size=${pageSize}`;
  const { data, mutate, isLoading } = useSWR(url, getFetcher);
  const rows = data?.data || [];
  const total = data?.total || 0;

  const openMenu = Boolean(anchorEl);

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

  const handleMenuClick = (event, row) => {
    setAnchorEl(event.currentTarget);
    setMenuRow(row);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuRow(null);
  };

  const handleMenuEdit = () => {
    if (menuRow) openDialog(menuRow);
    handleMenuClose();
  };

  const handleMenuDelete = () => {
    setConfirmOpen(true);
    setAnchorEl(null);
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

  const removeTable = async () => {
    if (!menuRow) return;
    try {
      await deleteFetcher(`${api.DELETE_TABLE}${menuRow.id}`);
      toast.success("Đã xoá bàn ăn");
      setConfirmOpen(false);
      setMenuRow(null);
      mutate();
    } catch (error) {
      toast.error(error.message || "Không thể xoá bàn ăn");
    }
  };

  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
        <Card
          variant="outlined"
          sx={{
            p: 2,
            width: "100%",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="h4" fontWeight={700} color="primary.main">
            Quản lý bàn ăn
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => openDialog()}
            disabled={!canCreate}
          >
            Thêm bàn
          </Button>
        </Card>
      </Stack>

      <Box sx={listCardSx}>
        <Typography variant="h6" fontWeight={600} mb={2}>
          Danh sách bàn ăn
        </Typography>

        <TableContainer>
          <Table sx={tableSx}>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Mã bàn</TableCell>
                <TableCell>Tên bàn</TableCell>
                <TableCell>Trạng thái</TableCell>
                <TableCell />
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
                rows.map((item) => (
                  <TableRow key={item.id} hover>
                    <TableCell>{item.id}</TableCell>
                    <TableCell>{item.table_code}</TableCell>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{getStatusChip(item)}</TableCell>
                    <TableCell>
                      <IconButton onClick={(e) => handleMenuClick(e, item)}>
                        <IconDotsVertical width={18} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Stack
          direction="row"
          justifyContent="flex-end"
          alignItems="center"
          spacing={2}
          mt={2}
        >
          <Typography>Trang:</Typography>
          <Button disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
            Trước
          </Button>
          <Typography>{page + 1}</Typography>
          <Button
            disabled={(page + 1) * pageSize >= total}
            onClick={() => setPage((p) => p + 1)}
          >
            Sau
          </Button>
          <Typography>Tổng: {total}</Typography>
        </Stack>

        <Menu anchorEl={anchorEl} open={openMenu} onClose={handleMenuClose}>
          <MenuItem onClick={handleMenuEdit} disabled={!canUpdate}>
            <IconEdit width={18} style={{ marginRight: 8 }} />
            Sửa
          </MenuItem>
          <MenuItem
            onClick={handleMenuDelete}
            disabled={!canDelete || menuRow?.status === "serving"}
          >
            <IconTrash width={18} style={{ marginRight: 8 }} color="red" />
            Xoá
          </MenuItem>
        </Menu>

        <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
          <DialogTitle>Xác nhận xoá</DialogTitle>
          <DialogContent>Bạn có chắc chắn muốn xoá bàn ăn này?</DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmOpen(false)}>Huỷ</Button>
            <Button color="error" onClick={removeTable}>
              Xoá
            </Button>
          </DialogActions>
        </Dialog>
      </Box>

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
    </Box>
  );
}
