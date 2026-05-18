import { afterEach, describe, expect, it } from "vitest";
import {
  createProviderSessionToken,
  validateProviderCredentials,
  verifyProviderSessionToken,
} from "./provider-auth";

const originalEnv = { ...process.env };

describe("provider auth", () => {
  afterEach(() => {
    for (const key of [
      "CARDIGAN_PROVIDER_EMAIL",
      "CARDIGAN_PROVIDER_PASSCODE",
      "CARDIGAN_SESSION_SECRET",
    ]) {
      if (originalEnv[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = originalEnv[key];
      }
    }
  });

  it("validates the configured provider passcode", () => {
    delete process.env.CARDIGAN_PROVIDER_EMAIL;
    process.env.CARDIGAN_PROVIDER_PASSCODE = "test-provider-passcode";

    expect(
      validateProviderCredentials({
        email: "christopher@cardiganincorporated.com",
        passcode: "test-provider-passcode",
      }),
    ).toBe(true);
    expect(
      validateProviderCredentials({
        email: "christopher@cardiganincorporated.com",
        passcode: "wrong",
      }),
    ).toBe(false);
  });

  it("rejects provider login when no passcode is configured", () => {
    delete process.env.CARDIGAN_PROVIDER_PASSCODE;

    expect(
      validateProviderCredentials({
        email: "christopher@cardiganincorporated.com",
        passcode: "test-provider-passcode",
      }),
    ).toBe(false);
  });

  it("signs and verifies a provider session token", () => {
    process.env.CARDIGAN_SESSION_SECRET = "test-secret";
    const now = Date.UTC(2026, 4, 16);
    const token = createProviderSessionToken(now);

    expect(verifyProviderSessionToken(token, now + 1000)?.providerId).toBe("provider-cmb");
    expect(verifyProviderSessionToken(`${token}x`, now + 1000)).toBeNull();
    expect(verifyProviderSessionToken(token, now + 1000 * 60 * 60 * 13)).toBeNull();
  });
});
