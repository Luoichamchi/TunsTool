const nextConfig = {
  output: "standalone",
  reactStrictMode: false,
  devIndicators: {
    appIsrStatus: false,
    buildActivity: false,
  },
  images: { unoptimized: true },
  // Proxy /api/* và /assets/* qua route handler runtime (backendProxy.js)
  // — không dùng rewrites ở đây vì bị bake cứng lúc build
};

export default nextConfig;
