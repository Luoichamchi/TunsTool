"use client";

import React, { useMemo, useState } from "react";
import useSWR from "swr";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  IconButton,
  MenuItem,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { IconEdit, IconTrash } from "@tabler/icons-react";
import { toast } from "react-toastify";

import PageContainer from "@/app/components/container/PageContainer";
import api from "@/app/api/api";
import {
  deleteFetcher,
  getFetcher,
  postFetcher,
  putFetcher,
} from "@/app/api/globalFetcher";
import { useHasPermission } from "@/app/utils/auth/useHasPermission";

const emptyCategory = {
  name: "",
  description: "",
  sort_order: 0,
  is_active: true,
};

const emptyProduct = {
  category_id: "",
  name: "",
  description: "",
  price: "",
  is_available: true,
  sort_order: 0,
  image_file: null,
};

const tableSx = {
  minWidth: 650,
  borderCollapse: "collapse",
  border: (theme) =>
    `1px solid ${theme.palette.mode === "dark" ? theme.palette.divider : "#e0e0e0"}`,
  "& .MuiTableCell-root": {
    border: (theme) =>
      `1px solid ${theme.palette.mode === "dark" ? theme.palette.divider : "#e0e0e0"}`,
    textAlign: "center",
    padding: "8px 12px",
  },
};

function toProductFormData(form) {
  const payload = new FormData();
  if (form.category_id !== "") payload.append("category_id", form.category_id);
  payload.append("name", form.name);
  payload.append("description", form.description || "");
  payload.append("price", form.price);
  payload.append("is_available", String(form.is_available));
  payload.append("sort_order", String(form.sort_order || 0));
  if (form.image_file) payload.append("image_file", form.image_file);
  return payload;
}

export default function ProductsPage() {
  const [categorySearch, setCategorySearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [categoryPage, setCategoryPage] = useState(0);
  const [categoryPageSize, setCategoryPageSize] = useState(10);
  const [productPage, setProductPage] = useState(0);
  const [productPageSize, setProductPageSize] = useState(10);
  const [categoryDialog, setCategoryDialog] = useState({ open: false, item: null });
  const [productDialog, setProductDialog] = useState({ open: false, item: null });
  const [categoryForm, setCategoryForm] = useState(emptyCategory);
  const [productForm, setProductForm] = useState(emptyProduct);

  const canCreateCategory = useHasPermission("product_category", "create");
  const canUpdateCategory = useHasPermission("product_category", "update");
  const canDeleteCategory = useHasPermission("product_category", "delete");
  const canCreateProduct = useHasPermission("product", "create");
  const canUpdateProduct = useHasPermission("product", "update");
  const canDeleteProduct = useHasPermission("product", "delete");

  const categoriesUrl = `${api.GET_PRODUCT_CATEGORY_LIST}?page=${categoryPage + 1}&page_size=${categoryPageSize}&search=${encodeURIComponent(categorySearch)}`;
  const productsUrl = `${api.GET_PRODUCT_LIST}?page=${productPage + 1}&page_size=${productPageSize}&search=${encodeURIComponent(productSearch)}`;
  const { data: categoriesData, mutate: mutateCategories, isLoading: categoriesLoading } =
    useSWR(categoriesUrl, getFetcher);
  const { data: productsData, mutate: mutateProducts, isLoading: productsLoading } =
    useSWR(productsUrl, getFetcher);

  const categories = useMemo(() => categoriesData?.data || [], [categoriesData]);
  const products = useMemo(() => productsData?.data || [], [productsData]);
  const categoryTotal = categoriesData?.total || 0;
  const productTotal = productsData?.total || 0;

  const categoryOptions = useMemo(
    () => categories.filter((item) => item.is_active),
    [categories],
  );

  const openCategoryDialog = (item = null) => {
    setCategoryDialog({ open: true, item });
    setCategoryForm(
      item
        ? {
            name: item.name || "",
            description: item.description || "",
            sort_order: item.sort_order || 0,
            is_active: item.is_active ?? true,
          }
        : emptyCategory,
    );
  };

  const openProductDialog = (item = null) => {
    setProductDialog({ open: true, item });
    setProductForm(
      item
        ? {
            category_id: item.category_id ?? "",
            name: item.name || "",
            description: item.description || "",
            price: item.price || "",
            is_available: item.is_available ?? true,
            sort_order: item.sort_order || 0,
            image_file: null,
          }
        : emptyProduct,
    );
  };

  const closeCategoryDialog = () => {
    setCategoryDialog({ open: false, item: null });
    setCategoryForm(emptyCategory);
  };

  const closeProductDialog = () => {
    setProductDialog({ open: false, item: null });
    setProductForm(emptyProduct);
  };

  const saveCategory = async () => {
    try {
      if (categoryDialog.item) {
        await putFetcher(
          `${api.PUT_PRODUCT_CATEGORY}/${categoryDialog.item.id}`,
          categoryForm,
        );
        toast.success("Đã cập nhật loại mặt hàng");
      } else {
        await postFetcher(api.POST_PRODUCT_CATEGORY, categoryForm);
        toast.success("Đã tạo loại mặt hàng");
      }
      closeCategoryDialog();
      mutateCategories();
    } catch (error) {
      toast.error(error.message || "Không thể lưu loại mặt hàng");
    }
  };

  const saveProduct = async () => {
    try {
      const payload = toProductFormData(productForm);
      if (productDialog.item) {
        await putFetcher(`${api.PUT_PRODUCT}/${productDialog.item.id}`, payload);
        toast.success("Đã cập nhật mặt hàng");
      } else {
        await postFetcher(api.POST_PRODUCT, payload);
        toast.success("Đã tạo mặt hàng");
      }
      closeProductDialog();
      mutateProducts();
    } catch (error) {
      toast.error(error.message || "Không thể lưu mặt hàng");
    }
  };

  const removeCategory = async (id) => {
    if (!window.confirm("Xoá loại mặt hàng này?")) return;
    try {
      await deleteFetcher(`${api.DELETE_PRODUCT_CATEGORY}${id}`);
      toast.success("Đã xoá loại mặt hàng");
      mutateCategories();
    } catch (error) {
      toast.error(error.message || "Không thể xoá loại mặt hàng");
    }
  };

  const removeProduct = async (id) => {
    if (!window.confirm("Xoá mặt hàng này?")) return;
    try {
      await deleteFetcher(`${api.DELETE_PRODUCT}${id}`);
      toast.success("Đã xoá mặt hàng");
      mutateProducts();
    } catch (error) {
      toast.error(error.message || "Không thể xoá mặt hàng");
    }
  };

  return (
    <PageContainer title="Quản lý hàng hoá" description="Quản lý loại mặt hàng, mặt hàng, ảnh và giá tiền">
      <Stack spacing={3}>
        <Card variant="outlined">
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h5" fontWeight={700}>
                Loại mặt hàng
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => openCategoryDialog()}
                disabled={!canCreateCategory}
              >
                Thêm loại
              </Button>
            </Stack>
            <Box mb={2} maxWidth={400}>
              <TextField
                fullWidth
                placeholder="Tìm loại mặt hàng..."
                value={categorySearch}
                onChange={(e) => {
                  setCategorySearch(e.target.value);
                  setCategoryPage(0);
                }}
              />
            </Box>
            <TableContainer>
              <Table sx={tableSx}>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Tên loại</TableCell>
                    <TableCell>Mô tả</TableCell>
                    <TableCell>Thứ tự</TableCell>
                    <TableCell>Trạng thái</TableCell>
                    <TableCell>Thao tác</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {categoriesLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <CircularProgress size={28} />
                      </TableCell>
                    </TableRow>
                  ) : categories.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        Không có dữ liệu
                      </TableCell>
                    </TableRow>
                  ) : (
                    categories.map((item) => (
                      <TableRow key={item.id} hover>
                        <TableCell>{item.id}</TableCell>
                        <TableCell>{item.name}</TableCell>
                        <TableCell sx={{ textAlign: "left", maxWidth: 240 }}>
                          <Typography variant="body2" noWrap title={item.description || ""}>
                            {item.description || "—"}
                          </Typography>
                        </TableCell>
                        <TableCell>{item.sort_order}</TableCell>
                        <TableCell>
                          <Chip
                            label={item.is_active ? "Đang dùng" : "Ẩn"}
                            color={item.is_active ? "success" : "default"}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={0.5} justifyContent="center">
                            <IconButton
                              size="small"
                              onClick={() => openCategoryDialog(item)}
                              disabled={!canUpdateCategory}
                            >
                              <IconEdit size={18} />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => removeCategory(item.id)}
                              disabled={!canDeleteCategory}
                            >
                              <IconTrash size={18} />
                            </IconButton>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={categoryTotal}
              page={categoryPage}
              onPageChange={(_, newPage) => setCategoryPage(newPage)}
              rowsPerPage={categoryPageSize}
              onRowsPerPageChange={(e) => {
                setCategoryPageSize(parseInt(e.target.value, 10));
                setCategoryPage(0);
              }}
              rowsPerPageOptions={[5, 10, 25, 50]}
              labelRowsPerPage="Số dòng:"
            />
          </CardContent>
        </Card>

        <Card variant="outlined">
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h5" fontWeight={700}>
                Mặt hàng
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => openProductDialog()}
                disabled={!canCreateProduct}
              >
                Thêm mặt hàng
              </Button>
            </Stack>
            <Box mb={2} maxWidth={400}>
              <TextField
                fullWidth
                placeholder="Tìm mặt hàng..."
                value={productSearch}
                onChange={(e) => {
                  setProductSearch(e.target.value);
                  setProductPage(0);
                }}
              />
            </Box>
            <TableContainer>
              <Table sx={tableSx}>
                <TableHead>
                  <TableRow>
                    <TableCell>Ảnh</TableCell>
                    <TableCell>Tên món</TableCell>
                    <TableCell>Loại</TableCell>
                    <TableCell>Giá</TableCell>
                    <TableCell>Trạng thái</TableCell>
                    <TableCell>Thao tác</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {productsLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <CircularProgress size={28} />
                      </TableCell>
                    </TableRow>
                  ) : products.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        Không có dữ liệu
                      </TableCell>
                    </TableRow>
                  ) : (
                    products.map((item) => (
                      <TableRow key={item.id} hover>
                        <TableCell>
                          <Box
                            sx={{
                              width: 48,
                              height: 48,
                              borderRadius: 1,
                              overflow: "hidden",
                              bgcolor: "action.hover",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              mx: "auto",
                            }}
                          >
                            {item.image_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={item.image_url}
                                alt={item.name}
                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                              />
                            ) : (
                              <Typography variant="caption" color="text.secondary">
                                —
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell sx={{ textAlign: "left" }}>
                          <Typography fontWeight={600}>{item.name}</Typography>
                          {item.description && (
                            <Typography variant="caption" color="text.secondary" noWrap display="block">
                              {item.description}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>{item.category_name || "Chưa phân loại"}</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: "primary.main" }}>
                          {Number(item.price || 0).toLocaleString("vi-VN")} đ
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={item.is_available ? "Sẵn sàng" : "Hết món"}
                            color={item.is_available ? "success" : "warning"}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={0.5} justifyContent="center">
                            <IconButton
                              size="small"
                              onClick={() => openProductDialog(item)}
                              disabled={!canUpdateProduct}
                            >
                              <IconEdit size={18} />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => removeProduct(item.id)}
                              disabled={!canDeleteProduct}
                            >
                              <IconTrash size={18} />
                            </IconButton>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={productTotal}
              page={productPage}
              onPageChange={(_, newPage) => setProductPage(newPage)}
              rowsPerPage={productPageSize}
              onRowsPerPageChange={(e) => {
                setProductPageSize(parseInt(e.target.value, 10));
                setProductPage(0);
              }}
              rowsPerPageOptions={[5, 10, 25, 50]}
              labelRowsPerPage="Số dòng:"
            />
          </CardContent>
        </Card>
      </Stack>

      <Dialog open={categoryDialog.open} onClose={closeCategoryDialog} fullWidth maxWidth="sm">
        <DialogTitle>
          {categoryDialog.item ? "Cập nhật loại mặt hàng" : "Thêm loại mặt hàng"}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField
              label="Tên loại"
              value={categoryForm.name}
              onChange={(e) => setCategoryForm((prev) => ({ ...prev, name: e.target.value }))}
              fullWidth
            />
            <TextField
              label="Mô tả"
              value={categoryForm.description}
              onChange={(e) =>
                setCategoryForm((prev) => ({ ...prev, description: e.target.value }))
              }
              fullWidth
              multiline
              rows={3}
            />
            <TextField
              label="Thứ tự"
              type="number"
              value={categoryForm.sort_order}
              onChange={(e) =>
                setCategoryForm((prev) => ({ ...prev, sort_order: Number(e.target.value) }))
              }
              fullWidth
            />
            <FormControlLabel
              control={
                <Switch
                  checked={categoryForm.is_active}
                  onChange={(e) =>
                    setCategoryForm((prev) => ({ ...prev, is_active: e.target.checked }))
                  }
                />
              }
              label="Đang sử dụng"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeCategoryDialog}>Huỷ</Button>
          <Button variant="contained" onClick={saveCategory}>
            Lưu
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={productDialog.open} onClose={closeProductDialog} fullWidth maxWidth="sm">
        <DialogTitle>{productDialog.item ? "Cập nhật mặt hàng" : "Thêm mặt hàng"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField
              select
              label="Loại mặt hàng"
              value={productForm.category_id}
              onChange={(e) =>
                setProductForm((prev) => ({ ...prev, category_id: e.target.value }))
              }
              fullWidth
            >
              <MenuItem value="">Chưa phân loại</MenuItem>
              {categoryOptions.map((item) => (
                <MenuItem key={item.id} value={item.id}>
                  {item.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Tên mặt hàng"
              value={productForm.name}
              onChange={(e) => setProductForm((prev) => ({ ...prev, name: e.target.value }))}
              fullWidth
            />
            <TextField
              label="Mô tả"
              value={productForm.description}
              onChange={(e) =>
                setProductForm((prev) => ({ ...prev, description: e.target.value }))
              }
              fullWidth
              multiline
              rows={3}
            />
            <TextField
              label="Giá tiền"
              type="number"
              value={productForm.price}
              onChange={(e) => setProductForm((prev) => ({ ...prev, price: e.target.value }))}
              fullWidth
            />
            <TextField
              label="Thứ tự"
              type="number"
              value={productForm.sort_order}
              onChange={(e) =>
                setProductForm((prev) => ({ ...prev, sort_order: Number(e.target.value) }))
              }
              fullWidth
            />
            <Button variant="outlined" component="label">
              Chọn ảnh
              <input
                hidden
                type="file"
                accept="image/*"
                onChange={(e) =>
                  setProductForm((prev) => ({
                    ...prev,
                    image_file: e.target.files?.[0] || null,
                  }))
                }
              />
            </Button>
            {productForm.image_file && (
              <Typography variant="body2">{productForm.image_file.name}</Typography>
            )}
            <Divider />
            <FormControlLabel
              control={
                <Switch
                  checked={productForm.is_available}
                  onChange={(e) =>
                    setProductForm((prev) => ({ ...prev, is_available: e.target.checked }))
                  }
                />
              }
              label="Có thể đặt món"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeProductDialog}>Huỷ</Button>
          <Button variant="contained" onClick={saveProduct}>
            Lưu
          </Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
}
