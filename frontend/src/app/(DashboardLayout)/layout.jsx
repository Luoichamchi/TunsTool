"use client";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import IconButton from "@mui/material/IconButton";
import { styled, useTheme } from "@mui/material/styles";
import React, { useContext } from "react";
import Sidebar from "./layout/vertical/sidebar/Sidebar";
import Header, { HEADER_LOGO_SIZE } from "./layout/vertical/header/Header";
import Customizer from "./layout/shared/customizer/Customizer";
import Navigation from "./layout/horizontal/navbar/Navigation";
import HorizontalHeader from "./layout/horizontal/header/Header";
import { CustomizerContext } from "@/app/context/ClientCustomizerContext/customizerContext";
import config from "@/utils/config";
import Typography from "@mui/material/Typography";
import MobileBottomNav from "./layout/shared/MobileBottomNav";
import MobilePullToRefresh from "@/app/components/mobile/MobilePullToRefresh";
import useIsMobile from "@/app/utils/hooks/useIsMobile";
import useMediaQuery from "@mui/material/useMediaQuery";
import { IconMenu2 } from "@tabler/icons-react";
import { getPageBackground } from "./layout/pageBackground";
import {
  LAYOUT_PADDING_LEFT,
  LAYOUT_PADDING_RIGHT,
} from "./layout/pageSpacing";

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
  background: getPageBackground(theme),
  borderTop: "none",
  padding: "16px 0",
  textAlign: "center",
  position: "sticky",
  bottom: 0,
  zIndex: 1000,
}));

export default function RootLayout({ children }) {
  const { activeLayout, isLayout, activeMode, isCollapse, setIsMobileSidebar } =
    useContext(CustomizerContext);
  const theme = useTheme();
  const MiniSidebarWidth = config.miniSidebarWidth;
  const isMobile = useIsMobile();
  const lgDown = useMediaQuery((theme) => theme.breakpoints.down("lg"));
  const showTabletSidebarToggle =
    activeLayout !== "horizontal" && lgDown && !isMobile;

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
        {/* PageContent */}
        {activeLayout === "horizontal" ? <HorizontalHeader /> : <Header />}
        {activeLayout === "horizontal" ? <Navigation /> : null}
        {showTabletSidebarToggle ? (
          <IconButton
            aria-label="menu"
            onClick={() => setIsMobileSidebar(!isMobileSidebar)}
            sx={{
              position: "fixed",
              top: 12,
              left: 12,
              zIndex: 1200,
              bgcolor: "background.paper",
              border: 1,
              borderColor: "divider",
              boxShadow: 1,
            }}
          >
            <IconMenu2 size={20} />
          </IconButton>
        ) : null}
        <Container
          sx={{
            pt: "15px",
            px: 0,
            paddingLeft: `${LAYOUT_PADDING_LEFT}px !important`,
            paddingRight: `${LAYOUT_PADDING_RIGHT}px !important`,
            width: "100%",
            minWidth: 0,
            maxWidth: isLayout === "boxed" ? "lg" : "100%!important",
            pb: isMobile ? "calc(50px + env(safe-area-inset-bottom))" : 0,
            backgroundColor: getPageBackground(theme),
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
              minHeight: isMobile
                ? "auto"
                : `calc(100dvh - ${HEADER_LOGO_SIZE + 80}px)`,
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
