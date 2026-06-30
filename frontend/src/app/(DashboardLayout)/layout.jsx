"use client";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import { styled, useTheme } from "@mui/material/styles";
import React, { useContext } from "react";
import Header from "./layout/vertical/header/Header";
import Sidebar from "./layout/vertical/sidebar/Sidebar";
import Customizer from "./layout/shared/customizer/Customizer";
import Navigation from "./layout/horizontal/navbar/Navigation";
import HorizontalHeader from "./layout/horizontal/header/Header";
import { CustomizerContext } from "@/app/context/ClientCustomizerContext/customizerContext";
import config from "@/utils/config";
import Typography from "@mui/material/Typography";
import MobileBottomNav from "./layout/shared/MobileBottomNav";
import MobilePullToRefresh from "@/app/components/mobile/MobilePullToRefresh";
import useIsMobile from "@/app/utils/hooks/useIsMobile";

const MainWrapper = styled("div")(() => ({
  display: "flex",
  minHeight: "100dvh",
  width: "100%",
}));

const PageWrapper = styled("div")(() => ({
  display: "flex",
  flexGrow: 1,
  flexDirection: "column",
  zIndex: 1,
  width: "100%",
  minWidth: 0,
  maxWidth: "100%",
  backgroundColor: "transparent",
}));

const Footer = styled("footer")(({ theme }) => ({
  width: "100%",
  background: theme.palette.background.paper,
  borderTop: `1px solid ${theme.palette.divider}`,
  padding: "16px 0",
  textAlign: "center",
  position: "sticky",
  bottom: 0,
  zIndex: 1000,
}));

export default function RootLayout({ children }) {
  const { activeLayout, isLayout, activeMode, isCollapse } =
    useContext(CustomizerContext);
  const theme = useTheme();
  const MiniSidebarWidth = config.miniSidebarWidth;
  const isMobile = useIsMobile();

  return (
    <MainWrapper
      className={activeMode === "dark" ? "darkbg mainwrapper" : "mainwrapper"}
      sx={{
        ...(isMobile && {
          height: "100dvh",
          overflow: "visible",
        }),
      }}
    >
      {/* ------------------------------------------- */}
      {/* Sidebar */}
      {/* ------------------------------------------- */}

      {activeLayout === "horizontal" ? "" : <Sidebar />}

      {/* ------------------------------------------- */}
      {/* Main Wrapper */}
      {/* ------------------------------------------- */}
      <PageWrapper
        className="page-wrapper"
        sx={{
          ...(isCollapse === "mini-sidebar" && {
            [theme.breakpoints.up("lg")]: {
              ml: `${MiniSidebarWidth}px`,
            },
          }),
          ...(isMobile && {
            overflow: "visible",
            height: "100%",
          }),
        }}
      >
        {/* ------------------------------------------- */}
        {/* Header */}
        {/* ------------------------------------------- */}
        {activeLayout === "horizontal" ? <HorizontalHeader /> : <Header />}
        {/* PageContent */}
        {activeLayout === "horizontal" ? <Navigation /> : ""}
        <Container
          sx={{
            pt: "15px",
            px: 0,
            paddingLeft: "15px !important",
            paddingRight: "15px !important",
            width: "100%",
            minWidth: 0,
            maxWidth: isLayout === "boxed" ? "lg" : "100%!important",
            pb: isMobile ? "calc(50px + env(safe-area-inset-bottom))" : 0,
            backgroundColor:
              theme.palette.mode === "dark"
                ? theme.palette.background.default
                : "#F3F8FB",
            // Mobile (Capacitor): fill remaining height and scroll only here
            ...(isMobile && {
              flexGrow: 1, // ✅ chỉ giữ cái này
            }),
          }}
        >
          {/* ------------------------------------------- */}
          {/* PageContent */}
          {/* ------------------------------------------- */}

          <Box
            sx={{
              minHeight: isMobile ? "auto" : "calc(100dvh - 100px)",
              width: "100%",
              maxWidth: "100%",
              minWidth: 0,
            }}
          >
            {children}
          </Box>

          {/* ------------------------------------------- */}
          {/* End Page */}
          {/* ------------------------------------------- */}

          {/* ------------------------------------------- */}
          {/* Footer */}
          {/* ------------------------------------------- */}
        </Container>
        <Footer sx={{ display: isMobile ? "none" : "block" }}>
          <Typography
            variant="body2"
            color="text.secondary"
            style={{
              fontSize: "12px",
              textAlign: "center",
            }}
          >
            Copyright © {new Date().getFullYear()}{" "}
            <span style={{ color: "#008000", fontWeight: "bold" }}>
              TunsTool
            </span>
            . All rights reserved.
          </Typography>
        </Footer>
        <MobileBottomNav />
        <MobilePullToRefresh />
        <Customizer />
      </PageWrapper>
    </MainWrapper>
  );
}
