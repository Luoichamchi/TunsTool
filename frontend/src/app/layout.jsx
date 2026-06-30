import React from "react";

import MyApp from "./App";
import "./global.css";
import ClientCustomizerProvider from "./context/ClientCustomizerContext/ClientCustomizerProvider";
import ServiceWorkerRegistrar from "./components/ServiceWorkerRegistrar";

// Next.js 15: viewport phải là export riêng, không nằm trong metadata
export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export const metadata = {
  title: "TunsTool Admin",
  description: "Multi-tenant admin base with JWT auth and RBAC",
  icons: {
    icon: [
      { url: "/icons/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
    shortcut: "/icons/favicon-32x32.png",
    apple: "/icons/icon-192x192.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "TunsTool",
  },
  manifest: "/manifest.webmanifest",
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export default async function RootLayout({ children }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <ServiceWorkerRegistrar />
        <ClientCustomizerProvider>
          <MyApp>{children}</MyApp>
        </ClientCustomizerProvider>
      </body>
    </html>
  );
}
