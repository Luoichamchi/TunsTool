"use client";

import Box from "@mui/material/Box";

const MOBILE_ACCENT = "#008000";

/** Đường phân cách cong hai đầu. */
function CurvedDivider() {
  return (
    <Box
      component="svg"
      viewBox="0 0 320 12"
      sx={{ width: "100%", height: 12, mt: 2.5, display: "block" }}
      aria-hidden
    >
      <path
        d="M0 6 Q40 0 80 6 T160 6 T240 6 T320 6"
        fill="none"
        stroke={MOBILE_ACCENT}
        strokeWidth="1.5"
      />
    </Box>
  );
}

/**
 * Khung login mobile: card trắng viền xanh giữa màn hình.
 * Chỉ dùng trên mobile — desktop không gọi component này.
 */
export default function LoginMobileShell({ children }) {
  return (
    <Box
      sx={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "background.default",
        px: 2,
        py: 3,
        pt: "calc(env(safe-area-inset-top, 0px) + 16px)",
        pb: "calc(env(safe-area-inset-bottom, 0px) + 16px)",
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: 380,
          bgcolor: "#ffffff",
          borderRadius: "14px",
          border: `2px solid ${MOBILE_ACCENT}`,
          boxShadow: "0 8px 24px rgba(0, 0, 0, 0.08)",
          overflow: "hidden",
        }}
      >
        <Box sx={{ px: 3, pt: 3, pb: 0, textAlign: "center" }}>
          <Box
            component="img"
            src="/icons/logo-light.png"
            alt="TunsTool"
            sx={{
              width: "min(200px, 70%)",
              height: "auto",
              mx: "auto",
              display: "block",
            }}
          />
          <CurvedDivider />
        </Box>

        <Box sx={{ px: 3, pt: 1, pb: 3 }}>{children}</Box>
      </Box>
    </Box>
  );
}
