"use client";
import React from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Stack, MenuItem,
} from "@mui/material";
import { useFormik } from "formik";
import * as yup from "yup";
import { postFetcher, putFetcher, getFetcher } from "@/app/api/globalFetcher";
import api from "@/app/api/api";
import { toast } from "react-toastify";
import useSWR from "swr";

const validationSchema = yup.object({
  name: yup.string().required("Tên camera không được để trống"),
  rtsp_link: yup.string().required("Link RTSP không được để trống"),
  station_id: yup.number().required("Vui lòng chọn trạm").positive("Vui lòng chọn trạm"),
});

export default function CameraFormDialog({ open, onClose, item }) {
  const isEdit = Boolean(item);

  // Lấy danh sách trạm để chọn
  const { data: stationData } = useSWR(
    open ? `${api.GET_STATION_LIST}?page=0` : null,
    getFetcher
  );
  const stations = stationData?.data || [];

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      name: item?.name || "",
      rtsp_link: item?.rtsp_link || "",
      station_id: item?.station_id || "",
    },
    validationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        const payload = { ...values, station_id: Number(values.station_id) };
        if (isEdit) {
          await putFetcher(`${api.PUT_CAMERA}/${item.id}`, payload);
          onClose(true, "Cập nhật camera thành công");
        } else {
          await postFetcher(api.POST_CAMERA, payload);
          onClose(true, "Thêm camera thành công");
        }
      } catch (e) {
        toast.error(e.message || "Có lỗi xảy ra");
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <Dialog open={open} onClose={() => onClose(false)} maxWidth="sm" fullWidth>
      <DialogTitle>{isEdit ? "Sửa" : "Thêm"} Camera</DialogTitle>
      <form onSubmit={formik.handleSubmit}>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              fullWidth label="Tên Camera" name="name"
              value={formik.values.name}
              onChange={formik.handleChange}
              error={formik.touched.name && Boolean(formik.errors.name)}
              helperText={formik.touched.name && formik.errors.name}
            />
            <TextField
              fullWidth label="Link RTSP" name="rtsp_link"
              placeholder="rtsp://192.168.1.100:554/stream"
              value={formik.values.rtsp_link}
              onChange={formik.handleChange}
              error={formik.touched.rtsp_link && Boolean(formik.errors.rtsp_link)}
              helperText={formik.touched.rtsp_link && formik.errors.rtsp_link}
            />
            <TextField
              fullWidth select label="Trạm" name="station_id"
              value={formik.values.station_id}
              onChange={formik.handleChange}
              error={formik.touched.station_id && Boolean(formik.errors.station_id)}
              helperText={formik.touched.station_id && formik.errors.station_id}
            >
              <MenuItem value="">-- Chọn trạm --</MenuItem>
              {stations.map((s) => (
                <MenuItem key={s.id} value={s.id}>{s.name} ({s.station_code})</MenuItem>
              ))}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => onClose(false)}>Hủy</Button>
          <Button type="submit" variant="contained" disabled={formik.isSubmitting}>
            {isEdit ? "Cập nhật" : "Thêm mới"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
