"use client";

import { useEffect, useRef } from "react";

/**
 * iOS PWA: Chặn scroll nội dung phía sau khi MUI Dialog/Modal mở.
 *
 * Cách duy nhất hoạt động 100% trên iOS:
 * Khi dialog mở → set html { position: fixed; top: -scrollY }
 * Khi dialog đóng → restore position và scroll position
 */
export default function IOSScrollLock() {
  const scrollYRef = useRef(0);
  const isLockedRef = useRef(false);

  useEffect(() => {
    const lockScroll = () => {
      if (isLockedRef.current) return;
      scrollYRef.current = window.scrollY;
      document.documentElement.style.position = "fixed";
      document.documentElement.style.top = `-${scrollYRef.current}px`;
      document.documentElement.style.width = "100%";
      document.documentElement.style.overflow = "hidden";
      isLockedRef.current = true;
    };

    const unlockScroll = () => {
      if (!isLockedRef.current) return;
      document.documentElement.style.position = "";
      document.documentElement.style.top = "";
      document.documentElement.style.width = "";
      document.documentElement.style.overflow = "";
      window.scrollTo(0, scrollYRef.current);
      isLockedRef.current = false;
    };

    // Polling: check mỗi 200ms xem có dialog nào đang mở không
    const interval = setInterval(() => {
      const hasDialog = document.querySelector(".MuiDialog-root") !== null;
      if (hasDialog && !isLockedRef.current) {
        lockScroll();
      } else if (!hasDialog && isLockedRef.current) {
        unlockScroll();
      }
    }, 200);

    return () => {
      clearInterval(interval);
      unlockScroll();
    };
  }, []);

  return null;
}
