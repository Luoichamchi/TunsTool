"use client";
import React, { useState, useCallback, useContext, useMemo } from "react";
import { CustomizerContext } from "@/app/context/ClientCustomizerContext/customizerContext";
import { UserDataContext } from "@/app/context/UserDataContext";
import { useRouter, usePathname } from "next/navigation";
import NProgress from "nprogress";
import { useTranslation } from "react-i18next";
import {
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
  Typography,
  useTheme,
} from "@mui/material";
import {
  IconArmchair2,
  IconMenu2,
  IconUsers,
  IconHistory,
  IconUserCheck,
  IconShieldCog,
  IconApps,
  IconUser,
  IconX,
  IconNotebook,
  IconPackage,
} from "@tabler/icons-react";
import useIsMobile from "@/app/utils/hooks/useIsMobile";
import { useIsDefaultTenant } from "@/app/utils/auth/useIsDefaultTenant";
import { hasPermission } from "@/app/utils/auth/hasPermission";
import { getPageBackground } from "../pageBackground";

const NAV_ITEMS = [
  {
    titleKey: "DiningTables",
    icon: IconArmchair2,
    href: "/apps/dining-tables",
    permission: "dining_table.view",
  },
  {
    titleKey: "OrderManagement",
    icon: IconNotebook,
    href: "/apps/orders",
    permission: "order.view",
  },
];

const DRAWER_MENU_ITEMS = [
  {
    titleKey: "ProductManagement",
    icon: IconPackage,
    href: "/apps/products",
    permission: "product.view",
  },
  {
    titleKey: "TableManagement",
    icon: IconPackage,
    href: "/apps/tables",
    permission: "dining_table.view",
  },
  {
    titleKey: "UserManagement",
    icon: IconUsers,
    href: "/systems/user-management",
    permission: "user.view",
  },
  {
    titleKey: "RoleManagement",
    icon: IconUserCheck,
    href: "/systems/role-management",
    permission: "role.view",
  },
  {
    titleKey: "AuditLog",
    icon: IconHistory,
    href: "/systems/audit-log",
    permission: "audit_log.view",
  },
  {
    titleKey: "TenantManagement",
    icon: IconShieldCog,
    href: "/systems/tenant-management",
    permission: "tenant.view",
    defaultTenantOnly: true,
  },
  {
    titleKey: "Profile",
    icon: IconUser,
    href: "/apps/user-profile/profile",
  },
  {
    titleKey: "Theme Option",
    icon: IconApps,
    isCustomizer: true,
  },
];

export default function MobileBottomNav() {
  const theme = useTheme();
  const pageBg = getPageBackground(theme);
  const isMobile = useIsMobile();
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useTranslation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { setCustomizerOpen } = useContext(CustomizerContext);
  const { user } = useContext(UserDataContext);
  const isDefaultTenant = useIsDefaultTenant();

  const checkItemPermission = useCallback(
    (item) => {
      if (item.defaultTenantOnly && !isDefaultTenant) return false;
      if (!item.permission) return true;
      const [module, action] = item.permission.split(".");
      return hasPermission(user?.permissions, module, action);
    },
    [isDefaultTenant, user?.permissions],
  );

  const visibleNavItems = useMemo(
    () => NAV_ITEMS.filter(checkItemPermission),
    [checkItemPermission],
  );

  const visibleDrawerItems = useMemo(
    () => DRAWER_MENU_ITEMS.filter(checkItemPermission),
    [checkItemPermission],
  );

  const handleOpenCustomizer = useCallback(() => {
    setDrawerOpen(false);
    setCustomizerOpen(true);
  }, [setCustomizerOpen]);

  if (!isMobile) return null;

  const activeIndex = visibleNavItems.findIndex((item) =>
    pathname?.startsWith(item.href),
  );

  const handleNavChange = (event, newValue) => {
    if (newValue === visibleNavItems.length) {
      setDrawerOpen(true);
    } else {
      NProgress.start();
      router.push(visibleNavItems[newValue].href);
    }
  };

  return (
    <>
      <Paper
        elevation={0}
        sx={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1300,
          paddingBottom: "env(safe-area-inset-bottom)",
          backgroundColor: pageBg,
        }}
      >
        <BottomNavigation
          value={activeIndex >= 0 ? activeIndex : false}
          onChange={handleNavChange}
          sx={{
            height: 60,
            backgroundColor: pageBg,
            "& .MuiBottomNavigationAction-root": {
              minWidth: 0,
              padding: "6px 4px 8px",
              color: theme.palette.text.secondary,
              transition: "all 0.2s ease",
              "&.Mui-selected": {
                color: theme.palette.primary.main,
              },
            },
            "& .MuiBottomNavigationAction-label": {
              fontSize: "10px",
              fontWeight: 500,
              marginTop: "2px",
              "&.Mui-selected": {
                fontSize: "10px",
                fontWeight: 700,
              },
            },
          }}
        >
          {visibleNavItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <BottomNavigationAction
                key={index}
                label={t(item.titleKey)}
                icon={<Icon size={22} />}
                showLabel
              />
            );
          })}
          <BottomNavigationAction
            label="Menu"
            icon={<IconMenu2 size={22} />}
            showLabel
            sx={{
              color: drawerOpen
                ? theme.palette.primary.main
                : theme.palette.text.secondary,
            }}
          />
        </BottomNavigation>
      </Paper>

      <Drawer
        anchor="bottom"
        open={drawerOpen}
        onClose={(event, reason) => {
          if (reason === "backdropClick") return;
          setDrawerOpen(false);
        }}
        PaperProps={{
          sx: {
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            maxHeight: "70vh",
            pb: 2,
            backgroundColor: pageBg,
          },
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 2,
            py: 1.5,
            borderBottom: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Typography variant="subtitle1" fontWeight={700}>
            Menu
          </Typography>
          <Box
            onClick={() => setDrawerOpen(false)}
            sx={{
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              color: theme.palette.text.secondary,
              "&:hover": { color: theme.palette.text.primary },
            }}
          >
            <IconX size={20} />
          </Box>
        </Box>

        <List sx={{ pt: 1 }}>
          {visibleDrawerItems.map((item, index) => {
            const Icon = item.icon;
            const isActive =
              !item.isCustomizer && pathname?.startsWith(item.href);
            return (
              <React.Fragment key={item.titleKey}>
                <ListItem disablePadding>
                  <ListItemButton
                    onClick={() => {
                      if (item.isCustomizer) {
                        handleOpenCustomizer();
                      } else {
                        NProgress.start();
                        router.push(item.href);
                        setDrawerOpen(false);
                      }
                    }}
                    sx={{
                      px: 3,
                      py: 1.2,
                      borderRadius: 2,
                      mx: 1,
                      backgroundColor: isActive
                        ? `${theme.palette.primary.main}15`
                        : "transparent",
                      color: isActive
                        ? theme.palette.primary.main
                        : theme.palette.text.primary,
                      "&:hover": {
                        backgroundColor: `${theme.palette.primary.main}10`,
                      },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 36,
                        color: isActive
                          ? theme.palette.primary.main
                          : theme.palette.text.secondary,
                      }}
                    >
                      <Icon size={20} />
                    </ListItemIcon>
                    <ListItemText
                      primary={t(item.titleKey)}
                      primaryTypographyProps={{
                        fontWeight: isActive ? 700 : 500,
                        fontSize: "14px",
                      }}
                    />
                  </ListItemButton>
                </ListItem>
                {index < visibleDrawerItems.length - 1 && (
                  <Divider sx={{ mx: 3, opacity: 0.4 }} />
                )}
              </React.Fragment>
            );
          })}
        </List>
      </Drawer>
    </>
  );
}
