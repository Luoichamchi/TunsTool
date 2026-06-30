"use client";

import { useEffect } from "react";
import { PULL_REFRESH_EVENT } from "@/app/utils/pullToRefresh";

/** Đăng ký callback khi user vuốt xuống để tải lại (mobile pull-to-refresh). */
export default function usePullToRefreshListener(callback) {
  useEffect(() => {
    if (!callback) return;

    const handler = () => callback();

    window.addEventListener(PULL_REFRESH_EVENT, handler);
    return () => window.removeEventListener(PULL_REFRESH_EVENT, handler);
  }, [callback]);
}
