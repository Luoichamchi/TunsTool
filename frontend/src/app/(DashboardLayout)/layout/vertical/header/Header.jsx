import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Toolbar from "@mui/material/Toolbar";
import useMediaQuery from "@mui/material/useMediaQuery";
import { styled } from "@mui/material/styles";
import useIsMobile from "@/app/utils/hooks/useIsMobile";
import { useIsDefaultTenant } from "@/app/utils/auth/useIsDefaultTenant";
import { usePathname } from "next/navigation";
import config from "@/utils/config";
import { useContext, useEffect } from "react";
import Image from "next/image";
// ...existing code...
import { IconMenu2, IconMoon, IconSun } from "@tabler/icons-react";
import Profile from "./Profile";
import Search from "./Search";
import Language from "./Language";
import TenantFilterSelect from "@/app/components/shared/TenantFilterSelect";
import CustomizerHeaderButton from "@/app/(DashboardLayout)/layout/shared/customizer/CustomizerHeaderButton";
import { CustomizerContext } from "@/app/context/ClientCustomizerContext/customizerContext";

const HIDE_TENANT_FILTER_PATHS = ["/systems/tenant-management"];

const Header = () => {
  const lgUp = useMediaQuery((theme) => theme.breakpoints.up("lg"));
  const isMobile = useIsMobile();
  const pathname = usePathname();
  const isDefaultTenant = useIsDefaultTenant();
  const showTenantFilter =
    isDefaultTenant &&
    !HIDE_TENANT_FILTER_PATHS.some((path) => pathname?.startsWith(path));
  const TopbarHeight = config.topbarHeight;

  // drawer
  const {
    activeMode,
    setActiveMode,
    setIsCollapse,
    isCollapse,
    isMobileSidebar,
    setIsMobileSidebar,
  } = useContext(CustomizerContext);

  const brandLogo = "/icons/favicon.png";
  const logoSize = isMobile ? 40 : 50;

  const AppBarStyled = styled(AppBar)(({ theme }) => ({
    boxShadow: "none",
    background: theme.palette.background.paper,
    justifyContent: "center",
    backdropFilter: "blur(4px)",
    [theme.breakpoints.up("lg")]: {
      minHeight: TopbarHeight,
    },
  }));
  const ToolbarStyled = styled(Toolbar)(({ theme }) => ({
    width: "100%",
    color: theme.palette.text.secondary,
  }));

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("customizer_collapse", isCollapse);
    }
  }, [isCollapse]);

  return (
    // ...existing code...
    <AppBarStyled
      position="sticky"
      color="default"
      sx={{
        display: "flex",
        borderBottom:
          activeMode === "dark" ? "1px solid #333" : "1px solid #e0e0e0",
        boxShadow:
          activeMode === "dark"
            ? "0 2px 8px 0 rgba(0,0,0,0.12), 0 1.5px 4px 0 rgba(0,0,0,0.10)"
            : "0 2px 8px 0 rgba(0,0,0,0.06), 0 1.5px 4px 0 rgba(0,0,0,0.03)",
        zIndex: 1100,
        backgroundColor:
          activeMode === "dark"
            ? "rgba(30, 32, 36, 0.85)"
            : undefined,
        backdropFilter: "blur(4px)",
        ...(isMobile && {
          minHeight: "auto",
        }),
      }}
    >
      <ToolbarStyled
        sx={{
          ...(isMobile && {
            minHeight: 48,
            py: 0.75,
            px: 1,
            gap: 0.5,
            overflow: "visible",
          }),
        }}
      >
        {/* Toggle Button Sidebar — ẩn trên mobile (dùng bottom nav) */}
        {!isMobile && (
          <IconButton
            color="inherit"
            aria-label="menu"
            onClick={() => {
              if (lgUp) {
                isCollapse === "full-sidebar"
                  ? setIsCollapse("mini-sidebar")
                  : setIsCollapse("full-sidebar");
              } else {
                setIsMobileSidebar(!isMobileSidebar);
              }
            }}
          >
            <IconMenu2 size="20" />
          </IconButton>
        )}

        {/* Search + Tenant filter */}
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          sx={{
            ml: isMobile ? 0 : 1,
            minWidth: 0,
            flex: isMobile && showTenantFilter ? 1 : undefined,
            overflow: "visible",
          }}
        >
          {!isMobile && <Search />}
          {showTenantFilter && (
            <TenantFilterSelect
              sx={isMobile ? { flex: 1, width: "100%" } : undefined}
            />
          )}
        </Stack>
        {/* {lgUp ? (
              <>
                <Navigation />
              </>
            ) : null} */}

        <Box sx={{ flexGrow: 1 }} />
        <Stack
          spacing={isMobile ? 0.25 : 0.5}
          direction="row"
          sx={{
            alignItems: "center",
            flexShrink: 0,
            ml: "auto",
          }}
        >
          <Image
            src={brandLogo}
            priority
            alt="TunsTool"
            width={logoSize}
            height={logoSize}
            style={{
              marginRight: isMobile ? "4px" : "10px",
              objectFit: "contain",
            }}
          />
          <CustomizerHeaderButton size={isMobile ? "medium" : "large"} />
          { <Language size={isMobile ? "small" : "large"}/>}
          {/* <Cart /> */}

          <IconButton size={isMobile ? "small" : "large"} color="inherit">
            {activeMode === "light" ? (
              <IconMoon
                size={isMobile ? 20 : 21}
                stroke="1.5"
                onClick={() => setActiveMode("dark")}
              />
            ) : (
              <IconSun
                size={isMobile ? 20 : 21}
                stroke="1.5"
                onClick={() => setActiveMode("light")}
              />
            )}
          </IconButton>

          {/* <Notifications /> */}
          {/* {lgDown ? <MobileRightSidebar /> : null} */}
          <Profile avatarSize={isMobile ? 28 : 35} />
        </Stack>
      </ToolbarStyled>
    </AppBarStyled>
    // ...existing code...
  );
};

export default Header;
