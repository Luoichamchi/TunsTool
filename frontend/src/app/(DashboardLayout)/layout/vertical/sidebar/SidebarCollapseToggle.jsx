"use client";

import { useContext } from "react";
import { List, ListItemButton, ListItemIcon } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { IconLayoutSidebar } from "@tabler/icons-react";

import { CustomizerContext } from "@/app/context/ClientCustomizerContext/customizerContext";
import useIsMobile from "@/app/utils/hooks/useIsMobile";
import { getNavItemButtonSx, NAV_ITEM_ICON_SX } from "./sidebarNavItemSx";

export default function SidebarCollapseToggle() {
  const theme = useTheme();
  const isDesktop = useMediaQuery((t) => t.breakpoints.up("lg"));
  const isMobile = useIsMobile();
  const { isCollapse, isSidebarHover, isBorderRadius, setIsCollapse } =
    useContext(CustomizerContext);

  const hideMenu = isCollapse === "mini-sidebar" && !isSidebarHover;

  if (!isDesktop || isMobile) return null;

  const toggleSidebarCollapse = () => {
    setIsCollapse(
      isCollapse === "full-sidebar" ? "mini-sidebar" : "full-sidebar",
    );
  };

  return (
    <List component="li" disablePadding>
      <ListItemButton
        onClick={toggleSidebarCollapse}
        aria-label="Thu gọn sidebar"
        sx={getNavItemButtonSx(theme, { isBorderRadius, hideMenu })}
      >
        <ListItemIcon sx={NAV_ITEM_ICON_SX}>
          <IconLayoutSidebar stroke={1.5} size="1.3rem" />
        </ListItemIcon>
      </ListItemButton>
    </List>
  );
}
