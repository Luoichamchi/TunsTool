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
  FormControlLabel,
  Switch,
  TablePagination,
  Card,
} from "@mui/material";
import { IconEdit, IconTrash, IconSettingsFilled } from "@tabler/icons-react";
import AddIcon from "@mui/icons-material/Add";
import {
  getFetcher,
  postFetcher,
  putFetcher,
  deleteFetcher,
} from "@/app/api/globalFetcher";
import TenantTable from "./TenantTable";
import TenantCard from "./mobile-view/TenantCard";
import { useHasPermission } from "@/app/utils/auth/useHasPermission";
import { useIsDefaultTenant } from "@/app/utils/auth/useIsDefaultTenant";
import { useRouter } from "next/navigation";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import { toast } from "react-toastify";
import { useTheme } from "@mui/material/styles";
import useIsMobile from "@/app/utils/hooks/useIsMobile";
import config from "@/utils/config";
import { useTenantFilterVersion } from "@/app/context/TenantFilterContext";

const fetchTenants = async (page, pageSize, search) => {
  const url = `/api/tenant?page=${page + 1}&page_size=${pageSize}&search=${
    search || ""
  }`;
  const data = await getFetcher(url, { skipTenantCode: true });
  if (!data)
    throw new Error("Lỗi khi tải danh sách tenant hoặc chưa đăng nhập");
  return data;
};
const deleteTenant = async (id) => {
  const url = `/api/tenant/${id}`;
  await deleteFetcher(url, null, { skipTenantCode: true });
  return true;
};

export default function TenantManagementPage() {
  const filterVersion = useTenantFilterVersion();
  const theme = useTheme();
  const isMobile = useIsMobile();
  const router = useRouter();
  const isDefaultTenant = useIsDefaultTenant();

  useEffect(() => {
    if (!isDefaultTenant) {
      router.replace("/apps/dining-tables");
    }
  }, [isDefaultTenant, router]);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [rowCount, setRowCount] = useState(0);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [mobileSearch, setMobileSearch] = useState("");
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuRow, setMenuRow] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [formDialog, setFormDialog] = useState({ open: false, tenant: null });
  const [configDialog, setConfigDialog] = useState({
    open: false,
    tenant: null,
  });

  // Quyền
  const canCreate = useHasPermission("tenant", "create");
  const canUpdate = useHasPermission("tenant", "update");
  const canDelete = useHasPermission("tenant", "delete");
  const canView = useHasPermission("tenant", "view");

  const openMenu = Boolean(anchorEl);
  const handleMenuClick = (event, row) => {
    setAnchorEl(event.currentTarget);
    setMenuRow(row);
  };
  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuRow(null);
  };
  const handleAdd = () => {
    setFormDialog({ open: true, tenant: null });
  };
  const handleEdit = (tenant) => {
    setFormDialog({ open: true, tenant });
  };
  const handleFormClose = (success, msg, severity = "success") => {
    setFormDialog({ open: false, tenant: null });
    if (msg) toast.success(msg);
    if (success) loadData();
  };
  const handleDeleteClick = (tenant) => {
    setDeleteId(tenant.id);
    setConfirmOpen(true);
    handleMenuClose();
  };
  const handleDelete = async () => {
    try {
      await deleteTenant(deleteId);
      toast.success("Xoá tenant thành công");
      loadData();
    } catch (e) {
      toast.error(e.message);
    }
    setConfirmOpen(false);
    setDeleteId(null);
  };

  const loadData = async () => {
    if (!canView) return; // Không gọi nếu không có quyền
    setLoading(true);
    try {
      const data = await fetchTenants(page, pageSize, debouncedSearch);
      setRows(data.data || []);
      setRowCount(data.total || 0);
    } catch (e) {
      setRows([]);
      setRowCount(0);
      if (e.message) toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
    setPage(0);
  }, [filterVersion]);

  useEffect(() => {
    if (!isDefaultTenant || !canView) return;
    loadData();
  }, [page, pageSize, debouncedSearch, canView, isDefaultTenant, filterVersion]);

  // Form state
  const [form, setForm] = useState({
    name: "",
    tenant_code: "",
    subdomain: "",
    db_name: "",
    expiration_date: null,
    is_active: true,
  });
  const [formLoading, setFormLoading] = useState(false);
  useEffect(() => {
    if (formDialog.open) {
      setForm({
        name: formDialog.tenant?.name || "",
        tenant_code: formDialog.tenant?.tenant_code || "",
        subdomain: formDialog.tenant?.subdomain || "",
        db_name: formDialog.tenant?.db_name || "",
        expiration_date: formDialog.tenant?.expiration_date || null,
        is_active: formDialog.tenant?.is_active ?? true,
      });
    }
  }, [formDialog]);

  const suggestDbName = (tenantCode) => {
    const safe = (tenantCode || "")
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_|_$/g, "");
    return safe ? `${config.tenantDbPrefix}${safe}` : "";
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => {
      const next = { ...f, [name]: value };
      if (name === "tenant_code" && !formDialog.tenant) {
        next.db_name = suggestDbName(value);
      }
      return next;
    });
  };
  const handleDateChange = (value) => {
    setForm((f) => ({
      ...f,
      expiration_date: value ? value.startOf("day").toISOString() : null,
    }));
  };
  const handleSwitchChange = (e) => {
    const { checked } = e.target;
    setForm((f) => ({ ...f, is_active: checked }));
  };
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      let payload = { ...form };
      // Chuyển chuỗi rỗng thành null để tránh lỗi unique constraint
      if (!payload.subdomain) payload.subdomain = null;
      if (!payload.expiration_date) delete payload.expiration_date;
      if (!formDialog.tenant) {
        if (!payload.db_name?.trim()) delete payload.db_name;
        else payload.db_name = payload.db_name.trim().toLowerCase();
      } else {
        delete payload.db_name;
        delete payload.tenant_code;
      }
      if (formDialog.tenant) {
        // Update
        const res = await putFetcher(
          `/api/tenant/${formDialog.tenant.id}`,
          payload,
          { skipTenantCode: true },
        );
        if (!res) throw new Error("Cập nhật tenant thất bại");
        toast.success("Cập nhật thành công");
      } else {
        const res = await postFetcher(`/api/tenant/`, payload, {
          skipTenantCode: true,
        });
        if (!res) throw new Error("Tạo tenant thất bại");
        toast.success("Thêm mới thành công");
      }
      handleFormClose(true);
    } catch (e) {
      toast.error(e.message);
      handleFormClose(false);
    } finally {
      setFormLoading(false);
    }
  };
  const handleConfigClose = (success, msg, severity = "success") => {
    setConfigDialog({ open: false, tenant: null });
    if (msg) toast.success(msg);
    if (success) loadData();
  };
  const handleConfig = (tenant) => {
    setConfigDialog({ open: true, tenant });
  };
  const isEditMode = !!formDialog.tenant;
  const canSubmit = isEditMode ? canUpdate : canCreate;

  if (!isDefaultTenant) {
    return null;
  }

  return (
    <Box>
      {/* Thanh tìm kiếm mobile — hiển thị phía TRÊN header */}
      {isMobile && (
        <Box mb={1}>
          <TextField
            fullWidth
            placeholder="Tìm kiếm tenant..."
            value={mobileSearch}
            onChange={(e) => setMobileSearch(e.target.value)}
            sx={{
              "& .MuiOutlinedInput-root": {
                backgroundColor:
                  theme.palette.mode === "dark" ? "#282828" : "#ffffff",
              },
            }}
          />
        </Box>
      )}

      <Card variant="outlined" style={{ padding: "0 15px" }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ minHeight: 64 }}
        >
          <Typography
            variant="h4"
            fontWeight={700}
            color="primary.main"
            sx={{ display: "flex", alignItems: "center", height: "100%" }}
          >
            Quản lý tenant
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAdd}
            disabled={!canCreate}
            sx={{ display: "flex", alignItems: "center", height: "100%" }}
          >
            Thêm tenant
          </Button>
        </Stack>
      </Card>

      {isMobile ? (
        /* Mobile: card-based layout */
        <Box mt={1}>
          <TenantCard
            rows={rows}
            loading={loading}
            page={page}
            setPage={setPage}
            pageSize={pageSize}
            rowCount={rowCount}
            canUpdate={canUpdate}
            canDelete={canDelete}
            onReload={loadData}
            onEdit={handleEdit}
            onConfig={handleConfig}
            externalSearch={mobileSearch}
          />
        </Box>
      ) : (
        /* Desktop: table layout */
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
            mt: 2,
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
              Danh sách tenant
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
          <TenantTable
            rows={rows}
            loading={loading}
            onMenuClick={handleMenuClick}
          />
          {/* Material-UI TablePagination */}
          <TablePagination
            component="div"
            count={rowCount}
            page={page}
            onPageChange={(event, newPage) => setPage(newPage)}
            rowsPerPage={pageSize}
            onRowsPerPageChange={(event) => {
              setPageSize(parseInt(event.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[5, 10, 25, 50]}
            labelDisplayedRows={({ from, to, count }) =>
              `${from}-${to} của ${count !== -1 ? count : `nhiều hơn ${to}`}`
            }
            labelRowsPerPage="Số dòng mỗi trang:"
            slotProps={{
              select: {
                native: true,
              },
            }}
            sx={{
              borderTop: 1,
              borderColor: "divider",
              "& .MuiTablePagination-toolbar": {
                paddingLeft: 0,
                paddingRight: 0,
              },
            }}
          />
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
                handleConfig(menuRow);
              }}
              disabled={!canUpdate}
            >
              <IconSettingsFilled width={18} style={{ marginRight: 8 }} />
              Cấu hình hiển thị
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
            <DialogContent>
              Bạn có chắc chắn muốn xoá tenant này? Hành động không thể hoàn
              tác.
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setConfirmOpen(false)}>Huỷ</Button>
              <Button
                color="error"
                onClick={handleDelete}
                disabled={!canDelete}
              >
                Xoá
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      )}

      {/* Form dialog (edit/create) — shared cho cả mobile & desktop */}
      <Dialog
        open={formDialog.open}
        onClose={() => handleFormClose(false)}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
      >
        <form onSubmit={handleFormSubmit}>
          <DialogTitle>{isEditMode ? "Sửa tenant" : "Thêm tenant"}</DialogTitle>
          <DialogContent>
            <Stack spacing={2} mt={1}>
              <TextField
                label="Mã (tenant_code)"
                name="tenant_code"
                value={form.tenant_code}
                onChange={handleFormChange}
                required
                fullWidth
                disabled={isEditMode}
              />
              <TextField
                label="Tên"
                name="name"
                value={form.name}
                onChange={handleFormChange}
                required
                fullWidth
              />
              <TextField
                label="Subdomain"
                name="subdomain"
                value={form.subdomain}
                onChange={handleFormChange}
                fullWidth
              />
              <TextField
                label="DB Name"
                name="db_name"
                value={form.db_name}
                onChange={handleFormChange}
                fullWidth
                disabled={isEditMode}
                placeholder={`${config.tenantDbPrefix}tenant_code`}
                helperText={
                  isEditMode
                    ? "Tên database PostgreSQL đã provision"
                    : `Để trống sẽ tự sinh ${config.tenantDbPrefix}{tenant_code}. Host lấy từ DATABASE_URL trên server`
                }
              />
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="Ngày hết hạn"
                  format="DD/MM/YYYY"
                  value={
                    form.expiration_date ? dayjs(form.expiration_date) : null
                  }
                  onChange={handleDateChange}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </LocalizationProvider>
              <FormControlLabel
                control={
                  <Switch
                    checked={form.is_active}
                    onChange={handleSwitchChange}
                  />
                }
                label={form.is_active ? "Active" : "Inactive"}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => handleFormClose(false)}>Huỷ</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={formLoading || !canSubmit}
            >
              {formLoading ? <CircularProgress size={20} color="inherit" /> : "Lưu"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
      {/* Dialog for config */}
      <Dialog
        open={configDialog.open}
        onClose={() => handleConfigClose(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>Cấu hình hiển thị</DialogTitle>
        <DialogContent>
          <Typography variant="h6">Cấu hình hiển thị</Typography>
        </DialogContent>
      </Dialog>
      {/* Snackbar notify */}
</Box>
  );
}
