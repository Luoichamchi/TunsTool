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
  const servedTableGroups = useMemo(
    () => (selectedStatus === "served" ? groupOrdersByTable(visibleOrders) : []),
    [selectedStatus, visibleOrders],
  );

  const updateGroupStatus = async (orderIds, status) => {
    try {
      await Promise.all(
        orderIds.map((orderId) => postFetcher(`${api.POST_ORDER_STATUS}/${orderId}/status`, { status })),
      );
      toast.success("Đã cập nhật trạng thái đơn");
      mutateOrders();
      mutateSummary();
    } catch (error) {
      toast.error(error.message || "Không thể cập nhật trạng thái");
    }
  };

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
      <Card variant="outlined" sx={{ overflow: "hidden", mb: 2 }}>
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
              <Chip
                label={
                  selectedStatus === "served"
                    ? `${servedTableGroups.length} bàn · ${visibleOrders.length} đơn`
                    : `${visibleOrders.length} đơn`
                }
                color="primary"
                size="small"
              />
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
            ) : selectedStatus === "served" ? (
              <Stack spacing={1.5}>
                {servedTableGroups.map((group) => {
                  const tableUnpaid = unpaidByTable.find((item) => item.table_id === group.table_id);
                  return (
                    <ServedTableGroupCard
                      key={group.table_id}
                      group={group}
                      tableUnpaid={tableUnpaid}
                      onUpdateGroupStatus={updateGroupStatus}
                      onMarkTablePaid={markTablePaid}
                    />
                  );
                })}
              </Stack>
            ) : (
              <Stack spacing={1.5}>
                {visibleOrders.map((order) => {
                  const tableUnpaid = unpaidByTable.find((item) => item.table_id === order.table_id);
                  return (
                    <OrderCard
                      key={order.id}
                      order={order}
                      tableUnpaid={tableUnpaid}
                      onUpdateStatus={updateStatus}
                    />
                  );
                })}
              </Stack>
            )}
          </Box>
        </Box>
      </Card>

      {unpaidByTable.length > 0 && (
        <Card variant="outlined">
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
                      {formatTableLabel(table)}
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
    </PageContainer>
  );
}

const ORDER_STATUS_FLOW = ["pending", "confirmed", "preparing", "served", "completed"];

const FORWARD_STATUS_ACTIONS = [
  { key: "confirmed", label: "Xác nhận", status: "confirmed" },
  { key: "preparing", label: "Đang chuẩn bị", status: "preparing" },
  { key: "served", label: "Đã phục vụ", status: "served" },
];

function buildStatusActions({ currentStatus, isPaid, onStatusChange, onMarkTablePaid }) {
  const currentIndex = ORDER_STATUS_FLOW.indexOf(currentStatus);
  const isTerminal = currentStatus === "completed" || currentStatus === "cancelled";

  const actions = [
    {
      key: "payment",
      label: isPaid ? "Đã thanh toán" : "Chưa thanh toán",
      color: isPaid ? "success" : "warning",
      variant: "chip",
    },
  ];

  if (!isTerminal) {
    FORWARD_STATUS_ACTIONS.forEach((action) => {
      const actionIndex = ORDER_STATUS_FLOW.indexOf(action.status);
      if (currentIndex < actionIndex) {
        actions.push({
          key: action.key,
          label: action.label,
          onClick: () => onStatusChange(action.status),
        });
      }
    });

    if (currentStatus === "served" && !isPaid && onMarkTablePaid) {
      actions.push({
        key: "mark_paid",
        label: "Thanh toán (theo bàn)",
        onClick: onMarkTablePaid,
        contained: true,
      });
    }

    actions.push({
      key: "cancelled",
      label: "Huỷ",
      onClick: () => onStatusChange("cancelled"),
      error: true,
    });
  }

  return actions;
}

function StatusActionBar({ actions }) {
  if (actions.length === 0) return null;

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: `repeat(${actions.length}, 1fr)`,
        gap: 1,
        mt: 1.5,
        pt: 1.5,
        borderTop: 1,
        borderColor: "divider",
      }}
    >
      {actions.map((action) =>
        action.variant === "chip" ? (
          <Box key={action.key} sx={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
            <Chip label={action.label} color={action.color} size="small" />
          </Box>
        ) : (
          <Button
            key={action.key}
            size="small"
            fullWidth
            variant={action.contained || action.error ? "contained" : "outlined"}
            color={action.error ? "error" : "primary"}
            onClick={action.onClick}
          >
            {action.label}
          </Button>
        ),
      )}
    </Box>
  );
}

function formatTableLabel({ table_name, table_code } = {}) {
  const label = table_name || table_code || "";
  if (!label) return "—";
  if (/^bàn\s/i.test(label)) return label;
  return `Bàn ${label}`;
}

function groupOrdersByTable(orders) {
  const map = new Map();
  orders.forEach((order) => {
    const existing = map.get(order.table_id) || {
      table_id: order.table_id,
      table_name: order.table_name,
      table_code: order.table_code,
      orders: [],
      total: 0,
      itemCount: 0,
      allPaid: true,
    };
    existing.orders.push(order);
    existing.total += Number(order.total_amount || 0);
    existing.itemCount += (order.items || []).reduce((sum, item) => sum + item.quantity, 0);
    if (!order.is_paid) existing.allPaid = false;
    map.set(order.table_id, existing);
  });
  return Array.from(map.values()).sort((a, b) => a.table_id - b.table_id);
}

function ServedTableGroupCard({ group, tableUnpaid, onUpdateGroupStatus, onMarkTablePaid }) {
  const [showDetails, setShowDetails] = useState(false);
  const orderIds = group.orders.map((order) => order.id);
  const orderIdLabel = orderIds.map((id) => `#${id}`).join(", ");

  const statusActions = buildStatusActions({
    currentStatus: "served",
    isPaid: group.allPaid,
    onStatusChange: (status) => onUpdateGroupStatus(orderIds, status),
    onMarkTablePaid: !group.allPaid ? () => onMarkTablePaid(group.table_id) : undefined,
  });

  return (
    <Card variant="outlined" sx={{ width: "100%" }}>
      <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "minmax(110px, auto) minmax(110px, auto) 1fr",
            },
            gap: { xs: 1.5, sm: 2 },
            alignItems: "center",
          }}
        >
          <Box>
            <Typography fontWeight={700} noWrap>
              {formatTableLabel(group)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {group.orders.length} đơn — {orderIdLabel}
            </Typography>
          </Box>

          <Box>
            <Typography variant="h6" color="primary.main" fontWeight={700} noWrap>
              {group.total.toLocaleString("vi-VN")} đ
            </Typography>
            {!group.allPaid && tableUnpaid && tableUnpaid.orderCount > 1 ? (
              <Typography variant="body2" color="text.secondary" noWrap>
                Tổng bàn ({tableUnpaid.orderCount} đơn): {tableUnpaid.total.toLocaleString("vi-VN")} đ
              </Typography>
            ) : null}
          </Box>

          <Box sx={{ minWidth: 0, gridColumn: { xs: "1 / -1", sm: "auto" } }}>
            <Stack
              direction="row"
              alignItems="center"
              spacing={0.5}
              onClick={() => setShowDetails((prev) => !prev)}
              sx={{ cursor: group.itemCount > 0 ? "pointer" : "default", userSelect: "none" }}
            >
              <Typography variant="body2" color="text.secondary" noWrap sx={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                {group.itemCount} món
                {!showDetails && group.itemCount > 0 ? " — bấm để xem chi tiết" : ""}
              </Typography>
              {group.itemCount > 0 && (
                <IconButton size="small" aria-label={showDetails ? "Ẩn chi tiết" : "Xem chi tiết"}>
                  {showDetails ? <IconChevronUp size={18} /> : <IconChevronDown size={18} />}
                </IconButton>
              )}
            </Stack>
            <Collapse in={showDetails}>
              <Stack spacing={1} mt={0.5}>
                {group.orders.map((order) => (
                  <Box key={order.id}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      Đơn #{order.id}
                    </Typography>
                    <Stack spacing={0.25} mt={0.25}>
                      {(order.items || []).map((item) => (
                        <Typography key={item.id} variant="body2">
                          {item.quantity} x {item.product_name}{" "}
                          <Typography component="span" variant="caption" color="text.secondary">
                            (batch {item.batch_no})
                          </Typography>
                        </Typography>
                      ))}
                    </Stack>
                    {order.note && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                        Ghi chú: {order.note}
                      </Typography>
                    )}
                  </Box>
                ))}
              </Stack>
            </Collapse>
          </Box>
        </Box>

        <StatusActionBar actions={statusActions} />
      </CardContent>
    </Card>
  );
}

function OrderCard({ order, tableUnpaid, onUpdateStatus }) {
  const itemCount = (order.items || []).reduce((sum, item) => sum + item.quantity, 0);
  const detailsExpandedByDefault = order.status === "confirmed";
  const [showDetails, setShowDetails] = useState(detailsExpandedByDefault);

  useEffect(() => {
    setShowDetails(order.status === "confirmed");
  }, [order.id, order.status]);

  const statusActions = buildStatusActions({
    currentStatus: order.status,
    isPaid: order.is_paid,
    onStatusChange: (status) => onUpdateStatus(order.id, status),
  });

  return (
    <Card variant="outlined" sx={{ width: "100%" }}>
      <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "minmax(110px, auto) minmax(110px, auto) 1fr",
            },
            gap: { xs: 1.5, sm: 2 },
            alignItems: "center",
          }}
        >
          <Box>
            <Typography fontWeight={700} noWrap>
              {formatTableLabel(order)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Đơn #{order.id}
            </Typography>
          </Box>

          <Box>
            <Typography variant="h6" color="primary.main" fontWeight={700} noWrap>
              {Number(order.total_amount || 0).toLocaleString("vi-VN")} đ
            </Typography>
            {!order.is_paid && tableUnpaid && tableUnpaid.orderCount > 1 ? (
              <Typography variant="body2" color="text.secondary" noWrap>
                Tổng bàn ({tableUnpaid.orderCount} đơn): {tableUnpaid.total.toLocaleString("vi-VN")} đ
              </Typography>
            ) : null}
          </Box>

          <Box sx={{ minWidth: 0, gridColumn: { xs: "1 / -1", sm: "auto" } }}>
            <Stack
              direction="row"
              alignItems="center"
              spacing={0.5}
              onClick={() => setShowDetails((prev) => !prev)}
              sx={{ cursor: itemCount > 0 ? "pointer" : "default", userSelect: "none" }}
            >
              <Typography variant="body2" color="text.secondary" noWrap sx={{ overflow: "hidden", textOverflow: "ellipsis" }}>
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
              <Stack spacing={0.5} mt={0.5}>
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
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Ghi chú: {order.note}
              </Typography>
            )}
          </Box>
        </Box>

        <StatusActionBar actions={statusActions} />
      </CardContent>
    </Card>
  );
}
