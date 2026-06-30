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
        const { Capacitor, SystemBars, SystemBarsStyle } = await import(
          "@capacitor/core"
        );
        if (Capacitor.getPlatform() !== "web") {
          activeMode === "dark"
            ? await SystemBars.setStyle({ style: SystemBarsStyle.Dark })
            : await SystemBars.setStyle({ style: SystemBarsStyle.Light });

          const { EdgeToEdge } = await import(
            "@capawesome/capacitor-android-edge-to-edge-support"
          );
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
    let metaTag = document.querySelector('meta[name="theme-color"]');
    if (metaTag) {
      metaTag.setAttribute("content", themeColor);
    } else {
      metaTag = document.createElement("meta");
      metaTag.name = "theme-color";
      metaTag.content = themeColor;
      document.head.appendChild(metaTag);
    }
  }, [activeMode]);

  return null;
}
