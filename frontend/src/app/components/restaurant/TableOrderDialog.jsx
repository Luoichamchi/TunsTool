"use client";

import React, { useMemo, useState } from "react";
import useSWR from "swr";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { IconMinus, IconPlus, IconX } from "@tabler/icons-react";
import { toast } from "react-toastify";

import api from "@/app/api/api";
import { getFetcher, postFetcher } from "@/app/api/globalFetcher";
import SessionOrderedItems from "@/app/order/SessionOrderedItems";

function CartQuantityButton({ onClick, children }) {
  return (
    <IconButton size="small" onClick={onClick} sx={{ border: "1px solid", borderColor: "divider" }}>
      {children}
    </IconButton>
  );
}

export default function TableOrderDialog({ open, table, onClose, onOrderSubmitted }) {
  const [cart, setCart] = useState({});
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const tableId = table?.id;
  const menuUrl = open ? api.GET_TABLE_MENU : null;
  const currentOrderUrl = open && tableId ? `${api.GET_TABLE_CURRENT_ORDER}/${tableId}/current-order` : null;

  const { data: menuData } = useSWR(menuUrl, getFetcher);
  const { data: sessionOrdersData, mutate: mutateOrders } = useSWR(currentOrderUrl, getFetcher, {
    refreshInterval: open ? 10000 : 0,
  });

  const categories = useMemo(() => menuData?.categories || [], [menuData]);
  const sessionTotalAmount = Number(sessionOrdersData?.total_amount || 0);
  const sessionOrderCount = sessionOrdersData?.order_count || 0;

  const cartItems = useMemo(() => {
    const productMap = new Map();
    categories.forEach((category) => {
      category.products.forEach((product) => {
        productMap.set(product.id, product);
      });
    });
    return Object.entries(cart)
      .filter(([, item]) => item.quantity > 0)
      .map(([productId, item]) => ({
        ...item,
        product: productMap.get(Number(productId)),
      }))
      .filter((item) => item.product);
  }, [cart, categories]);

  const totalAmount = cartItems.reduce(
    (sum, item) => sum + Number(item.product?.price || 0) * item.quantity,
    0,
  );

  const resetForm = () => {
    setCart({});
    setNote("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const updateQuantity = (product, delta) => {
    setCart((prev) => {
      const current = prev[product.id] || { quantity: 0, note: "" };
      const nextQuantity = Math.max(0, current.quantity + delta);
      return {
        ...prev,
        [product.id]: {
          quantity: nextQuantity,
          note: current.note,
        },
      };
    });
  };

  const updateItemNote = (productId, value) => {
    setCart((prev) => ({
      ...prev,
      [productId]: {
        ...(prev[productId] || { quantity: 1 }),
        note: value,
      },
    }));
  };

  const submitOrder = async () => {
    if (!cartItems.length) {
      toast.error("Vui lòng chọn món trước khi xác nhận");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        note,
        items: cartItems.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
          note: item.note || "",
        })),
      };
      await postFetcher(`${api.POST_TABLE_ORDER}/${tableId}/orders`, payload);
      toast.success("Đã gửi đơn hàng");
      resetForm();
      mutateOrders();
      onOrderSubmitted?.();
    } catch (error) {
      toast.error(error.message || "Không thể gửi đơn hàng");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm" fullScreen={false}>
      <DialogTitle sx={{ pr: 6 }}>
        Đặt món — {table?.name || ""}
        <IconButton
          onClick={handleClose}
          sx={{ position: "absolute", right: 8, top: 8 }}
          aria-label="Đóng"
        >
          <IconX size={18} />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ px: 2 }}>
        <Stack spacing={2}>
          <Typography variant="body2" color="text.secondary">
            Đặt món thay khách khi không quét QR. Mã bàn: {table?.table_code}
          </Typography>

          <SessionOrderedItems sessionOrdersData={sessionOrdersData} />

          {categories.map((category) => (
            <Box key={category.id}>
              <Typography variant="subtitle1" fontWeight={700} mb={1}>
                {category.name}
              </Typography>
              <Stack spacing={2}>
                {category.products.map((product) => {
                  const item = cart[product.id] || { quantity: 0, note: "" };
                  return (
                    <Box key={product.id}>
                      <Stack direction="row" spacing={2} alignItems="start">
                        <Box
                          sx={{
                            width: 72,
                            height: 72,
                            borderRadius: 2,
                            overflow: "hidden",
                            bgcolor: "action.hover",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          {product.image_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={product.image_url}
                              alt={product.name}
                              style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
                          ) : (
                            <Typography variant="caption">No image</Typography>
                          )}
                        </Box>
                        <Box flex={1}>
                          <Typography fontWeight={700}>{product.name}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {Number(product.price || 0).toLocaleString("vi-VN")} đ
                          </Typography>
                          <Stack direction="row" spacing={1} alignItems="center" mt={1}>
                            <CartQuantityButton onClick={() => updateQuantity(product, -1)}>
                              <IconMinus size={14} />
                            </CartQuantityButton>
                            <Typography minWidth={24} textAlign="center">
                              {item.quantity}
                            </Typography>
                            <CartQuantityButton onClick={() => updateQuantity(product, 1)}>
                              <IconPlus size={14} />
                            </CartQuantityButton>
                          </Stack>
                          {item.quantity > 0 && (
                            <TextField
                              fullWidth
                              size="small"
                              label="Ghi chú món"
                              value={item.note || ""}
                              onChange={(e) => updateItemNote(product.id, e.target.value)}
                              sx={{ mt: 1 }}
                            />
                          )}
                        </Box>
                      </Stack>
                      <Divider sx={{ mt: 2 }} />
                    </Box>
                  );
                })}
              </Stack>
            </Box>
          ))}

          <Box>
            <Typography variant="subtitle1" fontWeight={700}>
              Giỏ hàng
            </Typography>
            <Stack spacing={1} mt={1}>
              {cartItems.length ? (
                cartItems.map((item) => (
                  <Typography key={item.product.id} fontWeight={600}>
                    {item.quantity} x {item.product.name}
                  </Typography>
                ))
              ) : (
                <Typography color="text.secondary">Chưa chọn món.</Typography>
              )}
            </Stack>
            <TextField
              fullWidth
              label="Ghi chú đơn hàng"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              multiline
              rows={2}
              sx={{ mt: 2 }}
            />
            {cartItems.length > 0 && sessionOrderCount > 0 ? (
              <Typography variant="body2" color="text.secondary" mt={1}>
                Tổng bàn sau khi gửi:{" "}
                {(sessionTotalAmount + totalAmount).toLocaleString("vi-VN")} đ
              </Typography>
            ) : null}
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 2, py: 1.5, justifyContent: "space-between" }}>
        <Typography variant="h6" color="primary.main">
          {cartItems.length > 0 ? `${totalAmount.toLocaleString("vi-VN")} đ` : ""}
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button onClick={handleClose}>Đóng</Button>
          <Button
            variant="contained"
            onClick={submitOrder}
            disabled={submitting || !cartItems.length}
          >
            {submitting ? "Đang gửi..." : "Xác nhận đặt món"}
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
}
