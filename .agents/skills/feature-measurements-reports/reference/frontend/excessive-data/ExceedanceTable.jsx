import React from "react";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Stack,
  Button,
  CircularProgress,
} from "@mui/material";
import { IconDownload } from "@tabler/icons-react";
import moment from "moment";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

const severityConfig = {
  NGHIÊM_TRỌNG: { color: "error", label: "Vượt mức" },
};

export async function exportExceedanceExcel(rows, fileNamePrefix = "du-lieu-vuot-nguong") {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Vượt ngưỡng");

  worksheet.columns = [
    { header: "Thời gian", key: "date_time", width: 22 },
    { header: "Tên trạm", key: "station_name", width: 25 },
    { header: "Thông số", key: "parameter_name", width: 20 },
    { header: "Giá trị đo", key: "value", width: 15 },
    { header: "Ngưỡng", key: "threshold", width: 18 },
    { header: "Mức độ", key: "severity", width: 14 },
  ];

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

  rows.forEach((item) => {
    const addedRow = worksheet.addRow({
      date_time: moment(item.date_time).format("DD/MM/YYYY HH:mm:ss"),
      station_name: item.station_name || "—",
      parameter_name: item.parameter_name,
      value: `${item.value}${item.unit ? ` ${item.unit}` : ""}`,
      threshold: item.threshold,
      severity: severityConfig[item.severity]?.label || item.severity,
    });

    for (let colNumber = 1; colNumber <= worksheet.columns.length; colNumber++) {
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

  worksheet.eachRow((row) => {
    row.height = 22;
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  saveAs(blob, `${fileNamePrefix}-${moment().format("DD-MM-YYYY")}.xlsx`);
}


export default function ExceedanceTable({
  data = [],
  total = 0,
  page = 1,
  pageSize = 10,
  onPageChange,
  onExportExcel,
  exporting = false,
  loading = false,
}) {
  const totalPages = Math.ceil(total / pageSize);

  const handleExportExcel = () => {
    if (onExportExcel) {
      onExportExcel();
    }
  };

  return (
    <Box>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        mb={2}
      >
        <Typography variant="h6">
          Danh sách thông số vượt ngưỡng chi tiết
        </Typography>
        <Button
          variant="outlined"
          size="small"
          startIcon={
            exporting ? (
              <CircularProgress size={16} color="inherit" />
            ) : (
              <IconDownload size={16} />
            )
          }
          onClick={handleExportExcel}
          disabled={total === 0 || exporting || loading}
        >
          Xuất báo cáo (Excel)
        </Button>
      </Stack>

      <TableContainer>
        <Table
          sx={{
            minWidth: 750,
            border: (theme) =>
              `1px solid ${
                theme.palette.mode === "dark"
                  ? theme.palette.divider
                  : "#e0e0e0"
              }`,
          }}
          size="medium"
        >
          <TableHead>
            <TableRow>
              {["Thời gian", "Tên trạm", "Thông số", "Giá trị đo", "Ngưỡng", "Mức độ"].map(
                (header) => (
                  <TableCell
                    key={header}
                    sx={{
                      border: (theme) =>
                        `1px solid ${
                          theme.palette.mode === "dark"
                            ? theme.palette.divider
                            : "#e0e0e0"
                        }`,
                      textAlign: "center",
                      fontWeight: 600,
                    }}
                  >
                    {header}
                  </TableCell>
                ),
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  Không có dữ liệu
                </TableCell>
              </TableRow>
            ) : (
              data.map((item, idx) => {
                const sev = severityConfig[item.severity] || {
                  color: "default",
                  label: item.severity,
                };
                return (
                  <TableRow key={idx} hover>
                    <TableCell
                      sx={{
                        border: (theme) =>
                          `1px solid ${
                            theme.palette.mode === "dark"
                              ? theme.palette.divider
                              : "#e0e0e0"
                          }`,
                        textAlign: "center",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {moment(item.date_time).format("DD/MM/YYYY HH:mm:ss")}
                    </TableCell>
                    <TableCell
                      sx={{
                        border: (theme) =>
                          `1px solid ${
                            theme.palette.mode === "dark"
                              ? theme.palette.divider
                              : "#e0e0e0"
                          }`,
                        textAlign: "center",
                      }}
                    >
                      {item.station_name || "—"}
                    </TableCell>
                    <TableCell
                      sx={{
                        border: (theme) =>
                          `1px solid ${
                            theme.palette.mode === "dark"
                              ? theme.palette.divider
                              : "#e0e0e0"
                          }`,
                        textAlign: "center",
                      }}
                    >
                      {item.parameter_name}
                    </TableCell>
                    <TableCell
                      sx={{
                        border: (theme) =>
                          `1px solid ${
                            theme.palette.mode === "dark"
                              ? theme.palette.divider
                              : "#e0e0e0"
                          }`,
                        textAlign: "center",
                        fontWeight: 600,
                      }}
                    >
                      {item.value}
                      {item.unit ? ` ${item.unit}` : ""}
                    </TableCell>
                    <TableCell
                      sx={{
                        border: (theme) =>
                          `1px solid ${
                            theme.palette.mode === "dark"
                              ? theme.palette.divider
                              : "#e0e0e0"
                          }`,
                        textAlign: "center",
                      }}
                    >
                      {item.threshold}
                    </TableCell>
                    <TableCell
                      sx={{
                        border: (theme) =>
                          `1px solid ${
                            theme.palette.mode === "dark"
                              ? theme.palette.divider
                              : "#e0e0e0"
                          }`,
                        textAlign: "center",
                      }}
                    >
                      <Chip
                        label={sev.label}
                        color={sev.color}
                        size="small"
                        variant="filled"
                      />
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      {total > 0 && (
        <Stack
          direction="row"
          justifyContent="flex-end"
          alignItems="center"
          spacing={2}
          mt={2}
        >
          <Typography>Trang:</Typography>
          <Button
            disabled={page <= 1}
            onClick={() => onPageChange && onPageChange(page - 1)}
          >
            Trước
          </Button>
          <Typography>{page}</Typography>
          <Button
            disabled={page * pageSize >= total}
            onClick={() => onPageChange && onPageChange(page + 1)}
          >
            Sau
          </Button>
          <Typography>
            Đang xem {(page - 1) * pageSize + 1}–
            {Math.min(page * pageSize, total)} / {total} bản ghi
          </Typography>
        </Stack>
      )}
    </Box>
  );
}
