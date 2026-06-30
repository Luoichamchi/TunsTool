"use client";
import React, { useEffect } from "react";
import useSWR from "swr";
import { getFetcher, deleteFetcher } from "@/app/api/globalFetcher";
import api from "@/app/api/api";
import {
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, IconButton, Tooltip,
  CircularProgress, Box, Typography, TablePagination,
  TextField, InputAdornment, Chip,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SearchIcon from "@mui/icons-material/Search";
import VideocamIcon from "@mui/icons-material/Videocam";
import { toast } from "react-toastify";

export default function CameraTable({
  reload, onEdit, onActionDone, canUpdate, canDelete,
}) {
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  const [search, setSearch] = React.useState("");

  // SWR data fetching
  const { data, error, isLoading, mutate } = useSWR(
    `${api.GET_CAMERA_LIST}?page=${page + 1}&page_size=${rowsPerPage}`,
    getFetcher
  );

  useEffect(() => { mutate(); }, [reload]);

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa camera này?")) return;
    try {
      await deleteFetcher(`${api.DELETE_CAMERA}/${id}`);
      toast.success("Xóa camera thành công");
      mutate();
    } catch (e) {
      toast.error("Xóa thất bại: " + e.message);
    }
  };

  if (isLoading) return <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}><CircularProgress /></Box>;
  if (error) return <Typography color="error">Lỗi tải dữ liệu camera</Typography>;

  const items = data?.data || [];
  const total = data?.total || 0;

  return (
    <Paper elevation={0} sx={{ border: (theme) => `1px solid ${theme.palette.divider}`, borderRadius: 2 }}>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>STT</TableCell>
              <TableCell>Tên Camera</TableCell>
              <TableCell>Link RTSP</TableCell>
              <TableCell>Trạm</TableCell>
              <TableCell align="center">Thao tác</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <Box sx={{ py: 4, display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
                    <VideocamIcon sx={{ fontSize: 48, color: "text.disabled" }} />
                    <Typography color="text.secondary">Chưa có camera nào</Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              items.map((item, index) => (
                <TableRow key={item.id} hover>
                  <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <VideocamIcon fontSize="small" color="primary" />
                      {item.name}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={item.rtsp_link}
                      size="small"
                      variant="outlined"
                      sx={{ maxWidth: 300, fontFamily: "monospace", fontSize: "0.75rem" }}
                    />
                  </TableCell>
                  <TableCell>{item.station_id}</TableCell>
                  <TableCell align="center">
                    <Tooltip title="Sửa">
                      <IconButton color="primary" onClick={() => onEdit(item)} disabled={!canUpdate}>
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Xóa">
                      <IconButton color="error" onClick={() => handleDelete(item.id)} disabled={!canDelete}>
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={total}
        page={page}
        onPageChange={(_, newPage) => setPage(newPage)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
        labelRowsPerPage="Số dòng/trang"
      />
    </Paper>
  );
}
