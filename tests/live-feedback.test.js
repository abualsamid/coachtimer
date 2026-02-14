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

describe("live lap feedback", () => {
  /** @type {number} */
  let nowMs = 0;
  /** @type {FrameRequestCallback | null} */
  let animationFrameCallback = null;

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
      totalLaps: 12.5
    }));

    nowMs = 1000;
    vi.spyOn(Date, "now").mockImplementation(() => nowMs);
    vi.stubGlobal("requestAnimationFrame", (/** @type {FrameRequestCallback} */ callback) => {
      animationFrameCallback = callback;
      return 1;
    });
    vi.stubGlobal("cancelAnimationFrame", () => {});

    await import("../app.js");
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("updates lap count on the lap button and resets the current-lap timer after a lap", () => {
    getButton("#start-setup").click();
    getButton("#start-controls button").click();

    const lapButton = getButton("#lap-button");
    const currentLapTimer = getElement("#current-lap-timer");
    const lapCounter = getElement("#lap-counter");

    expect(lapButton.textContent).toBe("Lap 1 / 12 (AD)");
    expect(currentLapTimer.textContent).toBe("Current lap: 00:00.000");

    nowMs = 4750;
    if (animationFrameCallback) {
      animationFrameCallback(0);
    }
    expect(currentLapTimer.textContent).toBe("Current lap: 00:03.750");

    nowMs = 5000;
    lapButton.click();

    expect(lapButton.textContent).toBe("Lap 2 / 12 (AD)");
    expect(lapCounter.textContent).toBe("Lap 1 / 12.5");
    expect(currentLapTimer.textContent).toBe("Current lap: 00:00.000");
  });

  it("shows lap button labels from 1 through 24 before finish in a 25-lap race", async () => {
    localStorage.setItem("coachtimer:setup", JSON.stringify({
      sport: "cycling",
      eventType: "Practice",
      distanceId: "cycling-10k",
      startMode: "mass",
      selectedAthletes: ["Ada"],
      totalLaps: 25
    }));

    vi.resetModules();
    mountDom();
    ensureAnimateApi();
    await import("../app.js");

    getButton("#start-setup").click();
    getButton("#start-controls button").click();

    const lapButton = getButton("#lap-button");
    const finishButton = getButton("#finish-button");
    expect(lapButton.textContent).toBe("Lap 1 / 24 (AD)");
    expect(lapButton.hidden).toBe(false);
    expect(finishButton.hidden).toBe(true);

    for (let count = 0; count < 23; count += 1) {
      nowMs += 2100;
      lapButton.click();
    }

    expect(lapButton.textContent).toBe("Lap 24 / 24 (AD)");
    expect(lapButton.hidden).toBe(false);
    expect(finishButton.hidden).toBe(true);

    nowMs += 2100;
    lapButton.click();
    expect(lapButton.hidden).toBe(true);
    expect(finishButton.hidden).toBe(false);
  });
});
