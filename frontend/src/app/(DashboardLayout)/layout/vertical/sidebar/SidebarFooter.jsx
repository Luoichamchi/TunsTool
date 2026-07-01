import React, { useContext } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Box,
  Divider,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { IconSettings, IconUser } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";

import TenantFilterSelect from "@/app/components/shared/TenantFilterSelect";
import { CustomizerContext } from "@/app/context/ClientCustomizerContext/customizerContext";
import { useIsDefaultTenant } from "@/app/utils/auth/useIsDefaultTenant";

const PROFILE_HREF = "/apps/user-profile/profile";
const HIDE_TENANT_FILTER_PATHS = ["/systems/tenant-management"];

const itemSx = (theme, isBorderRadius, hideMenu) => ({
  whiteSpace: "nowrap",
  mb: "2px",
  py: "8px",
  px: "10px",
  borderRadius: `${isBorderRadius}px`,
  color: theme.palette.text.secondary,
  pl: hideMenu ? "10px" : "10px",
  "&:hover": {
    backgroundColor: theme.palette.primary.light,
    color: theme.palette.primary.main,
  },
  "&.Mui-selected": {
    color: "white",
    backgroundColor: theme.palette.primary.main,
    "&:hover": {
      backgroundColor: theme.palette.primary.main,
      color: "white",
    },
  },
});

function SidebarFooter({ onNavigate }) {
  const theme = useTheme();
  const pathname = usePathname();
  const { t } = useTranslation();
  const lgDown = useMediaQuery((theme) => theme.breakpoints.down("lg"));
  const { isBorderRadius, isSidebarHover, isCollapse, setCustomizerOpen } =
    useContext(CustomizerContext);

  const lgUp = useMediaQuery((theme) => theme.breakpoints.up("lg"));
  const hideMenu = lgUp ? isCollapse === "mini-sidebar" && !isSidebarHover : false;
  const isDefaultTenant = useIsDefaultTenant();
  const showTenantFilter =
    isDefaultTenant &&
    !HIDE_TENANT_FILTER_PATHS.some((path) => pathname?.startsWith(path));
  const isProfileActive =
    pathname === PROFILE_HREF || pathname.startsWith(`${PROFILE_HREF}/`);
  const listItemSx = itemSx(theme, isBorderRadius, hideMenu);

  const handleSettingsClick = () => {
    setCustomizerOpen(true);
    if (lgDown && onNavigate) onNavigate();
  };

  return (
    <Box sx={{ px: 3, pb: 2, pt: 1, mt: "auto", flexShrink: 0 }}>
      {!hideMenu && showTenantFilter ? (
        <Box sx={{ mb: 1.5 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.75 }}>
            Lọc theo tenant
          </Typography>
          <TenantFilterSelect size="small" sx={{ width: "100%" }} />
        </Box>
      ) : null}
      <Divider sx={{ mb: 1 }} />
      <List disablePadding>
        <List component="li" disablePadding>
          <Link href={PROFILE_HREF}>
            <ListItemButton
              selected={isProfileActive}
              onClick={lgDown ? onNavigate : undefined}
              sx={listItemSx}
            >
              <ListItemIcon sx={{ minWidth: "36px", p: "3px 0", color: "inherit" }}>
                <IconUser stroke={1.5} size="1.3rem" />
              </ListItemIcon>
              <ListItemText>{hideMenu ? "" : t("Profile")}</ListItemText>
            </ListItemButton>
          </Link>
        </List>
        <List component="li" disablePadding>
          <ListItemButton onClick={handleSettingsClick} sx={listItemSx}>
            <ListItemIcon sx={{ minWidth: "36px", p: "3px 0", color: "inherit" }}>
              <IconSettings stroke={1.5} size="1.3rem" />
            </ListItemIcon>
            <ListItemText>{hideMenu ? "" : t("Settings")}</ListItemText>
          </ListItemButton>
        </List>
      </List>
    </Box>
  );
}

export default SidebarFooter;
