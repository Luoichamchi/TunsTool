"use client";
import React, { useState } from "react";
import { useHasPermission } from "@/app/utils/auth/useHasPermission";
import {
  Box,
  Typography,
  Button,
  Stack,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CameraTable from "./CameraTable";
import CameraFormDialog from "./CameraFormDialog";
import { toast } from "react-toastify";
export default function CameraManagementPage() {
  const [openForm, setOpenForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [reload, setReload] = useState(false);

  // Quyền RBAC
  const canCreate = useHasPermission("camera", "create");
  const canUpdate = useHasPermission("camera", "update");
  const canDelete = useHasPermission("camera", "delete");

  const handleAdd = () => {
    setEditItem(null);
    setOpenForm(true);
  };

  const handleEdit = (item) => {
    setEditItem(item);
    setOpenForm(true);
  };

  const handleCloseForm = (refresh, msg) => {
    setOpenForm(false);
    setEditItem(null);
    if (refresh) setReload((r) => !r);
    if (msg) toast.success(msg);
  };

  return (
    <Box>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        mb={3}
        p={2}
        sx={{
          borderRadius: 2,
          border: (theme) =>
            `1px solid ${
              theme.palette.mode === "dark" ? theme.palette.divider : "#e0e0e0"
            }`,
        }}
      >
        <Typography variant="h4" fontWeight={700} color="primary.main">
          Quản lý Camera
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAdd}
          disabled={!canCreate}
        >
          Thêm Camera
        </Button>
      </Stack>

      <CameraTable
        reload={reload}
        onEdit={handleEdit}
        onActionDone={handleCloseForm}
        canUpdate={canUpdate}
        canDelete={canDelete}
      />

      <CameraFormDialog
        open={openForm}
        onClose={handleCloseForm}
        item={editItem}
      />
</Box>
  );
}
