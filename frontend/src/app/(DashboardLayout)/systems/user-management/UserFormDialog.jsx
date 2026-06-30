"use client";

import React, { useState, useEffect, useContext } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  MenuItem,
  CircularProgress,
} from "@mui/material";
import { toast } from "react-toastify";
import { getFetcher, postFetcher, putFetcher } from "@/app/api/globalFetcher";
import { useHasPermission } from "@/app/utils/auth/useHasPermission";
import { UserDataContext } from "@/app/context/UserDataContext";

const fetchRoles = async () => {
  try {
    const data = await getFetcher("/api/rbac/roles");
    return Array.isArray(data) ? data.map((r) => r.name) : [];
  } catch {
    return [];
  }
};

export default function UserFormDialog({
  open,
  onClose,
  user,
  isMobile = false,
}) {
  const isEdit = Boolean(user);
  const { user: currentUser } = useContext(UserDataContext);
  const isEditingSelf = isEdit && user?.id === currentUser?.id;
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    full_name: "",
    phone: "",
    role: "",
    is_active: true,
  });
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState([]);

  useEffect(() => {
    if (open) {
      fetchRoles().then((r) => {
        setRoles(r.filter((role) => role !== "root"));
        let roleInit = user?.role || user?.roles?.[0] || "";
        if (roleInit && !r.includes(roleInit)) roleInit = "";

        setForm({
          username: user?.username || "",
          email: user?.email || "",
          password: "",
          full_name: user?.full_name || "",
          phone: user?.phone || "",
          role: roleInit,
          is_active: user?.is_active !== undefined ? user.is_active : true,
        });
      });
    }
  }, [open, user]);

  useEffect(() => {
    if (!open) {
      setForm({
        username: "",
        email: "",
        password: "",
        full_name: "",
        phone: "",
        role: "",
        is_active: true,
      });
    }
  }, [open]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form };
      if (isEditingSelf) {
        delete payload.role;
      }
      let res;
      if (isEdit) {
        res = await putFetcher(`/api/users/${user.id}`, payload);
      } else {
        res = await postFetcher("/api/users", payload);
      }
      if (!res) throw new Error("Lưu người dùng thất bại");
      onClose(true, isEdit ? "Cập nhật thành công" : "Thêm mới thành công");
    } catch (e) {
      toast.error(e.message);
      onClose(false, e.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const canCreate = useHasPermission("user", "create");
  const canUpdate = useHasPermission("user", "update");
  const canSubmit = isEdit ? canUpdate : canCreate;

  return (
    <Dialog
      open={open}
      onClose={() => onClose(false)}
      maxWidth="xs"
      fullWidth
      fullScreen={isMobile}
    >
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          {isEdit ? "Sửa người dùng" : "Thêm người dùng"}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField
              label="Username"
              name="username"
              value={form.username}
              onChange={handleChange}
              required
              fullWidth
              disabled={isEdit}
            />
            <TextField
              label="Email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              fullWidth
              type="email"
            />
            {!isEdit && (
              <TextField
                label="Mật khẩu"
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                fullWidth
                type="password"
              />
            )}
            <TextField
              label="Họ tên"
              name="full_name"
              value={form.full_name}
              onChange={handleChange}
              fullWidth
            />
            <TextField
              label="Số điện thoại"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              fullWidth
            />
            <TextField
              select
              label="Vai trò"
              name="role"
              value={form.role}
              onChange={handleChange}
              required
              fullWidth
              disabled={isEditingSelf}
              helperText={
                isEditingSelf
                  ? "Không thể tự đổi vai trò của chính mình"
                  : ""
              }
            >
              {roles.map((r) => (
                <MenuItem key={r} value={r}>
                  {r}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
          <DialogActions sx={{ padding: "10px 0" }}>
            <Button onClick={() => onClose(false)}>Huỷ</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading || !canSubmit}
            >
              {loading ? <CircularProgress size={20} color="inherit" /> : "Lưu"}
            </Button>
          </DialogActions>
        </DialogContent>
      </form>
    </Dialog>
  );
}
