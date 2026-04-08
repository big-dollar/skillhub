const APP_URL_ENV_KEYS = ["APP_URL", "NEXT_PUBLIC_APP_URL"] as const;

function normalizeOrigin(value: string): string | null {
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function getOriginFromHeaders(request: Request): string | null {
  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();

  if (forwardedProto && forwardedHost) {
    return normalizeOrigin(`${forwardedProto}://${forwardedHost}`);
  }

  const host = request.headers.get("host")?.trim();

  if (host) {
    const requestUrl = new URL(request.url);
    return normalizeOrigin(`${requestUrl.protocol}//${host}`);
  }

  return null;
}

export function getAppOrigin(request?: Request): string | null {
  for (const key of APP_URL_ENV_KEYS) {
    const value = process.env[key];

    if (!value) {
      continue;
    }

    const origin = normalizeOrigin(value);

    if (origin) {
      return origin;
    }
  }

  if (!request) {
    return null;
  }

  return getOriginFromHeaders(request) ?? normalizeOrigin(request.url);
}
