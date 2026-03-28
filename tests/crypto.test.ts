import { describe, it, expect } from "vitest";
import { encrypt, decrypt } from "@/lib/crypto";

const TEST_KEY = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

describe("crypto", () => {
  it("encrypts and decrypts a string round-trip", () => {
    const plaintext = JSON.stringify({ annualIncome: 4000000, occupation: "engineer" });
    const encrypted = encrypt(plaintext, TEST_KEY);
    const decrypted = decrypt(encrypted, TEST_KEY);
    expect(decrypted).toBe(plaintext);
  });

  it("produces different ciphertext for same plaintext (random IV)", () => {
    const plaintext = "same input";
    const a = encrypt(plaintext, TEST_KEY);
    const b = encrypt(plaintext, TEST_KEY);
    expect(a).not.toBe(b);
  });

  it("fails to decrypt with wrong key", () => {
    const plaintext = "secret";
    const encrypted = encrypt(plaintext, TEST_KEY);
    const wrongKey = "abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789";
    expect(() => decrypt(encrypted, wrongKey)).toThrow();
  });
});
