"use client";
import React, { useState, useCallback, useContext } from "react";
import { CustomizerContext } from "@/app/context/ClientCustomizerContext/customizerContext";
import { useRouter, usePathname } from "next/navigation";
import NProgress from "nprogress";
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
  IconNotebook,
  IconSettings,
  IconMenu2,
  IconUsers,
  IconHistory,
  IconUserCheck,
  IconShieldCog,
  IconApps,
  IconUser,
  IconX,
} from "@tabler/icons-react";
import useIsMobile from "@/app/utils/hooks/useIsMobile";
import { useIsDefaultTenant } from "@/app/utils/auth/useIsDefaultTenant";

const NAV_ITEMS = [
  {
    label: "Demo",
    icon: <IconNotebook size={22} />,
    href: "/apps/demos-v2",
  },
];

const DRAWER_MENU_ITEMS = [
  {
    label: "Users",
    icon: <IconUsers size={20} />,
    href: "/systems/user-management",
  },
  {
    label: "Roles",
    icon: <IconUserCheck size={20} />,
    href: "/systems/role-management",
  },
  {
    label: "Audit log",
    icon: <IconHistory size={20} />,
    href: "/systems/audit-log",
  },
  {
    label: "Tenants",
    icon: <IconShieldCog size={20} />,
    href: "/systems/tenant-management",
    defaultTenantOnly: true,
  },
  {
    label: "Profile",
    icon: <IconUser size={20} />,
    href: "/apps/user-profile/profile",
  },
  {
    label: "Theme settings",
    icon: <IconApps size={20} />,
    isCustomizer: true,
  },
];

export default function MobileBottomNav() {
  const theme = useTheme();
  const isMobile = useIsMobile();
  const pathname = usePathname();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { setCustomizerOpen } = useContext(CustomizerContext);
  const isDefaultTenant = useIsDefaultTenant();

  const handleOpenCustomizer = useCallback(() => {
    setDrawerOpen(false);
    setCustomizerOpen(true);
  }, [setCustomizerOpen]);

  if (!isMobile) return null;

  const activeIndex = NAV_ITEMS.findIndex((item) =>
    pathname?.startsWith(item.href),
  );

  const handleNavChange = (event, newValue) => {
    if (newValue === NAV_ITEMS.length) {
      setDrawerOpen(true);
    } else {
      NProgress.start();
      router.push(NAV_ITEMS[newValue].href);
    }
  };

  return (
    <>
      <Paper
        elevation={8}
        sx={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1300,
          borderTop: `1px solid ${theme.palette.divider}`,
          paddingBottom: "env(safe-area-inset-bottom)",
          backgroundColor: theme.palette.background.paper,
        }}
      >
        <BottomNavigation
          value={activeIndex >= 0 ? activeIndex : false}
          onChange={handleNavChange}
          sx={{
            height: 60,
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
          {NAV_ITEMS.map((item, index) => (
            <BottomNavigationAction
              key={index}
              label={item.label}
              icon={item.icon}
              showLabel
            />
          ))}
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
          {DRAWER_MENU_ITEMS.filter(
            (item) => !item.defaultTenantOnly || isDefaultTenant,
          ).map((item, index) => {
            const isActive =
              !item.isCustomizer && pathname?.startsWith(item.href);
            return (
              <React.Fragment key={index}>
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
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={item.label}
                      primaryTypographyProps={{
                        fontWeight: isActive ? 700 : 500,
                        fontSize: "14px",
                      }}
                    />
                  </ListItemButton>
                </ListItem>
                {index < DRAWER_MENU_ITEMS.length - 1 && (
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
