"use client";
import { useContext } from "react";
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
  TextField,
  Chip,
} from "@mui/material";
import { IconDotsVertical, IconEdit, IconTrash, IconKey, IconRefresh } from "@tabler/icons-react";
import { useUserManagement } from "../hooks/useUserManagement";
import UserFormDialog from "../UserFormDialog";
import UserChangePasswordDialog from "../UserChangePasswordDialog";
import UserResetPasswordDialog from "../UserResetPasswordDialog";
import { useTheme } from "@mui/material/styles";
import { UserDataContext } from "@/app/context/UserDataContext";
import { isRootUser } from "@/app/utils/auth/isRootUser";
export default function UserCard({
  reload,
  canUpdate = false,
  canDelete = false,
  externalSearch,
}) {
  const theme = useTheme();
  const { user: currentUser } = useContext(UserDataContext);
  const isRoot = isRootUser(currentUser);
  const {
    rows,
    loading,
    rowCount,
    page,
    setPage,
    pageSize,
    anchorEl,
    menuRow,
    openMenu,
    handleMenuClick,
    handleMenuClose,
    handleMenuEdit,
    handleMenuDelete,
    confirmOpen,
    setConfirmOpen,
    handleDelete,
    formDialog,
    handleFormClose,
    passwordDialog,
    handleMenuChangePassword,
    handlePasswordDialogClose,
    canChangePassword,
    resetDialog,
    handleMenuResetPassword,
    handleResetDialogClose,
    canResetPassword,
  } = useUserManagement({
    reload,
    canUpdate,
    canDelete,
    externalSearch,
    currentUserId: currentUser?.id,
    isRoot,
  });

  return (
    <>
      {/* Nội dung chính */}
      {loading ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      ) : rows.length === 0 ? (
        <Box display="flex" justifyContent="center" py={4}>
          <Typography color="text.secondary">Không có dữ liệu</Typography>
        </Box>
      ) : (
        <>
          {/* Cards */}
          <Box display="flex" flexDirection="column" gap={1}>
            {rows.map((row, idx) => (
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
                    #{idx + 1} — {row.full_name || row.username}
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
                  <InfoRow label="Tên đăng nhập" value={row.username} />
                  <Divider sx={{ my: 0.75 }} />
                  <InfoRow label="Email" value={row.email || "—"} />
                  <Divider sx={{ my: 0.75 }} />
                  <InfoRow label="Vai trò" value={row.roles?.[0] || "—"} />
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
                      Trạng thái
                    </Typography>
                    {row.is_active ? (
                      <Chip label="Hoạt động" color="success" size="small" />
                    ) : (
                      <Chip label="Ngừng" size="small" />
                    )}
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Box>

          {/* Pagination */}
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
              disabled={(page + 1) * pageSize >= rowCount}
              onClick={() => setPage((p) => p + 1)}
            >
              Sau
            </Button>
            <Typography>Tổng: {rowCount}</Typography>
          </Stack>
        </>
      )}

      {/* Action Menu — luôn render để không vi phạm hooks */}
      <Menu anchorEl={anchorEl} open={openMenu} onClose={handleMenuClose}>
        <MenuItem
          onClick={handleMenuChangePassword}
          disabled={!canChangePassword(menuRow)}
        >
          <IconKey width={18} style={{ marginRight: 8 }} />
          Đổi mật khẩu
        </MenuItem>
        {isRoot && (
          <MenuItem
            onClick={handleMenuResetPassword}
            disabled={!canResetPassword(menuRow)}
          >
            <IconRefresh width={18} style={{ marginRight: 8 }} />
            Reset mật khẩu
          </MenuItem>
        )}
        <MenuItem
          onClick={handleMenuEdit}
          disabled={!canUpdate || menuRow?.roles?.includes("root")}
        >
          <IconEdit width={18} style={{ marginRight: 8 }} />
          Sửa
        </MenuItem>
        <MenuItem
          onClick={handleMenuDelete}
          disabled={!canDelete || menuRow?.roles?.includes("root")}
        >
          <IconTrash width={18} style={{ marginRight: 8 }} color="red" />
          Xoá
        </MenuItem>
      </Menu>

      {/* Confirm delete */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Xác nhận xoá</DialogTitle>
        <DialogContent>Bạn có chắc chắn muốn xoá người dùng này?</DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Huỷ</Button>
          <Button color="error" onClick={handleDelete}>
            Xoá
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit form dialog */}
      {formDialog.open && (
        <UserFormDialog
          open={formDialog.open}
          onClose={handleFormClose}
          user={formDialog.user}
          isMobile={true}
        />
      )}
      {passwordDialog.open && (
        <UserChangePasswordDialog
          open={passwordDialog.open}
          onClose={handlePasswordDialogClose}
          user={passwordDialog.user}
          isAdminMode={passwordDialog.isAdminMode}
        />
      )}
      {resetDialog.open && (
        <UserResetPasswordDialog
          open={resetDialog.open}
          onClose={handleResetDialogClose}
          user={resetDialog.user}
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
