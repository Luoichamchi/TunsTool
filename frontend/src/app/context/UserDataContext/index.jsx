"use client";
import React, { createContext, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { rawPostFetcher } from "@/app/api/globalFetcher";

export const UserDataContext = createContext(undefined);

const PUBLIC_PATHS = ["/login", "/tenant", "/auth/auth1/login", "/order"];

export const UserDataProvider = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  useEffect(() => {
    const storedToken =
      typeof window !== "undefined"
        ? localStorage.getItem("access_token")
        : null;
    const storedUser =
      typeof window !== "undefined" ? localStorage.getItem("user") : null;

    if (storedToken) {
      setToken(storedToken);
    }
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    const isPublic = PUBLIC_PATHS.some((p) => pathname?.startsWith(p));
    if (!storedToken && !isPublic) {
      router.replace("/login");
    }
  }, [pathname, router]);

  const login = async (username, password, tenantCode) => {
    const code = (tenantCode || localStorage.getItem("tenant_code") || "")
      .trim()
      .toLowerCase();
    if (!code) {
      return { success: false, message: "Chưa chọn mã tổ chức" };
    }

    try {
      const res = await rawPostFetcher("/api/auth/login", {
        username,
        password,
        tenant_code: code,
      });
      if (res && res.access_token) {
        setToken(res.access_token);
        localStorage.setItem("access_token", res.access_token);
        localStorage.setItem("tenant_code", code);
        const userInfo = { ...res.user, tenant_code: code };
        localStorage.setItem("user", JSON.stringify(userInfo));
        setUser(userInfo);
        return { success: true };
      }
      throw new Error("Login failed");
    } catch (err) {
      setError(err.message || "Login error");
      setToken(null);
      setUser(null);
      localStorage.removeItem("access_token");
      localStorage.removeItem("user");
      return { success: false, message: err.message };
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  return (
    <UserDataContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        error,
      }}
    >
      {children}
    </UserDataContext.Provider>
  );
};
