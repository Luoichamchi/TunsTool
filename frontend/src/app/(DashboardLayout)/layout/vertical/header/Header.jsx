"use client";

import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import { useTheme } from "@mui/material/styles";
import useIsMobile from "@/app/utils/hooks/useIsMobile";
import Logo from "../../shared/logo/Logo";
import { getPageBackground } from "../../pageBackground";
import { getLayoutHorizontalPadding } from "../../pageSpacing";

const HEADER_LOGO_SIZE = 96;

export default function Header() {
  const theme = useTheme();
  const isMobile = useIsMobile();
  const { left: layoutPaddingLeft, right: layoutPaddingRight } =
    getLayoutHorizontalPadding(isMobile);
  const toolbarMinHeight = HEADER_LOGO_SIZE + (isMobile ? 8 : 16);

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        backgroundColor: getPageBackground(theme),
        backgroundImage: "none",
        boxShadow: "none",
        borderBottom: "none",
        color: "inherit",
        zIndex: 1100,
      }}
    >
      <Toolbar
        disableGutters
        sx={{
          minHeight: toolbarMinHeight,
          pl: `${layoutPaddingLeft}px`,
          pr: `${layoutPaddingRight}px`,
          py: 1,
          width: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Logo variant="header" />
      </Toolbar>
    </AppBar>
  );
}

export { HEADER_LOGO_SIZE };
