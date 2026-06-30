"use client";
import { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  CircularProgress,
  Divider,
  Stack,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Chip,
} from "@mui/material";
import {
  IconDotsVertical,
  IconEdit,
  IconTrash,
  IconSettingsFilled,
} from "@tabler/icons-react";
import { useTheme } from "@mui/material/styles";
import dayjs from "dayjs";
import { deleteFetcher } from "@/app/api/globalFetcher";
import { toast } from "react-toastify";

export default function TenantCard({
  rows,
  loading,
  page,
  setPage,
  pageSize,
  rowCount,
  canUpdate = false,
  canDelete = false,
  onReload,
  onEdit,
  onConfig,
  externalSearch,
}) {
  const theme = useTheme();

  // Menu state
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuRow, setMenuRow] = useState(null);
  const openMenu = Boolean(anchorEl);

  // Delete confirm state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const handleMenuClick = (e, row) => {
    setAnchorEl(e.currentTarget);
    setMenuRow(row);
  };
  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuRow(null);
  };

  const handleEdit = () => {
    onEdit?.(menuRow);
    handleMenuClose();
  };

  const handleConfig = () => {
    onConfig?.(menuRow);
    handleMenuClose();
  };

  const handleDeleteClick = () => {
    setDeleteId(menuRow?.id);
    setConfirmOpen(true);
    handleMenuClose();
  };

  const handleDelete = async () => {
    try {
      await deleteFetcher(`/api/tenant/${deleteId}`, null, {
        skipTenantCode: true,
      });
      toast.success("Xoá tenant thành công");
      onReload?.();
    } catch (e) {
      toast.error(e.message || "Xoá tenant thất bại");
    }
    setConfirmOpen(false);
    setDeleteId(null);
  };

  // Lọc theo search
  const filteredRows = externalSearch
    ? rows.filter(
        (r) =>
          r.name?.toLowerCase().includes(externalSearch.toLowerCase()) ||
          r.tenant_code?.toLowerCase().includes(externalSearch.toLowerCase()) ||
          r.subdomain?.toLowerCase().includes(externalSearch.toLowerCase()) ||
          r.db_name?.toLowerCase().includes(externalSearch.toLowerCase()),
      )
    : rows;

  return (
    <>
      {loading ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      ) : filteredRows.length === 0 ? (
        <Box display="flex" justifyContent="center" py={4}>
          <Typography color="text.secondary">Không có dữ liệu</Typography>
        </Box>
      ) : (
        <>
          <Box display="flex" flexDirection="column" gap={1}>
            {filteredRows.map((row, idx) => {
              const exp = row.expiration_date
                ? dayjs(row.expiration_date)
                : null;
              const expired = exp && exp.toDate().getTime() < Date.now();

              return (
                <Card
                  key={row.id}
                  variant="outlined"
                  sx={{ borderRadius: 2, position: "relative" }}
                >
                  {/* Header */}
                  <Box
                    sx={{
                      px: 2,
                      pt: 1.5,
                      pb: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      bgcolor: "primary.main",
                      borderRadius: "8px 8px 0 0",
                    }}
                  >
                    <Typography
                      variant="subtitle1"
                      fontWeight={700}
                      color="white"
                    >
                      #{idx + 1} — {row.name}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuClick(e, row)}
                      sx={{ color: "white" }}
                    >
                      <IconDotsVertical width={20} />
                    </IconButton>
                  </Box>

                  <CardContent sx={{ pt: 1.5, pb: "12px !important" }}>
                    <InfoRow label="Mã tenant" value={row.tenant_code} />
                    <Divider sx={{ my: 0.75 }} />
                    <InfoRow label="Subdomain" value={row.subdomain || "—"} />
                    <Divider sx={{ my: 0.75 }} />
                    <InfoRow label="DB Name" value={row.db_name || "—"} />
                    <Divider sx={{ my: 0.75 }} />
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        fontWeight={500}
                      >
                        Hết hạn
                      </Typography>
                      {exp ? (
                        <Typography
                          variant="body2"
                          sx={{ color: expired ? "error.main" : "text.primary" }}
                          fontWeight={expired ? 700 : 400}
                        >
                          {exp.format("DD/MM/YYYY")}
                          {expired && " (Hết hạn)"}
                        </Typography>
                      ) : (
                        <Typography variant="body2">—</Typography>
                      )}
                    </Stack>
                    <Divider sx={{ my: 0.75 }} />
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        fontWeight={500}
                      >
                        Trạng thái
                      </Typography>
                      {row.is_active ? (
                        <Chip label="Active" color="success" size="small" />
                      ) : (
                        <Chip label="Inactive" size="small" />
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              );
            })}
          </Box>

          {/* Pagination */}
          <Stack
            direction="row"
            justifyContent="flex-end"
            alignItems="center"
            spacing={2}
            mt={2}
          >
            <Typography>Trang:</Typography>
            <Button disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
              Trước
            </Button>
            <Typography>{page + 1}</Typography>
            <Button
              disabled={(page + 1) * pageSize >= rowCount}
              onClick={() => setPage((p) => p + 1)}
            >
              Sau
            </Button>
            <Typography>Tổng: {rowCount}</Typography>
          </Stack>
        </>
      )}

      {/* Action Menu */}
      <Menu anchorEl={anchorEl} open={openMenu} onClose={handleMenuClose}>
        <MenuItem onClick={handleEdit} disabled={!canUpdate}>
          <IconEdit width={18} style={{ marginRight: 8 }} />
          Sửa
        </MenuItem>
        <MenuItem onClick={handleConfig} disabled={!canUpdate}>
          <IconSettingsFilled width={18} style={{ marginRight: 8 }} />
          Cấu hình hiển thị
        </MenuItem>
        <MenuItem onClick={handleDeleteClick} disabled={!canDelete}>
          <IconTrash width={18} style={{ marginRight: 8 }} color="red" />
          Xoá
        </MenuItem>
      </Menu>

      {/* Confirm delete */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Xác nhận xoá</DialogTitle>
        <DialogContent>
          Bạn có chắc chắn muốn xoá tenant này? Hành động không thể hoàn tác.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Huỷ</Button>
          <Button color="error" onClick={handleDelete} disabled={!canDelete}>
            Xoá
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

function InfoRow({ label, value }) {
  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      alignItems="flex-start"
      spacing={1}
    >
      <Typography
        variant="body2"
        color="text.secondary"
        fontWeight={500}
        minWidth={80}
      >
        {label}
      </Typography>
      <Typography
        variant="body2"
        textAlign="right"
        sx={{ wordBreak: "break-word" }}
      >
        {value}
      </Typography>
    </Stack>
  );
}
