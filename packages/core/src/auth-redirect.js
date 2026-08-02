function isAllowedProductOrigin(url, productHost) {
  const host = url.hostname.toLowerCase();
  const isLocal = host === "localhost" || host === "127.0.0.1" || host === "::1";
  const isAltoraProduct = url.protocol === "https:" && host === productHost;

  return isLocal || isAltoraProduct;
}

/**
 * Produces the only logout callback URL accepted by one Altora product.
 * It intentionally keeps an active local browser origin during development,
 * but falls back to that product's public entry point for every other input.
 */
export function resolveProductLoginUrl(origin, productHost) {
  const normalizedProductHost = productHost.toLowerCase();
  const fallback = `https://${normalizedProductHost}/login`;

  try {
    const parsedOrigin = new URL(origin);
    if (isAllowedProductOrigin(parsedOrigin, normalizedProductHost)) {
      return new URL("/login", parsedOrigin.origin).toString();
    }
  } catch {
    // Invalid callback inputs must never turn into a redirect target.
  }

  return fallback;
}
