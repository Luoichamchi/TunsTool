import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  CircularProgress,
} from "@mui/material";
import { toast } from "react-toastify";
import { putFetcher } from "@/app/api/globalFetcher";

const API_CHANGE_PASSWORD = "/api/auth/change-password";

const mapErrorMessage = (message) => {
  if (!message) return "Đổi mật khẩu thất bại";
  if (message === "Current password is incorrect") {
    return "Mật khẩu hiện tại không đúng";
  }
  return message;
};

export default function ChangePasswordDialog({ open, onClose }) {
  const [form, setForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [loading, setLoading] = useState(false);

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

    if (!form.current_password || !form.new_password) {
      toast.error("Vui lòng nhập đầy đủ thông tin");
      return;
    }
    if (form.new_password !== form.confirm_password) {
      toast.error("Mật khẩu mới và xác nhận không khớp");
      return;
    }
    if (form.new_password === form.current_password) {
      toast.error("Mật khẩu mới phải khác mật khẩu hiện tại");
      return;
    }

    setLoading(true);
    try {
      await putFetcher(API_CHANGE_PASSWORD, {
        current_password: form.current_password,
        new_password: form.new_password,
      });
      toast.success("Đổi mật khẩu thành công");
      resetForm();
      onClose();
    } catch (error) {
      toast.error(mapErrorMessage(error?.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs">
      <form onSubmit={handleSubmit}>
        <DialogTitle>Đổi mật khẩu</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
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
