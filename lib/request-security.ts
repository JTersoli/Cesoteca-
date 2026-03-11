import { NextRequest } from "next/server";

export function isSameOriginRequest(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) {
    // Allow non-browser/API clients that do not send Origin.
    return true;
  }
  return origin === request.nextUrl.origin;
}
