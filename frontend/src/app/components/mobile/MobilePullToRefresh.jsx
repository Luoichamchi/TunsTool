"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Box, CircularProgress, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import useIsMobile from "@/app/utils/hooks/useIsMobile";
import { triggerAppRefresh } from "@/app/utils/pullToRefresh";

const PULL_THRESHOLD = 72;
const MAX_PULL = 110;

export default function MobilePullToRefresh() {
  const isMobile = useIsMobile();
  const router = useRouter();
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);

  const startYRef = useRef(0);
  const pullingRef = useRef(false);
  const refreshingRef = useRef(false);
  const pullDistanceRef = useRef(0);

  const handleRefresh = useCallback(async () => {
    if (refreshingRef.current) return;

    refreshingRef.current = true;
    setRefreshing(true);
    setPullDistance(PULL_THRESHOLD);
    pullDistanceRef.current = PULL_THRESHOLD;

    try {
      await triggerAppRefresh(router);
    } finally {
      window.setTimeout(() => {
        refreshingRef.current = false;
        setRefreshing(false);
        setPullDistance(0);
        pullDistanceRef.current = 0;
      }, 350);
    }
  }, [router]);

  useEffect(() => {
    if (!isMobile) return;

    const onTouchStart = (e) => {
      if (window.scrollY > 0 || refreshingRef.current) return;
      startYRef.current = e.touches[0].clientY;
      pullingRef.current = true;
      setIsPulling(true);
    };

    const onTouchMove = (e) => {
      if (!pullingRef.current || refreshingRef.current) return;

      if (window.scrollY > 0) {
        pullingRef.current = false;
        pullDistanceRef.current = 0;
        setPullDistance(0);
        setIsPulling(false);
        return;
      }

      const delta = e.touches[0].clientY - startYRef.current;
      if (delta <= 0) {
        pullingRef.current = false;
        pullDistanceRef.current = 0;
        setPullDistance(0);
        setIsPulling(false);
        return;
      }

      const distance = Math.min(delta * 0.45, MAX_PULL);
      pullDistanceRef.current = distance;
      setPullDistance(distance);

      if (distance > 8) {
        e.preventDefault();
      }
    };

    const onTouchEnd = () => {
      if (!pullingRef.current || refreshingRef.current) {
        pullingRef.current = false;
        setIsPulling(false);
        return;
      }

      pullingRef.current = false;
      setIsPulling(false);

      if (pullDistanceRef.current >= PULL_THRESHOLD) {
        handleRefresh();
        return;
      }

      pullDistanceRef.current = 0;
      setPullDistance(0);
    };

    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchmove", onTouchMove, { passive: false });
    document.addEventListener("touchend", onTouchEnd);
    document.addEventListener("touchcancel", onTouchEnd);

    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);
      document.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [isMobile, handleRefresh]);

  if (!isMobile) return null;

  const visible = refreshing || pullDistance > 12;
  const indicatorHeight = refreshing
    ? 52
    : Math.max(0, Math.min(pullDistance, MAX_PULL));

  return (
    <Box
      aria-hidden={!visible}
      sx={{
        position: "fixed",
        top: "env(safe-area-inset-top, 0px)",
        left: 0,
        right: 0,
        height: indicatorHeight,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 1,
        zIndex: 1300,
        pointerEvents: "none",
        opacity: visible ? 1 : 0,
        bgcolor: "background.paper",
        borderBottom: visible ? 1 : 0,
        borderColor: "divider",
        transition: isPulling
          ? "none"
          : "height 0.25s ease, opacity 0.2s ease",
        overflow: "hidden",
      }}
    >
      <CircularProgress
        size={22}
        color="primary"
        variant={refreshing ? "indeterminate" : "determinate"}
        value={
          refreshing
            ? 0
            : Math.min(100, (pullDistance / PULL_THRESHOLD) * 100)
        }
      />
      <Typography variant="caption" color="text.secondary">
        {refreshing
          ? "Đang tải lại..."
          : pullDistance >= PULL_THRESHOLD
            ? "Thả để tải lại"
            : "Vuốt xuống để tải lại"}
      </Typography>
    </Box>
  );
}
