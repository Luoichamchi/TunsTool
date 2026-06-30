import React, { useContext } from "react";
import UserFormDialog from "./UserFormDialog";
import UserChangePasswordDialog from "./UserChangePasswordDialog";
import UserResetPasswordDialog from "./UserResetPasswordDialog";
import {
  Typography,
  Menu,
  MenuItem,
  Box,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
} from "@mui/material";
import UserThemeTable from "@/app/components/tables/UserThemeTable";
import { IconEdit, IconTrash, IconKey, IconRefresh } from "@tabler/icons-react";
import { useUserManagement } from "./hooks/useUserManagement";
import { UserDataContext } from "@/app/context/UserDataContext";
import { isRootUser } from "@/app/utils/auth/isRootUser";

export default function UserTableTemplate({
  reload,
  canUpdate = false,
  canDelete = false,
}) {
  const { user: currentUser } = useContext(UserDataContext);
  const isRoot = isRootUser(currentUser);
  const {
    rows,
    loading,
    rowCount,
    page,
    setPage,
    pageSize,
    search,
    setSearch,
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
    currentUserId: currentUser?.id,
    isRoot,
  });

  return (
    <>
      <Box
        sx={{
          borderRadius: 2,
          border: (theme) =>
            `1px solid ${
              theme.palette.mode === "dark" ? theme.palette.divider : "#e0e0e0"
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
            Danh sách người dùng
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
        <UserThemeTable
          rows={rows}
          loading={loading}
          onMenuClick={handleMenuClick}
        />
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
        {/* Menu for actions */}
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
        {/* Confirm delete dialog */}
        <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
          <DialogTitle>Xác nhận xoá</DialogTitle>
          <DialogContent>
            Bạn có chắc chắn muốn xoá người dùng này?
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmOpen(false)}>Huỷ</Button>
            <Button color="error" onClick={handleDelete}>
              Xoá
            </Button>
          </DialogActions>
        </Dialog>
        {/* Form dialog (edit/create) */}
        {formDialog.open && (
          <UserFormDialog
            open={formDialog.open}
            onClose={handleFormClose}
            user={formDialog.user}
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
      </Box>
    </>
  );
}
