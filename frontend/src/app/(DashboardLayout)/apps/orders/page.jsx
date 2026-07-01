"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import useSWR from "swr";
import mqtt from "mqtt";
import {
  Badge,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Collapse,
  Divider,
  Grid,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { IconChevronDown, IconChevronUp } from "@tabler/icons-react";
import { toast } from "react-toastify";

import PageContainer from "@/app/components/container/PageContainer";
import api from "@/app/api/api";
import { getFetcher, postFetcher } from "@/app/api/globalFetcher";
import { useTenant } from "@/app/context/TenantContext";
import { useRuntimeConfig } from "@/app/utils/hooks/useRuntimeConfig";

const STATUS_MENU = [
  { key: "pending", label: "Pending" },
  { key: "confirmed", label: "Confirmed" },
  { key: "preparing", label: "Preparing" },
  { key: "served", label: "Served" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
];

const statusKeys = STATUS_MENU.map((item) => item.key);

function normalizeMqttUrl(value) {
  if (!value || typeof value !== "string") return null;
  if (!/^(mqtt|ws|wss):\/\//.test(value)) {
    value = `ws://${value}`;
  }
  try {
    const url = new URL(value);
    if (!["ws:", "wss:"].includes(url.protocol)) {
      return null;
    }
    return value;
  } catch {
    return null;
  }
}

function playBeep() {
  if (typeof window === "undefined") return;
  try {
    const context = new window.AudioContext();
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = 880;
    gainNode.gain.value = 0.05;
    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.15);
  } catch {}
}

export default function OrdersPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { tenantCode } = useTenant();
  const { mqttServer } = useRuntimeConfig();
  const [selectedStatus, setSelectedStatus] = useState("pending");
  const clientRef = useRef(null);

  const ordersUrl = `${api.GET_ORDER_LIST}?page=1&page_size=100`;
  const { data: ordersData, mutate: mutateOrders } = useSWR(ordersUrl, getFetcher, {
    refreshInterval: 5000,
  });
  const { data: summaryData, mutate: mutateSummary } = useSWR("/api/orders/summary", getFetcher, {
    refreshInterval: 5000,
  });

  const orders = useMemo(() => ordersData?.data || [], [ordersData]);
  const unpaidByTable = useMemo(() => {
    const map = new Map();
    orders.forEach((order) => {
      if (order.is_paid || order.status === "cancelled") return;
      const key = order.table_id;
      const existing = map.get(key) || {
        table_id: order.table_id,
        table_name: order.table_name,
        table_code: order.table_code,
        orderCount: 0,
        total: 0,
      };
      existing.orderCount += 1;
      existing.total += Number(order.total_amount || 0);
      map.set(key, existing);
    });
    return Array.from(map.values()).sort((a, b) => a.table_id - b.table_id);
  }, [orders]);
  const groupedOrders = useMemo(() => {
    const map = Object.fromEntries(statusKeys.map((status) => [status, []]));
    orders.forEach((order) => {
      const key = order.status || "pending";
      if (!map[key]) map[key] = [];
      map[key].push(order);
    });
    return map;
  }, [orders]);

  const selectedMenu = STATUS_MENU.find((item) => item.key === selectedStatus);
  const visibleOrders = groupedOrders[selectedStatus] || [];

  useEffect(() => {
    const mqttUrl = normalizeMqttUrl(mqttServer);
    if (!mqttUrl || !tenantCode) return;

    const client = mqtt.connect(mqttUrl, { clean: true });
    clientRef.current = client;

    client.on("connect", () => {
      client.subscribe(`TunsTool/${tenantCode}/orders`);
    });

    client.on("message", (_topic, message) => {
      try {
        const payload = JSON.parse(message.toString());
        if (payload.event === "order_created" || payload.event === "order_appended") {
          playBeep();
          toast.info(`Có cập nhật đơn từ bàn ${payload.table_code || ""}`.trim());
        }
        mutateOrders();
        mutateSummary();
      } catch (error) {
        console.error("MQTT parse error", error);
      }
    });

    return () => {
      client.end(true);
      clientRef.current = null;
    };
  }, [mqttServer, tenantCode, mutateOrders, mutateSummary]);

  const markTablePaid = async (tableId) => {
    try {
      await postFetcher(`${api.MARK_TABLE_PAID}/${tableId}/mark-paid`, { is_paid: true });
      toast.success("Đã xác nhận thanh toán cho bàn");
      mutateOrders();
      mutateSummary();
    } catch (error) {
      toast.error(error.message || "Không thể xác nhận thanh toán");
    }
  };

  const updateStatus = async (orderId, status) => {
    try {
      await postFetcher(`${api.POST_ORDER_STATUS}/${orderId}/status`, { status });
      toast.success("Đã cập nhật trạng thái đơn");
      mutateOrders();
      mutateSummary();
    } catch (error) {
      toast.error(error.message || "Không thể cập nhật trạng thái");
    }
  };

  const statusMenu = (
    <List
      component="nav"
      disablePadding
      sx={{
        display: "flex",
        flexDirection: isMobile ? "row" : "column",
        flexWrap: isMobile ? "wrap" : "nowrap",
        gap: 0.5,
        p: isMobile ? 0 : 1,
      }}
    >
      {STATUS_MENU.map((item) => {
        const count = summaryData?.[item.key] ?? groupedOrders[item.key]?.length ?? 0;
        const selected = selectedStatus === item.key;
        return (
          <ListItemButton
            key={item.key}
            selected={selected}
            onClick={() => setSelectedStatus(item.key)}
            sx={{
              borderRadius: 1,
              mb: isMobile ? 0 : 0.5,
              px: 2,
              py: 1.25,
              minWidth: isMobile ? "auto" : "100%",
              flex: isMobile ? "1 1 auto" : "none",
              color: selected ? "primary.contrastText" : "text.secondary",
              bgcolor: selected ? "primary.main" : "transparent",
              "&.Mui-selected": {
                bgcolor: "primary.main",
                color: "primary.contrastText",
                "&:hover": { bgcolor: "primary.dark" },
              },
              "&:hover": {
                bgcolor: selected ? "primary.dark" : "primary.light",
                color: selected ? "primary.contrastText" : "primary.main",
              },
            }}
          >
            <ListItemText
              primary={item.label}
              primaryTypographyProps={{
                fontWeight: selected ? 700 : 500,
                fontSize: "0.95rem",
              }}
            />
            <Badge
              badgeContent={count}
              color={selected ? "default" : "primary"}
              sx={{
                ml: 1,
                "& .MuiBadge-badge": {
                  position: "static",
                  transform: "none",
                  bgcolor: selected ? "rgba(255,255,255,0.25)" : undefined,
                  color: selected ? "inherit" : undefined,
                },
              }}
            />
          </ListItemButton>
        );
      })}
    </List>
  );

  return (
    <PageContainer title="Quản lý đơn hàng" description="Theo dõi đơn hàng realtime từ khách quét QR">
      {unpaidByTable.length > 0 && (
        <Card variant="outlined" sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={700} mb={2}>
              Thanh toán theo bàn
            </Typography>
            <Stack spacing={1.5}>
              {unpaidByTable.map((table) => (
                <Stack
                  key={table.table_id}
                  direction={{ xs: "column", sm: "row" }}
                  justifyContent="space-between"
                  alignItems={{ xs: "stretch", sm: "center" }}
                  spacing={1}
                  sx={{
                    p: 1.5,
                    border: 1,
                    borderColor: "divider",
                    borderRadius: 2,
                  }}
                >
                  <Box>
                    <Typography fontWeight={700}>
                      Bàn {table.table_name || table.table_code}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {table.orderCount} đơn chưa thanh toán
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="h6" color="primary.main" fontWeight={700}>
                      {table.total.toLocaleString("vi-VN")} đ
                    </Typography>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => markTablePaid(table.table_id)}
                    >
                      Xác nhận thanh toán bàn
                    </Button>
                  </Stack>
                </Stack>
              ))}
            </Stack>
          </CardContent>
        </Card>
      )}
      <Card variant="outlined" sx={{ overflow: "hidden" }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            minHeight: isMobile ? "auto" : "calc(100vh - 220px)",
          }}
        >
          <Box
            sx={{
              width: isMobile ? "100%" : 240,
              flexShrink: 0,
              borderRight: isMobile ? "none" : 1,
              borderBottom: isMobile ? 1 : 0,
              borderColor: "divider",
              bgcolor: "background.default",
            }}
          >
            {!isMobile && (
              <Box sx={{ px: 2, py: 2, borderBottom: 1, borderColor: "divider" }}>
                <Typography variant="subtitle2" color="text.secondary" fontWeight={600}>
                  Trạng thái
                </Typography>
              </Box>
            )}
            {statusMenu}
          </Box>

          <Box sx={{ flex: 1, p: { xs: 2, md: 3 }, minWidth: 0 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h5" fontWeight={700}>
                {selectedMenu?.label || selectedStatus}
              </Typography>
              <Chip label={`${visibleOrders.length} đơn`} color="primary" size="small" />
            </Stack>

            {visibleOrders.length === 0 ? (
              <Box
                sx={{
                  py: 8,
                  textAlign: "center",
                  color: "text.secondary",
                  border: 1,
                  borderColor: "divider",
                  borderRadius: 2,
                  borderStyle: "dashed",
                }}
              >
                <Typography>Không có đơn hàng ở trạng thái này</Typography>
              </Box>
            ) : (
              <Grid container spacing={2}>
                {visibleOrders.map((order) => {
                  const tableUnpaid = unpaidByTable.find((item) => item.table_id === order.table_id);
                  return (
                    <Grid key={order.id} size={{ xs: 12, lg: 6, xl: 4 }}>
                      <OrderCard
                        order={order}
                        tableUnpaid={tableUnpaid}
                        onUpdateStatus={updateStatus}
                      />
                    </Grid>
                  );
                })}
              </Grid>
            )}
          </Box>
        </Box>
      </Card>
    </PageContainer>
  );
}

function OrderCard({ order, tableUnpaid, onUpdateStatus }) {
  const itemCount = (order.items || []).reduce((sum, item) => sum + item.quantity, 0);
  const detailsExpandedByDefault = order.status === "confirmed";
  const [showDetails, setShowDetails] = useState(detailsExpandedByDefault);

  useEffect(() => {
    setShowDetails(order.status === "confirmed");
  }, [order.id, order.status]);

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={1}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography fontWeight={700}>
                Bàn {order.table_name || order.table_code}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Đơn #{order.id}
              </Typography>
            </Box>
            <Chip
              label={order.is_paid ? "Đã thanh toán" : "Chưa thanh toán"}
              color={order.is_paid ? "success" : "warning"}
              size="small"
            />
          </Stack>
          <Typography variant="h6" color="primary.main">
            {Number(order.total_amount || 0).toLocaleString("vi-VN")} đ
          </Typography>
          {!order.is_paid && tableUnpaid && tableUnpaid.orderCount > 1 ? (
            <Typography variant="body2" color="text.secondary">
              Tổng bàn ({tableUnpaid.orderCount} đơn): {tableUnpaid.total.toLocaleString("vi-VN")} đ
            </Typography>
          ) : null}
          <Stack
            direction="row"
            alignItems="center"
            spacing={0.5}
            onClick={() => setShowDetails((prev) => !prev)}
            sx={{ cursor: "pointer", userSelect: "none" }}
          >
            <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
              {itemCount} món
              {!showDetails && itemCount > 0 ? " — bấm để xem chi tiết" : ""}
            </Typography>
            {itemCount > 0 && (
              <IconButton size="small" aria-label={showDetails ? "Ẩn chi tiết" : "Xem chi tiết"}>
                {showDetails ? <IconChevronUp size={18} /> : <IconChevronDown size={18} />}
              </IconButton>
            )}
          </Stack>
          <Collapse in={showDetails}>
            <Stack spacing={0.5}>
              {(order.items || []).map((item) => (
                <Typography key={item.id} variant="body2">
                  {item.quantity} x {item.product_name}{" "}
                  <Typography component="span" variant="caption" color="text.secondary">
                    (batch {item.batch_no})
                  </Typography>
                </Typography>
              ))}
            </Stack>
          </Collapse>
          {order.note && (
            <>
              <Divider />
              <Typography variant="body2">Ghi chú: {order.note}</Typography>
            </>
          )}
          <Divider />
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {order.status !== "confirmed" && order.status !== "completed" && order.status !== "cancelled" && (
              <Button size="small" variant="outlined" onClick={() => onUpdateStatus(order.id, "confirmed")}>
                Xác nhận
              </Button>
            )}
            {order.status !== "preparing" && order.status !== "completed" && order.status !== "cancelled" && (
              <Button size="small" variant="outlined" onClick={() => onUpdateStatus(order.id, "preparing")}>
                Đang chuẩn bị
              </Button>
            )}
            {order.status !== "served" && order.status !== "completed" && order.status !== "cancelled" && (
              <Button size="small" variant="outlined" onClick={() => onUpdateStatus(order.id, "served")}>
                Đã phục vụ
              </Button>
            )}
            {order.status !== "cancelled" && order.status !== "completed" && (
              <Button size="small" color="error" onClick={() => onUpdateStatus(order.id, "cancelled")}>
                Huỷ
              </Button>
            )}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
