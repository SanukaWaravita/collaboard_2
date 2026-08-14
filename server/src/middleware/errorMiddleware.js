export function errorMiddleware(
  error,
  request,
  response,
  next,
) {
  if (response.headersSent) {
    return next(error);
  }

  if (error.type === "entity.parse.failed") {
    return response.status(400).json({
      message: "Request body contains invalid JSON",
    });
  }

  const statusCode =
    Number.isInteger(error.status) && error.status >= 400
      ? error.status
      : 500;

  if (statusCode >= 500) {
    console.error(error);

    return response.status(statusCode).json({
      message: "An unexpected server error occurred",
    });
  }

  return response.status(statusCode).json({
    message: error.message || "Request failed",
  });
}
