import { parse } from "tldts";

const RESERVED_SUBDOMAINS = new Set(["www", "api"]);

/** Hostname là local/IP — không dùng subdomain tenant. */
export function isIpHostname(hostname) {
  if (!hostname) return false;
  if (hostname === "localhost") return true;
  if (/^(?:\d{1,3}\.){3}\d{1,3}$/.test(hostname)) return true;
  if (hostname.includes(":")) return true;
  return false;
}

/** Có thể redirect sang {tenant}.{domain} (dev localhost hoặc domain thật). */
export function canUseTenantSubdomain(hostname) {
  if (!hostname || isIpHostname(hostname)) return false;
  if (hostname === "localhost" || hostname.endsWith(".localhost")) return true;
  const parsed = parse(hostname, { allowPrivateDomains: true });
  return Boolean(parsed.domain);
}

export function getBaseDomain(hostname) {
  if (!hostname) return "";
  if (hostname === "localhost" || hostname.endsWith(".localhost")) {
    return "localhost";
  }
  const parsed = parse(hostname, { allowPrivateDomains: true });
  return parsed.domain || hostname;
}

/** Subdomain tenant từ hostname hiện tại (bỏ www/api). */
export function getHostnameSubdomain(hostname) {
  if (!hostname) return "";

  if (hostname.endsWith(".localhost")) {
    const sub = hostname.replace(".localhost", "");
    return sub && !RESERVED_SUBDOMAINS.has(sub.toLowerCase())
      ? sub.toLowerCase()
      : "";
  }

  const parsed = parse(hostname, { allowPrivateDomains: true });
  const sub = (parsed.subdomain || "").toLowerCase();
  if (!sub || RESERVED_SUBDOMAINS.has(sub)) return "";
  return sub;
}

/** Domain / localhost bắt buộc có subdomain tenant trên URL (không áp dụng IP). */
export function requiresTenantSubdomainInUrl(hostname) {
  return canUseTenantSubdomain(hostname);
}

/** Truy cập domain/localhost nhưng không có subdomain tenant trên hostname. */
export function isBareHostWithoutTenantSubdomain(hostname) {
  if (!requiresTenantSubdomainInUrl(hostname)) return false;
  return !getHostnameSubdomain(hostname);
}

/**
 * Chuyển sang origin có subdomain tenant. Trả về true nếu đã redirect.
 * Không làm gì khi truy cập bằng IP hoặc đã đúng subdomain.
 */
export function redirectToTenantSubdomain(tenantSubdomain, path = "/") {
  if (typeof window === "undefined") return false;

  const { hostname, protocol, port } = window.location;
  if (!canUseTenantSubdomain(hostname)) return false;

  const normalized = (tenantSubdomain || "").trim().toLowerCase();
  if (!normalized) return false;

  const currentSub = getHostnameSubdomain(hostname);
  if (currentSub === normalized) return false;

  const base = getBaseDomain(hostname);
  const portSuffix = port ? `:${port}` : "";
  const safePath = path.startsWith("/") ? path : `/${path}`;

  window.location.href = `${protocol}//${normalized}.${base}${portSuffix}${safePath}`;
  return true;
}
