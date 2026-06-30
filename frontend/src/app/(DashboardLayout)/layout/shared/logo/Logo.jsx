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

  const LinkStyled = styled(Link)(() => ({
    height: TopbarHeight,
    width: isMini ? "40px" : "180px",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
  }));

  // Logo theo theme (nền khớp sidebar). Ảnh vuông nên thu gọn vẫn hiển thị trọn.
  const logoSrc =
    activeMode === "dark" ? "/icons/logo-dark.png" : "/icons/logo-light.png";

  return (
    <LinkStyled href="/">
      <Image
        src={logoSrc}
        alt="TunsTool"
        priority
        width={isMini ? 40 : 180}
        height={TopbarHeight}
        style={{
          objectFit: "contain",
          width: isMini ? "40px" : "100%",
          height: "100%",
        }}
      />
    </LinkStyled>
  );
};

export default Logo;
