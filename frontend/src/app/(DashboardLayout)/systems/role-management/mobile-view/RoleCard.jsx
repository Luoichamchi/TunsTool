"use client";
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  CircularProgress,
  Divider,
  Stack,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Chip,
} from "@mui/material";
import {
  IconDotsVertical,
  IconEdit,
  IconTrash,
  IconSettings,
} from "@tabler/icons-react";
import RoleFormDialog from "../RoleFormDialog";
import { useTheme } from "@mui/material/styles";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteFetcher } from "@/app/api/globalFetcher";
import { toast } from "react-toastify";

export default function RoleCard({
  rows,
  loading,
  canUpdate = false,
  canDelete = false,
  onReload,
  externalSearch,
  currentUserRoles = [],
}) {
  const theme = useTheme();
  const router = useRouter();

  // Menu state
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuRow, setMenuRow] = useState(null);
  const openMenu = Boolean(anchorEl);

  // Edit dialog state
  const [editOpen, setEditOpen] = useState(false);
  const [editRole, setEditRole] = useState(null);

  // Delete confirm state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const handleMenuClick = (e, row) => {
    setAnchorEl(e.currentTarget);
    setMenuRow(row);
  };
  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuRow(null);
  };

  const handleEdit = () => {
    setEditRole(menuRow);
    setEditOpen(true);
    handleMenuClose();
  };

  const handleDeleteClick = () => {
    setDeleteId(menuRow?.id);
    setConfirmOpen(true);
    handleMenuClose();
  };

  const handleDelete = async () => {
    try {
      await deleteFetcher(`/api/rbac/roles/${deleteId}`);
      toast.success("Xoá vai trò thành công");
      onReload?.();
    } catch (e) {
      toast.error(e.message || "Xoá vai trò thất bại");
    }
    setConfirmOpen(false);
    setDeleteId(null);
  };

  const handleFormClose = (refresh, msg) => {
    setEditOpen(false);
    setEditRole(null);
    if (refresh) onReload?.();
    if (msg) toast.success(msg);
  };

  // Lọc theo search
  const filteredRows = externalSearch
    ? rows.filter(
        (r) =>
          r.name?.toLowerCase().includes(externalSearch.toLowerCase()) ||
          r.description?.toLowerCase().includes(externalSearch.toLowerCase()),
      )
    : rows;

  return (
    <>
      {loading ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      ) : filteredRows.length === 0 ? (
        <Box display="flex" justifyContent="center" py={4}>
          <Typography color="text.secondary">Không có dữ liệu</Typography>
        </Box>
      ) : (
        <Box display="flex" flexDirection="column" gap={1}>
          {filteredRows.map((row, idx) => (
            <Card
              key={row.id}
              variant="outlined"
              sx={{ borderRadius: 2, position: "relative" }}
            >
              {/* Header */}
              <Box
                sx={{
                  px: 2,
                  pt: 1.5,
                  pb: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  bgcolor: "primary.main",
                  borderRadius: "8px 8px 0 0",
                }}
              >
                <Typography
                  variant="subtitle1"
                  fontWeight={700}
                  color="white"
                >
                  #{idx + 1} — {row.name}
                </Typography>
                <IconButton
                  size="small"
                  onClick={(e) => handleMenuClick(e, row)}
                  sx={{ color: "white" }}
                >
                  <IconDotsVertical width={20} />
                </IconButton>
              </Box>

              <CardContent sx={{ pt: 1.5, pb: "12px !important" }}>
                <InfoRow label="Tên vai trò" value={row.name} />
                <Divider sx={{ my: 0.75 }} />
                <InfoRow label="Mô tả" value={row.description || "—"} />
                <Divider sx={{ my: 0.75 }} />
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    fontWeight={500}
                  >
                    Số quyền
                  </Typography>
                  <Chip
                    label={`${row.permissions?.length || 0} quyền`}
                    color="primary"
                    size="small"
                    variant="outlined"
                  />
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {/* Action Menu */}
      <Menu anchorEl={anchorEl} open={openMenu} onClose={handleMenuClose}>
        <MenuItem
          onClick={() => {
            handleMenuClose();
            router.push(`/systems/permission-management?roleId=${menuRow?.id}`);
          }}
          disabled={
            !canUpdate ||
            menuRow?.name === "root" ||
            currentUserRoles.includes(menuRow?.name)
          }
        >
          <IconSettings width={18} style={{ marginRight: 8 }} />
          Quản lý quyền
        </MenuItem>
        <MenuItem
          onClick={handleEdit}
          disabled={!canUpdate || menuRow?.name === "root"}
        >
          <IconEdit width={18} style={{ marginRight: 8 }} />
          Sửa
        </MenuItem>
        <MenuItem
          onClick={handleDeleteClick}
          disabled={!canDelete || menuRow?.name === "root"}
        >
          <IconTrash width={18} style={{ marginRight: 8 }} color="red" />
          Xoá
        </MenuItem>
      </Menu>

      {/* Confirm delete */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Xác nhận xoá</DialogTitle>
        <DialogContent>Bạn có chắc chắn muốn xoá vai trò này?</DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Huỷ</Button>
          <Button color="error" onClick={handleDelete}>
            Xoá
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit form dialog */}
      {editOpen && (
        <RoleFormDialog
          open={editOpen}
          onClose={handleFormClose}
          role={editRole}
        />
      )}
    </>
  );
}

function InfoRow({ label, value }) {
  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      alignItems="flex-start"
      spacing={1}
    >
      <Typography
        variant="body2"
        color="text.secondary"
        fontWeight={500}
        minWidth={80}
      >
        {label}
      </Typography>
      <Typography
        variant="body2"
        textAlign="right"
        sx={{ wordBreak: "break-word" }}
      >
        {value}
      </Typography>
    </Stack>
  );
}
