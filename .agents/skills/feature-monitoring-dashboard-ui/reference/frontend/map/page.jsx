"use client";
import dynamic from "next/dynamic";
import { CircularProgress, Box } from "@mui/material";

// Dynamic import với ssr: false — Leaflet và MQTT cần window (chỉ chạy trên client)
const MapContent = dynamic(() => import("./MapContent"), {
  ssr: false,
  loading: () => (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "calc(100vh - 120px)",
      }}
    >
      <CircularProgress />
    </Box>
  ),
});

const MapPage = () => {
  return <MapContent />;
};

export default MapPage;
