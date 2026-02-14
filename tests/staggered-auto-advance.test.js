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

describe("staggered live auto-advance", () => {
  /** @type {number} */
  let nowMs = 0;

  beforeEach(async () => {
    vi.useFakeTimers();
    vi.resetModules();
    localStorage.clear();
    mountDom();
    ensureAnimateApi();
    localStorage.setItem("coachtimer:athletes", JSON.stringify(["Ada", "Grace"]));
    localStorage.setItem("coachtimer:setup", JSON.stringify({
      sport: "cycling",
      eventType: "Practice",
      distanceId: "cycling-5k",
      startMode: "staggered",
      selectedAthletes: ["Ada", "Grace"],
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
    vi.useRealTimers();
  });

  it("cycles to the next unfinished athlete after each lap", () => {
    getButton("#start-setup").click();
    const startButtons = /** @type {HTMLButtonElement[]} */ (Array.from(document.querySelectorAll("#start-controls .athlete-pill button")));
    startButtons[0].click();
    nowMs += 100;
    startButtons[1].click();

    const activeAthleteName = getElement("#live-athlete-name");
    const lapButton = getButton("#lap-button");
    const switchFlash = getElement("#live-switch-flash");
    expect(activeAthleteName.textContent).toBe("Ada");
    expect(lapButton.textContent).toBe("Lap 1 / 1 (AD)");

    nowMs = 5000;
    lapButton.click();
    expect(activeAthleteName.textContent).toBe("Grace");
    expect(lapButton.textContent).toBe("Lap 1 / 1 (GR)");
    expect(switchFlash.textContent).toBe("Now timing: GR");
    expect(switchFlash.classList.contains("visible")).toBe(true);
    vi.advanceTimersByTime(2000);
    expect(switchFlash.classList.contains("visible")).toBe(false);

    nowMs = 8000;
    lapButton.click();
    expect(activeAthleteName.textContent).toBe("Ada");
    expect(lapButton.textContent).toBe("Lap 1 / 1 (AD)");
    expect(switchFlash.textContent).toBe("Now timing: AD");
  });

  it("moves to the next unfinished athlete after finish and completes results when all finish", () => {
    getButton("#start-setup").click();
    const startButtons = /** @type {HTMLButtonElement[]} */ (Array.from(document.querySelectorAll("#start-controls .athlete-pill button")));
    startButtons[0].click();
    nowMs += 100;
    startButtons[1].click();

    const activeAthleteName = getElement("#live-athlete-name");
    const lapButton = getButton("#lap-button");
    const finishButton = getButton("#finish-button");
    const switchFlash = getElement("#live-switch-flash");

    nowMs = 5000;
    lapButton.click();
    nowMs = 8000;
    lapButton.click();
    expect(activeAthleteName.textContent).toBe("Ada");
    expect(finishButton.hidden).toBe(false);

    nowMs = 11000;
    finishButton.click();
    expect(activeAthleteName.textContent).toBe("Grace");
    expect(finishButton.hidden).toBe(false);
    expect(switchFlash.textContent).toBe("Now timing: GR");
    expect(switchFlash.classList.contains("visible")).toBe(true);

    nowMs = 14000;
    finishButton.click();
    expect(getElement("#screen-results").classList.contains("active")).toBe(true);
  });
});
