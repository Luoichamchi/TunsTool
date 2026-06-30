const FILTER_KEY = "filter_tenant_code";
const LOGIN_TENANT_KEY = "tenant_code";
export const DEFAULT_TENANT_CODE = "default";

/** Mã tenant đang chọn trên filter (bao gồm cả "default"). */
export function getFilterTenantCode() {
  if (typeof window === "undefined") return DEFAULT_TENANT_CODE;
  return (localStorage.getItem(FILTER_KEY) || DEFAULT_TENANT_CODE).toLowerCase();
}

export function setFilterTenantCode(code) {
  if (typeof window === "undefined") return;
  const normalized = (code || DEFAULT_TENANT_CODE).trim().toLowerCase();
  localStorage.setItem(FILTER_KEY, normalized);
}

/** Tenant gửi lên API (?tenant_code=) — null nghĩa là dùng JWT tenant. */
export function getFilterTenantCodeForApi() {
  if (typeof window === "undefined") return null;
  const loginTenant = (localStorage.getItem(LOGIN_TENANT_KEY) || "").toLowerCase();
  if (loginTenant !== DEFAULT_TENANT_CODE) return null;

  const selected = getFilterTenantCode();
  if (!selected || selected === DEFAULT_TENANT_CODE) return null;
  return selected;
}

export function appendTenantCodeToUrl(url, options = {}) {
  if (options.skipTenantCode) return url;
  if (url.includes("tenant_code=")) return url;

  const target = options.tenantCode
    ? String(options.tenantCode).trim().toLowerCase()
    : getFilterTenantCodeForApi();

  if (!target) return url;

  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}tenant_code=${encodeURIComponent(target)}`;
}
