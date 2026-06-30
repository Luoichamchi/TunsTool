"use client";
import { useEffect } from "react";

/**
 * Component đăng ký Service Worker cho PWA.
 * Chỉ đăng ký trong production và khi browser hỗ trợ.
 */
export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("SW registered:", registration.scope);
        })
        .catch((error) => {
          console.log("SW registration failed:", error);
        });
    }
  }, []);

  return null;
}
