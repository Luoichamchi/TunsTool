"use client";
import React, { useState, useEffect, useContext } from "react";
import { useSearchParams } from "next/navigation";
import {
  Box,
  Typography,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Switch,
  Tabs,
  Tab,
  Stack,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import useIsMobile from "@/app/utils/hooks/useIsMobile";
import { getFetcher, postFetcher } from "@/app/api/globalFetcher";
import { toast } from "react-toastify";
import PermissionCard from "./mobile-view/PermissionCard";
import { UserDataContext } from "@/app/context/UserDataContext";
import { useTenantFilterVersion } from "@/app/context/TenantFilterContext";

export default function PermissionManagementPage() {
  const filterVersion = useTenantFilterVersion();
  const searchParams = useSearchParams();
  const roleId = searchParams.get("roleId");
  const theme = useTheme();
  const isMobile = useIsMobile();

  const [role, setRole] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [modules, setModules] = useState([]);
  const [tab, setTab] = useState(0);
  const [editPerms, setEditPerms] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user: currentUser } = useContext(UserDataContext);
  const currentUserRoles = currentUser?.roles || [];
  const isOwnRole =
    role?.name && currentUserRoles.includes(role.name);

  useEffect(() => {
    if (!roleId) return;
    setLoading(true);
    setTab(0);
    setRole(null);
    setPermissions([]);
    setModules([]);
    setEditPerms([]);
    Promise.all([
      getFetcher(`/api/rbac/roles/${roleId}`),
      getFetcher("/api/rbac/permissions"),
    ])
      .then(([role, permissions]) => {
        setRole(role);
        const moduleSet = new Set();
        permissions.forEach((p) => {
          const [mod] = p.name.split(".");
          moduleSet.add(mod);
        });
        const moduleList = Array.from(moduleSet).sort();
        setModules(moduleList);
        setPermissions(
          [...permissions].sort((a, b) => {
            const [modA, actA] = a.name.split(".");
            const [modB, actB] = b.name.split(".");
            const modCompare = modA.localeCompare(modB);
            if (modCompare !== 0) return modCompare;
            return actA.localeCompare(actB);
          }),
        );
        setEditPerms(role?.permissions ? [...role.permissions] : []);
      })
      .catch((e) => {
        toast.error(e.message);
      })
      .finally(() => setLoading(false));
  }, [roleId, filterVersion]);

  // Toggle quyền cho role
  const handleToggle = async (permissionId) => {
    if (loading || isOwnRole) return;
    setLoading(true);
    const module_id =
      permissions.find((p) => p.id === permissionId)?.module_id || 0;
    const hasPerm = editPerms.some(
      (p) => (p.permission_id || p.id) === permissionId,
    );
    let newPerms;
    try {
      if (hasPerm) {
        await postFetcher("/api/rbac/remove-permission", {
          role_id: Number(roleId),
          module_id: module_id,
          permission_id: permissionId,
        });
        newPerms = editPerms.filter(
          (p) => (p.permission_id || p.id) !== permissionId,
        );
        toast.success("Đã gỡ quyền thành công!");
      } else {
        await postFetcher("/api/rbac/assign-permission", {
          role_id: Number(roleId),
          module_id: module_id,
          permission_id: permissionId,
        });
        newPerms = [...editPerms, { permission_id: permissionId, module_id }];
        toast.success("Đã cấp quyền thành công!");
      }
      setEditPerms(newPerms);
    } catch (e) {
      toast.error(e?.response?.data?.detail || e.message);
    } finally {
      setLoading(false);
    }
  };

  // Lọc permissions theo module đang chọn
  const currentModulePerms = permissions.filter(
    (perm) => perm.name.split(".")[0] === modules[tab],
  );

  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 2,
        border: (theme) =>
          `1px solid ${
            theme.palette.mode === "dark" ? theme.palette.divider : "#e0e0e0"
          }`,
        bgcolor: "background.paper",
        width: "100%",
        maxWidth: "100%",
        minWidth: 0,
        boxSizing: "border-box",
      }}
    >
      <Typography
        variant="h4"
        fontWeight={700}
        color="primary.main"
        mb={isMobile ? 1 : 3}
      >
        Quản lý quyền cho vai trò
      </Typography>

      {loading && !role ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      ) : roleId && role ? (
        <>
          <Typography mb={2}>
            Vai trò: <b>{role.name}</b>
          </Typography>

          {isOwnRole && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Bạn không thể tự sửa quyền hạn của vai trò đang sử dụng.
            </Alert>
          )}

          {/* Tabs cho từng module */}
          <Box
            sx={{
              width: "100%",
              maxWidth: "100%",
              minWidth: 0,
              mb: 2,
            }}
          >
            <Tabs
              value={tab}
              onChange={(_, v) => setTab(v)}
              variant="scrollable"
              scrollButtons="auto"
              allowScrollButtonsMobile
              sx={{
                width: "100%",
                maxWidth: "100%",
                minWidth: 0,
                "& .MuiTabs-scroller": {
                  overflowX: "auto !important",
                  overflowY: "hidden",
                },
                "& .MuiTabs-flexContainer": {
                  flexWrap: "nowrap",
                },
                "& .MuiTab-root": {
                  textTransform: "none",
                  fontWeight: 500,
                  minWidth: "auto",
                  flexShrink: 0,
                  px: isMobile ? 1.5 : 2,
                  fontSize: isMobile ? "0.8rem" : undefined,
                },
              }}
            >
              {modules.map((mod) => (
                <Tab label={mod} key={mod} />
              ))}
            </Tabs>
          </Box>

          {/* ===== MOBILE VIEW ===== */}
          {isMobile ? (
            <PermissionCard
              permissions={currentModulePerms}
              editPerms={editPerms}
              loading={loading}
              onToggle={handleToggle}
              readOnly={isOwnRole}
            />
          ) : (
            /* ===== DESKTOP TABLE VIEW ===== */
            <TableContainer
              sx={{
                mt: 2,
                width: "100%",
                maxWidth: "100%",
                minWidth: 0,
              }}
            >
              <Table
                sx={{
                  width: "100%",
                  tableLayout: "fixed",
                  borderCollapse: "collapse",
                  border: (theme) =>
                    `1px solid ${
                      theme.palette.mode === "dark"
                        ? theme.palette.divider
                        : "#e0e0e0"
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
                size="small"
              >
                <TableHead>
                  <TableRow>
                    <TableCell
                      sx={{ fontWeight: 700, width: "8%" }}
                      align="center"
                    >
                      STT
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, width: "28%" }}>
                      Tên quyền
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, width: "44%" }}>
                      Mô tả
                    </TableCell>
                    <TableCell
                      sx={{ fontWeight: 700, width: "20%" }}
                      align="center"
                    >
                      Đang có?
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {currentModulePerms.map((perm, idx) => {
                    const checked = editPerms.some(
                      (rp) => (rp.permission_id || rp.id) === perm.id,
                    );
                    return (
                      <TableRow key={perm.id}>
                        <TableCell align="center">{idx + 1}</TableCell>
                        <TableCell
                          sx={{
                            wordBreak: "break-word",
                            whiteSpace: "normal",
                          }}
                        >
                          {perm.name}
                        </TableCell>
                        <TableCell
                          sx={{
                            wordBreak: "break-word",
                            whiteSpace: "normal",
                          }}
                        >
                          {perm.description || ""}
                        </TableCell>
                        <TableCell align="center">
                          <Switch
                            checked={checked}
                            onChange={() => handleToggle(perm.id)}
                            color={checked ? "success" : "default"}
                            disabled={loading || isOwnRole}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </>
      ) : (
        <Alert severity="error">
          Không tìm thấy vai trò hoặc thiếu roleId trên URL.
        </Alert>
      )}
</Box>
  );
}
