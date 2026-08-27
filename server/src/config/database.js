import mongoose from "mongoose";

export async function connectDatabase() {
  const mongodbUri =
    process.env.MONGODB_URI?.trim();

  if (!mongodbUri) {
    throw new Error(
      "MONGODB_URI is not configured",
    );
  }

  await mongoose.connect(mongodbUri, {
    serverSelectionTimeoutMS: 10000,
  });

  console.log(
    `MongoDB connected: ${mongoose.connection.name}`,
  );
}

export async function disconnectDatabase() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}

export function isDatabaseConnected() {
  return mongoose.connection.readyState === 1;
}