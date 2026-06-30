"use client";
import { useContext } from "react";
import { CustomizerContext } from "@/app/context/ClientCustomizerContext/customizerContext";
import config from "@/utils/config";
import Link from "next/link";
import { styled } from "@mui/material/styles";
import Image from "next/image";
import { Typography } from "@mui/material";

const Logo = () => {
  const { isCollapse, isSidebarHover, activeDir, activeMode } =
    useContext(CustomizerContext);
  const TopbarHeight = config.topbarHeight;

  const LinkStyled = styled(Link)(() => ({
    height: TopbarHeight,
    width: isCollapse == "mini-sidebar" && !isSidebarHover ? "40px" : "180px",
    overflow: "hidden",
    display: "block",
  }));

  if (activeDir === "ltr") {
    return (
      <LinkStyled href="/">
        {activeMode === "dark" ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              height: "100%",
              width: "100%",
              gap:
                isCollapse === "mini-sidebar" && !isSidebarHover
                  ? "0px"
                  : "10px",
            }}
          >
            <Image
              src="/images/logos/vimon-logo.png"
              alt="logo"
              priority
              width={isCollapse === "mini-sidebar" && !isSidebarHover ? 30 : 50}
              height={TopbarHeight}
              style={{
                objectFit: "contain",
                paddingTop: "10px",
                paddingBottom: "10px",
              }}
            />
            <Typography
              variant="h6"
              color="textSecondary"
              sx={{
                fontSize: "25px",
                lineHeight: 1,
                fontFamily: "'Source Sans Pro', sans-serif",
                fontWeight: 300,
                display:
                  isCollapse === "mini-sidebar" && !isSidebarHover
                    ? "none"
                    : "flex",
                alignItems: "center",
                height: "100%",
                mb: 0,
              }}
            >
              ViMON
            </Typography>
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              height: "100%",
              width: "100%",
              gap:
                isCollapse === "mini-sidebar" && !isSidebarHover
                  ? "0px"
                  : "10px",
            }}
          >
            <Image
              src="/images/logos/vimon-logo.png"
              alt="logo"
              priority
              width={isCollapse === "mini-sidebar" && !isSidebarHover ? 30 : 50}
              height={TopbarHeight}
              style={{
                objectFit: "contain",
                paddingTop: "10px",
                paddingBottom: "10px",
                display: "block",
              }}
            />
            <Typography
              variant="h6"
              color="textSecondary"
              sx={{
                fontSize: "25px",
                lineHeight: 1,
                fontFamily: "'Source Sans Pro', sans-serif",
                fontWeight: 300,
                display:
                  isCollapse === "mini-sidebar" && !isSidebarHover
                    ? "none"
                    : "flex",
                alignItems: "center",
                height: "100%",
                mb: 0,
              }}
            >
              ViMON
            </Typography>
          </div>
        )}
      </LinkStyled>
    );
  }

  return (
    <LinkStyled href="/">
      {activeMode === "dark" ? (
        <Image
          src="/images/logos/dark-rtl-logo.svg"
          alt="logo"
          height={TopbarHeight}
          width={174}
          priority
        />
      ) : (
        <Image
          src="/images/logos/light-logo-rtl.svg"
          alt="logo"
          height={TopbarHeight}
          width={174}
          priority
        />
      )}
    </LinkStyled>
  );
};

export default Logo;
