import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Drawer from "@mui/material/Drawer";
import useMediaQuery from "@mui/material/useMediaQuery";
import useIsMobile from "@/app/utils/hooks/useIsMobile";
import NavListing from "./NavListing/NavListing";
import Logo from "../../shared/logo/Logo";
import { CustomizerContext } from "@/app/context/ClientCustomizerContext/customizerContext";
import { useContext } from "react";
import config from "@/utils/config";
import SidebarItems from "../../vertical/sidebar/SidebarItems";
import SidebarFooter from "../../vertical/sidebar/SidebarFooter";
import Scrollbar from "@/app/components/custom-scroll/Scrollbar";
import { useTheme } from "@mui/material";
import { getPageBackground } from "../../pageBackground";
const Navigation = () => {
  const theme = useTheme();
  const isMobile = useIsMobile();
  const lgUp = useMediaQuery((theme) => theme.breakpoints.up("lg"));
  const { activeMode, isLayout, isMobileSidebar, setIsMobileSidebar } =
    useContext(CustomizerContext);
  const SidebarWidth = config.sidebarWidth;

  if (lgUp) {
    return (
      <Box
        sx={{
          py: 2,
          borderBottom: "1px solid rgba(0,0,0,0.05)",
        }}
      >
        {/* ------------------------------------------- */}
        {/* Sidebar for desktop */}
        {/* ------------------------------------------- */}
        <Container
          sx={{
            maxWidth: isLayout === "boxed" ? "lg" : "100%!important",
          }}
        >
          <NavListing />
        </Container>
      </Box>
    );
  }

  return (
    <Drawer
      anchor="left"
      open={isMobileSidebar}
      onClose={() => setIsMobileSidebar(false)}
      variant="temporary"
      slotProps={{
        paper: {
          sx: {
            width: SidebarWidth,
            border: "0 !important",
            boxShadow: theme.shadows[8],
            backgroundColor: getPageBackground(theme),
          },
        },
      }}
    >
      {/* ------------------------------------------- */}
      {/* Logo */}
      {/* ------------------------------------------- */}
      <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
        <Box sx={{ px: 2, flexShrink: 0 }}>
          <Logo />
        </Box>
        <Scrollbar sx={{ flex: 1, minHeight: 0 }}>
          <SidebarItems />
        </Scrollbar>
        <SidebarFooter onNavigate={() => setIsMobileSidebar(false)} />
      </Box>
    </Drawer>
  );
};

export default Navigation;
