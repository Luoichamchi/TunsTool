import { useContext } from "react";
import { UserDataContext } from "@/app/context/UserDataContext";

const DEFAULT_TENANT_CODE = "default";

/** Chỉ user đăng nhập tenant default mới quản lý registry tenant. */
export function useIsDefaultTenant() {
  const { user } = useContext(UserDataContext);
  return (user?.tenant_code || "").toLowerCase() === DEFAULT_TENANT_CODE;
}

export { DEFAULT_TENANT_CODE };
