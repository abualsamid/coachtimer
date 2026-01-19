import { describe, expect, it } from "vitest";

describe("project setup", () => {
  it("runs tests in the browser-like environment", () => {
    expect(typeof window).toBe("object");
  });
});
