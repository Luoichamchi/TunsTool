"use client";
import React, { useState } from "react";
import { useHasPermission } from "@/app/utils/auth/useHasPermission";
import { Box, Typography, Button, Stack, TextField } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import UserTableTemplate from "./UserTableTemplate";
import UserFormDialog from "./UserFormDialog";
import { toast } from "react-toastify";
import { useTheme } from "@mui/material/styles";
import useIsMobile from "@/app/utils/hooks/useIsMobile";
import UserCard from "./mobile-view/UserCard";
import { Card } from "@mui/material";
export default function UserManagementPage() {
  const theme = useTheme();
  const isMobile = useIsMobile();
  const [openForm, setOpenForm] = useState(false);
  const [reload, setReload] = useState(false);
  const [mobileSearch, setMobileSearch] = useState("");

  const canCreate = useHasPermission("user", "create");
  const canUpdate = useHasPermission("user", "update");
  const canDelete = useHasPermission("user", "delete");

  const handleAdd = () => setOpenForm(true);

  const handleCloseForm = (refresh, msg) => {
    setOpenForm(false);
    if (refresh) setReload((r) => !r);
    if (msg) toast.success(msg);
  };

  return (
    <Box>
      {/* Thanh tìm kiếm mobile — hiển thị phía TRÊN header */}
      {isMobile && (
        <Box mb={1}>
          <TextField
            fullWidth
            placeholder="Tìm kiếm..."
            value={mobileSearch}
            onChange={(e) => setMobileSearch(e.target.value)}
            sx={{
              "& .MuiOutlinedInput-root": {
                backgroundColor:
                  theme.palette.mode === "dark" ? "#282828" : "#ffffff",
              },
            }}
          />
        </Box>
      )}

      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        mb={1}
      >
        <Card
          variant="outlined"
          sx={{
            p: 2,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="h4" fontWeight={700} color="primary.main">
            Quản lý người dùng
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAdd}
            disabled={!canCreate}
          >
            Thêm người dùng
          </Button>
        </Card>
      </Stack>

      {isMobile ? (
        <UserCard
          reload={reload}
          canUpdate={canUpdate}
          canDelete={canDelete}
          externalSearch={mobileSearch}
        />
      ) : (
        <UserTableTemplate
          reload={reload}
          canUpdate={canUpdate}
          canDelete={canDelete}
          isMobile={isMobile}
        />
      )}

      {/* Dialog thêm user mới từ nút "Thêm người dùng" */}
      <UserFormDialog
        open={openForm}
        onClose={handleCloseForm}
        user={null}
        isMobile={isMobile}
      />
</Box>
  );
}
