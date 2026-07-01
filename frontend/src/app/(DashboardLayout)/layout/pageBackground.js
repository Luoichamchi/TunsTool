export function getPageBackground(theme) {
  return theme.palette.mode === "dark"
    ? theme.palette.background.default
    : "#F3F8FB";
}
