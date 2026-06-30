"use client";
import { useEffect } from "react";

/**
 * Gỡ bỏ mọi Service Worker đã đăng ký (kể cả các bản cũ còn sót lại).
 *
 * Base admin động không dùng offline caching vì dễ phục vụ nội dung cũ.
 * `public/sw.js` là kill-switch tự huỷ; component này đảm bảo không còn SW
 * nào kiểm soát trang.
 */
export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => registration.unregister());
    });
  }, []);

  return null;
}
