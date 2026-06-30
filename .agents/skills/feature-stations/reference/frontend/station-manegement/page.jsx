"use client";
import React, { useState, useEffect, useRef, useMemo } from "react";
import useSWR from "swr";
import { TabContext, TabList, TabPanel } from "@mui/lab";
import { Tab } from "@mui/material";
import { useTheme } from "@mui/material";
import useIsMobile from "@/app/utils/hooks/useIsMobile";
import {
  Box,
  Typography,
  Button,
  Stack,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  IconButton,
  Autocomplete,
  Fab,
} from "@mui/material";
import {
  IconEdit,
  IconTrash,
  IconSettings,
  IconChevronUp,
  IconChevronRight,
} from "@tabler/icons-react";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import Card from "@mui/material/Card";
import {
  getFetcher,
  postFetcher,
  putFetcher,
  deleteFetcher,
} from "@/app/api/globalFetcher";
import DemoThemeTable from "./StationTable";
import StationCard from "./mobile-view/StationCard";
import ParameterConfig from "./mobile-view/ParameterConfig";
import { useHasPermission } from "@/app/utils/auth/useHasPermission";
import { useTenantFilterVersion } from "@/app/context/TenantFilterContext";
import api from "@/app/api/api";
import { toast } from "react-toastify";
import reactCSS from "reactcss";
import { SketchPicker } from "react-color";
const fetchDemos = async (page, pageSize, search) => {
  const url = `${api.GET_STATION_LIST}/?search=${search || ""}&page=${
    page + 1
  }&page_size=${pageSize}`;
  const data = await getFetcher(url);
  console.log(data);
  if (!data) throw new Error("Lỗi khi tải danh sách demo hoặc chưa đăng nhập");
  return data;
};
const fetchSensor = async (page, pageSize, search, start_date, end_date) => {
  const url = `${api.GET_SENSOR_LIST}/?search=${
    search || ""
  }&page=${1}&page_size=${1000}`;
  const data = await getFetcher(url);
  console.log(data);
  if (!data) throw new Error("Lỗi khi tải danh sách demo hoặc chưa đăng nhập");
  return data;
};
const deleteStation = async (id) => {
  const url = `${api.DELETE_STATION}${id}`;
  await deleteFetcher(url);
  return true;
};

export default function DemoManagementPage() {
  const theme = useTheme();
  const isMobile = useIsMobile();
  const filterVersion = useTenantFilterVersion();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [rowCount, setRowCount] = useState(0);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuRow, setMenuRow] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [formDialog, setFormDialog] = useState({ open: false, demo: null });
  const [configDialog, setConfigDialog] = useState({ open: false, demo: null });
  const [configTab, setConfigTab] = useState("1");
  const [form, setForm] = useState({
    name: "",
    address: "",
    latitude: "",
    longitude: "",
    station_code: "",
  });
  const [formLoading, setFormLoading] = useState(false);
  const [parameterSuggestions, setParameterSuggestions] = useState([]);
  const [displayColorPicker, setDisplayColorPicker] = useState({});
  const [colorPickerPosition, setColorPickerPosition] = useState({
    x: 0,
    y: 0,
  });
  const [color, setColor] = useState({
    r: "241",
    g: "112",
    b: "19",
    a: "1",
  });
  const styles = reactCSS({
    default: {
      color: {
        width: "36px",
        height: "14px",
        borderRadius: "2px",
        background: `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`,
      },
      swatch: {
        padding: "5px",
        background: "#fff",
        borderRadius: "1px",
        boxShadow: "0 0 0 1px rgba(0,0,0,.1)",
        display: "inline-block",
        cursor: "pointer",
      },
      popover: {
        position: "fixed",
        zIndex: 9999,
        boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
        borderRadius: "8px",
      },
      cover: {
        position: "fixed",
        top: "0px",
        right: "0px",
        bottom: "0px",
        left: "0px",
      },
    },
  });
  // Quyền
  const canCreate = useHasPermission("demo", "create");
  const canUpdate = useHasPermission("demo", "update");
  const canDelete = useHasPermission("demo", "delete");

  const openMenu = Boolean(anchorEl);
  const handleMenuClick = (event, row) => {
    setAnchorEl(event.currentTarget);
    setMenuRow(row);
  };
  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuRow(null);
  };
  const handleAdd = () => {
    setFormDialog({ open: true, demo: null });
  };
  const handleEdit = (demo) => {
    setFormDialog({ open: true, demo });
  };
  const handleConfig = async () => {
    setConfigDialog({ open: true, demo: null });
    setConfigTab("1");
    // Load danh sách thông số khi mở dialog
    try {
      const res = await getFetcher(
        `${api.GET_SENSOR_LIST}/?search=${""}&page=${1}&page_size=${100}`,
      );
      setParameterSuggestions(res.data || []);
    } catch (err) {
      setParameterSuggestions([]);
    }
  };
  const loadConfig = async () => {
    const res = await getFetcher(
      `${api.GET_STATION_CONFIG_BY_STATION_ID}/${menuRow.id}`,
    );
    let dataMap = res.station_configs.map((item) => ({
      row_id: Date.now() + item.id,
      parameter_id: item.parameter_id,
      parameter_code: item.parameter.parameter_code,
      parameter_name: item.parameter.parameter_name,
      min_value: item.min_value,
      max_value: item.max_value,
      color: item.color,
      unit: item.parameter.unit,
    }));

    console.log(dataMap);
    setConfigRows(dataMap || []);
  };
  const handleFormClose = (success, msg, severity = "success") => {
    setFormDialog({ open: false, demo: null });
    setConfigDialog({ open: false, demo: null });
    // Reset form
    setForm({
      name: "",
      address: "",
      latitude: "",
      longitude: "",
      station_code: "",
    });
    setConfigRows([]);
    if (msg) {
      if (severity === "success") {
        toast.success(msg);
      } else if (severity === "error") {
        toast.error(msg);
      } else if (severity === "warning") {
        toast.warning(msg);
      } else {
        toast.info(msg);
      }
    }
    if (success) loadData();
  };
  const handleClick = (event, rowId) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    // Tính toán vị trí X
    let x = rect.left;
    if (x + 220 > viewportWidth) {
      x = viewportWidth - 220 - 10;
    }
    if (x < 10) {
      x = 10;
    }

    // Tính toán vị trí Y
    let y = rect.bottom + 10;
    if (y + 320 > viewportHeight) {
      y = rect.top - 320 - 10;
    }
    if (y < 10) {
      y = 10;
    }

    setColorPickerPosition({ x, y });
    setDisplayColorPicker((prev) => ({
      ...prev,
      [rowId]: !prev[rowId],
    }));
  };

  const handleClose = (rowId) => {
    setDisplayColorPicker((prev) => ({
      ...prev,
      [rowId]: false,
    }));
  };

  const handleChange = (color, rowId) => {
    setColor(color.rgb);
    // Cập nhật màu cho dòng tương ứng
    handleConfigRowChange(rowId, "color", `#${color.hex}`);
  };
  const handleDeleteClick = (demo) => {
    setDeleteId(demo.id);
    setConfirmOpen(true);
    handleMenuClose();
  };
  const handleDelete = async () => {
    try {
      await deleteStation(deleteId);
      toast.success("Xoá trạm thành công");
      loadData();
    } catch (e) {
      toast.error(e.message);
    }
    setConfirmOpen(false);
    setDeleteId(null);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchDemos(page, pageSize, search);
      setRows(data.data || []);
      setRowCount(data.total || 0);
    } catch (e) {
      setRows([]);
      setRowCount(0);
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
    loadData();
  }, [page, pageSize, debouncedSearch, filterVersion]);

  useEffect(() => {
    if (formDialog.open) {
      console.log(formDialog.demo);
      setForm({
        name: formDialog.demo?.name || "",
        address: formDialog.demo?.address || "",
        latitude: formDialog.demo?.coordinates?.split(",")[0] || "",
        longitude: formDialog.demo?.coordinates?.split(",")[1] || "",
        station_code: formDialog.demo?.station_code || "",
      });
    }
  }, [formDialog]);
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      let res;
      const stationData = {
        name: form.name,
        address: form.address,
        coordinates:
          form.latitude && form.longitude
            ? form.latitude + "," + form.longitude
            : null,
        station_code: form.station_code,
      };

      if (formDialog.demo) {
        res = await putFetcher(
          `${api.PUT_STATION}/${formDialog.demo.id}`,
          stationData,
        );
      } else {
        res = await postFetcher(`${api.POST_STATION}`, stationData);
      }
      if (!res) throw new Error("Lưu trạm thất bại");
      toast.success(
        formDialog.demo ? "Cập nhật thành công" : "Thêm mới thành công",
      );
      handleFormClose(true);
    } catch (e) {
      toast.error(e.message);
      handleFormClose(false);
    } finally {
      setFormLoading(false);
    }
  };
  const handleConfigSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      for (const row of configRows) {
        if (row.parameter_id == null) {
          toast.error("Vui lòng chọn thông số");
          return;
        }
      }
      const res = await postFetcher(`${api.ADD_STATION_CONFIG}`, {
        station_id: menuRow.id,
        configs: configRows.map(
          ({ row_id, parameter_code, parameter_name, unit, ...rest }) => ({
            ...rest,
          }),
        ),
      });
      if (!res) throw new Error("Cấu hình thông số trạm thất bại");
      toast.success("Cấu hình thông số trạm thành công");
      handleFormClose(true);
    } catch (e) {
      toast.error(e.message);
      handleFormClose(false);
    } finally {
      setFormLoading(false);
    }
  };
  const isEditMode = !!formDialog.demo;
  const canSubmit = isEditMode ? canUpdate : canCreate;
  const [configRows, setConfigRows] = useState([]);

  const handleAddConfigRow = () => {
    setConfigRows((prev) => [
      ...prev,
      {
        row_id: Date.now(),
        parameter_id: null,
        parameter_code: "",
        parameter_name: "",
        min_value: "",
        max_value: "",
        unit: "",
        color: "#000000",
      },
    ]);
  };

  const handleConfigRowChange = (id, field, value) => {
    setConfigRows((prev) =>
      prev.map((row) => (row.row_id === id ? { ...row, [field]: value } : row)),
    );
  };

  const handleDeleteConfigRow = (id) => {
    setConfigRows((prev) => prev.filter((row) => row.row_id !== id));
  };
  return (
    <Box>
{isMobile ? (
        <TextField
          fullWidth
          placeholder="Tìm kiếm..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{
            "& .MuiOutlinedInput-root": {
              backgroundColor:
                theme.palette.mode === "dark" ? "#282828" : "#ffffff",
            },
            marginBottom: "10px",
          }}
        />
      ) : null}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        mb={1}
        gap={2}
        flexWrap="wrap"
      >
        <Card
          variant="outlined"
          sx={{
            p: 2,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flex: 1,
          }}
        >
          <Typography variant="h4" fontWeight={700} color="primary.main">
            Quản lý Trạm
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAdd}
            disabled={!canCreate}
          >
            Thêm Trạm
          </Button>
        </Card>
      </Stack>
      {isMobile ? (
        <StationCard
          rows={rows}
          loading={loading}
          onMenuClick={handleMenuClick}
        />
      ) : (
        <Box
          sx={{
            borderRadius: 2,
            border: (theme) =>
              `1px solid ${
                theme.palette.mode === "dark"
                  ? theme.palette.divider
                  : "#e0e0e0"
              }`,
            p: 2,
            bgcolor: "background.paper",
          }}
        >
          <Stack
            direction="row"
            spacing={1}
            mb={2}
            alignItems="center"
            justifyContent={"space-between"}
          >
            <Typography variant="h6" fontWeight={600}>
              Danh sách trạm
            </Typography>
            <Box width={400}>
              <TextField
                fullWidth
                placeholder="Tìm kiếm..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </Box>
          </Stack>
          <DemoThemeTable
            rows={rows}
            loading={loading}
            onMenuClick={handleMenuClick}
          />
        </Box>
      )}
      {/* Pagination */}
      <Stack
        direction="row"
        justifyContent="flex-end"
        alignItems="center"
        spacing={2}
        mt={2}
        mb={2}
      >
        <Typography>Trang:</Typography>
        <Button disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
          Trước
        </Button>
        <Typography>{page + 1}</Typography>
        <Button
          disabled={(page + 1) * pageSize >= rowCount}
          onClick={() => setPage((p) => p + 1)}
        >
          Sau
        </Button>
        <Typography>Tổng: {rowCount}</Typography>
      </Stack>
      {/* Menu for actions */}
      <Menu anchorEl={anchorEl} open={openMenu} onClose={handleMenuClose}>
        <MenuItem
          onClick={() => {
            handleMenuClose();
            handleEdit(menuRow);
          }}
          disabled={!canUpdate}
        >
          <IconEdit width={18} style={{ marginRight: 8 }} />
          Sửa
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleMenuClose();
            handleDeleteClick(menuRow);
          }}
          disabled={!canDelete}
        >
          <IconTrash width={18} style={{ marginRight: 8 }} color="red" />
          Xoá
        </MenuItem>
        <MenuItem
          onClick={() => {
            setAnchorEl(null);
            handleConfig();
            loadConfig();
          }}
          disabled={!canDelete}
        >
          <IconSettings width={18} style={{ marginRight: 8 }} />
          Cấu hình thông số trạm
        </MenuItem>
      </Menu>
      {/* Confirm delete dialog */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Xác nhận xoá</DialogTitle>
        <DialogContent>Bạn có chắc chắn muốn xoá trạm này?</DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Huỷ</Button>
          <Button color="error" onClick={handleDelete} disabled={!canDelete}>
            Xoá
          </Button>
        </DialogActions>
      </Dialog>
      {/* Form dialog (edit/create) */}
      <Dialog
        open={formDialog.open}
        onClose={() => handleFormClose(false)}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
      >
        <form onSubmit={handleFormSubmit}>
          <DialogTitle>{isEditMode ? "Sửa Trạm" : "Thêm Trạm"}</DialogTitle>
          <DialogContent>
            <Stack spacing={2} mt={1}>
              <TextField
                label="Mã trạm"
                name="station_code"
                value={form.station_code}
                onChange={handleFormChange}
                required
                fullWidth
              />
              <TextField
                label="Tên trạm"
                name="name"
                value={form.name}
                onChange={handleFormChange}
                required
                fullWidth
              />
              <TextField
                label="Địa chỉ"
                name="address"
                value={form.address}
                onChange={handleFormChange}
                required
                fullWidth
              />
              <TextField
                label="Vĩ độ"
                name="latitude"
                value={form.latitude}
                onChange={handleFormChange}
                fullWidth
                required={!!form.longitude}
                error={!!form.longitude && !form.latitude}
                helperText={
                  !!form.longitude && !form.latitude
                    ? "Vui lòng nhập Vĩ độ khi đã nhập Kinh độ"
                    : ""
                }
              />
              <TextField
                label="Kinh độ"
                name="longitude"
                value={form.longitude}
                onChange={handleFormChange}
                fullWidth
                required={!!form.latitude}
                error={!!form.latitude && !form.longitude}
                helperText={
                  !!form.latitude && !form.longitude
                    ? "Vui lòng nhập Kinh độ khi đã nhập Vĩ độ"
                    : ""
                }
              />
            </Stack>
            <DialogActions sx={{ padding: "10px 0" }}>
              <Button onClick={() => handleFormClose(false)}>Huỷ</Button>
              <Button
                type="submit"
                variant="contained"
                disabled={formLoading || !canSubmit}
              >
                {formLoading ? <CircularProgress size={20} color="inherit" /> : "Lưu"}
              </Button>
            </DialogActions>
          </DialogContent>
        </form>
      </Dialog>
      {/* Dialog cấu hình trạm — có tabs */}
      <Dialog
        open={configDialog.open}
        onClose={() => handleFormClose(false)}
        maxWidth="lg"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            display: "flex",
            flexDirection: "column",
            height: isMobile ? "100%" : "80vh",
          },
        }}
      >
        <DialogTitle sx={{ color: "primary.main", flexShrink: 0 }}>
          Cấu hình trạm: {menuRow?.name || ""}
        </DialogTitle>
        <Divider />
        <TabContext value={configTab}>
          <Box
            sx={{
              borderBottom: 1,
              borderColor: "divider",
              px: 2,
              flexShrink: 0,
            }}
          >
            <TabList
              onChange={(e, v) => setConfigTab(v)}
              sx={{
                "& .MuiTab-root": { textTransform: "none", fontWeight: 500 },
              }}
            >
              <Tab label="Thông số" value="1" />
              <Tab label="Camera" value="2" />
            </TabList>
          </Box>

          {/* Tab content area — scrollable, takes remaining space */}
          <Box
            sx={{
              flex: 1,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Tab 1: Cấu hình thông số */}
            <TabPanel value="1" sx={{ p: 0, flex: 1, overflow: "auto" }}>
              <DialogContent>
                <Box display="flex" flexDirection="column" gap={1}>
                  {!isMobile && (
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      sx={{ mb: 1, alignSelf: "flex-end" }}
                      onClick={handleAddConfigRow}
                    >
                      Thêm thông số
                    </Button>
                  )}
                  {isMobile ? (
                    <ParameterConfig
                      configRows={configRows}
                      parameterSuggestions={parameterSuggestions}
                      onAddRow={handleAddConfigRow}
                      onDeleteRow={handleDeleteConfigRow}
                      onRowChange={handleConfigRowChange}
                    />
                  ) : (
                    <TableContainer
                      sx={{
                        maxHeight: 400,
                        overflowY: "auto",
                        borderRadius: 2,
                        border: (theme) =>
                          `1px solid ${theme.palette.mode === "dark" ? theme.palette.divider : "#e0e0e0"}`,
                      }}
                    >
                      <Table stickyHeader>
                        <TableHead>
                          <TableRow>
                            <TableCell>#ID</TableCell>
                            <TableCell>Mã thông số</TableCell>
                            <TableCell>Tên thông số</TableCell>
                            <TableCell>Giới hạn Min</TableCell>
                            <TableCell>Giới hạn Max</TableCell>
                            <TableCell>Đơn vị</TableCell>
                            <TableCell>Màu sắc</TableCell>
                            <TableCell></TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {configRows.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={8} align="center">
                                Chưa có thông số nào, hãy nhấn "Thêm thông số"
                              </TableCell>
                            </TableRow>
                          ) : (
                            configRows.map((row, idx) => (
                              <TableRow
                                key={row.row_id}
                                style={{ position: "relative" }}
                              >
                                <TableCell>{idx + 1}</TableCell>
                                <TableCell
                                  sx={{ minWidth: 280, maxWidth: 350 }}
                                >
                                  <Autocomplete
                                    size="medium"
                                    options={parameterSuggestions}
                                    getOptionLabel={(option) =>
                                      option.parameter_code || ""
                                    }
                                    isOptionEqualToValue={(option, value) =>
                                      option.parameter_code ===
                                      value.parameter_code
                                    }
                                    value={
                                      parameterSuggestions.find(
                                        (param) =>
                                          param.parameter_code ===
                                          row.parameter_code,
                                      ) || null
                                    }
                                    sx={{
                                      minWidth: 250,
                                      "& .MuiAutocomplete-input": {
                                        fontSize: "14px",
                                        padding: "8px 12px",
                                      },
                                      "& .MuiOutlinedInput-root": {
                                        padding: "0px",
                                      },
                                    }}
                                    onChange={(event, newValue) => {
                                      if (newValue) {
                                        handleConfigRowChange(
                                          row.row_id,
                                          "parameter_code",
                                          newValue.parameter_code,
                                        );
                                        handleConfigRowChange(
                                          row.row_id,
                                          "parameter_name",
                                          newValue.parameter_name || "",
                                        );
                                        handleConfigRowChange(
                                          row.row_id,
                                          "unit",
                                          newValue.unit || "",
                                        );
                                        handleConfigRowChange(
                                          row.row_id,
                                          "parameter_id",
                                          newValue.id || "",
                                        );
                                      } else {
                                        handleConfigRowChange(
                                          row.row_id,
                                          "parameter_code",
                                          "",
                                        );
                                        handleConfigRowChange(
                                          row.row_id,
                                          "parameter_name",
                                          "",
                                        );
                                        handleConfigRowChange(
                                          row.row_id,
                                          "unit",
                                          "",
                                        );
                                        handleConfigRowChange(
                                          row.row_id,
                                          "parameter_id",
                                          "",
                                        );
                                      }
                                    }}
                                    renderInput={(params) => (
                                      <TextField
                                        {...params}
                                        placeholder="Chọn mã thông số"
                                        size="small"
                                      />
                                    )}
                                    renderOption={(props, option) => {
                                      const { key, ...otherProps } = props;
                                      return (
                                        <Box
                                          component="li"
                                          key={key}
                                          {...otherProps}
                                        >
                                          <Box>
                                            <Typography fontWeight={600}>
                                              {option.parameter_code}
                                            </Typography>
                                          </Box>
                                        </Box>
                                      );
                                    }}
                                    filterOptions={(
                                      options,
                                      { inputValue },
                                    ) => {
                                      const selectedParameters = configRows
                                        .filter(
                                          (r) =>
                                            r.row_id !== row.row_id &&
                                            r.parameter_code,
                                        )
                                        .map((r) => r.parameter_code);
                                      return options.filter((option) => {
                                        const matchesSearch =
                                          option.parameter_code
                                            ?.toLowerCase()
                                            .includes(inputValue.toLowerCase());
                                        const isNotSelected =
                                          !selectedParameters.includes(
                                            option.parameter_code,
                                          );
                                        return matchesSearch && isNotSelected;
                                      });
                                    }}
                                  />
                                </TableCell>
                                <TableCell>
                                  <TextField
                                    disabled
                                    size="small"
                                    value={row.parameter_name || ""}
                                  />
                                </TableCell>
                                <TableCell>
                                  <TextField
                                    size="small"
                                    type="text"
                                    required
                                    value={row.min_value}
                                    onChange={(e) => {
                                      let value = e.target.value.replace(
                                        /[^0-9.]/g,
                                        "",
                                      );
                                      const parts = value.split(".");
                                      if (parts.length > 2)
                                        value =
                                          parts[0] +
                                          "." +
                                          parts.slice(1).join("");
                                      handleConfigRowChange(
                                        row.row_id,
                                        "min_value",
                                        value,
                                      );
                                    }}
                                  />
                                </TableCell>
                                <TableCell>
                                  <TextField
                                    size="small"
                                    type="text"
                                    required
                                    value={row.max_value}
                                    onChange={(e) => {
                                      let value = e.target.value.replace(
                                        /[^0-9.]/g,
                                        "",
                                      );
                                      const parts = value.split(".");
                                      if (parts.length > 2)
                                        value =
                                          parts[0] +
                                          "." +
                                          parts.slice(1).join("");
                                      handleConfigRowChange(
                                        row.row_id,
                                        "max_value",
                                        value,
                                      );
                                    }}
                                  />
                                </TableCell>
                                <TableCell>
                                  <TextField
                                    disabled
                                    size="small"
                                    value={row.unit}
                                  />
                                </TableCell>
                                <TableCell>
                                  <Box
                                    sx={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 1,
                                      position: "relative",
                                    }}
                                  >
                                    <div
                                      style={styles.swatch}
                                      onClick={(e) =>
                                        handleClick(e, row.row_id)
                                      }
                                    >
                                      <div
                                        style={{
                                          ...styles.color,
                                          background: row.color || "#000000",
                                        }}
                                      />
                                    </div>
                                    {displayColorPicker[row.row_id] && (
                                      <div
                                        style={{
                                          ...styles.popover,
                                          left: colorPickerPosition.x,
                                          top: colorPickerPosition.y,
                                        }}
                                      >
                                        <div
                                          style={styles.cover}
                                          onClick={() =>
                                            handleClose(row.row_id)
                                          }
                                        />
                                        <SketchPicker
                                          color={row.color || "#000000"}
                                          onChange={(color) => {
                                            handleConfigRowChange(
                                              row.row_id,
                                              "color",
                                              color.hex
                                                ? `#${color.hex.replace(/^#/, "")}`
                                                : "#000000",
                                            );
                                          }}
                                          presetColors={[
                                            "#D0021B",
                                            "#F5A623",
                                            "#F8E71C",
                                            "#7ED321",
                                            "#BD10E0",
                                            "#9013FE",
                                            "#4A90E2",
                                            "#50E3C2",
                                            "#B8E986",
                                            "#000000",
                                            "#4A4A4A",
                                            "#9B9B9B",
                                          ]}
                                        />
                                      </div>
                                    )}
                                    <span>{row.color || "#000000"}</span>
                                  </Box>
                                </TableCell>
                                <TableCell>
                                  <IconButton
                                    color="error"
                                    onClick={() =>
                                      handleDeleteConfigRow(row.row_id)
                                    }
                                  >
                                    <DeleteIcon />
                                  </IconButton>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </Box>
              </DialogContent>
            </TabPanel>

            {/* Tab 2: Quản lý Camera */}
            <TabPanel value="2" sx={{ p: 0, flex: 1, overflow: "auto" }}>
              <StationCameraTab stationId={menuRow?.id} isMobile={isMobile} />
            </TabPanel>
          </Box>
        </TabContext>

        {/* Footer chung — luôn pin ở bottom */}
        <Divider />
        <DialogActions sx={{ flexShrink: 0 }}>
          <Button onClick={() => handleFormClose(false)}>Huỷ</Button>
          {configTab === "1" && (
            <Button
              variant="contained"
              color="primary"
              onClick={handleConfigSubmit}
            >
              Cập nhật
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// Component quản lý camera trong dialog cấu hình trạm
function StationCameraTab({ stationId, isMobile }) {
  const { data, error, isLoading, mutate } = useSWR(
    stationId ? `${api.GET_CAMERA_LIST}?station_id=${stationId}&page=0` : null,
    getFetcher,
    { revalidateOnFocus: false },
  );
  const [cameraForm, setCameraForm] = useState({ name: "", rtsp_link: "" });
  const [editingCamera, setEditingCamera] = useState(null);
  const [addingCamera, setAddingCamera] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  const cameras = data?.data || [];

  const handleAddCamera = async () => {
    if (!cameraForm.name || !cameraForm.rtsp_link) {
      toast.error("Vui lòng nhập đầy đủ tên và link RTSP");
      return;
    }
    try {
      await postFetcher(api.POST_CAMERA, {
        name: cameraForm.name,
        rtsp_link: cameraForm.rtsp_link,
        station_id: stationId,
      });
      toast.success("Thêm camera thành công");
      setCameraForm({ name: "", rtsp_link: "" });
      setAddingCamera(false);
      mutate();
    } catch (e) {
      toast.error("Lỗi khi thêm camera");
    }
  };

  const handleUpdateCamera = async () => {
    if (!cameraForm.name || !cameraForm.rtsp_link) {
      toast.error("Vui lòng nhập đầy đủ tên và link RTSP");
      return;
    }
    try {
      await putFetcher(`${api.PUT_CAMERA}/${editingCamera.id}`, {
        name: cameraForm.name,
        rtsp_link: cameraForm.rtsp_link,
        station_id: stationId,
      });
      toast.success("Cập nhật camera thành công");
      setCameraForm({ name: "", rtsp_link: "" });
      setEditingCamera(null);
      mutate();
    } catch (e) {
      toast.error("Lỗi khi cập nhật camera");
    }
  };

  const handleDeleteCamera = async (id) => {
    try {
      await deleteFetcher(`${api.DELETE_CAMERA}/${id}`);
      toast.success("Xóa camera thành công");
      mutate();
    } catch (e) {
      toast.error("Lỗi khi xóa camera");
    }
  };

  const startEdit = (camera) => {
    setEditingCamera(camera);
    setCameraForm({ name: camera.name, rtsp_link: camera.rtsp_link });
    setAddingCamera(false);
    if (isMobile) setExpandedId(camera.id);
  };

  const startAdd = () => {
    setAddingCamera(true);
    setEditingCamera(null);
    setCameraForm({ name: "", rtsp_link: "" });
  };

  const cancelForm = () => {
    setAddingCamera(false);
    setEditingCamera(null);
    setCameraForm({ name: "", rtsp_link: "" });
  };

  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <Box sx={{ p: 2 }}>
      {/* Form thêm/sửa camera */}
      {(addingCamera || editingCamera) && (
        <Box
          sx={{
            mb: 2,
            p: 2,
            border: "1px solid #e0e0e0",
            borderRadius: 2,
            bgcolor: "action.hover",
          }}
        >
          <Typography fontWeight={600} mb={1}>
            {editingCamera ? "Sửa Camera" : "Thêm Camera mới"}
          </Typography>
          <Stack
            direction={isMobile ? "column" : "row"}
            spacing={2}
            alignItems={isMobile ? "stretch" : "center"}
          >
            <TextField
              label="Tên camera"
              size="small"
              fullWidth={isMobile}
              value={cameraForm.name}
              onChange={(e) =>
                setCameraForm((f) => ({ ...f, name: e.target.value }))
              }
              sx={isMobile ? {} : { flex: 1 }}
            />
            <TextField
              label="Link RTSP"
              size="small"
              fullWidth={isMobile}
              value={cameraForm.rtsp_link}
              onChange={(e) =>
                setCameraForm((f) => ({ ...f, rtsp_link: e.target.value }))
              }
              sx={isMobile ? {} : { flex: 2 }}
            />
            <Stack
              direction="row"
              spacing={1}
              justifyContent={isMobile ? "flex-end" : "flex-start"}
            >
              <Button
                variant="contained"
                onClick={editingCamera ? handleUpdateCamera : handleAddCamera}
              >
                {editingCamera ? "Lưu" : "Thêm"}
              </Button>
              <Button onClick={cancelForm}>Huỷ</Button>
            </Stack>
          </Stack>
        </Box>
      )}

      {/* Danh sách camera */}
      {isLoading ? (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      ) : isMobile ? (
        /* ── Mobile: Card expandable ── */
        <Box display="flex" flexDirection="column" gap={1.5} sx={{ pr: 0.5 }}>
          {cameras.length === 0 && (
            <Typography align="center" color="text.secondary" py={3}>
              Chưa có camera nào cho trạm này
            </Typography>
          )}

          {cameras.map((cam, idx) => {
            const isOpen = expandedId === cam.id;
            return (
              <Box
                key={cam.id}
                sx={{
                  border: "1px solid",
                  borderColor: isOpen ? "primary.main" : "divider",
                  borderRadius: 0,
                }}
              >
                {/* Header */}
                <Box
                  onClick={() => toggleExpand(cam.id)}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    px: 2,
                    py: 1.25,
                    bgcolor: isOpen ? "primary.main" : "background.paper",
                    cursor: "pointer",
                    userSelect: "none",
                  }}
                >
                  <Typography
                    variant="body2"
                    fontWeight={600}
                    color={isOpen ? "white" : "text.primary"}
                  >
                    {idx + 1} - {cam.name}
                  </Typography>
                  <Box display="flex" alignItems="center" gap={0.5}>
                    {isOpen && (
                      <>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            startEdit(cam);
                          }}
                          sx={{ color: "white", p: 0.25 }}
                        >
                          <IconEdit size={18} />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCamera(cam.id);
                          }}
                          sx={{ color: "white", p: 0.25 }}
                        >
                          <IconTrash size={18} />
                        </IconButton>
                      </>
                    )}
                    {isOpen ? (
                      <IconChevronUp size={18} color="white" />
                    ) : (
                      <IconChevronRight size={18} />
                    )}
                  </Box>
                </Box>

                {/* Body (expanded) */}
                {isOpen && (
                  <Box
                    px={2}
                    py={1.5}
                    display="flex"
                    flexDirection="column"
                    gap={1.25}
                  >
                    <CameraFieldRow label="Tên camera">
                      <Typography variant="body2">{cam.name}</Typography>
                    </CameraFieldRow>
                    <Divider />
                    <CameraFieldRow label="Link RTSP">
                      <Typography
                        variant="body2"
                        sx={{
                          wordBreak: "break-all",
                          fontSize: "0.8rem",
                          color: "text.secondary",
                        }}
                      >
                        {cam.rtsp_link}
                      </Typography>
                    </CameraFieldRow>
                  </Box>
                )}
              </Box>
            );
          })}

          {/* Add button */}
          <Box display="flex" justifyContent="center" mt={1} mb={0.5}>
            <Fab
              size="medium"
              color="primary"
              onClick={startAdd}
              sx={{ boxShadow: 3 }}
            >
              <AddIcon />
            </Fab>
          </Box>
        </Box>
      ) : (
        /* ── Desktop: Table ── */
        <Box>
          <Box display="flex" justifyContent="flex-end" mb={1}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={startAdd}
            >
              Thêm Camera
            </Button>
          </Box>
          <TableContainer sx={{ borderRadius: 2, border: "1px solid #e0e0e0" }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>STT</TableCell>
                  <TableCell>Tên Camera</TableCell>
                  <TableCell>Link RTSP</TableCell>
                  <TableCell align="right">Thao tác</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {cameras.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      Chưa có camera nào cho trạm này
                    </TableCell>
                  </TableRow>
                ) : (
                  cameras.map((cam, idx) => (
                    <TableRow key={cam.id}>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell>{cam.name}</TableCell>
                      <TableCell
                        sx={{
                          maxWidth: 400,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {cam.rtsp_link}
                      </TableCell>
                      <TableCell align="right">
                        <IconButton size="small" onClick={() => startEdit(cam)}>
                          <IconEdit width={18} />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteCamera(cam.id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}
    </Box>
  );
}

/* Helper: label + content dạng row cho camera mobile */
function CameraFieldRow({ label, children }) {
  return (
    <Stack direction="row" alignItems="flex-start" spacing={1.5}>
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ minWidth: 90, flexShrink: 0, fontWeight: 500 }}
      >
        {label}
      </Typography>
      <Box flex={1}>{children}</Box>
    </Stack>
  );
}
