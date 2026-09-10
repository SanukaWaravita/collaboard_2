# Real-time Task updates

## Scope

Connected users viewing the same Project receive Task creation, update, movement, and deletion changes without refreshing the page. REST remains the mutation and data-retrieval boundary; Socket.IO delivers invalidation events.

## Security model

- A socket connection requires the same signed JWT used by the REST API.
- The server verifies the JWT algorithm, subject, and current user record.
- Joining `project:<projectId>` requires current `READ_PROJECT` permission.
- Unauthorized joins return the same `Project not found` response used to avoid revealing private Project existence.
- Events contain only `projectId`, `taskId`, and `version`; they do not broadcast Task text or viewer-specific permission fields.
- On create or update, each client fetches `/api/tasks/:taskId` using its own JWT before changing the interface.

## Events

| Event | Trigger | Client action |
|---|---|---|
| `project:join` | Project page opens or reconnects | Server verifies access and joins the Project room |
| `project:leave` | Project page closes | Socket leaves the Project room |
| `task:created` | Successful Task POST | Fetch and insert the Task if absent |
| `task:updated` | Successful Task PATCH or movement | Fetch and reconcile the newest version |
| `task:deleted` | Successful Task DELETE | Remove the Task idempotently |

Task reconciliation rejects an incoming version older than the version already displayed. Existing `409 Conflict` handling continues to protect simultaneous REST writes.

## Connection experience

The Project toolbar displays `Connecting`, `Live`, `Reconnecting`, or `Offline`. Socket.IO reconnects automatically. A reconnection repeats the authorized Project join. The ordinary REST interface remains usable while live delivery is unavailable.

## Configuration

The client derives the Socket.IO origin from `VITE_API_URL`. Set `VITE_SOCKET_URL` only if real-time traffic uses a different origin.

The server reuses `CORS_ALLOWED_ORIGINS` for both Express and Socket.IO. The production Nginx configuration proxies both `/api/` and `/socket.io/`, including WebSocket upgrade headers.

## Validation

- Server tests cover missing-token rejection, Project-room authorization, and permission-safe room broadcasts.
- Client tests cover idempotent reconciliation, stale-version protection, and Project-page create/update/move/delete delivery.
- The existing CI workflow automatically runs these tests on pushes and pull requests.

## Deployment note

The included in-memory Socket.IO adapter is appropriate for the current single API instance. A future horizontally scaled deployment must use a compatible shared adapter so events reach clients connected to different instances.
