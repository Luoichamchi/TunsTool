"use client";
import { useState, useEffect } from "react";

/**
 * Hook phát hiện mobile:
 * 1. Capacitor native (không phải web) → isMobile = true
 * 2. PWA standalone mode (cài trên home screen) → isMobile = true
 * 3. [DEBUG] Window width < 768px → isMobile = true (tạm thời để debug)
 * 4. Còn lại (web browser) → isMobile = false
 *
 * TODO: Bỏ check width khi không cần debug nữa
 */
export default function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      // Check 1: Capacitor native platform
      let isNative = false;
      import("@capacitor/core")
        .then(({ Capacitor }) => {
          if (Capacitor.getPlatform() !== "web") {
            isNative = true;
            setIsMobile(true);
          }
        })
        .catch(() => {});

      if (isNative) return;

      // Check 2: PWA standalone mode (cài trên home screen)
      const isStandalone =
        window.navigator.standalone === true ||
        window.matchMedia("(display-mode: standalone)").matches;

      // Check 3: [DEBUG] Window width nhỏ → coi là mobile để debug
      const isSmallScreen = window.innerWidth < 768;

      setIsMobile(isStandalone || isSmallScreen);
    };

    checkMobile();

    // Lắng nghe resize để cập nhật khi co/giãn trình duyệt
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return isMobile;
}
