import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  IconButton,
  Switch,
} from "@mui/material";
import { IconDotsVertical } from "@tabler/icons-react";

export default function SensorTable({ rows, loading, onMenuClick }) {
  return (
    <TableContainer>
        <Table
  sx={{
    minWidth: 650,
    borderCollapse: "collapse",
    border: (theme) =>
      `1px solid ${
        theme.palette.mode === "dark"
          ? theme.palette.divider
          : "#e0e0e0"
      }`,
    "& .MuiTableCell-root": {
      border: (theme) =>
        `1px solid ${
          theme.palette.mode === "dark"
            ? theme.palette.divider
            : "#e0e0e0"
        }`,
        textAlign: "center",
        padding: "4px 8px",
    },
  }}
>
        <TableHead>
          <TableRow>
            <TableCell>STT</TableCell>
            <TableCell>Mã thông số</TableCell>
            <TableCell>Tên thông số</TableCell>
            <TableCell>Đơn vị</TableCell>
            <TableCell>Hành động</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={6} align="center">
                <CircularProgress />
              </TableCell>
            </TableRow>
          ) : rows?.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} align="center">
                {!loading && "Không có dữ liệu"}
              </TableCell>
            </TableRow>
          ) : (
            rows?.map((row, index) => (
              <TableRow key={row.id} hover>
                <TableCell>{index + 1}</TableCell>
                <TableCell>{row.parameter_code}</TableCell>
                <TableCell>{row.parameter_name}</TableCell>
                <TableCell>{row.unit}</TableCell>
                <TableCell>
                  <IconButton onClick={(e) => onMenuClick(e, row)}>
                    <IconDotsVertical width={18} />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
