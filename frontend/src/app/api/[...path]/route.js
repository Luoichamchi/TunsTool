import { proxyToBackend } from "@/app/utils/backendProxy";

export const dynamic = "force-dynamic";

async function handler(request, context) {
  const { path } = await context.params;
  const suffix = path?.length ? `/${path.join("/")}` : "";
  return proxyToBackend(request, `/api${suffix}`);
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
