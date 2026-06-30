import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  IconButton,
} from "@mui/material";
import { IconDotsVertical } from "@tabler/icons-react";
import moment from "moment";

export default function TableDetailReport({ rows, loading, headerTable }) {
  return (
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
    {headerTable.map((item, idx) => (
      <TableCell key={item.key} sx={{
        border: (theme) =>
          `1px solid ${
            theme.palette.mode === "dark"
              ? theme.palette.divider
              : "#e0e0e0"
          }`,
        width: 150, 
        maxWidth: 200,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        textAlign: "center",
      }}>
        {item.header}
      </TableCell>
    ))}
  </TableRow>
</TableHead>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={headerTable.length || 8} align="center">
                <CircularProgress />
              </TableCell>
            </TableRow>
          ) : rows?.data?.length === 0 ? (
            <TableRow>
              <TableCell colSpan={headerTable.length || 8} align="center">
                {!loading && "Không có dữ liệu"}
              </TableCell>
            </TableRow>
          ) : (
            rows?.data?.map((row, index) => (
              <TableRow key={index} hover>
                {headerTable.map((item, idx) => (
                  <TableCell
                    key={item.key}
                    sx={{
                      border: (theme) =>
                        `1px solid ${
                          theme.palette.mode === "dark"
                            ? theme.palette.divider
                            : "#e0e0e0"
                        }`,
                      width: idx === 0 ? 120 : undefined,
                      maxWidth: idx === 0 ? 120 : undefined,
                      whiteSpace: idx === 0 ? "nowrap" : undefined,
                      overflow: idx === 0 ? "hidden" : undefined,
                      textOverflow: idx === 0 ? "ellipsis" : undefined,
                      textAlign: "center",
                    }}
                  >
                    {item.key === "time" ? (
                      typeof row.time === "string" &&
                      /^\d{4}-\d{2}-\d{2}$/.test(row.time)
                        ? moment.utc(row.time).utcOffset(7).format("DD/MM/YYYY")
                        : moment.utc(row.time).utcOffset(7).format("DD/MM/YYYY HH:mm")
                    ) : (
                      row.parameters?.[item.key] ?? ""
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
