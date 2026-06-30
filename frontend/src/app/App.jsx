"use client";
import React, { useContext } from "react";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import RTL from "@/app/(DashboardLayout)/layout/shared/customizer/RTL";
import { ThemeSettings } from "@/utils/theme/Theme";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v14-appRouter";
import "@/utils/i18n";
import { CustomizerContext } from "@/app/context/ClientCustomizerContext/customizerContext";
import { UserDataProvider } from "./context/UserDataContext";
import { TenantProvider } from "./context/TenantContext";
import { TenantFilterProvider } from "./context/TenantFilterContext";
import TenantAccessGate from "@/app/components/shared/TenantAccessGate";
import HandleBackMobileApp from "@/app/components/mobile/HandleBackMobileApp";
import InitMobileUI from "@/app/components/mobile/InitMobileUI";
import IOSScrollLock from "@/app/components/mobile/IOSScrollLock";
import SafeAreaTop from "@/app/components/mobile/SafeAreaTop";
import NextTopLoader from "nextjs-toploader";
import { ToastContainer, Slide } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const MyApp = ({ children }) => {
  const theme = ThemeSettings();
  const { activeDir } = useContext(CustomizerContext);

  return (
    <>
      <AppRouterCacheProvider options={{ enableCssLayer: true }}>
        <ThemeProvider theme={theme}>
          <RTL direction={activeDir}>
            <CssBaseline />
            <NextTopLoader color="#5D87FF" />
            <HandleBackMobileApp />
            <InitMobileUI />
            <IOSScrollLock />
            <SafeAreaTop />
            <ToastContainer
              position="top-center"
              autoClose={2500}
              hideProgressBar
              newestOnTop
              closeOnClick
              pauseOnHover
              draggable
              transition={Slide}
            />
            <TenantProvider>
              <TenantAccessGate>
                <TenantFilterProvider>
                  <UserDataProvider>{children}</UserDataProvider>
                </TenantFilterProvider>
              </TenantAccessGate>
            </TenantProvider>
          </RTL>
        </ThemeProvider>
      </AppRouterCacheProvider>
    </>
  );
};

export default MyApp;

