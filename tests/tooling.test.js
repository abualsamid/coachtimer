import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const packageJson = JSON.parse(readFileSync("package.json", "utf8"));

describe("tooling scripts", () => {
  it("uses a live-reload dev server on the standard local port", () => {
    expect(packageJson.scripts.dev).toContain("vite");
    expect(packageJson.scripts.dev).toContain("--port 5173");
    expect(packageJson.scripts.dev).toContain("--strictPort");
    expect(packageJson.scripts.devl).toBeUndefined();
  });
});
