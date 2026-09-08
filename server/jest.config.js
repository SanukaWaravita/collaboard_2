export default {
  testEnvironment: "node",
  testMatch: ["<rootDir>/tests/**/*.test.js"],
  transform: {},
  setupFiles: ["<rootDir>/tests/setup-env.js"],
  clearMocks: true,
  testTimeout: 30000,
};
