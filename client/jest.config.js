export default {
  testEnvironment: "jsdom",
  testMatch: ["<rootDir>/tests/**/*.test.{js,jsx}"],
  extensionsToTreatAsEsm: [".jsx"],
  transform: {
    "^.+\\.[jt]sx?$": ["babel-jest", {
      presets: [
        ["@babel/preset-env", { targets: { node: "current" }, modules: false }],
        ["@babel/preset-react", { runtime: "automatic" }],
      ],
    }],
  },
  setupFiles: ["<rootDir>/tests/polyfills.js"],
  setupFilesAfterEnv: ["<rootDir>/tests/setup.js"],
  clearMocks: true,
};
