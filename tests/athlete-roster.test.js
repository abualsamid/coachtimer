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

describe("athlete roster", () => {
  beforeEach(async () => {
    vi.resetModules();
    localStorage.clear();
    mountDom();
    localStorage.setItem("coachtimer:athletes", JSON.stringify(["Asia", "Bassel"]));
    localStorage.setItem("coachtimer:setup", JSON.stringify({
      sport: "cycling",
      eventType: "Practice",
      distanceId: "cycling-5k",
      startMode: "mass",
      selectedAthletes: [],
      totalLaps: 12.5
    }));

    await import("../app.js");
  });

  it("reuses a saved athlete when the new entry only differs by case", () => {
    const athleteInput = /** @type {HTMLInputElement} */ (getElement("#athlete-input"));
    const athleteList = getElement("#athlete-list");

    athleteInput.value = "asia";
    getElement("#add-athlete").click();

    const savedAthletes = JSON.parse(localStorage.getItem("coachtimer:athletes") ?? "[]");
    const selectedAthletes = JSON.parse(localStorage.getItem("coachtimer:setup") ?? "{}").selectedAthletes;
    const checkboxes = Array.from(document.querySelectorAll("#athlete-list input[type='checkbox']"));

    expect(savedAthletes).toEqual(["Asia", "Bassel"]);
    expect(selectedAthletes).toEqual(["Asia"]);
    expect(checkboxes).toHaveLength(2);
    expect(athleteList.textContent).toContain("Asia");
  });
});
