export function resolveSafeCallbackPath(callbackPath) {
  if (typeof callbackPath !== "string") return "/simple/hari-ini";
  if (!callbackPath.startsWith("/") || callbackPath.startsWith("//")) return "/simple/hari-ini";
  if (callbackPath === "/login" || callbackPath.startsWith("/login?")) return "/simple/hari-ini";
  return callbackPath;
}
