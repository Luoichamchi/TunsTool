"use client";
import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Stack,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
} from "@mui/material";
import { toast } from "react-toastify";
import { IconEdit, IconTrash, IconSettings } from "@tabler/icons-react";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import Card from "@mui/material/Card";
import { useTheme } from "@mui/material";
import useIsMobile from "@/app/utils/hooks/useIsMobile";
import SensorCard from "./mobile-view/SensorCard";
import {
  getFetcher,
  postFetcher,
  putFetcher,
  deleteFetcher,
} from "@/app/api/globalFetcher";
import SensorTable from "./SensorTable";
import { useHasPermission } from "@/app/utils/auth/useHasPermission";
import api from "@/app/api/api";
import { useTenantFilterVersion } from "@/app/context/TenantFilterContext";
import { Toast } from "@capacitor/toast";
const fetchDemos = async (page, pageSize, search, start_date, end_date) => {
  const url = `${api.GET_SENSOR_LIST}/?search=${search || ""}&page=${page + 1}&page_size=${pageSize}`;
  const data = await getFetcher(url);
  if (!data) throw new Error("Lỗi khi tải danh sách demo hoặc chưa đăng nhập");
  return data;
};
const deleteDemo = async (id) => {
  const url = `${api.DELETE_SENSOR}${id}`;
  await deleteFetcher(url);
  return true;
};

export default function SensorPage() {
  const filterVersion = useTenantFilterVersion();
  const theme = useTheme();
  const isMobile = useIsMobile();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [rowCount, setRowCount] = useState(0);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuRow, setMenuRow] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [formDialog, setFormDialog] = useState({ open: false, demo: null });
  const [configDialog, setConfigDialog] = useState({ open: false, demo: null });

  // Quyền
  const canCreate = useHasPermission("demo", "create");
  const canUpdate = useHasPermission("demo", "update");
  const canDelete = useHasPermission("demo", "delete");

  const openMenu = Boolean(anchorEl);
  const handleMenuClick = (event, row) => {
    setAnchorEl(event.currentTarget);
    setMenuRow(row);
    console.log(row);
  };
  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuRow(null);
  };
  const handleAdd = () => {
    setFormDialog({ open: true, demo: null });
  };
  const handleEdit = (demo) => {
    setFormDialog({ open: true, demo });
  };
  const handleConfig = () => {
    setConfigDialog({ open: true, demo: null });
    console.log("modal config");
  };
  const handleFormClose = (success, msg, severity = "success") => {
    setFormDialog({ open: false, demo: null });
    setConfigDialog({ open: false, demo: null });
    // Reset form
    setForm({ parameter: "", name: "", unit: "" });
    if (msg) {
      if (severity === "error") {
        toast.error(msg);
      } else {
        toast.success(msg);
      }
    }
    if (success) loadData();
  };
  const handleDeleteClick = (demo) => {
    setDeleteId(demo.id);
    setConfirmOpen(true);
    handleMenuClose();
  };
  const handleDelete = async () => {
    try {
      await deleteDemo(deleteId);
      toast.success("Xoá thông số thành công");
      loadData();
    } catch (e) {
      toast.error(e.message);
    }
    setConfirmOpen(false);
    setDeleteId(null);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchDemos(page, pageSize, search);
      console.log(data);
      setRows(data.data || []);
      setRowCount(data.total || 0);
    } catch (e) {
      setRows([]);
      setRowCount(0);
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
    setPage(0);
  }, [filterVersion]);

  useEffect(() => {
    loadData();
  }, [page, pageSize, debouncedSearch, filterVersion]);

  // Form dialog
  const [form, setForm] = useState({
    parameter_code: "",
    parameter_name: "",
    unit: "",
  });
  const [formLoading, setFormLoading] = useState(false);
  useEffect(() => {
    if (formDialog.open) {
      setForm({
        parameter_code: formDialog.demo?.parameter_code || "",
        parameter_name: formDialog.demo?.parameter_name || "",
        unit: formDialog.demo?.unit || "",
      });
    }
  }, [formDialog]);
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      let res;
      const sensorData = {
        parameter_code: form.parameter_code,
        parameter_name: form.parameter_name,
        unit: form.unit,
      };

      if (formDialog.demo) {
        res = await putFetcher(
          `${api.PUT_SENSOR}/${formDialog.demo.id}`,
          sensorData,
        );
      } else {
        res = await postFetcher(api.POST_SENSOR, sensorData);
      }
      if (!res) throw new Error("Lưu thông số thất bại");
      isMobile
        ? await Toast.show({
            text: formDialog.demo
              ? "Cập nhật thành công"
              : "Thêm mới thành công",
            duration: "short",
            position: "bottom",
          })
        : toast.success(
            formDialog.demo ? "Cập nhật thành công" : "Thêm mới thành công",
          );
      handleFormClose(true);
    } catch (e) {
      isMobile
        ? await Toast.show({
            text: e.message,
            duration: "short",
            position: "bottom",
          })
        : toast.error(e.message);
      handleFormClose(false);
    } finally {
      setFormLoading(false);
    }
  };
  const handleConfigSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
    } catch (e) {
      toast.error(e.message);
      handleFormClose(false);
    } finally {
      setFormLoading(false);
    }
  };
  const isEditMode = !!formDialog.demo;
  const canSubmit = isEditMode ? canUpdate : canCreate;

  return (
    <Box>
      {isMobile ? (
        <TextField
          fullWidth
          placeholder="Tìm kiếm..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{
            "& .MuiOutlinedInput-root": {
              backgroundColor:
                theme.palette.mode === "dark" ? "#282828" : "#ffffff",
            },
            marginBottom: "10px",
          }}
        />
      ) : null}

      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        mb={1}
      >
        <Card
          variant="outlined"
          sx={{
            p: 2,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="h4" fontWeight={700} color="primary.main">
            Quản lý thông số trạm
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAdd}
            disabled={!canCreate}
          >
            Thêm thông số trạm
          </Button>
        </Card>
      </Stack>
      {isMobile ? (
        <SensorCard
          rows={rows}
          loading={loading}
          onMenuClick={handleMenuClick}
        />
      ) : (
        <Box
          sx={{
            borderRadius: 2,
            border: (theme) =>
              `1px solid ${
                theme.palette.mode === "dark"
                  ? theme.palette.divider
                  : "#e0e0e0"
              }`,
            p: 2,
            bgcolor: "background.paper",
          }}
        >
          <Stack
            direction="row"
            spacing={1}
            mb={2}
            alignItems="center"
            justifyContent={"space-between"}
          >
            <Typography variant="h6" fontWeight={600}>
              Danh sách thông số trạm
            </Typography>
            <Box width={400}>
              <TextField
                fullWidth
                placeholder="Tìm kiếm..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </Box>
          </Stack>
          <SensorTable
            rows={rows}
            loading={loading}
            onMenuClick={handleMenuClick}
          />
        </Box>
      )}
      {/* Pagination */}
      <Stack
        direction="row"
        justifyContent="flex-end"
        alignItems="center"
        spacing={2}
        mt={2}
        mb={2}
      >
        <Typography>Trang:</Typography>
        <Button disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
          Trước
        </Button>
        <Typography>{page + 1}</Typography>
        <Button
          disabled={(page + 1) * pageSize >= rowCount}
          onClick={() => setPage((p) => p + 1)}
        >
          Sau
        </Button>
        <Typography>Tổng: {rowCount}</Typography>
      </Stack>
      {/* Menu for actions */}
      <Menu anchorEl={anchorEl} open={openMenu} onClose={handleMenuClose}>
        <MenuItem
          onClick={() => {
            handleMenuClose();
            handleEdit(menuRow);
          }}
          disabled={!canUpdate}
        >
          <IconEdit width={18} style={{ marginRight: 8 }} />
          Sửa
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleMenuClose();
            handleDeleteClick(menuRow);
          }}
          disabled={!canDelete}
        >
          <IconTrash width={18} style={{ marginRight: 8 }} color="red" />
          Xoá
        </MenuItem>
      </Menu>
      {/* Confirm delete dialog */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Xác nhận xoá</DialogTitle>
        <DialogContent>Bạn có chắc chắn muốn xoá thông số này?</DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Huỷ</Button>
          <Button color="error" onClick={handleDelete} disabled={!canDelete}>
            Xoá
          </Button>
        </DialogActions>
      </Dialog>
      {/* Form dialog (edit/create) */}
      <Dialog
        open={formDialog.open}
        onClose={() => handleFormClose(false)}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
      >
        <form onSubmit={handleFormSubmit}>
          <DialogTitle>
            {isEditMode ? "Sửa thông số" : "Thêm thông số"}
          </DialogTitle>
          <DialogContent>
            <Stack spacing={2} mt={1}>
              <TextField
                label="Mã thông số"
                name="parameter_code"
                value={form.parameter_code ?? ""}
                onChange={handleFormChange}
                required
                fullWidth
              />
              <TextField
                label="Tên thông số"
                name="parameter_name"
                value={form.parameter_name ?? ""}
                onChange={handleFormChange}
                required
                fullWidth
              />
              <TextField
                label="Đơn vị"
                name="unit"
                value={form.unit ?? ""}
                onChange={handleFormChange}
                fullWidth
              />
            </Stack>
            <DialogActions sx={{ padding: "10px 0" }}>
              <Button onClick={() => handleFormClose(false)}>Huỷ</Button>
              <Button
                type="submit"
                variant="contained"
                disabled={formLoading || !canSubmit}
              >
                {formLoading ? <CircularProgress size={20} color="inherit" /> : "Lưu"}
              </Button>
            </DialogActions>
          </DialogContent>
        </form>
      </Dialog>
      {/* Toast Container */}
</Box>
  );
}
