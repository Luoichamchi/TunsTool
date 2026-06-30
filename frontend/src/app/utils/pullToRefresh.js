import { mutate } from "swr";

export const PULL_REFRESH_EVENT = "app:pull-refresh";

/** Kích hoạt tải lại dữ liệu toàn app (SWR + custom event + Next router). */
export async function triggerAppRefresh(router) {
  window.dispatchEvent(new CustomEvent(PULL_REFRESH_EVENT));

  try {
    await mutate(() => true, { revalidate: true });
  } catch {
    // Bỏ qua lỗi revalidate
  }

  router?.refresh?.();
}
