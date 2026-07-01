export const NAV_ITEM_ICON_SX = {
  minWidth: "36px",
  p: "3px 0",
  color: "inherit",
};

export function getNavItemButtonSx(
  theme,
  { isBorderRadius, hideMenu, level = 1, itemHref, pathDirect } = {},
) {
  const isActive =
    itemHref &&
    (pathDirect === itemHref || pathDirect?.startsWith(`${itemHref}/`));

  return {
    whiteSpace: "nowrap",
    marginBottom: "2px",
    padding: "8px 10px",
    borderRadius: `${isBorderRadius}px`,
    backgroundColor: level > 1 ? "transparent !important" : "inherit",
    color:
      level > 1 && isActive
        ? `${theme.palette.primary.main}!important`
        : theme.palette.text.secondary,
    paddingLeft: hideMenu ? "10px" : level > 2 ? `${level * 15}px` : "10px",
    "&:hover": {
      backgroundColor: theme.palette.primary.light,
      color: theme.palette.primary.main,
    },
    "&.Mui-selected": {
      color: "white",
      backgroundColor: theme.palette.primary.main,
      "&:hover": {
        backgroundColor: theme.palette.primary.main,
        color: "white",
      },
    },
  };
}
