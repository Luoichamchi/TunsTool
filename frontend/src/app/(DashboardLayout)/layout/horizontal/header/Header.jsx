import * as React from "react";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Toolbar from "@mui/material/Toolbar";
import useMediaQuery from "@mui/material/useMediaQuery";
import { styled } from "@mui/material/styles";
import { CustomizerContext } from "@/app/context/ClientCustomizerContext/customizerContext";
import config from "@/utils/config";

import { IconMenu2 } from "@tabler/icons-react";
import Notifications from "../../vertical/header/Notification";

import Profile from "../../vertical/header/Profile";
import Search from "../../vertical/header/Search";
import Navigation from "../../vertical/header/Navigation";
import Logo from "../../shared/logo/Logo";
import TenantFilterSelect from "@/app/components/shared/TenantFilterSelect";
import CustomizerHeaderButton from "@/app/(DashboardLayout)/layout/shared/customizer/CustomizerHeaderButton";

const Header = () => {
  const lgDown = useMediaQuery((theme) => theme.breakpoints.down("lg"));
  const lgUp = useMediaQuery((theme) => theme.breakpoints.up("lg"));

  // drawer
  const {
    isLayout,
    setIsMobileSidebar,
    isMobileSidebar,
  } = React.useContext(CustomizerContext);
  const TopbarHeight = config.topbarHeight;

  const AppBarStyled = styled(AppBar)(({ theme }) => ({
    background: theme.palette.background.paper,
    justifyContent: "center",
    backdropFilter: "blur(4px)",

    [theme.breakpoints.up("lg")]: {
      minHeight: TopbarHeight,
    },
  }));
  const ToolbarStyled = styled(Toolbar)(({ theme }) => ({
    margin: "0 auto",
    width: "100%",
    color: `${theme.palette.text.secondary} !important`,
  }));

  return (
    <AppBarStyled position="sticky" color="default" elevation={8}>
        <ToolbarStyled
          sx={{
            maxWidth: isLayout === "boxed" ? "lg" : "100%!important",
          }}
        >
          <Box sx={{ width: lgDown ? "45px" : "auto", overflow: "hidden" }}>
            <Logo />
          </Box>
          {/* ------------------------------------------- */}
          {/* Toggle Button Sidebar */}
          {/* ------------------------------------------- */}
          {lgDown ? (
            <IconButton
              color="inherit"
              aria-label="menu"
              onClick={() => setIsMobileSidebar(!isMobileSidebar)}
            >
              <IconMenu2 />
            </IconButton>
          ) : (
            ""
          )}
          {/* ------------------------------------------- */}
          {/* Search + Tenant filter */}
          {/* ------------------------------------------- */}
          <Stack direction="row" spacing={1} alignItems="center" sx={{ ml: 1 }}>
            <Search />
            <TenantFilterSelect />
          </Stack>
          {lgUp ? (
            <>
              <Navigation />
            </>
          ) : null}
          <Box
            sx={{
              flexGrow: 1,
            }}
          />
          <Stack
            spacing={1}
            direction="row"
            sx={{
              alignItems: "center",
            }}
          >
            <CustomizerHeaderButton />

            <Notifications />
            <Profile />
          </Stack>
        </ToolbarStyled>
      </AppBarStyled>
  );
};

export default Header;
