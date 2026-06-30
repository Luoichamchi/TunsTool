import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  CircularProgress,
  Typography,
} from "@mui/material";
import { toast } from "react-toastify";
import { putFetcher } from "@/app/api/globalFetcher";

const mapErrorMessage = (message) => {
  if (!message) return "Đổi mật khẩu thất bại";
  if (message === "Current password is incorrect") {
    return "Mật khẩu hiện tại không đúng";
  }
  return message;
};

export default function UserChangePasswordDialog({
  open,
  onClose,
  user,
  isAdminMode = false,
}) {
  const [form, setForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm({
      current_password: "",
      new_password: "",
      confirm_password: "",
    });
  }, [open, user?.id]);

  const resetForm = () => {
    setForm({
      current_password: "",
      new_password: "",
      confirm_password: "",
    });
  };

  const handleClose = () => {
    if (loading) return;
    resetForm();
    onClose();
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.new_password) {
      toast.error("Vui lòng nhập mật khẩu mới");
      return;
    }
    if (!isAdminMode && !form.current_password) {
      toast.error("Vui lòng nhập mật khẩu hiện tại");
      return;
    }
    if (form.new_password !== form.confirm_password) {
      toast.error("Mật khẩu mới và xác nhận không khớp");
      return;
    }
    if (!isAdminMode && form.new_password === form.current_password) {
      toast.error("Mật khẩu mới phải khác mật khẩu hiện tại");
      return;
    }

    setLoading(true);
    try {
      const payload = { new_password: form.new_password };
      if (!isAdminMode) {
        payload.current_password = form.current_password;
      }
      await putFetcher(`/api/users/${user.id}/change-password`, payload);
      toast.success("Đổi mật khẩu thành công");
      resetForm();
      onClose(true);
    } catch (error) {
      toast.error(mapErrorMessage(error?.message));
    } finally {
      setLoading(false);
    }
  };

  const title = isAdminMode
    ? `Đổi mật khẩu — ${user?.username || ""}`
    : "Đổi mật khẩu";

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs">
      <form onSubmit={handleSubmit}>
        <DialogTitle>{title}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {isAdminMode && (
              <Typography variant="body2" color="text.secondary">
                Đặt mật khẩu mới cho tài khoản{" "}
                <strong>{user?.full_name || user?.username}</strong>.
              </Typography>
            )}
            {!isAdminMode && (
              <TextField
                label="Mật khẩu hiện tại"
                name="current_password"
                type="password"
                value={form.current_password}
                onChange={handleChange}
                required
                fullWidth
                autoComplete="current-password"
              />
            )}
            <TextField
              label="Mật khẩu mới"
              name="new_password"
              type="password"
              value={form.new_password}
              onChange={handleChange}
              required
              fullWidth
              autoComplete="new-password"
            />
            <TextField
              label="Xác nhận mật khẩu mới"
              name="confirm_password"
              type="password"
              value={form.confirm_password}
              onChange={handleChange}
              required
              fullWidth
              autoComplete="new-password"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClose} disabled={loading}>
            Hủy
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={18} /> : null}
          >
            Lưu
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
