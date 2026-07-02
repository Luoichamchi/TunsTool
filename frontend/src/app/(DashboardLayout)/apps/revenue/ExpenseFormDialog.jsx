"use client";

import React, { useEffect, useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from "@mui/material";

const CATEGORY_OPTIONS = [
  { value: "ingredient", label: "Nguyên liệu" },
  { value: "utility", label: "Điện nước" },
  { value: "labor", label: "Nhân công" },
  { value: "rent", label: "Mặt bằng" },
  { value: "other", label: "Khác" },
];

function toInputDate(value) {
  if (!value) return "";
  if (typeof value === "string") return value.slice(0, 10);
  return "";
}

export default function ExpenseFormDialog({
  open,
  onClose,
  onSubmit,
  initialValue,
  isSubmitting = false,
}) {
  const [form, setForm] = useState({
    expense_date: "",
    amount: "",
    category: "ingredient",
    note: "",
  });

  useEffect(() => {
    if (!open) return;
    setForm({
      expense_date: toInputDate(initialValue?.expense_date),
      amount: initialValue?.amount ? String(initialValue.amount) : "",
      category: initialValue?.category || "ingredient",
      note: initialValue?.note || "",
    });
  }, [initialValue, open]);

  const handleChange = (field) => (event) => {
    setForm((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleSubmit = async () => {
    await onSubmit({
      expense_date: form.expense_date,
      amount: Number(form.amount || 0),
      category: form.category,
      note: form.note?.trim() || null,
    });
  };

  return (
    <Dialog open={open} onClose={isSubmitting ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>{initialValue?.id ? "Cập nhật khoản chi" : "Thêm khoản chi"}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Ngày chi"
            type="date"
            value={form.expense_date}
            onChange={handleChange("expense_date")}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
          <TextField
            label="Số tiền"
            type="number"
            value={form.amount}
            onChange={handleChange("amount")}
            fullWidth
            inputProps={{ min: 0, step: "1000" }}
          />
          <FormControl fullWidth>
            <InputLabel id="expense-category-label">Loại chi phí</InputLabel>
            <Select
              labelId="expense-category-label"
              label="Loại chi phí"
              value={form.category}
              onChange={handleChange("category")}
            >
              {CATEGORY_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Ghi chú"
            value={form.note}
            onChange={handleChange("note")}
            fullWidth
            multiline
            minRows={3}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isSubmitting}>
          Hủy
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={isSubmitting || !form.expense_date || !form.amount}
        >
          {initialValue?.id ? "Lưu thay đổi" : "Thêm chi phí"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
