import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const packageJson = JSON.parse(readFileSync("package.json", "utf8"));

describe("tooling scripts", () => {
  it("uses a live-reload dev server on the standard local port", () => {
    expect(packageJson.scripts.dev).toContain("live-server");
    expect(packageJson.scripts.dev).toContain("--port=5173");
    expect(packageJson.scripts.dev).toContain("--no-browser");
    expect(packageJson.scripts.dev).toContain("--watch=index.html,styles.css,app.js,src,sw.js");
    expect(packageJson.scripts.devl).toBeUndefined();
  });
});
