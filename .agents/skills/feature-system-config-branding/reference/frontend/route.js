import { proxyToBackend } from "@/app/utils/backendProxy";

export const dynamic = "force-dynamic";

async function handler(request, context) {
  const { path } = await context.params;
  const suffix = path?.length ? `/${path.join("/")}` : "";
  return proxyToBackend(request, `/assets${suffix}`);
}

export const GET = handler;
