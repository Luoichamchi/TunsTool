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
} from "@mui/material";
import { IconDotsVertical } from "@tabler/icons-react";

// Chỉ render bảng, menu sẽ do component cha quản lý giống UserTableTemplate
export default function RoleThemeTable({ rows, loading, onMenuClick }) {
  return (
    <TableContainer>
      <Table sx={{
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
  }}>
        <TableHead>
          <TableRow>
            <TableCell>ID</TableCell>
            <TableCell>Tên vai trò</TableCell>
            <TableCell>Mô tả</TableCell>
            <TableCell>Số quyền sở hữu</TableCell>
            <TableCell></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={5} align="center">
                <CircularProgress />
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} align="center">
                {!loading && "Không có dữ liệu"}
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow key={row.id} hover>
                <TableCell>{row.id}</TableCell>
                <TableCell>{row.name}</TableCell>
                <TableCell>{row.description}</TableCell>
                <TableCell>{row.permissions.length}</TableCell>
                <TableCell>
                  <IconButton
                    onClick={(e) => onMenuClick && onMenuClick(e, row)}
                  >
                    <IconDotsVertical width={18} />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      {/* Menu sẽ do component cha quản lý giống UserTableTemplate */}
    </TableContainer>
  );
}
