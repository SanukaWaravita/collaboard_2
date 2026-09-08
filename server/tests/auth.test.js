import { afterAll, beforeAll, beforeEach, describe, expect, test } from "@jest/globals";
import bcrypt from "bcryptjs";
import request from "supertest";
import app from "../src/app.js";
import { User } from "../src/models/index.js";
import { clearTestDatabase, startTestDatabase, stopTestDatabase } from "./helpers/database.js";

beforeAll(startTestDatabase, 120000);
beforeEach(clearTestDatabase);
afterAll(stopTestDatabase);

const account = { name: "Test Member", email: "member@example.com", password: "test-password" };

describe("Authentication API", () => {
  test("registration stores a hash, hides it from the response, and issues a usable token", async () => {
    const response = await request(app).post("/api/auth/register").send(account).expect(201);
    expect(response.body.user).toEqual({ id: expect.any(String), name: account.name, email: account.email });
    const stored = await User.findById(response.body.user.id).select("+passwordHash");
    expect(stored.passwordHash).not.toBe(account.password);
    expect(await bcrypt.compare(account.password, stored.passwordHash)).toBe(true);
    await request(app).get("/api/workspaces").auth(response.body.token, { type: "bearer" }).expect(200);
  });

  test("duplicate email registration is rejected regardless of case", async () => {
    await request(app).post("/api/auth/register").send(account).expect(201);
    await request(app).post("/api/auth/register").send({ ...account, email: " MEMBER@EXAMPLE.COM " }).expect(409);
    expect(await User.countDocuments()).toBe(1);
  });

  test("login accepts correct credentials and rejects a wrong password", async () => {
    await request(app).post("/api/auth/register").send(account).expect(201);
    const login = await request(app).post("/api/auth/login").send(account).expect(200);
    expect(login.body.token).toEqual(expect.any(String));
    expect(login.body.user).not.toHaveProperty("passwordHash");
    const rejected = await request(app).post("/api/auth/login").send({ ...account, password: "wrong-password" }).expect(401);
    expect(rejected.body.message).toBe("Invalid email or password");
    expect(rejected.body).not.toHaveProperty("token");
  });
});
