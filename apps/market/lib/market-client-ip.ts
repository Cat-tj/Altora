import { headers } from "next/headers";

export async function getMarketClientIp(): Promise<string> {
  const requestHeaders = await headers();
  const forwardedFor = requestHeaders.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0]?.trim() || "unknown";
  return requestHeaders.get("x-real-ip") ?? "unknown";
}
