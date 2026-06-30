export function getBackendBaseUrl() {
  return (process.env.API_BASE_URL || "http://backend:6001").replace(/\/$/, "");
}

// Header gắn với 1 chặng kết nối — phải bỏ khi forward sang backend
const HOP_BY_HOP_HEADERS = [
  "host",
  "connection",
  "content-length",
  "transfer-encoding",
  "accept-encoding",
  "keep-alive",
  "proxy-connection",
];

export async function proxyToBackend(request, backendPath) {
  const incomingUrl = new URL(request.url);
  const targetUrl = `${getBackendBaseUrl()}${backendPath}${incomingUrl.search}`;

  const headers = new Headers(request.headers);
  for (const name of HOP_BY_HOP_HEADERS) {
    headers.delete(name);
  }

  const init = { method: request.method, headers };
  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = await request.arrayBuffer();
  }

  let response;
  try {
    response = await fetch(targetUrl, init);
  } catch (error) {
    console.error("[backendProxy] fetch failed:", targetUrl, error?.cause || error);
    return Response.json(
      { detail: "Không kết nối được backend", target: targetUrl },
      { status: 502 },
    );
  }

  const responseHeaders = new Headers(response.headers);
  responseHeaders.delete("transfer-encoding");
  responseHeaders.delete("content-encoding");
  responseHeaders.delete("content-length");

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
  });
}
