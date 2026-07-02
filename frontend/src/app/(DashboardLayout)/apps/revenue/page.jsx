"use client";

import React, { useMemo, useState } from "react";
import useSWR from "swr";
import dayjs from "dayjs";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { IconEdit, IconPlus, IconTrash } from "@tabler/icons-react";
import { toast } from "react-toastify";

import api from "@/app/api/api";
import { deleteFetcher, getFetcher, postFetcher, putFetcher } from "@/app/api/globalFetcher";
import PageContainer from "@/app/components/container/PageContainer";
import { useHasPermission } from "@/app/utils/auth/useHasPermission";
import { StyledRangePickerAnt } from "@/utils/styleRangeDateAnt";
import ExpenseFormDialog from "./ExpenseFormDialog";
import RevenueChart from "./RevenueChart";

const GRANULARITY_OPTIONS = [
  { value: "day", label: "Theo ngày" },
  { value: "month", label: "Theo tháng" },
  { value: "year", label: "Theo năm" },
];

const CATEGORY_OPTIONS = [
  { value: "", label: "Tất cả loại chi phí" },
  { value: "ingredient", label: "Nguyên liệu" },
  { value: "utility", label: "Điện nước" },
  { value: "labor", label: "Nhân công" },
  { value: "rent", label: "Mặt bằng" },
  { value: "other", label: "Khác" },
];

const QUICK_RANGES = [
  {
    label: "Hôm nay",
    getValue: () => [dayjs().startOf("day"), dayjs().endOf("day")],
  },
  {
    label: "Tuần này",
    getValue: () => [dayjs().startOf("week"), dayjs().endOf("week")],
  },
  {
    label: "Tháng này",
    getValue: () => [dayjs().startOf("month"), dayjs().endOf("month")],
  },
  {
    label: "Năm nay",
    getValue: () => [dayjs().startOf("year"), dayjs().endOf("year")],
  },
];

function formatCurrency(value) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function getCategoryLabel(value) {
  return CATEGORY_OPTIONS.find((item) => item.value === value)?.label || value || "—";
}

export default function RevenuePage() {
  const canView = useHasPermission("revenue", "view");
  const canCreate = useHasPermission("revenue", "create");
  const canUpdate = useHasPermission("revenue", "update");
  const canDelete = useHasPermission("revenue", "delete");

  const [range, setRange] = useState([dayjs().startOf("month"), dayjs().endOf("month")]);
  const [granularity, setGranularity] = useState("day");
  const [expenseCategory, setExpenseCategory] = useState("");
  const [expenseSearch, setExpenseSearch] = useState("");
  const [expensePage, setExpensePage] = useState(0);
  const [expensePageSize, setExpensePageSize] = useState(10);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const startDate = range?.[0]?.format("YYYY-MM-DD");
  const endDate = range?.[1]?.format("YYYY-MM-DD");

  const summaryUrl = useMemo(() => {
    if (!startDate || !endDate || !canView) return null;
    const params = new URLSearchParams({
      start_date: startDate,
      end_date: endDate,
      granularity,
    });
    return `${api.GET_REVENUE_SUMMARY}?${params.toString()}`;
  }, [canView, endDate, granularity, startDate]);

  const expensesUrl = useMemo(() => {
    if (!startDate || !endDate || !canView) return null;
    const params = new URLSearchParams({
      page: String(expensePage + 1),
      page_size: String(expensePageSize),
      start_date: startDate,
      end_date: endDate,
    });
    if (expenseCategory) params.set("category", expenseCategory);
    if (expenseSearch.trim()) params.set("search", expenseSearch.trim());
    return `${api.GET_REVENUE_EXPENSES}?${params.toString()}`;
  }, [canView, endDate, expenseCategory, expensePage, expensePageSize, expenseSearch, startDate]);

  const {
    data: summaryData,
    isLoading: summaryLoading,
    mutate: mutateSummary,
  } = useSWR(summaryUrl, getFetcher);
  const {
    data: expensesData,
    isLoading: expensesLoading,
    mutate: mutateExpenses,
  } = useSWR(expensesUrl, getFetcher);

  const handleCloseDialog = () => {
    if (isSubmitting) return;
    setDialogOpen(false);
    setEditingExpense(null);
  };

  const handleSubmitExpense = async (payload) => {
    try {
      setIsSubmitting(true);
      if (editingExpense?.id) {
        await putFetcher(`${api.PUT_REVENUE_EXPENSE}/${editingExpense.id}`, payload);
        toast.success("Đã cập nhật khoản chi");
      } else {
        await postFetcher(api.POST_REVENUE_EXPENSE, payload);
        toast.success("Đã thêm khoản chi");
      }
      setDialogOpen(false);
      setEditingExpense(null);
      mutateExpenses();
      mutateSummary();
    } catch (error) {
      toast.error(error.message || "Không thể lưu khoản chi");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteExpense = async (expenseId) => {
    if (!window.confirm("Bạn có chắc muốn xóa khoản chi này?")) return;
    try {
      await deleteFetcher(`${api.DELETE_REVENUE_EXPENSE}${expenseId}`);
      toast.success("Đã xóa khoản chi");
      mutateExpenses();
      mutateSummary();
    } catch (error) {
      toast.error(error.message || "Không thể xóa khoản chi");
    }
  };

  const summaryCards = [
    { label: "Doanh thu", value: summaryData?.total_revenue, color: "primary.main" },
    { label: "Chi phí", value: summaryData?.total_expense, color: "warning.main" },
    { label: "Lợi nhuận", value: summaryData?.profit, color: "success.main" },
    { label: "Số đơn", value: summaryData?.order_count || 0, color: "info.main", isCurrency: false },
  ];

  if (!canView) {
    return (
      <PageContainer title="Doanh thu" description="Quản lý doanh thu và chi phí">
        <Alert severity="warning">Bạn chưa có quyền xem báo cáo doanh thu.</Alert>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Doanh thu" description="Quản lý doanh thu, chi phí và lợi nhuận">
      <Stack spacing={3}>
        <Card variant="outlined">
          <CardContent>
            <Stack spacing={2}>
              <Typography variant="h5">Quản lý doanh thu</Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 7 }}>
                  <StyledRangePickerAnt
                    value={range}
                    allowClear={false}
                    presets={QUICK_RANGES.map((item) => ({
                      label: item.label,
                      value: item.getValue(),
                    }))}
                    format="DD/MM/YYYY"
                    onChange={(values) => {
                      if (!values?.[0] || !values?.[1]) return;
                      setRange(values);
                      setExpensePage(0);
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <TextField
                    select
                    fullWidth
                    label="Kiểu báo cáo"
                    value={granularity}
                    onChange={(event) => setGranularity(event.target.value)}
                  >
                    {GRANULARITY_OPTIONS.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, md: 2 }}>
                  <Box sx={{ display: "flex", height: "100%", alignItems: "center" }}>
                    <Chip
                      color="default"
                      label={`TB/đơn: ${formatCurrency(summaryData?.avg_order_value || 0)}`}
                      sx={{ width: "100%", justifyContent: "center" }}
                    />
                  </Box>
                </Grid>
              </Grid>
            </Stack>
          </CardContent>
        </Card>

        <Grid container spacing={2}>
          {summaryCards.map((item) => (
            <Grid key={item.label} size={{ xs: 12, sm: 6, lg: 3 }}>
              <Card variant="outlined">
                <CardContent>
                  <Stack spacing={1}>
                    <Typography variant="body2" color="text.secondary">
                      {item.label}
                    </Typography>
                    <Typography variant="h5" sx={{ color: item.color }}>
                      {item.isCurrency === false ? Number(item.value || 0) : formatCurrency(item.value || 0)}
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, lg: 8 }}>
            <Card variant="outlined" sx={{ height: "100%" }}>
              <CardContent>
                <Stack spacing={2}>
                  <Typography variant="h6">Biểu đồ doanh thu - lợi nhuận</Typography>
                  {summaryLoading ? (
                    <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                      <CircularProgress />
                    </Box>
                  ) : summaryData?.series?.length ? (
                    <RevenueChart series={summaryData.series} />
                  ) : (
                    <Alert severity="info">Chưa có dữ liệu trong khoảng thời gian đã chọn.</Alert>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, lg: 4 }}>
            <Card variant="outlined" sx={{ height: "100%" }}>
              <CardContent>
                <Stack spacing={2}>
                  <Typography variant="h6">Top món bán chạy</Typography>
                  {summaryData?.top_products?.length ? (
                    <Stack spacing={1.25}>
                      {summaryData.top_products.map((item, index) => (
                        <Paper key={`${item.product_name}-${index}`} variant="outlined" sx={{ p: 1.5 }}>
                          <Stack spacing={0.5}>
                            <Typography variant="subtitle2">{item.product_name}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              Số lượng: {Number(item.quantity_sold || 0)}
                            </Typography>
                            <Typography variant="body2" color="primary.main" fontWeight={600}>
                              {formatCurrency(item.revenue)}
                            </Typography>
                          </Stack>
                        </Paper>
                      ))}
                    </Stack>
                  ) : (
                    <Alert severity="info">Chưa có dữ liệu món bán chạy.</Alert>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Card variant="outlined">
          <CardContent>
            <Stack spacing={2}>
              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={2}
                justifyContent="space-between"
                alignItems={{ xs: "stretch", md: "center" }}
              >
                <Typography variant="h6">Sổ chi phí</Typography>
                {canCreate && (
                  <Button
                    variant="contained"
                    startIcon={<IconPlus size={18} />}
                    onClick={() => {
                      setEditingExpense(null);
                      setDialogOpen(true);
                    }}
                  >
                    Thêm chi phí
                  </Button>
                )}
              </Stack>

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    fullWidth
                    label="Tìm theo ghi chú"
                    value={expenseSearch}
                    onChange={(event) => {
                      setExpenseSearch(event.target.value);
                      setExpensePage(0);
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    select
                    fullWidth
                    label="Loại chi phí"
                    value={expenseCategory}
                    onChange={(event) => {
                      setExpenseCategory(event.target.value);
                      setExpensePage(0);
                    }}
                  >
                    {CATEGORY_OPTIONS.map((option) => (
                      <MenuItem key={option.value || "all"} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
              </Grid>

              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Ngày</TableCell>
                      <TableCell>Loại</TableCell>
                      <TableCell>Ghi chú</TableCell>
                      <TableCell align="right">Số tiền</TableCell>
                      <TableCell align="right">Thao tác</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {expensesLoading ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          <CircularProgress size={24} />
                        </TableCell>
                      </TableRow>
                    ) : expensesData?.data?.length ? (
                      expensesData.data.map((expense) => (
                        <TableRow key={expense.id} hover>
                          <TableCell>{formatDate(expense.expense_date)}</TableCell>
                          <TableCell>{getCategoryLabel(expense.category)}</TableCell>
                          <TableCell>{expense.note || "—"}</TableCell>
                          <TableCell align="right">{formatCurrency(expense.amount)}</TableCell>
                          <TableCell align="right">
                            {canUpdate && (
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setEditingExpense(expense);
                                  setDialogOpen(true);
                                }}
                              >
                                <IconEdit size={16} />
                              </IconButton>
                            )}
                            {canDelete && (
                              <IconButton size="small" color="error" onClick={() => handleDeleteExpense(expense.id)}>
                                <IconTrash size={16} />
                              </IconButton>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          Chưa có khoản chi nào trong kỳ này.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              <TablePagination
                component="div"
                count={expensesData?.total || 0}
                page={expensePage}
                onPageChange={(_event, newPage) => setExpensePage(newPage)}
                rowsPerPage={expensePageSize}
                onRowsPerPageChange={(event) => {
                  setExpensePageSize(parseInt(event.target.value, 10));
                  setExpensePage(0);
                }}
                rowsPerPageOptions={[5, 10, 25, 50]}
                labelRowsPerPage="Số dòng:"
              />
            </Stack>
          </CardContent>
        </Card>
      </Stack>

      <ExpenseFormDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        onSubmit={handleSubmitExpense}
        initialValue={editingExpense}
        isSubmitting={isSubmitting}
      />
    </PageContainer>
  );
}
