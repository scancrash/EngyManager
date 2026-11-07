import { describe, expect, it } from "vitest";
import { createToken, verifyToken, SESSION_SECONDS } from "./auth";
import { hashPassword, verifyPassword } from "./password";

describe("session token", () => {
  const secret = "test-secret";

  it("accepts a fresh token", async () => {
    expect(await verifyToken(await createToken(secret), secret)).toBe(true);
  });

  it("rejects wrong secret, tampering, missing and malformed tokens", async () => {
    const t = await createToken(secret);
    expect(await verifyToken(t, "other")).toBe(false);
    const [exp, sig] = t.split(".");
    expect(await verifyToken(`${Number(exp) + 1}.${sig}`, secret)).toBe(false);
    expect(await verifyToken(undefined, secret)).toBe(false);
    expect(await verifyToken(t, undefined)).toBe(false);
    expect(await verifyToken("garbage", secret)).toBe(false);
  });

  it("rejects an expired token", async () => {
    const t = await createToken(secret, Date.now() - (SESSION_SECONDS + 10) * 1000);
    expect(await verifyToken(t, secret)).toBe(false);
  });
});

describe("password hashing", () => {
  const stored = hashPassword("correct horse");

  it("verifies the right password only", () => {
    expect(verifyPassword("correct horse", stored)).toBe(true);
    expect(verifyPassword("wrong", stored)).toBe(false);
  });

  it("rejects missing or malformed stored values", () => {
    expect(verifyPassword("x", undefined)).toBe(false);
    expect(verifyPassword("x", "plaintext")).toBe(false);
  });

  it("stored value contains no $ (dotenv-safe)", () => {
    expect(stored.includes("$")).toBe(false);
  });
});
