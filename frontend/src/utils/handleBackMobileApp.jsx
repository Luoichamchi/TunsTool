"use client";

import { App } from "@capacitor/app";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function HandleBackMobileApp() {
  const router = useRouter();

  useEffect(() => {
    const listener = App.addListener("backButton", ({ canGoBack }) => {
      if (window.history.length > 1) {
        router.back();
      } else {
        App.exitApp();
      }
    });

    return () => {
      listener.remove();
    };
  }, [router]);

  return null;
}
