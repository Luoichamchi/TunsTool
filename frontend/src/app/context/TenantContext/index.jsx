"use client";
import React, { createContext, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  getHostnameSubdomain,
  canUseTenantSubdomain,
  isIpHostname,
} from "@/app/utils/tenantHostname";

const TenantContext = createContext();

export const useTenant = () => {
  const context = React.useContext(TenantContext);
  if (!context) {
    throw new Error("useTenant must be used within a TenantProvider");
  }
  return context;
};

const PUBLIC_PATHS = ["/login", "/tenant", "/auth/auth1/login"];

export const TenantProvider = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [tenant, setTenant] = useState(null);
  const [tenantCode, setTenantCodeState] = useState("");
  const [hasSubdomain, setHasSubdomain] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [tenantResolveFailed, setTenantResolveFailed] = useState(false);

  const setTenantCode = (code) => {
    const normalized = (code || "").trim().toLowerCase();
    setTenantCodeState(normalized);
    if (typeof window !== "undefined" && normalized) {
      localStorage.setItem("tenant_code", normalized);
    }
  };

  const clearTenantCode = () => {
    setTenantCodeState("");
    if (typeof window !== "undefined") {
      localStorage.removeItem("tenant_code");
    }
  };

  useEffect(() => {
    let cancelled = false;

    async function resolveTenant() {
      try {
        const hostname = window.location.hostname;
        const hostSubdomain = getHostnameSubdomain(hostname);

        if (hostSubdomain && canUseTenantSubdomain(hostname)) {
          const res = await fetch(
            `/api/tenant/resolve/${encodeURIComponent(hostSubdomain)}`,
          );
          if (res.ok) {
            const data = await res.json();
            if (!cancelled) {
              setTenantCodeState(data.tenant_code);
              setHasSubdomain(true);
              setTenantResolveFailed(false);
              localStorage.setItem("tenant_code", data.tenant_code);
            }
            return;
          }
          if (!cancelled) {
            setTenantResolveFailed(true);
          }
          return;
        }

        if (!cancelled) {
          setTenantResolveFailed(false);
          const savedCode = localStorage.getItem("tenant_code");
          if (savedCode && isIpHostname(hostname)) {
            setTenantCodeState(savedCode);
          }
        }
      } catch (error) {
        console.error("Error detecting tenant:", error);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    resolveTenant();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (isLoading || hasSubdomain) return;
    if (typeof window === "undefined" || !isIpHostname(window.location.hostname)) {
      return;
    }
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("access_token")
        : null;
    const isPublic = PUBLIC_PATHS.some((p) => pathname?.startsWith(p));
    if (token || isPublic) return;

    router.replace("/login");
  }, [isLoading, hasSubdomain, pathname, router]);

  const value = {
    tenant,
    tenantCode,
    hasSubdomain,
    isLoading,
    tenantResolveFailed,
    setTenant,
    setTenantCode,
    clearTenantCode,
  };

  return (
    <TenantContext.Provider value={value}>{children}</TenantContext.Provider>
  );
};
