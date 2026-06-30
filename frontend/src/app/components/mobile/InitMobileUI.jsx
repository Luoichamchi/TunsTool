"use client";

import { useEffect } from "react";
import { useContext } from "react";
import { CustomizerContext } from "@/app/context/ClientCustomizerContext/customizerContext";

export default function InitMobileUI() {
  const { activeMode } = useContext(CustomizerContext);

  useEffect(() => {
    // === Capacitor native: SystemBars + EdgeToEdge ===
    const initCapacitor = async () => {
      try {
        const { Capacitor, SystemBars, SystemBarsStyle } =
          await import("@capacitor/core");
        if (Capacitor.getPlatform() !== "web") {
          activeMode === "dark"
            ? await SystemBars.setStyle({ style: SystemBarsStyle.Dark })
            : await SystemBars.setStyle({ style: SystemBarsStyle.Light });

          const { EdgeToEdge } =
            await import("@capawesome/capacitor-android-edge-to-edge-support");
          activeMode === "dark"
            ? await EdgeToEdge.setBackgroundColor({ color: "#000000" })
            : await EdgeToEdge.setBackgroundColor({ color: "#FFFFFF" });
        }
      } catch {
        // Capacitor không available — bỏ qua
      }
    };
    initCapacitor();

    // === PWA + Web: cập nhật meta theme-color theo dark/light mode ===
    const themeColor = activeMode === "dark" ? "#1e2024" : "#ffffff";

    // Cập nhật body background — dùng cho các vùng không có content
    document.body.style.backgroundColor = themeColor;

    // Cập nhật color-scheme trên html — Chrome Android dùng để đổi màu navigation bar hệ thống
    document.documentElement.style.colorScheme =
      activeMode === "dark" ? "dark" : "light";

    // Cập nhật meta theme-color — ảnh hưởng status bar iOS + navigation bar Android
    document
      .querySelectorAll('meta[name="theme-color"]')
      .forEach((tag) => tag.remove());

    const metaTag = document.createElement("meta");
    metaTag.name = "theme-color";
    metaTag.content = themeColor;
    document.head.appendChild(metaTag);
  }, [activeMode]);

  return null;
}
