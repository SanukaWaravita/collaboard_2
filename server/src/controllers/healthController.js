export function getHealth(request, response) {
  response.status(200).json({
    status: "ok",
    message: "CollabBoard API is running",
    timestamp: new Date().toISOString(),
  });
}
