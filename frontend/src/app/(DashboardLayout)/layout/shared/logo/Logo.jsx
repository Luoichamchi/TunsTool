"use client";
import { useContext } from "react";
import { CustomizerContext } from "@/app/context/ClientCustomizerContext/customizerContext";
import config from "@/utils/config";
import Link from "next/link";
import { styled } from "@mui/material/styles";
import Image from "next/image";

const Logo = () => {
  const { isCollapse, isSidebarHover, activeMode } = useContext(
    CustomizerContext,
  );
  const TopbarHeight = config.topbarHeight;
  const isMini = isCollapse === "mini-sidebar" && !isSidebarHover;
  const logoSize = isMini ? 40 : TopbarHeight;

  const LinkStyled = styled(Link)(() => ({
    height: logoSize,
    width: logoSize,
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  }));

  // Thu gọn sidebar: chỉ hiện mark TT (favicon). Mở rộng: logo đầy đủ theo theme.
  const logoSrc = isMini
    ? "/icons/favicon.png"
    : activeMode === "dark"
      ? "/icons/logo-dark.png"
      : "/icons/logo-light.png";

  return (
    <LinkStyled href="/">
      <Image
        src={logoSrc}
        alt="TunsTool"
        priority
        width={logoSize}
        height={logoSize}
        style={{
          objectFit: "contain",
          width: logoSize,
          height: logoSize,
        }}
      />
    </LinkStyled>
  );
};

export default Logo;
