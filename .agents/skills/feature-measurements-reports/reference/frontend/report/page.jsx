"use client";
import {
  Card,
  CardContent,
  Typography,
  TextField,
  Stack,
  Grid,
  Button,
  MenuItem,
  Switch,
  FormControlLabel,
  Box,
  Tab,
  CircularProgress,
} from "@mui/material";
import { toast } from "react-toastify";
import ReportCard from "./mobile-view/ReportCard";
import { Toast } from "@capacitor/toast";
import "@ant-design/v5-patch-for-react-19";
import { Autocomplete } from "@mui/material";
import React from "react";
import { styled } from "@mui/material/styles";
import { useEffect, useState } from "react";
import { TabContext, TabList, TabPanel } from "@mui/lab";
import TableDetailReport from "./TableDetailReport";
import ChartOverview from "../overview/view/chartOverview";
import api from "@/app/api/api";
import { getFetcher, postFetcher } from "@/app/api/globalFetcher";
import { useTenantFilterVersion } from "@/app/context/TenantFilterContext";
import moment from "moment";
import viVN from "antd/locale/vi_VN";
import dayjs from "dayjs";
import "dayjs/locale/vi";
import { StyledRangePickerAnt } from "@/utils/styleRangeDateAnt";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { useTheme } from "@mui/material";
import useIsMobile from "@/app/utils/hooks/useIsMobile";
const VN_OFFSET = 7 * 60 * 60 * 1000;
const REPORT_FILTER_FIELD_HEIGHT = 48;
const REPORT_FILTER_INPUT_FONT_SIZE = "1rem";
const REPORT_FILTER_LABEL_FONT_SIZE = "0.75rem";

const reportFilterInputSx = {
  "& .MuiOutlinedInput-root": {
    height: REPORT_FILTER_FIELD_HEIGHT,
    minHeight: REPORT_FILTER_FIELD_HEIGHT,
    alignItems: "center",
  },
  "& .MuiInputBase-input, & .MuiSelect-select": {
    fontSize: REPORT_FILTER_INPUT_FONT_SIZE,
  },
  "& .MuiInputLabel-root": {
    fontSize: REPORT_FILTER_LABEL_FONT_SIZE,
  },
};

const reportFilterAutocompleteSx = {
  "& .MuiOutlinedInput-root": {
    height: REPORT_FILTER_FIELD_HEIGHT,
    minHeight: REPORT_FILTER_FIELD_HEIGHT,
    alignItems: "center",
    overflow: "hidden",
  },
  "& .MuiInputBase-input": {
    fontSize: REPORT_FILTER_INPUT_FONT_SIZE,
  },
  "& .MuiInputLabel-root": {
    fontSize: REPORT_FILTER_LABEL_FONT_SIZE,
  },
  "& .MuiChip-label": {
    fontSize: REPORT_FILTER_INPUT_FONT_SIZE,
  },
};

const reportFilterDatePickerSlotProps = {
  textField: {
    fullWidth: true,
    InputLabelProps: { shrink: true },
    sx: reportFilterInputSx,
  },
};

const Report = () => {
  const filterVersion = useTenantFilterVersion();
  const theme = useTheme();
  const isMobile = useIsMobile();
  const primaryColor = theme.palette.primary.main;
  const primaryContrastText = theme.palette.primary.contrastText;
  const now = dayjs();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [value, setValue] = React.useState("1");
  const [detailReport, setDetailReport] = useState([]);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(30);
  const [rowCount, setRowCount] = useState(0);
  const [chartData, setChartData] = useState([]);
  const [stationList, setStationList] = useState([]);
  const [selectedStation, setSelectedStation] = useState(null);
  const [parameterList, setParameterList] = useState([]);
  const [selectedParameters, setSelectedParameters] = useState([]);
  const [startDate, setStartDate] = useState(now.startOf("day"));
  const [endDate, setEndDate] = useState(now.endOf("day"));
  const [selectedReport, setSelectedReport] = useState("data");
  const [dataReport, setDataReport] = useState({});
  const [dataReportChart, setDataReportChart] = useState([]);
  const [loadingReport, setLoadingReport] = useState(false);
  const [loadingExportExcel, setLoadingExportExcel] = useState(false);
  const [loadingStations, setLoadingStations] = useState(false);
  const [loadingParameters, setLoadingParameters] = useState(false);
  const [loadingDataTable, setLoadingDataTable] = useState(false);
  const [error, setError] = useState(null);
  const [headerTable, setHeaderTable] = useState([]);
  // Infinite scroll (mobile)
  const [accumulatedRows, setAccumulatedRows] = useState([]);
  const [mobileCurrentPage, setMobileCurrentPage] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const presets = [
    { label: "Hôm nay", value: [now.startOf("day"), now.endOf("day")] },
    {
      label: "Hôm qua",
      value: [
        now.subtract(1, "day").startOf("day"),
        now.subtract(1, "day").endOf("day"),
      ],
    },
    {
      label: "7 ngày qua",
      value: [now.subtract(6, "day").startOf("day"), now.endOf("day")],
    },
    { label: "Tháng này", value: [now.startOf("month"), now.endOf("month")] },
    {
      label: "Tháng trước",
      value: [
        now.subtract(1, "month").startOf("month"),
        now.subtract(1, "month").endOf("month"),
      ],
    },
  ];
  const handleChange = (event, newValue) => {
    setValue(newValue);
  };
  // Đổi tenant → reset bộ lọc và dữ liệu báo cáo cũ
  useEffect(() => {
    setSelectedStation(null);
    setParameterList([]);
    setSelectedParameters([]);
    setPage(0);
    setRowCount(0);
    setDataReport({});
    setDataReportChart([]);
    setHeaderTable([]);
    setAccumulatedRows([]);
    setMobileCurrentPage(0);
    setDetailReport([]);
  }, [filterVersion]);

  useEffect(() => {
    setLoadingStations(true);
    setError(null);
    getFetcher(`${api.GET_STATION_LIST}?page=0&page_size=100`)
      .then(async (data) => {
        const stations = data.data || [];
        setStationList(stations);
        if (stations.length > 0) {
          const station = stations[0];
          setSelectedStation(station);
          try {
            setLoadingParameters(true);
            const response = await getFetcher(
              api.GET_CONFIG_PARAMETER_BY_STATION_ID + "/" + station.id,
            );
            setParameterList(response.data || []);
            setSelectedParameters((response.data || []).map((opt) => opt.id));
          } catch {
            setParameterList([]);
            setSelectedParameters([]);
          } finally {
            setLoadingParameters(false);
          }
        }
      })
      .catch(() => {
        setError("Không thể tải danh sách trạm");
      })
      .finally(() => {
        setLoadingStations(false);
        setLoading(false);
      });
  }, [filterVersion]);
  useEffect(() => {
    if (parameterList.length > 0 && selectedParameters.length === 0) {
      setSelectedParameters(parameterList.map((opt) => opt.id));
    }
  }, [parameterList]);

  const getDataReport = async (pageParam, pageSizeParam) => {
    const response = await postFetcher(
      api.GET_STATION_DATA_REPORT +
        "?page=" +
        (pageParam + 1) +
        "&page_size=" +
        pageSizeParam,
      {
        station_id: selectedStation.id,
        start_date: startDate
          ? new Date(
              new Date(startDate).toLocaleString("en-US", {
                timeZone: "Asia/Ho_Chi_Minh",
              }),
            ).getTime()
          : new Date(
              new Date().toLocaleString("en-US", {
                timeZone: "Asia/Ho_Chi_Minh",
              }),
            ).getTime(),
        end_date: endDate
          ? new Date(
              new Date(endDate).toLocaleString("en-US", {
                timeZone: "Asia/Ho_Chi_Minh",
              }),
            ).getTime()
          : new Date(
              new Date().toLocaleString("en-US", {
                timeZone: "Asia/Ho_Chi_Minh",
              }),
            ).getTime(),
        list_parameter_id: selectedParameters,
      },
    );
    return response;
  };
  const getDataChart = async () => {
    const response = await postFetcher(api.GET_STATION_DATA_REPORT_CHART, {
      station_id: selectedStation.id,
      start_date: startDate
        ? new Date(
            new Date(startDate).toLocaleString("en-US", {
              timeZone: "Asia/Ho_Chi_Minh",
            }),
          ).getTime()
        : new Date(
            new Date().toLocaleString("en-US", {
              timeZone: "Asia/Ho_Chi_Minh",
            }),
          ).getTime(),
      end_date: endDate
        ? new Date(
            new Date(endDate).toLocaleString("en-US", {
              timeZone: "Asia/Ho_Chi_Minh",
            }),
          ).getTime()
        : new Date(
            new Date().toLocaleString("en-US", {
              timeZone: "Asia/Ho_Chi_Minh",
            }),
          ).getTime(),
      list_parameter_id: selectedParameters,
    });
    return response;
  };
  const fetchDataTableAvg = async (pageParam, pageSizeParam) => {
    const response = await postFetcher(
      api.GET_STATION_DATA_REPORT_AVG +
        "?page=" +
        (pageParam + 1) +
        "&page_size=" +
        pageSizeParam,
      {
        station_id: selectedStation.id,
        start_date: startDate
          ? new Date(
              new Date(startDate).toLocaleString("en-US", {
                timeZone: "Asia/Ho_Chi_Minh",
              }),
            ).getTime()
          : new Date(
              new Date().toLocaleString("en-US", {
                timeZone: "Asia/Ho_Chi_Minh",
              }),
            ).getTime(),
        end_date: endDate
          ? new Date(
              new Date(endDate).toLocaleString("en-US", {
                timeZone: "Asia/Ho_Chi_Minh",
              }),
            ).getTime()
          : new Date(
              new Date().toLocaleString("en-US", {
                timeZone: "Asia/Ho_Chi_Minh",
              }),
            ).getTime(),
        list_parameter_id: selectedParameters,
      },
    );
    return response;
  };

  const fetchDataTableAvgChart = async () => {
    const response = await postFetcher(api.GET_STATION_DATA_REPORT_AVG_CHART, {
      station_id: selectedStation.id,
      start_date: startDate
        ? new Date(
            new Date(startDate).toLocaleString("en-US", {
              timeZone: "Asia/Ho_Chi_Minh",
            }),
          ).getTime()
        : new Date(
            new Date().toLocaleString("en-US", {
              timeZone: "Asia/Ho_Chi_Minh",
            }),
          ).getTime(),
      end_date: endDate
        ? new Date(
            new Date(endDate).toLocaleString("en-US", {
              timeZone: "Asia/Ho_Chi_Minh",
            }),
          ).getTime()
        : new Date(
            new Date().toLocaleString("en-US", {
              timeZone: "Asia/Ho_Chi_Minh",
            }),
          ).getTime(),
      list_parameter_id: selectedParameters,
    });
    return response;
  };

  const fetchDataTable = async (pageParam, pageSizeParam) => {
    if (selectedReport === "data") {
      try {
        setLoadingDataTable(true);
        const response = await getDataReport(pageParam, pageSizeParam);
        setDataReport(response);
        setRowCount(response.total);
      } catch (error) {
        isMobile
          ? await Toast.show({
              text: "Có lỗi xảy ra khi tải dữ liệu bảng",
              duration: "short",
              position: "bottom",
            })
          : toast.error("Có lỗi xảy ra khi tải dữ liệu bảng", {
              position: "top-right",
              autoClose: 5000,
            });
        setRowCount(0);
      } finally {
        setLoadingDataTable(false);
      }
    } else {
      try {
        setLoadingDataTable(true);
        const [response] = await fetchDataTableAvg(pageParam, pageSizeParam);
        setDataReport(response);
        setRowCount(response.total);
      } catch (error) {
        isMobile
          ? await Toast.show({
              text: "Có lỗi xảy ra khi tải dữ liệu bảng trung bình",
              duration: "short",
              position: "bottom",
            })
          : toast.error("Có lỗi xảy ra khi tải dữ liệu bảng trung bình", {
              position: "top-right",
              autoClose: 5000,
            });
        setRowCount(0);
      } finally {
        setLoadingDataTable(false);
      }
    }
  };

  const fetchDataReport = async () => {
    if (!selectedStation) {
      isMobile
        ? await Toast.show({
            text: "Vui lòng chọn trạm",
            duration: "short",
            position: "bottom",
          })
        : toast.warning("Vui lòng chọn trạm", {
            position: "top-right",
            autoClose: 3000,
          });
      return;
    }

    setLoadingReport(true);
    if (selectedReport === "data") {
      try {
        const [response, responseChart] = await Promise.all([
          getDataReport(0, pageSize),
          getDataChart(),
        ]);
        setDataReport(response);
        setRowCount(response.total);
        setDataReportChart(responseChart);
        // Reset accumulated rows cho mobile
        setAccumulatedRows(response.data || []);
        setMobileCurrentPage(0);
        if (response.data.length > 0) {
          const headerTable = [
            { header: "Thời gian", key: "time" },
            ...selectedParameters.map((item) => {
              const param = parameterList.find((opt) => opt.id === item);
              return {
                header: param.parameter_name,
                key: param.parameter_code,
              };
            }),
          ];
          setHeaderTable(headerTable);
        }
        setPage(0);
      } catch (error) {
        isMobile
          ? await Toast.show({
              text: "Có lỗi xảy ra khi tải dữ liệu báo cáo",
              duration: "short",
              position: "bottom",
            })
          : toast.error("Có lỗi xảy ra khi tải dữ liệu báo cáo", {
              position: "top-right",
              autoClose: 5000,
            });
        setRowCount(0);
      } finally {
        setLoadingReport(false);
      }
    } else {
      try {
        const [response, responseChart] = await Promise.all([
          fetchDataTableAvg(0, pageSize),
          fetchDataTableAvgChart(),
        ]);
        setDataReport(response);
        setRowCount(response.total);
        setDataReportChart(responseChart);
        // Reset accumulated rows cho mobile
        setAccumulatedRows(response.data || []);
        setMobileCurrentPage(0);
        if (response.data.length > 0) {
          const headerTable = [
            { header: "Thời gian", key: "time" },
            ...selectedParameters.map((item) => {
              const param = parameterList.find((opt) => opt.id === item);
              return {
                header: param.parameter_name,
                key: param.parameter_code,
              };
            }),
          ];
          setHeaderTable(headerTable);
        }
        setPage(0);
      } catch (error) {
        isMobile
          ? await Toast.show({
              text: "Có lỗi xảy ra khi tải dữ liệu báo cáo",
              duration: "short",
              position: "bottom",
            })
          : toast.error("Có lỗi xảy ra khi tải dữ liệu báo cáo", {
              position: "top-right",
              autoClose: 5000,
            });
        setRowCount(0);
      } finally {
        setLoadingReport(false);
      }
    }
  };

  // Load thêm dữ liệu khi cuộn (mobile infinite scroll)
  const loadMoreMobile = async () => {
    if (loadingMore) return;
    const nextPage = mobileCurrentPage + 1;
    if (nextPage * pageSize >= rowCount) return;
    setLoadingMore(true);
    try {
      let response;
      if (selectedReport === "data") {
        response = await getDataReport(nextPage, pageSize);
      } else {
        response = await fetchDataTableAvg(nextPage, pageSize);
      }
      setAccumulatedRows((prev) => [...prev, ...(response.data || [])]);
      setMobileCurrentPage(nextPage);
    } catch (error) {
      isMobile
        ? await Toast.show({
            text: "Có lỗi khi tải thêm dữ liệu",
            duration: "short",
            position: "bottom",
          })
        : toast.error("Có lỗi khi tải thêm dữ liệu", {
            position: "top-right",
            autoClose: 3000,
          });
    } finally {
      setLoadingMore(false);
    }
  };

  const getConfigParameterByStationId = async (stationId) => {
    try {
      setLoadingParameters(true);
      setError(null);
      const response = await getFetcher(
        api.GET_CONFIG_PARAMETER_BY_STATION_ID + "/" + stationId,
      );
      setParameterList(response.data);
      setSelectedParameters(response.data.map((opt) => opt.id));
    } catch (error) {
      setError("Không thể tải danh sách thông số");
      setSelectedParameters([]);
      setParameterList([]);
    } finally {
      setLoadingParameters(false);
      setLoading(false);
    }
  };
  const exportExcel = async () => {
    setLoadingExportExcel(true);
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Báo cáo");
      let response;

      if (selectedReport === "data") {
        response = await getDataReport(0, 0);
      } else {
        response = await fetchDataTableAvg(0, 0);
      }

      const header = [
        { header: "Thời gian", key: "time", width: 25 },
        ...selectedParameters.map((item) => {
          const param = parameterList.find((opt) => opt.id === item);
          return {
            header: param.parameter_name,
            key: param.parameter_code,
            width: 20,
          };
        }),
      ];
      worksheet.columns = header;

      worksheet.getRow(1).eachCell((cell) => {
        cell.font = { bold: true };
        cell.alignment = { vertical: "middle", horizontal: "center" };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFDDEEFF" },
        };
      });

      if (response && response.data && Array.isArray(response.data)) {
        response.data.forEach((row) => {
          const addedRow = worksheet.addRow({
            time: moment.utc(row.time).format("DD/MM/YYYY HH:mm"),
            ...row.parameters,
          });
          for (let colNumber = 1; colNumber <= header.length; colNumber++) {
            const cell = addedRow.getCell(colNumber);
            cell.border = {
              top: { style: "thin" },
              left: { style: "thin" },
              bottom: { style: "thin" },
              right: { style: "thin" },
            };
            cell.alignment = { vertical: "middle", horizontal: "center" };
          }
        });
      }

      worksheet.eachRow((row) => {
        row.height = 22;
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      let fileName = "bao_cao";
      if (selectedStation && selectedStation.name) {
        const stationName = selectedStation.name
          .replace(/[<>:"/\\|?*]/g, "")
          .replace(/\s+/g, "_")
          .trim();
        fileName = `${fileName}_${stationName}`;
      }

      if (startDate && endDate) {
        const formatDate = (date) => {
          return moment(date).format("DD-MM-YYYY_HH-mm");
        };
        const startDateStr = formatDate(startDate);
        const endDateStr = formatDate(endDate);
        fileName = `${fileName}_${startDateStr}_den_${endDateStr}`;
      }

      saveAs(blob, `${fileName}.xlsx`);
    } catch (error) {
      toast.error("Có lỗi xảy ra khi xuất Excel", {
        position: "top-right",
        autoClose: 5000,
      });
    } finally {
      setLoadingExportExcel(false);
    }
  };

  return (
    <div>
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
          <Typography variant="h6">Bộ lọc dữ liệu</Typography>
          <Stack mt={2}>
            <Grid container spacing={2}>
              <Grid
                size={{
                  xs: 12,
                  lg: 4,
                  md: 4,
                  sm: 6,
                }}
              >
                <Autocomplete
                  options={stationList}
                  disableClearable
                  sx={reportFilterAutocompleteSx}
                  getOptionLabel={(option) => option.name || ""}
                  isOptionEqualToValue={(option, value) =>
                    option.id === value.id
                  }
                  loading={loadingStations}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Trạm"
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
                  value={selectedStation}
                  onChange={async (event, newValue) => {
                    setSelectedStation(newValue);
                    if (newValue) {
                      await getConfigParameterByStationId(newValue.id);
                    } else {
                      setParameterList([]);
                      setSelectedParameters([]);
                    }
                  }}
                />
              </Grid>
              <Grid
                size={{
                  xs: 12,
                  lg: 4,
                  md: 4,
                  sm: 6,
                }}
              >
                <TextField
                  label="Báo cáo"
                  select
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                  sx={{ minWidth: 180, ...reportFilterInputSx }}
                  value={selectedReport || "data"}
                  onChange={(e) => setSelectedReport(e.target.value)}
                >
                  <MenuItem value="data">Dữ liệu gốc</MenuItem>
                  <MenuItem value="avg-data">Dữ liệu trung bình</MenuItem>
                </TextField>
              </Grid>
              <Grid
                size={{
                  xs: 12,
                  lg: 4,
                  md: 4,
                  sm: 6,
                }}
              >
                {isMobile ? (
                  <LocalizationProvider
                    dateAdapter={AdapterDayjs}
                    adapterLocale="vi"
                  >
                    <Stack spacing={2} sx={{ width: "100%" }}>
                      <DateTimePicker
                        label="Từ ngày"
                        format="DD-MM-YYYY HH:mm"
                        ampm={false}
                        timeSteps={{ minutes: 1 }}
                        value={startDate ? dayjs(startDate) : null}
                        onChange={(value) => {
                          if (value) {
                            setStartDate(value.toDate());
                          } else {
                            setStartDate(new Date());
                          }
                        }}
                        slotProps={reportFilterDatePickerSlotProps}
                      />
                      <DateTimePicker
                        label="Đến ngày"
                        format="DD-MM-YYYY HH:mm"
                        ampm={false}
                        timeSteps={{ minutes: 1 }}
                        value={endDate ? dayjs(endDate) : null}
                        onChange={(value) => {
                          if (value) {
                            setEndDate(value.toDate());
                          } else {
                            setEndDate(new Date());
                          }
                        }}
                        slotProps={reportFilterDatePickerSlotProps}
                      />
                    </Stack>
                  </LocalizationProvider>
                ) : (
                  <Box
                    sx={{
                      position: "relative",
                      height: `${REPORT_FILTER_FIELD_HEIGHT}px`,
                      ".mui-6bacdf": {
                        height: `${REPORT_FILTER_FIELD_HEIGHT}px !important`,
                      },
                      ".ant-picker": {
                        height: `${REPORT_FILTER_FIELD_HEIGHT}px !important`,
                      },
                      ".ant-picker-input > input": {
                        fontSize: `${REPORT_FILTER_INPUT_FONT_SIZE} !important`,
                      },
                      ".ant-picker-separator": {
                        fontSize: `${REPORT_FILTER_INPUT_FONT_SIZE} !important`,
                      },
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        position: "absolute",
                        top: -8,
                        left: 14,
                        backgroundColor: "background.paper",
                        px: 1,
                        zIndex: 1,
                        fontSize: "12px",
                        color: "text.secondary",
                      }}
                    >
                      Khoảng thời gian
                    </Typography>
                    <StyledRangePickerAnt
                      style={{ height: REPORT_FILTER_FIELD_HEIGHT }}
                      presets={presets}
                      showTime={{
                        format: "HH:mm",
                        minuteStep: 1,
                      }}
                      format="DD-MM-YYYY HH:mm"
                      placeholder={["Từ ngày", "Đến ngày"]}
                      value={
                        startDate && endDate
                          ? [dayjs(startDate), dayjs(endDate)]
                          : null
                      }
                      onChange={(values) => {
                        if (values) {
                          setStartDate(values[0].toDate());
                          setEndDate(values[1].toDate());
                        } else {
                          setStartDate(new Date());
                          setEndDate(new Date());
                        }
                      }}
                    />
                  </Box>
                )}
                {/* <TextField
                  label="Từ ngày"
                  type="datetime-local"
                  value={startDate ? formatDateLocal(new Date(startDate)) : formatDateLocal(new Date())}
                  onChange={(e) => setStartDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                /> */}
              </Grid>
              {/* <Grid
                size={{
                  xs: 12,
                  lg: 3,
                  md: 4,
                  sm: 6,
                }}
              >
                <TextField
                  label="Đến ngày"
                  type="datetime-local"
                  value={endDate ? formatDateLocal(new Date(endDate)) : formatDateLocal(new Date())}
                  onChange={(e) => setEndDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
              </Grid> */}
              <Grid
                size={{
                  xs: 12,
                  lg: 12,
                  md: 12,
                  sm: 12,
                }}
              >
                {(() => {
                  const selectedOptions = selectedParameters
                    .map((val) => parameterList.find((opt) => opt.id === val))
                    .filter(Boolean);

                  return (
                    <Autocomplete
                      multiple
                      options={parameterList}
                      sx={reportFilterAutocompleteSx}
                      getOptionLabel={(option) => option.parameter_name}
                      value={selectedOptions}
                      loading={loadingParameters}
                      onChange={(_, newValue) => {
                        setSelectedParameters(newValue.map((opt) => opt.id));
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Thông số"
                          placeholder="Chọn thông số"
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
                            style: {
                              ...params.InputProps?.style,
                              color: "black",
                            },
                          }}
                          sx={{
                            "& .MuiInputBase-input::placeholder": {
                              color: "black",
                              opacity: 1,
                            },
                          }}
                        />
                      )}
                      isOptionEqualToValue={(option, value) =>
                        option.id === value.id
                      }
                    />
                  );
                })()}
              </Grid>
              <Grid
                size={{
                  xs: 12,
                  lg: 3,
                  md: 4,
                  sm: 6,
                }}
              >
                {/* <FormControlLabel
                  control={
                    <IOSSwitch
                      label="Vượt mức"
                      name="Vượt Mức"
                      sx={{ m: 1.5 }}
                    />
                  }
                  label="Vượt mức"
                /> */}
              </Grid>
            </Grid>
          </Stack>
          {error && (
            <Box
              sx={{
                p: 2,
                backgroundColor: "error.light",
                color: "#d32f2f",
                borderRadius: 1,
                mb: 2,
              }}
            >
              <Typography
                variant="body2"
                sx={{ color: "#d32f2f", fontWeight: 600 }}
              >
                {error}
              </Typography>
            </Box>
          )}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 4,
              marginTop: 5,
            }}
          >
            {Array.isArray(dataReport.data) && dataReport.data.length > 0 && (
              <Button
                variant="contained"
                color="primary"
                sx={{ mr: 0 }}
                onClick={exportExcel}
                disabled={loadingExportExcel}
                startIcon={
                  loadingExportExcel ? <CircularProgress size={20} color="inherit" /> : null
                }
              >
                {loadingExportExcel ? "Đang xuất Excel..." : "Xuất Excel"}
              </Button>
            )}
            <Button
              variant="contained"
              color="primary"
              disabled={loadingReport || loadingStations || loadingParameters}
              onClick={fetchDataReport}
              startIcon={loadingReport ? <CircularProgress size={20} color="inherit" /> : null}
            >
              {loadingReport ? "Đang tải..." : "Áp dụng"}
            </Button>
          </div>
        </CardContent>
      </Card>
      {/* <Card variant="outlined" sx={{ mt: 2 }}>
        <CardContent>
          <DuLieuTrungBinh loading={loading} rows={rows} />
        </CardContent>
      </Card> */}
      {loadingReport ? (
        <Card variant="outlined" sx={{ mt: 2 }}>
          <CardContent
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              py: 4,
            }}
          >
            <CircularProgress size={40} sx={{ mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              Đang tải dữ liệu báo cáo...
            </Typography>
          </CardContent>
        </Card>
      ) : // : isMobile ? (
      //   <ReportCard
      //     rows={dataReport}
      //     loading={loadingDataTable}
      //     headerTable={headerTable}
      //   />
      // )
      (Array.isArray(dataReport.data) && dataReport.data.length > 0) ||
        (Array.isArray(dataReportChart) && dataReportChart.length > 0) ? (
        <Card variant="outlined" sx={{ mt: 2, padding: 0 }}>
          <TabContext value={value}>
            <Box sx={{ borderBottom: 1, borderColor: "divider", padding: 0 }}>
              <TabList onChange={handleChange}>
                <Tab label="Dữ liệu" value="1" />
                <Tab label="Biểu đồ" value="2" />
              </TabList>
            </Box>
            <TabPanel value="1" sx={{ padding: "15px !important" }}>
              {isMobile ? (
                <ReportCard
                  rows={{ ...dataReport, data: accumulatedRows }}
                  loading={loadingDataTable}
                  headerTable={headerTable}
                  onLoadMore={loadMoreMobile}
                  hasMore={accumulatedRows.length < rowCount}
                  loadingMore={loadingMore}
                />
              ) : (
                <>
                  <TableDetailReport
                    rows={dataReport}
                    loading={loadingDataTable}
                    headerTable={headerTable}
                  />
                  <Stack
                    direction="row"
                    justifyContent="flex-end"
                    alignItems="center"
                    spacing={2}
                    mt={2}
                  >
                    <Typography>Trang:</Typography>
                    <Button
                      disabled={page === 0}
                      onClick={() => {
                        const prevPage = page - 1;
                        setPage(prevPage);
                        fetchDataTable(prevPage, pageSize);
                      }}
                    >
                      Trước
                    </Button>
                    <Typography>{page + 1}</Typography>
                    <Button
                      disabled={(page + 1) * pageSize >= rowCount}
                      onClick={() => {
                        const nextPage = page + 1;
                        setPage(nextPage);
                        fetchDataTable(nextPage, pageSize);
                      }}
                    >
                      Sau
                    </Button>
                    <Typography>
                      Đang xem {page * pageSize + 1}–
                      {Math.min((page + 1) * pageSize, rowCount)} / {rowCount}{" "}
                      bản ghi
                    </Typography>
                  </Stack>
                </>
              )}
            </TabPanel>
            <TabPanel value="2" sx={{ padding: "15px !important" }}>
              <Grid container spacing={2}>
                {dataReportChart.map((item, idx) => {
                  return (
                    <Grid
                      key={idx}
                      size={{
                        xs: 12,
                        lg: 12,
                        md: 12,
                        sm: 12,
                      }}
                      sx={{
                        padding: "0 !important",
                      }}
                    >
                      <div style={{ width: "99.9%", padding: 0 }}>
                        <ChartOverview
                          colorChart={item.color}
                          tenBieuDo={item.chiTieu}
                          donVi={item.unit}
                          xData={item.data_points.map((dp) => dp.time)}
                          yData={item.data_points.map((dp) => dp.value)}
                          primaryColor={primaryColor}
                          primaryContrastText={primaryContrastText}
                        />
                      </div>
                    </Grid>
                  );
                })}
              </Grid>
            </TabPanel>
          </TabContext>
        </Card>
      ) : null}

      {/* Toast Container */}
</div>
  );
};

export default Report;
