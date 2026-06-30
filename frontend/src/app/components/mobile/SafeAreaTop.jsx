"use client";

import { useEffect } from "react";
import useIsMobile from "@/app/utils/hooks/useIsMobile";
import { useTheme } from "@mui/material/styles";

/**
 * Component xử lý safe area cho Dynamic Island / notch / camera.
 *
 * Cách hoạt động:
 * - Set CSS variable --safe-area-bg trên <html> để global CSS dùng
 * - Thêm class "mobile-app" lên <html> để kích hoạt CSS rules
 * - global.css dùng body::before (position:fixed) làm overlay + body padding-top làm spacer
 * - body::before nằm ngoài mọi React component nên position:fixed luôn hoạt động
 */
export default function SafeAreaTop() {
  const isMobile = useIsMobile();
  const theme = useTheme();

  useEffect(() => {
    const html = document.documentElement;

    if (isMobile) {
      const bgColor =
        theme.palette.mode === "dark"
          ? theme.palette.background.default
          : "#F3F8FB";

      html.classList.add("mobile-app");
      html.style.setProperty("--safe-area-bg", bgColor);
    } else {
      html.classList.remove("mobile-app");
      html.style.removeProperty("--safe-area-bg");
    }

    return () => {
      html.classList.remove("mobile-app");
      html.style.removeProperty("--safe-area-bg");
    };
  }, [isMobile, theme.palette.mode, theme.palette.background.default]);

  return null; // Không render gì — toàn bộ xử lý qua CSS
}
