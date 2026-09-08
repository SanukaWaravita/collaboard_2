# M4 — Test Suite & CI

## Requirements and implementation

| Brief requirement | Implementation |
| --- | --- |
| At least 3 server tests | 19 Jest + Supertest tests: 9 documentation/CORS checks, 3 authentication tests and 7 task API tests. |
| At least 3 client tests | 10 Jest + React Testing Library tests: 5 task-form tests and 5 authentication/navigation tests. |
| Tests on every push | `.github/workflows/tests.yml` runs on every push and pull request, with independent client and server jobs. |
| At least 1 real bug fixed | Login now returns the user to the protected page they originally requested. The regression test failed before the fix and passed afterwards. |

## Run locally

Use Node.js 24 (the version used in CI). From the repository root:

```bash
npm --prefix server ci
npm --prefix client ci
npm --prefix server test
npm --prefix client test
npm --prefix client run lint
npm --prefix client run build
```

Focused runs:

```bash
npm --prefix server run test:docs
npm --prefix server test -- --runTestsByPath tests/tasks.test.js
npm --prefix client test -- --runTestsByPath tests/auth-navigation.test.jsx
```

The server's `test:docs` command remains available; the existing nine Node test-runner cases have been ported to Jest and Supertest. The standard `npm test` command now runs the whole server suite.

The client uses jsdom to exercise real React components and routing. Only the API boundary is mocked in the login/navigation suite. JSX is transformed with Babel inside Jest's configuration, preserving the app's ES modules. Vite's production build configuration is unchanged. The Node VM Modules experimental warning is expected with this Jest ESM setup; it does not indicate a test failure. See [Jest ESM documentation](https://jestjs.io/docs/ecmascript-modules).

## Database isolation

Authentication and task tests start a disposable real MongoDB process using `mongodb-memory-server`. They exercise Express routes, authentication middleware, controllers and Mongoose together. Task fixtures use signed JWTs; the authentication suite separately checks real registration and login.

No running application, Atlas account, `.env` file, Docker container, or deployment secrets are needed. Tests do not import `server.js` or use the application's database URI. Each database suite owns a temporary process, clears its own collections between tests, disconnects, and stops that process afterwards. Setup failures fail the suite; tests are not silently skipped.

The first database-backed run may download a MongoDB binary and requires internet access and a supported OS/runtime. Subsequent runs reuse the cached binary. The test startup hook allows 120 seconds for the initial download/start. On an unsupported Linux distribution, consult the package's [supported systems](https://typegoose.github.io/mongodb-memory-server/docs/guides/supported-systems/) and [configuration options](https://typegoose.github.io/mongodb-memory-server/docs/api/config-options/). A compatible local MongoDB binary can be selected with `MONGOMS_SYSTEM_BINARY`; this starts a separate test process, not an existing development database.

## Test coverage

| File | Behaviours checked |
| --- | --- |
| `server/tests/docs.test.js` | Public Swagger assets; relative OpenAPI URL and bearer scheme; same-origin local/proxied requests; both Firebase origins; rejected unlisted origins; protected routes; disconnected health. |
| `server/tests/auth.test.js` | Password hashing and usable registration token; duplicate normalised email; successful login and rejected incorrect password. |
| `server/tests/tasks.test.js` | Unauthenticated creation rejected; task persistence and retrieval; reviewer restrictions; invalid date rejected; status update and stale version conflict; competing edits; deletion. |
| `client/tests/TaskForm.test.jsx` | Normalised submission; whitespace title rejected; clearing due date; reporter-only changes; disabled submission while saving. |
| `client/tests/auth-navigation.test.jsx` | Protected-route redirect; access with a session; return to original destination after login; ordinary login fallback; failed login feedback. |

These are component and integration tests. They do not constitute browser E2E coverage or comprehensive coverage of every endpoint. There is no claimed coverage percentage.

## Real bug: login loses the original project destination

### Reproduction before the fix

1. Sign out.
2. Open a valid protected Project URL directly, such as `/workspaces/<workspaceId>/projects/<projectId>`.
3. The application redirects to Login.
4. Sign in successfully.
5. Observe that Workspaces opens instead of the requested Project.

Expected: return to the requested Project, preserving its query string and fragment when present.

`ProtectedRoute` already supplies the requested location through `state.from`, but `LoginPage` ignored it and always navigated to `/workspaces`.

### Fix

`LoginPage` now reads that location and navigates back after saving the session. Direct logins still go to Workspaces. The return destination must be an internal absolute path, and Login/Register destinations fall back to Workspaces. Navigation replaces the login history entry.

The TaskForm's duplicate `autoFocus` attribute was also removed; its conditional autofocus remains. This cleanup is separate from the M4 functional bug fix.

### Regression evidence

`client/tests/auth-navigation.test.jsx` includes:

> returns to the requested project after login, including search and hash

Before editing LoginPage, this test failed: the DOM contained `Workspaces destination` when the expected heading was the requested Project destination. The other four tests in that file passed. After the fix, all five passed.

## Validation recorded for this package

Local verification was completed on 8 September 2026.

| Check | Local result |
| --- | --- |
| Server test suites | All 3 suites passed. |
| Server tests | All 19 tests passed: 9 documentation/CORS, 3 authentication and 7 task API tests. |
| Client tests | All 10 tests passed. |
| Frontend lint | Passed. |
| Production frontend build | Passed. |
| GitHub Actions | Workflow configured; the first remote run remains to be verified. |

The complete server suite passed locally on Arch Linux in approximately 42 seconds, including all database-backed tests.

The earlier MongoDB startup restriction occurred only in the environment used to prepare the package. It did not prevent local verification: `mongodb-memory-server` successfully started a temporary MongoDB process using its Ubuntu-compatible binary fallback.

The server run reported non-blocking warnings about Jest's experimental VM Modules support, the MongoDB binary fallback for Arch Linux, and Mongoose's deprecated `new` option. All tests passed despite these warnings.

The client tests, lint and production build also completed successfully locally. Their terminal output was subsequently cleared, so that output has not been retained as evidence.

## CI and submission evidence

The workflow in `.github/workflows/tests.yml` has no branch or path filters and runs on every push and pull request. It installs dependencies from both lockfiles using `npm ci`, runs both test suites, and runs frontend lint and build checks.

It requires no repository secrets. Existing Firebase deployment workflows remain separate; deployment does not currently depend on successful completion of the test workflow.

M4 verification checklist:

- [x] Run all 19 server tests successfully locally.
- [x] Run all 10 client tests successfully locally.
- [x] Complete frontend lint and production build checks.
- [x] Fix a real bug and verify its regression test.
- [ ] Push the feature branch and confirm both M4 CI jobs pass.
- [ ] Retain the successful GitHub Actions run URL or screenshot.
- [ ] Record the actual bug-fix commit and pull request links.
- [ ] Review the team's contribution history against the group brief.

Branch: `feature/m4-tests-ci`.

Pull request target: `develop`.

Suggested pull request title:
`test: add M4 client and server suites, CI, and login redirect fix`

Local verification is complete. M4's CI requirement still needs a successful GitHub Actions run.