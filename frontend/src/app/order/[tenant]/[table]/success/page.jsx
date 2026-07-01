"use client";

import React, { Suspense } from "react";
import useSWR from "swr";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import { useParams, useRouter, useSearchParams } from "next/navigation";

import { publicGetFetcher } from "@/app/api/globalFetcher";

const STATUS_LABELS = {
  pending: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  preparing: "Đang chế biến",
  served: "Đã phục vụ",
  completed: "Hoàn tất",
  cancelled: "Đã hủy",
};

function formatCurrency(value) {
  return Number(value || 0).toLocaleString("vi-VN");
}

function OrderSuccessContent() {
  const { tenant, table: sessionToken } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  const orderUrl = orderId
    ? `/api/public/${tenant}/orders/${orderId}?session_token=${encodeURIComponent(sessionToken)}`
    : null;
  const sessionOrdersUrl = `/api/public/${tenant}/tables/${sessionToken}/current-order`;

  const { data: order, error, isLoading } = useSWR(orderUrl, publicGetFetcher, {
    refreshInterval: 10000,
  });
  const { data: sessionOrdersData } = useSWR(sessionOrdersUrl, publicGetFetcher, {
    refreshInterval: 10000,
  });

  const sessionOrderCount = sessionOrdersData?.order_count || 0;
  const sessionTotalAmount = Number(sessionOrdersData?.total_amount || 0);

  const goOrderMore = () => {
    router.push(`/order/${tenant}/${sessionToken}`);
  };

  if (!orderId) {
    return (
      <Box sx={{ maxWidth: 720, mx: "auto", px: 2, py: 3 }}>
        <Alert severity="error">Không tìm thấy thông tin đơn hàng.</Alert>
        <Button variant="contained" onClick={goOrderMore} sx={{ mt: 2 }}>
          Quay lại đặt món
        </Button>
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Box sx={{ maxWidth: 720, mx: "auto", px: 2, py: 3 }}>
        <Typography>Đang tải đơn hàng...</Typography>
      </Box>
    );
  }

  if (error || !order) {
    return (
      <Box sx={{ maxWidth: 720, mx: "auto", px: 2, py: 3 }}>
        <Alert severity="error">Không thể tải thông tin đơn hàng.</Alert>
        <Button variant="contained" onClick={goOrderMore} sx={{ mt: 2 }}>
          Quay lại đặt món
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 720, mx: "auto", px: 2, py: 3 }}>
      <Stack spacing={2}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h4" fontWeight={700} color="success.main">
              Đặt hàng thành công
            </Typography>
            <Typography variant="body1" color="text.secondary" mt={1}>
              Đơn #{order.id} · Trạng thái:{" "}
              <strong>{STATUS_LABELS[order.status] || order.status}</strong>
            </Typography>
            {order.table_name ? (
              <Typography variant="body2" color="text.secondary" mt={0.5}>
                {order.table_name}
                {order.table_code ? ` (${order.table_code})` : ""}
              </Typography>
            ) : null}
          </CardContent>
        </Card>

        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" fontWeight={700} mb={2}>
              Món đã đặt
            </Typography>
            <Stack spacing={1.5} divider={<Divider flexItem />}>
              {(order.items || []).map((item) => (
                <Box key={item.id}>
                  <Stack direction="row" justifyContent="space-between" alignItems="start">
                    <Box>
                      <Typography fontWeight={600}>
                        {item.quantity} x {item.product_name}
                      </Typography>
                      {item.note ? (
                        <Typography variant="body2" color="text.secondary">
                          Ghi chú: {item.note}
                        </Typography>
                      ) : null}
                      <Typography variant="body2" color="text.secondary">
                        {formatCurrency(item.unit_price)} đ / món
                      </Typography>
                    </Box>
                    <Typography fontWeight={600}>
                      {formatCurrency(item.subtotal)} đ
                    </Typography>
                  </Stack>
                </Box>
              ))}
            </Stack>

            {order.note ? (
              <Typography variant="body2" color="text.secondary" mt={2}>
                Ghi chú đơn: {order.note}
              </Typography>
            ) : null}

            <Stack direction="row" justifyContent="space-between" alignItems="center" mt={3}>
              <Box>
                <Typography variant="h5" fontWeight={700} color="primary.main">
                  Tổng đơn này: {formatCurrency(order.total_amount)} đ
                </Typography>
                {sessionOrderCount > 1 ? (
                  <Typography variant="body1" color="text.secondary" mt={0.5}>
                    Tổng bàn ({sessionOrderCount} đơn): {formatCurrency(sessionTotalAmount)} đ
                  </Typography>
                ) : null}
              </Box>
            </Stack>

            <Button variant="contained" fullWidth size="large" onClick={goOrderMore} sx={{ mt: 3 }}>
              Gọi thêm món
            </Button>
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense
      fallback={
        <Box sx={{ maxWidth: 720, mx: "auto", px: 2, py: 3 }}>
          <Typography>Đang tải...</Typography>
        </Box>
      }
    >
      <OrderSuccessContent />
    </Suspense>
  );
}
