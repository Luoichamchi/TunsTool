import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import { IconPower } from "@tabler/icons-react";
import { CustomizerContext } from "@/app/context/ClientCustomizerContext/customizerContext";
import { useContext } from "react";
import { UserDataContext } from "@/app/context/UserDataContext";

export const Profile = () => {
  const lgUp = useMediaQuery((theme) => theme.breakpoints.up("lg"));
  const { isSidebarHover, isCollapse } = useContext(CustomizerContext);
  const hideMenu = lgUp ? isCollapse == "mini-sidebar" && !isSidebarHover : "";
  const { user, logout } = useContext(UserDataContext);
  const avatarText = user?.full_name?.[0] || user?.username?.[0] || "?";
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 2,
        m: 3,
        p: 2,
        bgcolor: "secondary.light",
        borderRadius: 2,
        minWidth: 0,
        overflow: "hidden",
      }}
    >
      {!hideMenu ? (
        <>
          <Avatar
            alt={avatarText}
            sx={{ height: 40, width: 40, flexShrink: 0 }}
          >
            {avatarText}
          </Avatar>
          <Box
            sx={{
              minWidth: 0,
              flex: "1 1 auto",
              overflow: "hidden",
            }}
          >
            <Typography
              variant="h6"
              noWrap
              sx={{ maxWidth: "100%" }}
            >
              {user?.full_name || user?.username || "User"}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              noWrap
              sx={{ maxWidth: "100%" }}
            >
              {user?.email || ""}
            </Typography>
          </Box>
          <Box
            sx={{
              ml: 1,
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
            }}
          >
            <Tooltip title="Logout" placement="top">
              <IconButton
                color="primary"
                aria-label="logout"
                size="small"
                onClick={logout}
                sx={{
                  p: 0.75,
                  minWidth: 0,
                  minHeight: 0,
                  overflow: "visible",
                }}
              >
                <IconPower size="20" />
              </IconButton>
            </Tooltip>
          </Box>
        </>
      ) : (
        ""
      )}
    </Box>
  );
};
