"use client";

import React, { Suspense } from "react";
import useSWR from "swr";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  Typography,
} from "@mui/material";
import { useParams, useRouter, useSearchParams } from "next/navigation";

import { publicGetFetcher } from "@/app/api/globalFetcher";
import SessionOrderedItems from "@/app/order/SessionOrderedItems";

const STATUS_LABELS = {
  pending: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  preparing: "Đang chế biến",
  served: "Đã phục vụ",
  completed: "Hoàn tất",
  cancelled: "Đã hủy",
};

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

        <SessionOrderedItems sessionOrdersData={sessionOrdersData} />

        <Button variant="contained" fullWidth size="large" onClick={goOrderMore}>
          Gọi thêm món
        </Button>
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
