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

const DuLieuTrungBinh = ({loading, rows}) => {
    return (
        <TableContainer>
        <Table sx={{ minWidth: 750 }} size="medium">
          <TableHead>
            <TableRow>
              <TableCell>Thông số</TableCell>
              <TableCell>Thời gian vượt tối đa</TableCell>
              <TableCell>Giá trị tối đa</TableCell>
              <TableCell>Thời gian giảm tối thiểu</TableCell>
              <TableCell>Giá trị tối thiểu</TableCell>
              <TableCell>Giá trị trung bình</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : rows?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  {!loading && "Không có dữ liệu"}
                </TableCell>
              </TableRow>
            ) : (
              rows?.map((row, index) => (
                <TableRow key={row.id || index} hover>
                  <TableCell>{row.ThongSo}</TableCell>
                  <TableCell>{row.ThoiGianVuotToiDa}</TableCell>
                  <TableCell>{row.GiaTriToiDa}</TableCell>
                  <TableCell>{row.ThoiGianGiamToiThieu}</TableCell>
                  <TableCell>{row.GiaTriToiThieu}</TableCell>
                  <TableCell>{row.GiaTriTrungBinh}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    )
}

export default DuLieuTrungBinh;