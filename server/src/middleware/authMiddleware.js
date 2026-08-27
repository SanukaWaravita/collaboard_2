import jwt from "jsonwebtoken";
import User from "../models/User.js";

export async function authenticateUser(
  request,
  response,
  next,
) {
  const authorizationHeader =
    request.get("Authorization");

  if (
    !authorizationHeader ||
    !authorizationHeader.startsWith(
      "Bearer ",
    )
  ) {
    return response.status(401).json({
      message:
        "Authentication required",
    });
  }

  const token = authorizationHeader
    .slice("Bearer ".length)
    .trim();

  const secret = process.env.JWT_SECRET;

  if (!secret) {
    const error = new Error(
      "JWT secret is not configured",
    );

    error.status = 500;

    return next(error);
  }

  let decodedToken;

  try {
    decodedToken = jwt.verify(
      token,
      secret,
      {
        algorithms: ["HS256"],
      },
    );
  } catch {
    return response.status(401).json({
      message:
        "Invalid or expired token",
    });
  }

  if (
    typeof decodedToken.sub !== "string" ||
    !decodedToken.sub
  ) {
    return response.status(401).json({
      message:
        "Invalid or expired token",
    });
  }

  try {
    const user =
      await User.findById(
        decodedToken.sub,
      );

    if (!user) {
      return response.status(401).json({
        message:
          "Invalid or expired token",
      });
    }

    request.user = {
      id: user.id,
      name: user.name,
      email: user.email,
    };

    return next();
  } catch (error) {
    return next(error);
  }
}