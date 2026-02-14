import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("service worker cache strategy", () => {
  it("uses network-first for static assets with cache fallback", () => {
    const sw = readFileSync("sw.js", "utf8");

    expect(sw).toContain("event.respondWith(networkFirstStatic(request));");
    expect(sw).toContain("async function networkFirstStatic(request)");
    expect(sw).toContain("const response = await fetch(request);");
    expect(sw).toContain("const cached = await caches.match(request);");
    expect(sw).toContain("return cached || new Response");
    expect(sw).not.toContain("cacheFirstStatic");
  });
});
