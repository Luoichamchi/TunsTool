"use client";

import React, { useEffect, useState } from "react";
import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Box,
} from "@mui/material";
import { usePathname } from "next/navigation";
import useSWR from "swr";
import { getFetcher } from "@/app/api/globalFetcher";
import { useIsDefaultTenant } from "@/app/utils/auth/useIsDefaultTenant";
import { useTenantFilterActions } from "@/app/context/TenantFilterContext";
import {
  DEFAULT_TENANT_CODE,
  getFilterTenantCode,
  setFilterTenantCode,
} from "@/app/utils/stationTargetTenant";
import useIsMobile from "@/app/utils/hooks/useIsMobile";

/**
 * Filter tenant — chỉ hiện khi user login tenant default.
 * Chọn tenant → globalFetcher tự gắn ?tenant_code= cho API trạm.
 */
const HIDE_ON_PATHS = [
  "/systems/tenant-management",
];

export default function TenantFilterSelect({ onChange, size = "small", sx }) {
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const isDefaultTenant = useIsDefaultTenant();
  const { bumpFilterVersion } = useTenantFilterActions();
  const [value, setValue] = useState(DEFAULT_TENANT_CODE);

  const isHiddenRoute = HIDE_ON_PATHS.some((path) => pathname?.startsWith(path));

  const { data, isLoading } = useSWR(
    isDefaultTenant ? "/api/tenant/?page=1&page_size=100" : null,
    (url) => getFetcher(url, { skipTenantCode: true }),
    { revalidateOnFocus: false },
  );

  useEffect(() => {
    setValue(getFilterTenantCode());
  }, []);

  if (!isDefaultTenant || isHiddenRoute) return null;

  const tenants = data?.data || [];

  const handleChange = (e) => {
    const code = e.target.value;
    setValue(code);
    setFilterTenantCode(code);
    bumpFilterVersion();
    onChange?.(code);
  };

  const getTenantLabel = (code) => {
    const tenant = tenants.find((t) => t.tenant_code === code);
    if (tenant) return `${tenant.name} (${tenant.tenant_code})`;
    if (code === DEFAULT_TENANT_CODE) return "Default";
    return code;
  };

  return (
    <Box
      sx={{
        minWidth: isMobile ? 0 : { xs: 160, sm: 200 },
        width: isMobile ? "100%" : undefined,
        ...sx,
      }}
    >
      <FormControl fullWidth size={size}>
        {/* {!isMobile && (
          <InputLabel id="tenant-filter-label">Lọc theo tenant</InputLabel>
        )} */}
        <Select
          labelId="tenant-filter-label"
          // label={isMobile ? undefined : "Lọc theo tenant"}
          value={value}
          onChange={handleChange}
          disabled={isLoading && tenants.length === 0}
          displayEmpty={isMobile}
          renderValue={isMobile ? (code) => getTenantLabel(code) : undefined}
          inputProps={isMobile ? { "aria-label": "Lọc theo tenant" } : undefined}
          sx={
            isMobile
              ? {
                  "& .MuiSelect-select": {
                    py: 1,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  },
                }
              : undefined
          }
        >
          {tenants.length === 0 && (
            <MenuItem value={DEFAULT_TENANT_CODE}>Default</MenuItem>
          )}
          {tenants.map((t) => (
            <MenuItem key={t.tenant_code} value={t.tenant_code}>
              {t.name} ({t.tenant_code})
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
}
