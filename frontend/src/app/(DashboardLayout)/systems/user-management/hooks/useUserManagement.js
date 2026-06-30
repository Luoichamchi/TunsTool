import { useState, useEffect, useRef, useCallback } from "react";
import { getFetcher, deleteFetcher } from "@/app/api/globalFetcher";
import { useTenantFilterVersion } from "@/app/context/TenantFilterContext";
import { toast } from "react-toastify";

const fetchUsers = async (page, pageSize, search) => {
  const url = `/api/users?page=${page + 1}&page_size=${pageSize}&search=${search || ""}`;
  const data = await getFetcher(url);
  if (!data)
    throw new Error("Lỗi khi tải danh sách người dùng hoặc chưa đăng nhập");
  return data;
};

const deleteUser = async (id) => {
  const url = `/api/users/${id}`;
  const data = await deleteFetcher(url);
  if (!data) throw new Error("Xoá người dùng thất bại hoặc chưa đăng nhập");
  return data;
};

export function useUserManagement({
  reload,
  canUpdate,
  canDelete,
  externalSearch,
  currentUserId,
  isRoot = false,
} = {}) {
  const filterVersion = useTenantFilterVersion();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [pageSize] = useState(10);
  const [rowCount, setRowCount] = useState(0);
  // Nếu search được quản lý từ bên ngoài (page.jsx) thì dùng externalSearch
  const [internalSearch, setInternalSearch] = useState("");
  const search = externalSearch !== undefined ? externalSearch : internalSearch;
  const setSearch = externalSearch !== undefined ? () => {} : setInternalSearch;
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Menu state
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuRow, setMenuRow] = useState(null);

  // Confirm delete dialog
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  // Edit dialog
  const [formDialog, setFormDialog] = useState({ open: false, user: null });

  // Change password dialog
  const [passwordDialog, setPasswordDialog] = useState({
    open: false,
    user: null,
    isAdminMode: false,
  });

  // Reset password dialog (chỉ root)
  const [resetDialog, setResetDialog] = useState({ open: false, user: null });

  const openMenu = Boolean(anchorEl);

  // ---------- Fetch ----------
  // Dùng useCallback để loadData luôn có đúng page/debouncedSearch mới nhất
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchUsers(page, pageSize, debouncedSearch);
      setRows(data.data || []);
      setRowCount(data.total || 0);
    } catch (e) {
      setRows([]);
      setRowCount(0);
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, debouncedSearch]); // eslint-disable-line react-hooks/exhaustive-deps

  // Giữ ref loadData để gọi từ handlers mà không cần deps
  const loadDataRef = useRef(loadData);
  useEffect(() => {
    loadDataRef.current = loadData;
  }, [loadData]);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(handler);
  }, [search]);

  // Reset về trang 0 khi search hoặc đổi tenant thay đổi
  useEffect(() => {
    setPage(0);
  }, [debouncedSearch, filterVersion]);

  // Load data khi page/search/reload/tenant thay đổi
  useEffect(() => {
    loadData();
  }, [loadData, reload, filterVersion]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---------- Menu ----------
  const handleMenuClick = (event, row) => {
    setAnchorEl(event.currentTarget);
    setMenuRow(row);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuRow(null);
  };

  // ---------- Edit ----------
  const handleEdit = (user) => {
    setFormDialog({ open: true, user });
  };

  const handleMenuEdit = () => {
    handleMenuClose();
    handleEdit(menuRow);
  };

  const handleFormClose = (success, message) => {
    setFormDialog({ open: false, user: null });
    if (message) toast.success(message);
    if (success) loadDataRef.current();
  };

  // ---------- Change password ----------
  const handleChangePassword = (user, isAdminMode) => {
    setPasswordDialog({ open: true, user, isAdminMode });
  };

  const handleMenuChangePassword = () => {
    const user = menuRow;
    handleMenuClose();
    if (!user) return;
    const isAdminMode = isRoot && user.id !== currentUserId;
    handleChangePassword(user, isAdminMode);
  };

  const handlePasswordDialogClose = () => {
    setPasswordDialog({ open: false, user: null, isAdminMode: false });
  };

  // ---------- Reset password (root only) ----------
  const handleMenuResetPassword = () => {
    const user = menuRow;
    handleMenuClose();
    if (!user) return;
    setResetDialog({ open: true, user });
  };

  const handleResetDialogClose = () => {
    setResetDialog({ open: false, user: null });
  };

  const sameUserId = (a, b) => String(a) === String(b);

  // ---------- Delete ----------
  const handleMenuDelete = () => {
    handleMenuClose();
    setDeleteId(menuRow?.id);
    setConfirmOpen(true);
  };

  const handleDelete = async () => {
    try {
      await deleteUser(deleteId);
      toast.success("Xoá người dùng thành công");
      setDeleteId(null);
      setConfirmOpen(false);
      loadDataRef.current();
    } catch (e) {
      toast.error(e.message);
    }
  };

  return {
    // Data
    rows,
    loading,
    rowCount,
    page,
    setPage,
    pageSize,
    search,
    setSearch,

    // Menu
    anchorEl,
    menuRow,
    openMenu,
    handleMenuClick,
    handleMenuClose,
    handleMenuEdit,
    handleMenuDelete,

    // Confirm delete
    confirmOpen,
    setConfirmOpen,
    handleDelete,

    // Edit dialog
    formDialog,
    handleEdit,
    handleFormClose,

    // Change password
    passwordDialog,
    handleMenuChangePassword,
    handlePasswordDialogClose,
    canChangePassword: (row) => {
      if (!row) return false;
      if (row.roles?.includes("root") && !sameUserId(row.id, currentUserId))
        return false;
      if (isRoot) return true;
      return sameUserId(row.id, currentUserId);
    },

    // Reset password
    resetDialog,
    handleMenuResetPassword,
    handleResetDialogClose,
    canResetPassword: (row) => {
      if (!isRoot || !row) return false;
      if (sameUserId(row.id, currentUserId)) return false;
      if (row.roles?.includes("root")) return false;
      return true;
    },

    // Permissions
    canUpdate,
    canDelete,
  };
}
