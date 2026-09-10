# Final verification record

## Scope

This record summarizes the final local Docker and public staging checks completed on 10 September 2026. Results below are based on the manual verification reported by the developer. Screenshot and URL evidence should be retained with the submission report.

## Local Docker verification

| Check | Result |
| --- | --- |
| Compose shutdown with `.env.docker` | Passed |
| Clean image build using `--no-cache` | Passed |
| MongoDB, API, and client startup | Passed |
| Container health checks | Passed |
| Registration and login | Passed |
| Workspace, Project, and Task creation | Passed |
| Cross-session Task create, edit, move, and delete delivery | Passed |
| Socket.IO reconnection and return to `Live` | Passed |
| MongoDB persistence after container restart | Passed |

The Docker environment was started with:

```bash
docker compose --env-file .env.docker build --no-cache
docker compose --env-file .env.docker up -d
docker compose --env-file .env.docker ps
```

The real-time recovery check temporarily stopped only the API container, kept the Project page open, restarted the API, and confirmed that the status returned to `Live` without refreshing the page.

## Public staging verification

| Component | URL | Result |
| --- | --- | --- |
| Firebase client | <https://collaboard-staging-2026.web.app/> | Passed manually |
| Firebase client alias | <https://collaboard-staging-2026.firebaseapp.com/> | Passed manually |
| Render API health | <https://collaboard-api-staging.onrender.com/api/health> | Passed manually |

Public verification covered authentication, persisted data after refresh, the `Live` status, and Task synchronization between two active browser sessions. The browser console was checked for blocking CORS, WebSocket, and authentication errors.

## Evidence still to retain

- Successful GitHub Actions workflow URL or screenshot.
- Pull-request and merge-commit links for the final features.
- `docker compose ps` showing healthy services.
- Local and Render `/api/health` responses.
- Firebase Project page showing the `Live` indicator.
- Two-session Task synchronization before-and-after screenshots.
- MongoDB Atlas collections or documents with secrets and private data redacted.
- Final team contribution summary and reflection.

Do not include JWTs, passwords, environment files, database credentials, or private user data in submission screenshots.
