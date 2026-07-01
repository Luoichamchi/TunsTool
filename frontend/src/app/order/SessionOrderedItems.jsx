import React from "react";
import { Box, Card, CardContent, Divider, Stack, Typography } from "@mui/material";

export default function SessionOrderedItems({ sessionOrdersData }) {
  const orders = sessionOrdersData?.orders || [];
  if (!orders.length) return null;

  const sessionTotalAmount = Number(sessionOrdersData?.total_amount || 0);
  const sessionOrderCount = sessionOrdersData?.order_count || orders.length;
  const sortedOrders = [...orders].sort((a, b) => {
    const timeDiff = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    return timeDiff !== 0 ? timeDiff : a.id - b.id;
  });

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6" fontWeight={700}>
          Món đã đặt
        </Typography>
        <Stack spacing={2} mt={2}>
          {sortedOrders.map((order, index) => (
            <Box key={order.id}>
              {index > 0 ? <Divider sx={{ mb: 2 }} /> : null}
              <Typography variant="subtitle2" color="text.secondary" fontWeight={600} mb={1}>
                Đơn #{order.id}
              </Typography>
              <Stack spacing={1}>
                {(order.items || []).map((item) => (
                  <Box key={item.id}>
                    <Typography fontWeight={600}>
                      {item.quantity} x {item.product_name}
                    </Typography>
                    {item.note ? (
                      <Typography variant="body2" color="text.secondary">
                        Ghi chú: {item.note}
                      </Typography>
                    ) : null}
                  </Box>
                ))}
              </Stack>
              {order.note ? (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Ghi chú đơn: {order.note}
                </Typography>
              ) : null}
            </Box>
          ))}
        </Stack>
        <Divider sx={{ my: 2 }} />
        <Typography variant="h6" fontWeight={700} color="primary.main">
          Tổng bàn ({sessionOrderCount} đơn): {sessionTotalAmount.toLocaleString("vi-VN")} đ
        </Typography>
      </CardContent>
    </Card>
  );
}
