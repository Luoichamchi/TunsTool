import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  Typography,
} from "@mui/material";
import { toast } from "react-toastify";
import { postFetcher } from "@/app/api/globalFetcher";

const API_RESET_PASSWORD = "/api/auth/reset-password";
export const DEFAULT_RESET_PASSWORD = "TunsTool@123";

export default function UserResetPasswordDialog({ open, onClose, user }) {
  const [loading, setLoading] = useState(false);

  const handleClose = () => {
    if (loading) return;
    onClose();
  };

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await postFetcher(API_RESET_PASSWORD, {
        username: user.username,
        new_password: DEFAULT_RESET_PASSWORD,
      });
      toast.success(
        `Reset mật khẩu thành công. Mật khẩu mới: ${DEFAULT_RESET_PASSWORD}`
      );
      onClose(true);
    } catch (error) {
      toast.error(error?.message || "Reset mật khẩu thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs">
      <DialogTitle>Reset mật khẩu — {user?.username || ""}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Bạn có chắc muốn reset mật khẩu cho tài khoản{" "}
          <strong>{user?.full_name || user?.username}</strong>?
        </Typography>
        <Typography variant="body2" sx={{ mt: 2 }}>
          Mật khẩu mới sẽ được đặt thành:{" "}
          <strong>{DEFAULT_RESET_PASSWORD}</strong>
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={loading}>
          Hủy
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          color="warning"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={18} /> : null}
        >
          Reset
        </Button>
      </DialogActions>
    </Dialog>
  );
}
