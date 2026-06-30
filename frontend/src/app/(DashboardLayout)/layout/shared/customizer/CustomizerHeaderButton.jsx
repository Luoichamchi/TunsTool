"use client";

import { useContext } from "react";
import { IconButton, Tooltip } from "@mui/material";
import { IconSettings } from "@tabler/icons-react";
import { CustomizerContext } from "@/app/context/ClientCustomizerContext/customizerContext";

export default function CustomizerHeaderButton({
  size = "large",
  iconSize = 21,
}) {
  const { setCustomizerOpen } = useContext(CustomizerContext);

  return (
    <Tooltip title="Cài đặt">
      <IconButton
        size={size}
        color="inherit"
        aria-label="settings"
        onClick={() => setCustomizerOpen(true)}
      >
        <IconSettings size={iconSize} stroke="1.5" />
      </IconButton>
    </Tooltip>
  );
}
