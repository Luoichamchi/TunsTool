// Kill-switch service worker.
//
// App admin động không hưởng lợi từ offline caching mà còn dễ phục vụ
// nội dung cũ (stale). Service worker này không cache gì cả: nó xoá toàn bộ
// cache cũ và tự gỡ chính nó. Mọi trình duyệt còn giữ SW cũ sẽ nhận bản này
// ở lần kiểm tra cập nhật kế tiếp và được dọn sạch.

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(names.map((name) => caches.delete(name)));
      await self.registration.unregister();
      const clients = await self.clients.matchAll({ type: "window" });
      clients.forEach((client) => client.navigate(client.url));
    })(),
  );
});
