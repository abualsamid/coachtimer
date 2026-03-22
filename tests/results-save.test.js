import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const appHtml = readFileSync("index.html", "utf8");
const bodyMatch = appHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i);

if (!bodyMatch) {
  throw new Error("Unable to load app body from index.html");
}

const appBodyHtml = bodyMatch[1].replace(/<script[\s\S]*?<\/script>/gi, "");

/**
 * @param {string} selector
 * @returns {HTMLElement}
 */
function getElement(selector) {
  const element = document.querySelector(selector);
  if (!(element instanceof HTMLElement)) {
    throw new Error(`Missing element: ${selector}`);
  }
  return element;
}

/**
 * @param {string} selector
 * @returns {HTMLButtonElement}
 */
function getButton(selector) {
  const element = getElement(selector);
  if (!(element instanceof HTMLButtonElement)) {
    throw new Error(`Expected button: ${selector}`);
  }
  return element;
}

function mountDom() {
  document.head.innerHTML = "";
  document.body.innerHTML = appBodyHtml;
}

function ensureAnimateApi() {
  if (typeof HTMLElement.prototype.animate === "function") return;
  Object.defineProperty(HTMLElement.prototype, "animate", {
    configurable: true,
    writable: true,
    value: () => null
  });
}

describe("results saving", () => {
  /** @type {number} */
  let nowMs = 0;

  beforeEach(async () => {
    vi.resetModules();
    localStorage.clear();
    mountDom();
    ensureAnimateApi();
    localStorage.setItem("coachtimer:athletes", JSON.stringify(["Ada"]));
    localStorage.setItem("coachtimer:setup", JSON.stringify({
      sport: "cycling",
      eventType: "Practice",
      distanceId: "cycling-5k",
      startMode: "mass",
      selectedAthletes: ["Ada"],
      totalLaps: 2
    }));

    nowMs = 1000;
    vi.spyOn(Date, "now").mockImplementation(() => nowMs);
    vi.stubGlobal("requestAnimationFrame", () => 1);
    vi.stubGlobal("cancelAnimationFrame", () => {});

    await import("../app.js");
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("does not duplicate a race if save is triggered twice", () => {
    getButton("#start-setup").click();
    getButton("#start-controls button").click();

    nowMs = 4000;
    getButton("#lap-button").click();

    nowMs = 7000;
    getButton("#finish-button").click();

    expect(getElement("#screen-results").classList.contains("active")).toBe(true);

    const saveResults = getButton("#save-results");
    saveResults.click();
    saveResults.click();

    const history = JSON.parse(localStorage.getItem("coachtimer:history") ?? "[]");
    expect(history).toHaveLength(1);
    expect(history[0].athleteName).toBe("Ada");
  });
});
