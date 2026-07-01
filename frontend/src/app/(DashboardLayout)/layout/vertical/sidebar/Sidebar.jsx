import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import SidebarItems from "./SidebarItems";
import SidebarFooter from "./SidebarFooter";
import Scrollbar from "@/app/components/custom-scroll/Scrollbar";
import { useContext, useEffect } from "react";
import { CustomizerContext } from "@/app/context/ClientCustomizerContext/customizerContext";
import config from "@/utils/config";
import { getPageBackground } from "../../pageBackground";

const sidebarPaperSx = (theme, { mobile = false } = {}) => ({
  backgroundColor: getPageBackground(theme),
  borderRight: "none",
  ...(mobile
    ? { boxShadow: theme.shadows[8] }
    : { boxShadow: "none" }),
});

const Sidebar = () => {
  const lgUp = useMediaQuery((theme) => theme.breakpoints.down("lg"));
  const {
    isCollapse,
    isSidebarHover,
    setIsSidebarHover,
    isMobileSidebar,
    setIsMobileSidebar,
  } = useContext(CustomizerContext);
  const MiniSidebarWidth = config.miniSidebarWidth;
  const SidebarWidth = config.sidebarWidth;

  const theme = useTheme();
  const toggleWidth =
    isCollapse == "mini-sidebar" && !isSidebarHover
      ? MiniSidebarWidth
      : SidebarWidth;

  const onHoverEnter = () => {
    if (isCollapse == "mini-sidebar") {
      setIsSidebarHover(true);
    }
  };

  const onHoverLeave = () => {
    setIsSidebarHover(false);
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("customizer_collapse", isCollapse);
    }
  }, [isCollapse]);

  return (
    <>
      {!lgUp ? (
        <Box
          sx={{
            zIndex: 100,
            width: toggleWidth,
            flexShrink: 0,
            ...(isCollapse == "mini-sidebar" && {
              position: "absolute",
            }),
          }}
        >
          {/* ------------------------------------------- */}
          {/* Sidebar for desktop */}
          {/* ------------------------------------------- */}
          <Drawer
            anchor="left"
            open
            onMouseEnter={onHoverEnter}
            onMouseLeave={onHoverLeave}
            variant="permanent"
            slotProps={{
              paper: {
                sx: {
                  transition: theme.transitions.create("width", {
                    duration: theme.transitions.duration.shortest,
                  }),
                  width: toggleWidth,
                  boxSizing: "border-box",
                  ...sidebarPaperSx(theme),
                },
              },
            }}
          >
            {/* ------------------------------------------- */}
            {/* Sidebar Box */}
            {/* ------------------------------------------- */}
            <Box
              sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {/* ------------------------------------------- */}
              {/* Logo */}
              {/* ------------------------------------------- */}
              <Scrollbar sx={{ flex: 1, minHeight: 0 }}>
                <SidebarItems />
              </Scrollbar>
              <SidebarFooter />
            </Box>
          </Drawer>
        </Box>
      ) : (
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
                ...sidebarPaperSx(theme, { mobile: true }),
              },
            },
          }}
        >
          {/* ------------------------------------------- */}
          {/* Logo */}
          {/* ------------------------------------------- */}
          <Box
            sx={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Scrollbar sx={{ flex: 1, minHeight: 0 }}>
              <SidebarItems />
            </Scrollbar>
            <SidebarFooter
              onNavigate={() => setIsMobileSidebar(false)}
            />
          </Box>
        </Drawer>
      )}
    </>
  );
};

export default Sidebar;
