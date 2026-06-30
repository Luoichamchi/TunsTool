"use client";

import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import { useTenant } from "@/app/context/TenantContext";
import { isBareHostWithoutTenantSubdomain } from "@/app/utils/tenantHostname";
import NotFoundPage from "@/app/not-found";

/**
 * Domain / localhost: bắt buộc subdomain tenant trên URL, không có → 404.
 * IP: không chặn (luồng nhập mã tổ chức).
 */
export default function TenantAccessGate({ children }) {
  const { isLoading, tenantResolveFailed } = useTenant();

  const bareHostBlocked =
    typeof window !== "undefined" &&
    isBareHostWithoutTenantSubdomain(window.location.hostname);

  if (bareHostBlocked || tenantResolveFailed) {
    return <NotFoundPage />;
  }

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="40vh">
        <CircularProgress />
      </Box>
    );
  }

  return children;
}
