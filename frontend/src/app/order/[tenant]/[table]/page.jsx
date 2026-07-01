"use client";

import React, { useMemo, useState } from "react";
import useSWR from "swr";
import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  IconButton,
  Stack,
  TextField,
  Typography,
  Alert,
} from "@mui/material";
import { IconMinus, IconPlus } from "@tabler/icons-react";
import { useParams } from "next/navigation";
import { toast } from "react-toastify";

import { publicGetFetcher, publicPostFetcher } from "@/app/api/globalFetcher";

function CartQuantityButton({ onClick, children }) {
  return (
    <IconButton size="small" onClick={onClick} sx={{ border: "1px solid", borderColor: "divider" }}>
      {children}
    </IconButton>
  );
}

export default function PublicOrderPage() {
  const { tenant, table } = useParams();
  const [cart, setCart] = useState({});
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const tableUrl = `/api/public/${tenant}/tables/${table}`;
  const menuUrl = `/api/public/${tenant}/menu`;
  const currentOrderUrl = `/api/public/${tenant}/tables/${table}/current-order`;

  const { data: tableInfo } = useSWR(tableUrl, publicGetFetcher);
  const { data: menuData } = useSWR(menuUrl, publicGetFetcher);
  const { data: currentOrderData, mutate: mutateCurrentOrder } = useSWR(
    currentOrderUrl,
    publicGetFetcher,
    { refreshInterval: 15000 },
  );

  const categories = useMemo(() => menuData?.categories || [], [menuData]);
  const currentOrder = currentOrderData?.order || null;

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
    setSubmitSuccess(false);
    try {
      const payload = {
        qr_token: table,
        note,
        items: cartItems.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
          note: item.note || "",
        })),
      };
      await publicPostFetcher(`/api/public/${tenant}/orders`, payload);
      setCart({});
      setNote("");
      setSubmitSuccess(true);
      toast.success("Đã gửi đơn hàng");
      await mutateCurrentOrder();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Không thể gửi đơn hàng";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 720, mx: "auto", px: 2, py: 3 }}>
      <Stack spacing={2}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h4" fontWeight={700}>
              Đặt món qua QR
            </Typography>
            <Typography variant="body1" color="text.secondary" mt={1}>
              {tableInfo ? `${tableInfo.name} (${tableInfo.table_code})` : "Đang tải thông tin bàn..."}
            </Typography>
          </CardContent>
        </Card>

        {categories.map((category) => (
          <Card key={category.id} variant="outlined">
            <CardContent>
              <Typography variant="h6" fontWeight={700} mb={2}>
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
                            width: 88,
                            height: 88,
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
                            {product.description || "Không có mô tả"}
                          </Typography>
                          <Typography variant="h6" color="primary.main" mt={1}>
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
                              label="Ghi chú cho món"
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
            </CardContent>
          </Card>
        ))}

        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" fontWeight={700}>
              Giỏ hàng
            </Typography>
            <Stack spacing={1} mt={2}>
              {cartItems.length ? (
                cartItems.map((item) => (
                  <Box key={item.product.id}>
                    <Typography fontWeight={600}>
                      {item.quantity} x {item.product.name}
                    </Typography>
                    {item.note ? (
                      <Typography variant="body2" color="text.secondary">
                        Ghi chú: {item.note}
                      </Typography>
                    ) : null}
                  </Box>
                ))
              ) : (
                <Typography color="text.secondary">Chưa có món nào được chọn.</Typography>
              )}
            </Stack>
            <TextField
              fullWidth
              label="Ghi chú cho đơn hàng"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              multiline
              rows={3}
              sx={{ mt: 2 }}
            />
            <Stack direction="row" justifyContent="space-between" alignItems="center" mt={2}>
              <Typography variant="h6" color="primary.main">
                Tổng: {totalAmount.toLocaleString("vi-VN")} đ
              </Typography>
              <Button
                variant="contained"
                onClick={submitOrder}
                disabled={submitting || !cartItems.length}
              >
                {submitting ? "Đang gửi..." : "Xác nhận đặt món"}
              </Button>
            </Stack>
            {submitSuccess && (
              <Alert severity="success" sx={{ mt: 2 }}>
                Đã gửi đơn hàng. Bạn có thể tiếp tục gọi thêm món, đơn sẽ được cộng dồn
                cho đến khi quán xác nhận thanh toán.
              </Alert>
            )}
          </CardContent>
        </Card>

        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" fontWeight={700}>
              Đơn hiện tại của bàn
            </Typography>
            {currentOrder ? (
              <Stack spacing={1} mt={2}>
                <Typography>
                  Trạng thái: <strong>{currentOrder.status}</strong>
                </Typography>
                <Typography>
                  Thanh toán: <strong>{currentOrder.is_paid ? "Đã thanh toán" : "Chưa thanh toán"}</strong>
                </Typography>
                {(currentOrder.items || []).map((item) => (
                  <Typography key={item.id} variant="body2">
                    {item.quantity} x {item.product_name} (batch {item.batch_no})
                  </Typography>
                ))}
                <Typography variant="h6" color="primary.main" pt={1}>
                  Tổng cộng: {Number(currentOrder.total_amount || 0).toLocaleString("vi-VN")} đ
                </Typography>
              </Stack>
            ) : (
              <Typography color="text.secondary" mt={2}>
                Bàn này hiện chưa có đơn mở.
              </Typography>
            )}
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
}
