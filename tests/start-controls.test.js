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

describe("start controls", () => {
  beforeEach(async () => {
    vi.resetModules();
    localStorage.clear();
    mountDom();
    localStorage.setItem("coachtimer:athletes", JSON.stringify(["Ada", "Grace"]));
    localStorage.setItem("coachtimer:setup", JSON.stringify({
      sport: "cycling",
      eventType: "Practice",
      distanceId: "cycling-5k",
      startMode: "staggered",
      selectedAthletes: ["Ada", "Grace"],
      totalLaps: 12.5
    }));

    await import("../app.js");
  });

  it("shows a started state immediately after tapping a staggered start button", () => {
    const startSetup = /** @type {HTMLButtonElement} */ (getElement("#start-setup"));
    startSetup.click();

    const buttons = /** @type {HTMLButtonElement[]} */ (Array.from(document.querySelectorAll("#start-controls .athlete-pill button")));
    expect(buttons).toHaveLength(2);

    const [firstButton, secondButton] = buttons;
    expect(firstButton.textContent).toBe("Start");
    expect(firstButton.classList.contains("is-started")).toBe(false);
    expect(firstButton.disabled).toBe(false);

    firstButton.click();

    expect(firstButton.textContent).toBe("Started");
    expect(firstButton.classList.contains("is-started")).toBe(true);
    expect(firstButton.disabled).toBe(true);
    expect(secondButton.textContent).toBe("Start");
    expect(secondButton.disabled).toBe(false);
  });
});
