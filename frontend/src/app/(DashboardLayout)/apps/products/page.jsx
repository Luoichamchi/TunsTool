"use client";

import React, { useMemo, useState } from "react";
import useSWR from "swr";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  Grid,
  MenuItem,
  Stack,
  Switch,
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

  const categoriesUrl = `${api.GET_PRODUCT_CATEGORY_LIST}?page=1&page_size=100&search=${encodeURIComponent(categorySearch)}`;
  const productsUrl = `${api.GET_PRODUCT_LIST}?page=1&page_size=100&search=${encodeURIComponent(productSearch)}`;
  const { data: categoriesData, mutate: mutateCategories } = useSWR(categoriesUrl, getFetcher);
  const { data: productsData, mutate: mutateProducts } = useSWR(productsUrl, getFetcher);

  const categories = useMemo(() => categoriesData?.data || [], [categoriesData]);
  const products = useMemo(() => productsData?.data || [], [productsData]);

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
            <TextField
              fullWidth
              placeholder="Tìm loại mặt hàng..."
              value={categorySearch}
              onChange={(e) => setCategorySearch(e.target.value)}
              sx={{ mb: 2 }}
            />
            <Grid container spacing={2}>
              {categories.map((item) => (
                <Grid key={item.id} size={{ xs: 12, md: 6, lg: 4 }}>
                  <Card variant="outlined">
                    <CardContent>
                      <Stack direction="row" justifyContent="space-between" alignItems="start">
                        <Box>
                          <Typography fontWeight={700}>{item.name}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {item.description || "Không có mô tả"}
                          </Typography>
                        </Box>
                        <Chip
                          label={item.is_active ? "Đang dùng" : "Ẩn"}
                          color={item.is_active ? "success" : "default"}
                          size="small"
                        />
                      </Stack>
                      <Stack direction="row" spacing={1} mt={2}>
                        <Button
                          size="small"
                          startIcon={<IconEdit size={16} />}
                          onClick={() => openCategoryDialog(item)}
                          disabled={!canUpdateCategory}
                        >
                          Sửa
                        </Button>
                        <Button
                          size="small"
                          color="error"
                          startIcon={<IconTrash size={16} />}
                          onClick={() => removeCategory(item.id)}
                          disabled={!canDeleteCategory}
                        >
                          Xoá
                        </Button>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
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
            <TextField
              fullWidth
              placeholder="Tìm mặt hàng..."
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              sx={{ mb: 2 }}
            />
            <Grid container spacing={2}>
              {products.map((item) => (
                <Grid key={item.id} size={{ xs: 12, md: 6 }}>
                  <Card variant="outlined">
                    <CardContent>
                      <Stack direction="row" spacing={2}>
                        <Box
                          sx={{
                            width: 96,
                            height: 96,
                            borderRadius: 2,
                            overflow: "hidden",
                            bgcolor: "action.hover",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
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
                            <Typography variant="caption">No image</Typography>
                          )}
                        </Box>
                        <Box flex={1}>
                          <Stack direction="row" justifyContent="space-between" alignItems="start">
                            <Box>
                              <Typography fontWeight={700}>{item.name}</Typography>
                              <Typography variant="body2" color="text.secondary">
                                {item.category_name || "Chưa phân loại"}
                              </Typography>
                            </Box>
                            <Chip
                              label={item.is_available ? "Sẵn sàng" : "Hết món"}
                              color={item.is_available ? "success" : "warning"}
                              size="small"
                            />
                          </Stack>
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            {item.description || "Không có mô tả"}
                          </Typography>
                          <Typography variant="h6" color="primary.main" sx={{ mt: 1 }}>
                            {Number(item.price || 0).toLocaleString("vi-VN")} đ
                          </Typography>
                          <Stack direction="row" spacing={1} mt={2}>
                            <Button
                              size="small"
                              startIcon={<IconEdit size={16} />}
                              onClick={() => openProductDialog(item)}
                              disabled={!canUpdateProduct}
                            >
                              Sửa
                            </Button>
                            <Button
                              size="small"
                              color="error"
                              startIcon={<IconTrash size={16} />}
                              onClick={() => removeProduct(item.id)}
                              disabled={!canDeleteProduct}
                            >
                              Xoá
                            </Button>
                          </Stack>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
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
