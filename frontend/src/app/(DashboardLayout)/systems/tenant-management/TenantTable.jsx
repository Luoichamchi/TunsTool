import React from 'react';
import dayjs from 'dayjs';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  IconButton,
  Chip,
  Tooltip,
} from '@mui/material';
import { IconDotsVertical } from '@tabler/icons-react';

export default function TenantTable({ rows, loading, onMenuClick }) {
  return (
    <TableContainer>
      <Table size="medium"
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
        }}>
        <TableHead>
          <TableRow>
            <TableCell>ID</TableCell>
            <TableCell>Mã (tenant_code)</TableCell>
            <TableCell>Tên</TableCell>
            <TableCell>Subdomain</TableCell>
            <TableCell>DB Name</TableCell>
            <TableCell>Hết hạn</TableCell>
            <TableCell>Trạng thái</TableCell>
            <TableCell>Ngày tạo</TableCell>
            <TableCell>Ngày cập nhật</TableCell>
            <TableCell></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={10} align="center">
                <CircularProgress />
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={10} align="center">
                Không có dữ liệu
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => {
              const exp = row.expiration_date ? dayjs(row.expiration_date) : null;
              const expired = exp && exp.toDate().getTime() < Date.now();
              return (
                <TableRow key={row.id} hover selected={!row.is_active}>
                  <TableCell>{row.id}</TableCell>
                  <TableCell>{row.tenant_code}</TableCell>
                  <TableCell>{row.name}</TableCell>
                  <TableCell>{row.subdomain || ''}</TableCell>
                  <TableCell>{row.db_name || ''}</TableCell>
                  <TableCell>
                    {exp ? (
                      <Tooltip title={expired ? 'Đã hết hạn' : 'Còn hạn'}>
                        <span style={{ color: expired ? 'red' : 'inherit' }}>
                          {exp.format('DD/MM/YYYY')}
                        </span>
                      </Tooltip>
                    ) : ''}
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={row.is_active ? 'Active' : 'Inactive'}
                      color={row.is_active ? 'success' : 'default'}
                    />
                  </TableCell>
                  <TableCell>
                    {row.created_at
                      ? new Date(row.created_at).toLocaleString()
                      : ''}
                  </TableCell>
                  <TableCell>
                    {row.updated_at
                      ? new Date(row.updated_at).toLocaleString()
                      : ''}
                  </TableCell>
                  <TableCell>
                    <IconButton onClick={(e) => onMenuClick(e, row)} size="small">
                      <IconDotsVertical width={18} />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
