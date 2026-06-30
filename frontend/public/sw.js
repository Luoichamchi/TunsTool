const CACHE_NAME = "vimon-pwa-v2";

// Danh sách tài nguyên tĩnh cần cache khi install
const STATIC_ASSETS = [
  "/",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
  "/images/logos/vimon-logo.png",
  "/images/logos/vietcis-logo.png",
];

// Install — cache static assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }),
  );
  // Kích hoạt ngay khi install xong, không chờ tab cũ đóng
  self.skipWaiting();
});

// Activate — xoá cache cũ nếu có version mới
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name)),
      );
    }),
  );
  // Claim tất cả clients ngay lập tức
  self.clients.claim();
});

// Fetch — Network first, fallback to cache
self.addEventListener("fetch", (event) => {
  // Bỏ qua non-GET requests
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // Bỏ qua API calls — không cache dynamic data
  if (url.pathname.startsWith("/api/")) return;

  // Bỏ qua chrome-extension và các protocol khác
  if (!url.protocol.startsWith("http")) return;

  // Bỏ qua Next.js build chunks — tránh ChunkLoadError khi code thay đổi
  if (url.pathname.startsWith("/_next/")) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone response vì stream chỉ đọc được 1 lần
        const responseClone = response.clone();
        // Cache response mới
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone);
        });
        return response;
      })
      .catch(() => {
        // Network lỗi — trả từ cache
        return caches.match(event.request);
      }),
  );
});
