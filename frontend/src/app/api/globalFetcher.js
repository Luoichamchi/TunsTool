import { refreshTokenIfNeeded } from "./refreshTokenHelper";
import { appendTenantCodeToUrl } from "@/app/utils/stationTargetTenant";
// SWR fetcher function

const getBaseUrl = () => {
  // Browser: luôn gọi cùng origin (frontend proxy → backend qua [...path]/route.js)
  if (typeof window !== "undefined") {
    return "";
  }
  // Server Next.js: gọi trực tiếp backend trong Docker network
  return process.env.API_BASE_URL || "";
};

const buildUrl = (url) => {
  if (url.startsWith("/api/")) {
    return getBaseUrl() + url;
  }
  return url;
};

function getAuthHeaders(options = {}) {
  let token = null;
  if (typeof window !== "undefined") {
    token = localStorage.getItem("access_token");
  }
  return token
    ? { ...options.headers, Authorization: `Bearer ${token}` }
    : { ...options.headers };
}

async function parseErrorResponse(res, fallbackMessage) {
  let errorMessage = fallbackMessage;
  try {
    const errorData = await res.json();
    if (errorData && errorData.detail) {
      errorMessage = errorData.detail;
    }
  } catch (e) {
    errorMessage = fallbackMessage;
  }
  const error = new Error(errorMessage);
  error.status = res.status;
  throw error;
}

const getFetcher = (url, options = {}) => {
  let token = null;
  if (options.token) token = options.token;
  else if (typeof window !== "undefined")
    token = localStorage.getItem("access_token");
  if (!token) return Promise.resolve(null);
  const doFetch = async () => {
    const res = await fetch(buildUrl(appendTenantCodeToUrl(url, options)), {
      method: "GET",
      headers: {
        browserrefreshed: "false",
        ...getAuthHeaders({ ...options, token }),
      },
      ...options,
    });
    if (res.status === 401) {
      const refreshed = await refreshTokenIfNeeded({ message: "401" }, doFetch);
      if (refreshed && typeof refreshed !== "string") return refreshed;
      if (typeof refreshed === "string") {
        token = refreshed;
        return doFetch();
      }
      return null;
    }
    if (!res.ok) throw new Error("Failed to fetch the data");
    return res.json();
  };
  return doFetch();
};

const postFetcher = (url, arg, options = {}) => {
  let token = null;
  if (options.token) token = options.token;
  else if (typeof window !== "undefined")
    token = localStorage.getItem("access_token");
  if (!token) return Promise.resolve(null);
  const doFetch = async () => {
    const isFormData = arg instanceof FormData;
      const res = await fetch(buildUrl(appendTenantCodeToUrl(url, options)), {
      method: "POST",
      headers: {
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        ...getAuthHeaders({ ...options, token }),
      },
      body: isFormData ? arg : JSON.stringify(arg),
      ...options,
    });
    if (res.status === 401) {
      const refreshed = await refreshTokenIfNeeded({ message: "401" }, doFetch);
      if (refreshed && typeof refreshed !== "string") return refreshed;
      if (typeof refreshed === "string") {
        token = refreshed;
        return doFetch();
      }
      return null;
    }
    if (!res.ok) {
      let errorMessage = "Failed to post data";
      try {
        const errorData = await res.json();
        if (errorData && errorData.detail) {
          errorMessage = errorData.detail;
        }
      } catch (e) {
        throw new Error("Failed to post data");
      }
      throw new Error(errorMessage);
    }
    return res.json();
  };
  return doFetch();
};

// Fetcher không kiểm tra access_token, dùng cho login/refresh
const rawPostFetcher = async (url, arg, options = {}) => {
  const res = await fetch(buildUrl(url), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    body: JSON.stringify(arg),
    credentials: "include",
    ...options,
  });
  if (!res.ok) {
    await parseErrorResponse(res, "Failed to post data");
  }
  return res.json();
};

const rawGetFetcher = async (url, options = {}) => {
  const res = await fetch(buildUrl(url), {
    method: "GET",
    credentials: "include",
    ...options,
  });
  if (!res.ok) {
    await parseErrorResponse(res, "Failed to fetch data");
  }
  return res.json();
};

const publicGetFetcher = async (url, options = {}) => {
  const res = await fetch(buildUrl(url), {
    method: "GET",
    ...options,
  });
  if (!res.ok) {
    await parseErrorResponse(res, "Failed to fetch public data");
  }
  return res.json();
};

const publicPostFetcher = async (url, arg, options = {}) => {
  const fallbackMessage = "Failed to post public data";
  const isFormData = arg instanceof FormData;
  const res = await fetch(buildUrl(url), {
    method: "POST",
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(options.headers || {}),
    },
    body: isFormData ? arg : JSON.stringify(arg),
    ...options,
  });
  if (!res.ok) {
    await parseErrorResponse(res, fallbackMessage);
  }
  return res.json();
};

const putFetcher = (url, arg, options = {}) => {
  let token = null;
  if (options.token) token = options.token;
  else if (typeof window !== "undefined")
    token = localStorage.getItem("access_token");
  if (!token) return Promise.resolve(null);
  const doFetch = async () => {
    const res = await fetch(buildUrl(appendTenantCodeToUrl(url, options)), {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders({ ...options, token }),
      },
      body: JSON.stringify(arg),
      ...options,
    });
    if (res.status === 401) {
      const refreshed = await refreshTokenIfNeeded({ message: "401" }, doFetch);
      if (refreshed && typeof refreshed !== "string") return refreshed;
      if (typeof refreshed === "string") {
        token = refreshed;
        return doFetch();
      }
      return null;
    }
    if (!res.ok) {
      let errorMessage = "Failed to updated data";
      try {
        const errorData = await res.json();
        if (errorData && errorData.detail) {
          errorMessage = errorData.detail;
        }
      } catch (e) {
        throw new Error("Failed to updated data");
      }
      throw new Error(errorMessage);
    }
    return res.json();
  };
  return doFetch();
};

const patchFetcher = (url, arg, options = {}) => {
  let token = null;
  if (options.token) token = options.token;
  else if (typeof window !== "undefined")
    token = localStorage.getItem("access_token");
  if (!token) return Promise.resolve(null);
  const doFetch = async () => {
    const res = await fetch(buildUrl(appendTenantCodeToUrl(url, options)), {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders({ ...options, token }),
      },
      body: JSON.stringify(arg),
      ...options,
    });
    if (res.status === 401) {
      const refreshed = await refreshTokenIfNeeded({ message: "401" }, doFetch);
      if (refreshed && typeof refreshed !== "string") return refreshed;
      if (typeof refreshed === "string") {
        token = refreshed;
        return doFetch();
      }
      return null;
    }
    if (!res.ok) throw new Error("Failed to updated data");
    return res.json();
  };
  return doFetch();
};

const deleteFetcher = (url, arg, options = {}) => {
  let token = null;
  if (options.token) token = options.token;
  else if (typeof window !== "undefined")
    token = localStorage.getItem("access_token");
  if (!token) return Promise.resolve(null);
  const doFetch = async () => {
    const res = await fetch(buildUrl(appendTenantCodeToUrl(url, options)), {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders({ ...options, token }),
      },
      body: JSON.stringify(arg),
      ...options,
    });
    if (res.status === 401) {
      const refreshed = await refreshTokenIfNeeded({ message: "401" }, doFetch);
      if (refreshed && typeof refreshed !== "string") return refreshed;
      if (typeof refreshed === "string") {
        token = refreshed;
        return doFetch();
      }
      return null;
    }
    if (!res.ok) throw new Error("Failed to delete data");
    // Nếu status là 204 thì không có body, trả về null
    if (res.status === 204) return null;
    return res.json();
  };
  return doFetch();
};

export {
  getFetcher,
  postFetcher,
  putFetcher,
  deleteFetcher,
  patchFetcher,
  rawPostFetcher,
  rawGetFetcher,
  publicGetFetcher,
  publicPostFetcher,
};
