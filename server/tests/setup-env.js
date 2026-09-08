// Test-only settings. Never load .env or connect using the deployment URI.
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "collaboard-m4-tests-only-not-for-deployment";
process.env.JWT_EXPIRES_IN = "1h";
process.env.CORS_ALLOWED_ORIGINS = [
  "https://collaboard-staging-2026.firebaseapp.com",
  "https://collaboard-staging-2026.web.app",
].join(",");
