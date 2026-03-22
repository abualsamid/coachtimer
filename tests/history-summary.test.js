import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it, vi } from "vitest";

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

function mountDom() {
  document.head.innerHTML = "";
  document.body.innerHTML = appBodyHtml;
}

describe("history summary", () => {
  beforeEach(async () => {
    vi.resetModules();
    localStorage.clear();
    mountDom();
    localStorage.setItem("coachtimer:history", JSON.stringify([
      {
        id: "2026-03-20-asia-5k",
        athleteName: "Asia",
        sport: "Cycling",
        eventType: "Practice",
        distance: "5k (12.5 laps)",
        totalLaps: 12.5,
        startMode: "mass",
        startTime: 0,
        lapTimestamps: [1],
        lapSplitsMs: [330000],
        finishTime: 330000,
        totalTimeMs: 330000,
        averageLapMs: 26400,
        dateISO: "2026-03-20T14:00:00.000Z",
        notes: ""
      },
      {
        id: "2026-03-21-asia-5k",
        athleteName: "Asia",
        sport: "Cycling",
        eventType: "Practice",
        distance: "5k (12.5 laps)",
        totalLaps: 12.5,
        startMode: "mass",
        startTime: 0,
        lapTimestamps: [1],
        lapSplitsMs: [320000],
        finishTime: 320000,
        totalTimeMs: 320000,
        averageLapMs: 25600,
        dateISO: "2026-03-21T14:00:00.000Z",
        notes: ""
      },
      {
        id: "2026-03-22-asia-10k",
        athleteName: "Asia",
        sport: "Cycling",
        eventType: "Practice",
        distance: "10k (25 laps)",
        totalLaps: 25,
        startMode: "mass",
        startTime: 0,
        lapTimestamps: [1],
        lapSplitsMs: [700000],
        finishTime: 700000,
        totalTimeMs: 700000,
        averageLapMs: 28000,
        dateISO: "2026-03-22T14:00:00.000Z",
        notes: ""
      },
      {
        id: "2026-03-22-bassel-5k",
        athleteName: "Bassel",
        sport: "Cycling",
        eventType: "Practice",
        distance: "5k (12.5 laps)",
        totalLaps: 12.5,
        startMode: "mass",
        startTime: 0,
        lapTimestamps: [1],
        lapSplitsMs: [340000],
        finishTime: 340000,
        totalTimeMs: 340000,
        averageLapMs: 27200,
        dateISO: "2026-03-22T15:00:00.000Z",
        notes: ""
      }
    ]));

    await import("../app.js");
  });

  it("shows athlete progress grouped by race type", () => {
    const historyButton = /** @type {HTMLButtonElement} */ (getElement("#history-nav"));
    const athleteFilter = /** @type {HTMLSelectElement} */ (getElement("#history-athlete-filter"));

    historyButton.click();
    athleteFilter.value = "Asia";
    athleteFilter.dispatchEvent(new Event("change"));

    const summary = getElement("#history-summary").textContent ?? "";

    expect(summary).toContain("Asia Progress");
    expect(summary).toContain("3 saved races");
    expect(summary).toContain("Best total");
    expect(summary).toContain("05:20.000");
    expect(summary).toContain("Cycling · 5k (12.5 laps)");
    expect(summary).toContain("Faster by 00:10.000");
    expect(summary).toContain("Cycling · 10k (25 laps)");
  });
});
