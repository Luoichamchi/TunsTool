/** Màu nền light mode dùng chung cho body, header, sidebar, footer, bottom nav */
export const PAGE_BACKGROUND_LIGHT = "#E8EDF2";

export function getPageBackground(theme) {
  return theme.palette.mode === "dark"
    ? theme.palette.background.default
    : PAGE_BACKGROUND_LIGHT;
}
