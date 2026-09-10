const DEFAULT_ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:8080",
  "http://127.0.0.1:8080",
];

export function normalizeOrigin(value) {
  return value.trim().replace(/\/+$/, "");
}

export function getAllowedOrigins() {
  const configuredOrigins =
    process.env.CORS_ALLOWED_ORIGINS
      ?.split(",")
      .map(normalizeOrigin)
      .filter(Boolean) ?? [];

  return new Set(
    configuredOrigins.length > 0
      ? configuredOrigins
      : DEFAULT_ALLOWED_ORIGINS,
  );
}

export function isAllowedOrigin(origin, allowedOrigins) {
  return !origin || allowedOrigins.has(normalizeOrigin(origin));
}
