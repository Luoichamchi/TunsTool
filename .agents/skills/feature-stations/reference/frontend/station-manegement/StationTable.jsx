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
import { postFetcher } from "@/app/api/globalFetcher";
import api from "@/app/api/api";
import { toast } from "react-toastify";
import { IconDotsVertical } from "@tabler/icons-react";
import { useState, useEffect } from "react";

export default function DemoThemeTable({
  rows: initialRows,
  loading,
  onMenuClick,
}) {
  const [rows, setRows] = useState(initialRows || []);
  useEffect(() => {
    setRows(initialRows || []);
  }, [initialRows]);
  const onMqttStatusChange = async (e, id) => {
    try {
      const res = await postFetcher(`${api.POST_UPDATE_MQTT_STATUS}`, {
        station_id: id,
        mqtt_status: e.target.checked,
      });
      if (res) {
        toast.success(res);
        setRows((prev) =>
          prev.map((row) =>
            row.id === id ? { ...row, mqtt_status: e.target.checked } : row
          )
        );
      } else {
        toast.error("Cập nhật trạng thái MQTT thất bại");
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <TableContainer>
      <Table
        sx={{
          minWidth: 650,
          borderCollapse: "collapse",
          border: (theme) =>
            `1px solid ${
              theme.palette.mode === "dark" ? theme.palette.divider : "#e0e0e0"
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
            <TableCell>Mã trạm</TableCell>
            <TableCell>Tên trạm</TableCell>
            <TableCell>Địa chỉ</TableCell>
            <TableCell>Toạ độ</TableCell>
            <TableCell>Trạng thái MQTT</TableCell>
            <TableCell>Trạng thái</TableCell>
            <TableCell>Hành động</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={8} align="center">
                <CircularProgress />
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} align="center">
                {!loading && "Không có dữ liệu"}
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow key={row.id} hover>
                <TableCell>{rows.indexOf(row) + 1}</TableCell>
                <TableCell>{row.station_code}</TableCell>
                <TableCell>{row.name}</TableCell>
                <TableCell>{row.address}</TableCell>
                <TableCell>{row.coordinates}</TableCell>
                <TableCell>
                  <Switch
                    checked={row.mqtt_status}
                    onChange={async (e) => await onMqttStatusChange(e, row.id)}
                  />
                </TableCell>
                <TableCell>
                  <p
                    style={{ color: row.status === "active" ? "green" : "red" }}
                  >
                    {" "}
                    {row.status === "active" ? "Hoạt động" : "Mất tín hiệu"}
                  </p>
                </TableCell>
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
