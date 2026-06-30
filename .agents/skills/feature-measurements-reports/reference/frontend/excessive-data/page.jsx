"use client";
import React from "react";
import {
  Card,
  CardContent,
  Typography,
  TextField,
  Stack,
  Grid,
  Box,
  Tab,
  CircularProgress,
  Autocomplete,
  ToggleButton,
  ToggleButtonGroup,
  Button,
} from "@mui/material";
import { TabContext, TabList, TabPanel } from "@mui/lab";
import { toast } from "react-toastify";
import { useState, useEffect, useCallback } from "react";
import { getFetcher, postFetcher } from "@/app/api/globalFetcher";
import api from "@/app/api/api";
import { useTenantFilterVersion } from "@/app/context/TenantFilterContext";
import useIsMobile from "@/app/utils/hooks/useIsMobile";
import ExceedanceChart from "./ExceedanceChart";
import ExceedanceTable, {
  exportExceedanceExcel,
} from "./ExceedanceTable";
import ExceedanceCard from "./mobile-view/ExceedanceCard";

// Tính khoảng thời gian dựa trên period
const getTimeRange = (period) => {
  const now = new Date();
  const startOfDay = (date) => {
    const result = new Date(date);
    result.setHours(0, 0, 0, 0);
    return result;
  };
  const endOfDay = (date) => {
    const result = new Date(date);
    result.setHours(23, 59, 59, 999);
    return result;
  };

  switch (period) {
    case "day": {
      return {
        start_date: startOfDay(now).getTime(),
        end_date: endOfDay(now).getTime(),
      };
    }
    case "week": {
      const start = startOfDay(now);
      const day = start.getDay();
      const diffToMonday = day === 0 ? -6 : 1 - day;
      start.setDate(start.getDate() + diffToMonday);

      const end = endOfDay(start);
      end.setDate(start.getDate() + 6);

      return { start_date: start.getTime(), end_date: end.getTime() };
    }
    case "month": {
      const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      const end = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0,
        23,
        59,
        59,
        999,
      );

      return { start_date: start.getTime(), end_date: end.getTime() };
    }
    default:
      return {
        start_date: startOfDay(now).getTime(),
        end_date: endOfDay(now).getTime(),
      };
  }
};

const ExcessiveDataPage = () => {
  const filterVersion = useTenantFilterVersion();
  const isMobile = useIsMobile();
  const [tabValue, setTabValue] = useState("1");
  const [period, setPeriod] = useState("day");
  const [selectedStation, setSelectedStation] = useState(null);
  const [stationList, setStationList] = useState([]);
  const [loadingStations, setLoadingStations] = useState(false);
  const [selectedParameter, setSelectedParameter] = useState(null);
  const [parameters, setParameters] = useState([]);
  const [loadingParameters, setLoadingParameters] = useState(false);
  const [summaryData, setSummaryData] = useState([]);
  const [detailData, setDetailData] = useState([]);
  const [detailTotal, setDetailTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [loading, setLoading] = useState(true);
  // Infinite scroll (mobile)
  const [accumulatedRows, setAccumulatedRows] = useState([]);
  const [mobileCurrentPage, setMobileCurrentPage] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);

  // Đổi tenant → reset bộ lọc trạm/thông số và dữ liệu cũ
  useEffect(() => {
    setSelectedStation(null);
    setSelectedParameter(null);
    setParameters([]);
    setPage(1);
    setSummaryData([]);
    setDetailData([]);
    setDetailTotal(0);
    setAccumulatedRows([]);
    setMobileCurrentPage(0);
  }, [filterVersion]);

  // Load danh sách trạm (đã được lọc theo tenant/user)
  useEffect(() => {
    setLoadingStations(true);
    getFetcher(`${api.GET_STATION_LIST}?page=0&page_size=100`)
      .then((data) => {
        setStationList(data.data || []);
        // Tự động chọn trạm đầu tiên nếu chỉ có 1 trạm
        if (data.data && data.data.length === 1) {
          setSelectedStation(data.data[0]);
        }
      })
      .catch(() => {
        toast.error("Không thể tải danh sách trạm", {
          position: "top-right",
          autoClose: 3000,
        });
      })
      .finally(() => {
        setLoadingStations(false);
        setLoading(false);
      });
  }, [filterVersion]);

  // Load danh sách thông số khi chọn trạm
  useEffect(() => {
    if (!selectedStation) {
      setParameters([]);
      setSelectedParameter(null);
      return;
    }
    setLoadingParameters(true);
    getFetcher(
      api.GET_CONFIG_PARAMETER_BY_STATION_ID + "/" + selectedStation.id,
    )
      .then((res) => {
        setParameters(res?.data || []);
      })
      .catch(() => {
        setParameters([]);
      })
      .finally(() => {
        setLoadingParameters(false);
      });
  }, [selectedStation]);

  // Build request body
  const buildRequestBody = useCallback(() => {
    const { start_date, end_date } = getTimeRange(period);
    const body = { start_date, end_date, period };
    if (selectedStation) body.station_id = selectedStation.id;
    if (selectedParameter) body.parameter_id = selectedParameter.id;
    return body;
  }, [period, selectedStation, selectedParameter, filterVersion]);

  // Load summary data (chart)
  const loadSummary = useCallback(async () => {
    setLoadingSummary(true);
    try {
      const res = await postFetcher(
        api.POST_EXCEEDANCE_SUMMARY,
        buildRequestBody(),
      );
      setSummaryData(res?.data || []);
    } catch {
      setSummaryData([]);
      toast.error("Có lỗi xảy ra khi tải dữ liệu tổng hợp", {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setLoadingSummary(false);
    }
  }, [buildRequestBody]);

  // Load detail data (table / cards)
  const loadDetail = useCallback(async () => {
    setLoadingDetail(true);
    try {
      const res = await postFetcher(
        `${api.POST_EXCEEDANCE_DETAIL}?page=${page}&page_size=${pageSize}`,
        buildRequestBody(),
      );
      setDetailData(res?.data || []);
      setDetailTotal(res?.total || 0);
      // Reset mobile accumulated rows khi filter thay đổi
      setAccumulatedRows(res?.data || []);
      setMobileCurrentPage(1);
    } catch {
      setDetailData([]);
      setDetailTotal(0);
      toast.error("Có lỗi xảy ra khi tải dữ liệu chi tiết", {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setLoadingDetail(false);
    }
  }, [buildRequestBody, page, pageSize]);

  // Load thêm dữ liệu khi cuộn (mobile infinite scroll)
  const loadMoreMobile = async () => {
    if (loadingMore) return;
    const nextPage = mobileCurrentPage + 1;
    if (accumulatedRows.length >= detailTotal) return;
    setLoadingMore(true);
    try {
      const res = await postFetcher(
        `${api.POST_EXCEEDANCE_DETAIL}?page=${nextPage}&page_size=${pageSize}`,
        buildRequestBody(),
      );
      setAccumulatedRows((prev) => [...prev, ...(res?.data || [])]);
      setMobileCurrentPage(nextPage);
    } catch {
      toast.error("Có lỗi khi tải thêm dữ liệu", {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  const handlePeriodChange = (e, newPeriod) => {
    if (newPeriod) {
      setPeriod(newPeriod);
      setPage(1);
    }
  };

  const fetchAllDetailData = useCallback(async () => {
    const allData = [];
    const exportPageSize = 100;
    let currentPage = 1;
    let totalRecords = 0;

    do {
      const res = await postFetcher(
        `${api.POST_EXCEEDANCE_DETAIL}?page=${currentPage}&page_size=${exportPageSize}`,
        buildRequestBody(),
      );
      allData.push(...(res?.data || []));
      totalRecords = res?.total || 0;
      currentPage += 1;
    } while (allData.length < totalRecords);

    return allData;
  }, [buildRequestBody]);

  const handleExportExcel = async () => {
    if (exportingExcel || detailTotal === 0) return;
    setExportingExcel(true);
    try {
      const rows = await fetchAllDetailData();
      await exportExceedanceExcel(rows);
    } catch {
      toast.error("Có lỗi xảy ra khi xuất Excel", {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setExportingExcel(false);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
        }}
      >
        <CircularProgress />
      </div>
    );
  }

  return (
    <div>
      {/* Bộ lọc dữ liệu */}
      <Card variant="outlined" sx={{ paddingBottom: 0, marginBottom: 2 }}>
        <CardContent
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 0,
            padding: 0,
            paddingBottom: 0,
          }}
        >
          <Typography variant="h6">Bộ lọc dữ liệu vượt ngưỡng</Typography>
          <Stack mt={2}>
            <Grid container spacing={2}>
              <Grid
                size={{
                  xs: 12,
                  lg: 3,
                  md: 4,
                  sm: 6,
                }}
              >
                <Autocomplete
                  options={stationList}
                  getOptionLabel={(option) => option.name || ""}
                  isOptionEqualToValue={(option, value) =>
                    option.id === value.id
                  }
                  loading={loadingStations}
                  value={selectedStation}
                  onChange={(e, newValue) => {
                    setSelectedStation(newValue);
                    setSelectedParameter(null);
                    setPage(1);
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Trạm"
                      placeholder="Tất cả trạm"
                      InputLabelProps={{ shrink: true }}
                      fullWidth
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {loadingStations ? (
                              <CircularProgress color="inherit" size={20} />
                            ) : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                />
              </Grid>
              <Grid
                size={{
                  xs: 12,
                  lg: 3,
                  md: 4,
                  sm: 6,
                }}
              >
                <Autocomplete
                  options={parameters}
                  getOptionLabel={(option) =>
                    option.parameter_name
                      ? `${option.parameter_name} (${option.parameter_code})`
                      : ""
                  }
                  isOptionEqualToValue={(option, value) =>
                    option.id === value.id
                  }
                  loading={loadingParameters}
                  value={selectedParameter}
                  onChange={(e, newValue) => {
                    setSelectedParameter(newValue);
                    setPage(1);
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Thông số"
                      placeholder="Tất cả thông số"
                      InputLabelProps={{ shrink: true }}
                      fullWidth
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {loadingParameters ? (
                              <CircularProgress color="inherit" size={20} />
                            ) : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                />
              </Grid>
              <Grid
                size={{
                  xs: 12,
                  lg: 3,
                  md: 4,
                  sm: 6,
                }}
              >
                <ToggleButtonGroup
                  value={period}
                  exclusive
                  onChange={handlePeriodChange}
                  size="small"
                  fullWidth
                  sx={{ height: "100%" }}
                >
                  <ToggleButton value="day">Ngày</ToggleButton>
                  <ToggleButton value="week">Tuần</ToggleButton>
                  <ToggleButton value="month">Tháng</ToggleButton>
                </ToggleButtonGroup>
              </Grid>
            </Grid>
          </Stack>
        </CardContent>
      </Card>

      {/* Mobile: 2 tabs (Biểu đồ / Chi tiết) */}
      {isMobile ? (
        <Card variant="outlined" sx={{ padding: 0 }}>
          <TabContext value={tabValue}>
            <Box sx={{ borderBottom: 1, borderColor: "divider", padding: 0 }}>
              <TabList onChange={(e, v) => setTabValue(v)}>
                <Tab label="Biểu đồ" value="1" />
                <Tab label="Chi tiết" value="2" />
              </TabList>
            </Box>
            <TabPanel value="1" sx={{ padding: "15px !important" }}>
              {loadingSummary ? (
                <Box
                  sx={{
                    height: 300,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <CircularProgress />
                </Box>
              ) : (
                <ExceedanceChart data={summaryData} loading={loadingSummary} />
              )}
            </TabPanel>
            <TabPanel value="2" sx={{ padding: "15px !important" }}>
              <ExceedanceCard
                rows={accumulatedRows}
                loading={loadingDetail}
                onLoadMore={loadMoreMobile}
                hasMore={accumulatedRows.length < detailTotal}
                loadingMore={loadingMore}
              />
            </TabPanel>
          </TabContext>
        </Card>
      ) : (
        <>
          {/* Desktop: Biểu đồ tổng hợp */}
          <Card variant="outlined" sx={{ paddingBottom: 0, marginBottom: 2 }}>
            <CardContent sx={{ padding: 0, paddingBottom: 0 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Số lần vượt ngưỡng theo thông số
              </Typography>
              {loadingSummary ? (
                <Box
                  sx={{
                    height: 300,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <CircularProgress />
                </Box>
              ) : (
                <ExceedanceChart data={summaryData} loading={loadingSummary} />
              )}
            </CardContent>
          </Card>

          {/* Desktop: Bảng chi tiết */}
          <Card variant="outlined" sx={{ paddingBottom: 0 }}>
            <CardContent sx={{ padding: 0, paddingBottom: 0 }}>
              <ExceedanceTable
                data={detailData}
                total={detailTotal}
                page={page}
                pageSize={pageSize}
                onPageChange={(newPage) => setPage(newPage)}
                onExportExcel={handleExportExcel}
                exporting={exportingExcel}
                loading={loadingDetail}
              />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default ExcessiveDataPage;
