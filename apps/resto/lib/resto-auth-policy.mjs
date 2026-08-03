export function resolveSafeCallbackPath(callbackPath) {
  if (typeof callbackPath !== "string") return "/";
  if (!callbackPath.startsWith("/") || callbackPath.startsWith("//")) return "/";
  if (callbackPath === "/login" || callbackPath.startsWith("/login?")) return "/";
  return callbackPath;
}
