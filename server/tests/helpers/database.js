import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

let database;

export async function startTestDatabase() {
  // An isolated real mongod process, not Atlas or the development database.
  // Fail setup if MongoDB cannot start; never fall back to a configured URI.
  database = await MongoMemoryServer.create();
  await mongoose.connect(database.getUri(), { dbName: "collaboard_m4_test" });
  await Promise.all(Object.values(mongoose.models).map((model) => model.init()));
}

export async function clearTestDatabase() {
  await Promise.all(
    Object.values(mongoose.connection.collections).map((collection) => collection.deleteMany({})),
  );
}

export async function stopTestDatabase() {
  try {
    await mongoose.disconnect();
  } finally {
    await database?.stop();
  }
}
