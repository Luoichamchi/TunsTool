export const LAYOUT_PADDING_LEFT = 15;
export const LAYOUT_PADDING_RIGHT = 50;

export function getLayoutHorizontalPadding(isMobile) {
  return {
    left: LAYOUT_PADDING_LEFT,
    right: isMobile ? LAYOUT_PADDING_LEFT : LAYOUT_PADDING_RIGHT,
  };
}
