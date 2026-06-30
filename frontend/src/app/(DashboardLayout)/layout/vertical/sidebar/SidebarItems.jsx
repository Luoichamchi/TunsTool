import Menuitems from "./MenuItems";
import { useIsDefaultTenant } from "@/app/utils/auth/useIsDefaultTenant";
import { hasPermission } from "@/app/utils/auth/hasPermission";
import { UserDataContext } from "@/app/context/UserDataContext";
import { usePathname } from "next/navigation";
import Box from "@mui/material/Box";
import List from "@mui/material/List";
import useMediaQuery from "@mui/material/useMediaQuery";
import NavItem from "./NavItem";
import NavCollapse from "./NavCollapse";
import NavGroup from "./NavGroup/NavGroup";
import { useContext } from "react";
import { CustomizerContext } from "@/app/context/ClientCustomizerContext/customizerContext";

const SidebarItems = () => {
  const pathname = usePathname();
  const pathDirect = pathname;
  const pathWithoutLastPart = pathname.slice(0, pathname.lastIndexOf("/"));
  const { isSidebarHover, isCollapse, isMobileSidebar, setIsMobileSidebar } =
    useContext(CustomizerContext);

  const lgUp = useMediaQuery((theme) => theme.breakpoints.up("lg"));
  const hideMenu = lgUp ? isCollapse == "mini-sidebar" && !isSidebarHover : "";

  const { user } = useContext(UserDataContext);
  const isDefaultTenant = useIsDefaultTenant();

  const checkItemPermission = (item) => {
    if (item.defaultTenantOnly && !isDefaultTenant) return false;
    if (!item.permission) return true;
    const [module, action] = item.permission.split(".");
    return hasPermission(user?.permissions, module, action);
  };

  // Nhóm menu items theo subheader và kiểm tra quyền
  const processMenuItems = () => {
    const result = [];
    let currentSubheader = null;
    let currentSubheaderItems = [];

    Menuitems.forEach((item, index) => {
      if (item.subheader) {
        // Nếu có subheader trước đó, kiểm tra xem có item nào hiển thị không
        if (currentSubheader && currentSubheaderItems.length > 0) {
          const hasVisibleItems = currentSubheaderItems.some(checkItemPermission);
          if (hasVisibleItems) {
            result.push(currentSubheader);
            result.push(...currentSubheaderItems);
          }
        }
        
        // Bắt đầu subheader mới
        currentSubheader = item;
        currentSubheaderItems = [];
      } else {
        // Item thường
        if (currentSubheader) {
          currentSubheaderItems.push(item);
        } else {
          // Item không thuộc subheader nào
          if (checkItemPermission(item)) {
            result.push(item);
          }
        }
      }
    });

    // Xử lý subheader cuối cùng
    if (currentSubheader && currentSubheaderItems.length > 0) {
      const hasVisibleItems = currentSubheaderItems.some(checkItemPermission);
      if (hasVisibleItems) {
        result.push(currentSubheader);
        result.push(...currentSubheaderItems);
      }
    }

    return result;
  };

  const visibleMenuItems = processMenuItems();

  return (
    <Box sx={{ px: 3 }}>
      <List sx={{ pt: 0 }} className="sidebarNav">
        {visibleMenuItems.map((item) => {
          if (!checkItemPermission(item)) return null;
          // {/********SubHeader**********/}
          if (item.subheader) {
            return (
              <NavGroup item={item} hideMenu={hideMenu} key={item.subheader} />
            );
          } else if (item.children) {
            return (
              <NavCollapse
                menu={item}
                pathDirect={pathDirect}
                hideMenu={hideMenu}
                pathWithoutLastPart={pathWithoutLastPart}
                level={1}
                key={item.id}
                onClick={() => setIsMobileSidebar(!isMobileSidebar)}
              />
            );
          } else {
            return (
              <NavItem
                item={item}
                key={item.id}
                pathDirect={pathDirect}
                hideMenu={hideMenu}
                onClick={() => setIsMobileSidebar(!isMobileSidebar)}
              />
            );
          }
        })}
      </List>
    </Box>
  );
};
export default SidebarItems;
