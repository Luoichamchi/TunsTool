"use client";
import React, { useState, useEffect, useContext } from "react";
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
  Card,
} from "@mui/material";
import { IconEdit, IconSettings, IconTrash } from "@tabler/icons-react";
import AddIcon from "@mui/icons-material/Add";
import RoleThemeTable from "@/app/components/tables/RoleThemeTable";
import RoleFormDialog from "./RoleFormDialog";
import RoleCard from "./mobile-view/RoleCard";
import { getFetcher, deleteFetcher } from "@/app/api/globalFetcher";
import { useHasPermission } from "@/app/utils/auth/useHasPermission";
import { useRouter } from "next/navigation";
import { useTheme } from "@mui/material/styles";
import useIsMobile from "@/app/utils/hooks/useIsMobile";
import { toast } from "react-toastify";
import { UserDataContext } from "@/app/context/UserDataContext";
import { useTenantFilterVersion } from "@/app/context/TenantFilterContext";
const fetchRoles = async () => {
  return await getFetcher("/api/rbac/roles");
};
const deleteRole = async (id) => {
  return await deleteFetcher(`/api/rbac/roles/${id}`);
};

export default function RoleManagementPage() {
  const filterVersion = useTenantFilterVersion();
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useIsMobile();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openForm, setOpenForm] = useState(false);
  const [editRole, setEditRole] = useState(null);
  const [reload, setReload] = useState(false);
  const [mobileSearch, setMobileSearch] = useState("");
  const [search, setSearch] = useState("");

  // Desktop menu state
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuRow, setMenuRow] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

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
    setEditRole(null);
    setOpenForm(true);
  };
  const handleEdit = (role) => {
    setEditRole(role);
    setOpenForm(true);
  };
  const handleDeleteClick = (role) => {
    setDeleteId(role.id);
    setConfirmOpen(true);
    handleMenuClose();
  };
  const handleCloseForm = (refresh, msg, severity = "success") => {
    setOpenForm(false);
    setEditRole(null);
    if (refresh) setReload((r) => !r);
    if (msg) toast.success(msg);
  };
  const handleDelete = async () => {
    try {
      await deleteRole(deleteId);
      toast.success("Xoá vai trò thành công");
      setReload((r) => !r);
    } catch (e) {
      toast.error(e.message || "Xoá vai trò thất bại");
    }
    setConfirmOpen(false);
    setDeleteId(null);
  };

  useEffect(() => {
    setLoading(true);
    fetchRoles()
      .then((data) => {
        setRows(data || []);
      })
      .catch((e) => {
        setRows([]);
        toast.error(e.message);
      })
      .finally(() => setLoading(false));
  }, [reload, filterVersion]);

  // Quyền
  const canCreate = useHasPermission("role", "create");
  const canUpdate = useHasPermission("role", "update");
  const canDelete = useHasPermission("role", "delete");
  const { user: currentUser } = useContext(UserDataContext);
  const currentUserRoles = currentUser?.roles || [];
  const isOwnRole = (roleName) =>
    roleName && currentUserRoles.includes(roleName);

  // Desktop search filter
  const filteredRows = search
    ? rows.filter(
        (r) =>
          r.name?.toLowerCase().includes(search.toLowerCase()) ||
          r.description?.toLowerCase().includes(search.toLowerCase()),
      )
    : rows;

  return (
    <Box>
      {/* Thanh tìm kiếm mobile */}
      {isMobile && (
        <Box mb={1}>
          <TextField
            fullWidth
            placeholder="Tìm kiếm vai trò..."
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

      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        mb={isMobile ? 1 : 3}
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
            Quản lý vai trò
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAdd}
            disabled={!canCreate}
          >
            Thêm vai trò
          </Button>
        </Card>
      </Stack>

      {isMobile ? (
        <RoleCard
          rows={rows}
          loading={loading}
          canUpdate={canUpdate}
          canDelete={canDelete}
          onReload={() => setReload((r) => !r)}
          externalSearch={mobileSearch}
          currentUserRoles={currentUserRoles}
        />
      ) : (
        /* Desktop: bọc bảng trong Box giống UserTableTemplate */
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
            justifyContent="space-between"
          >
            <Typography variant="h6" fontWeight={600}>
              Danh sách vai trò
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

          <RoleThemeTable
            rows={filteredRows}
            loading={loading}
            onMenuClick={handleMenuClick}
          />

          {/* Menu actions */}
          <Menu anchorEl={anchorEl} open={openMenu} onClose={handleMenuClose}>
            <MenuItem
              onClick={() => {
                handleMenuClose();
                router.push(
                  `/systems/permission-management?roleId=${menuRow?.id}`,
                );
              }}
              disabled={
                !canUpdate ||
                menuRow?.name === "root" ||
                isOwnRole(menuRow?.name)
              }
            >
              <IconSettings width={18} style={{ marginRight: 8 }} />
              Quản lý quyền
            </MenuItem>
            <MenuItem
              onClick={() => {
                handleMenuClose();
                handleEdit(menuRow);
              }}
              disabled={!canUpdate || menuRow?.name === "root"}
            >
              <IconEdit width={18} style={{ marginRight: 8 }} />
              Sửa
            </MenuItem>
            <MenuItem
              onClick={() => handleDeleteClick(menuRow)}
              disabled={!canDelete || menuRow?.name === "root"}
            >
              <IconTrash width={18} style={{ marginRight: 8 }} color="red" />
              Xoá
            </MenuItem>
          </Menu>

          {/* Confirm delete dialog */}
          <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
            <DialogTitle>Xác nhận xoá</DialogTitle>
            <DialogContent>
              Bạn có chắc chắn muốn xoá vai trò này?
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

      {/* Form dialog — shared cho cả mobile & desktop */}
      <RoleFormDialog
        open={openForm}
        onClose={handleCloseForm}
        role={editRole}
      />
</Box>
  );
}
