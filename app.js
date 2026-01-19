// @ts-check
import {
  buildCsv,
  canFinish,
  computeLapSplits,
  computeTotalTime,
  formatDuration,
  normalizeName,
  replaceHistoryAthlete,
  replaceName
} from "./src/logic.js";

/**
 * @typedef {Object} AthleteTiming
 * @property {string} athleteName
 * @property {number} totalLaps
 * @property {number | null} startTime
 * @property {number[]} lapTimestamps
 * @property {number[]} lapSplitsMs
 * @property {number | null} finishTime
 */

/**
 * @typedef {Object} Setup
 * @property {string} sport
 * @property {string} eventType
 * @property {string} distanceId
 * @property {string} startMode
 * @property {string[]} selectedAthletes
 */

/**
 * @typedef {Object} Session
 * @property {string} sport
 * @property {string} eventType
 * @property {string} distance
 * @property {number} totalLaps
 * @property {string} startMode
 * @property {string[]} participants
 * @property {Record<string, AthleteTiming>} athleteTimings
 * @property {number} activeIndex
 */

/**
 * @typedef {Object} ResultRecord
 * @property {string} id
 * @property {string} athleteName
 * @property {string} sport
 * @property {string} eventType
 * @property {string} distance
 * @property {number} totalLaps
 * @property {string} startMode
 * @property {number | null} startTime
 * @property {number[]} lapTimestamps
 * @property {number[]} lapSplitsMs
 * @property {number | null} finishTime
 * @property {number | null} totalTimeMs
 * @property {number | null} averageLapMs
 * @property {string} dateISO
 * @property {string} notes
 */

/**
 * @template {Element} T
 * @param {string} selector
 * @returns {T}
 */
function getRequiredElement(selector) {
  const element = document.querySelector(selector);
  if (!element) {
    throw new Error(`Missing element: ${selector}`);
  }
  return /** @type {T} */ (element);
}

const STORAGE_KEYS = {
  athletes: "coachtimer:athletes",
  setup: "coachtimer:setup",
  history: "coachtimer:history"
};

/** @type {Record<string, { label: string, distances: { id: string, label: string, totalLaps: number }[] }>} */
const SPORT_CONFIG = {
  cycling: {
    label: "Cycling",
    distances: [
      { id: "cycling-5k", label: "5k (12.5 laps)", totalLaps: 12.5 },
      { id: "cycling-10k", label: "10k (25 laps)", totalLaps: 25 }
    ]
  },
  sup: {
    label: "Stand-Up Paddleboarding (SUP)",
    distances: [
      { id: "sup-1lap", label: "1 lap", totalLaps: 1 },
      { id: "sup-2lap", label: "2 laps", totalLaps: 2 }
    ]
  }
};

const EVENT_TYPES = ["Practice", "Area Games", "Regional Games", "State Games"];
const START_MODES = [
  { id: "mass", label: "Mass start" },
  { id: "staggered", label: "Staggered start" }
];

/** @type {Setup} */
const defaultSetup = {
  sport: "cycling",
  eventType: EVENT_TYPES[0],
  distanceId: "cycling-5k",
  startMode: "mass",
  selectedAthletes: []
};

/** @type {{ athletes: string[], setup: Setup, session: Session | null, history: ResultRecord[], resultsDraft: ResultRecord[], resultsSaved: boolean }} */
const state = {
  athletes: [],
  setup: { ...defaultSetup },
  session: null,
  history: [],
  resultsDraft: [],
  resultsSaved: true
};

const elements = {
  screens: {
    setup: /** @type {HTMLElement} */ (getRequiredElement("#screen-setup")),
    start: /** @type {HTMLElement} */ (getRequiredElement("#screen-start")),
    live: /** @type {HTMLElement} */ (getRequiredElement("#screen-live")),
    results: /** @type {HTMLElement} */ (getRequiredElement("#screen-results")),
    history: /** @type {HTMLElement} */ (getRequiredElement("#screen-history"))
  },
  sportSelect: /** @type {HTMLSelectElement} */ (getRequiredElement("#sport-select")),
  eventSelect: /** @type {HTMLSelectElement} */ (getRequiredElement("#event-select")),
  distanceSelect: /** @type {HTMLSelectElement} */ (getRequiredElement("#distance-select")),
  startModeSelect: /** @type {HTMLSelectElement} */ (getRequiredElement("#start-mode-select")),
  athleteInput: /** @type {HTMLInputElement} */ (getRequiredElement("#athlete-input")),
  addAthlete: /** @type {HTMLButtonElement} */ (getRequiredElement("#add-athlete")),
  athleteList: /** @type {HTMLElement} */ (getRequiredElement("#athlete-list")),
  startSetup: /** @type {HTMLButtonElement} */ (getRequiredElement("#start-setup")),
  startContext: /** @type {HTMLElement} */ (getRequiredElement("#start-context")),
  startControls: /** @type {HTMLElement} */ (getRequiredElement("#start-controls")),
  startLive: /** @type {HTMLButtonElement} */ (getRequiredElement("#start-live")),
  backToSetup: /** @type {HTMLButtonElement} */ (getRequiredElement("#back-to-setup")),
  backToSetup2: /** @type {HTMLButtonElement} */ (getRequiredElement("#back-to-setup-2")),
  liveAthleteName: /** @type {HTMLElement} */ (getRequiredElement("#live-athlete-name")),
  liveAthleteIndex: /** @type {HTMLElement} */ (getRequiredElement("#live-athlete-index")),
  liveTimer: /** @type {HTMLElement} */ (getRequiredElement("#live-timer")),
  lapCounter: /** @type {HTMLElement} */ (getRequiredElement("#lap-counter")),
  lastSplit: /** @type {HTMLElement} */ (getRequiredElement("#last-split")),
  lapButton: /** @type {HTMLButtonElement} */ (getRequiredElement("#lap-button")),
  finishButton: /** @type {HTMLButtonElement} */ (getRequiredElement("#finish-button")),
  prevAthlete: /** @type {HTMLButtonElement} */ (getRequiredElement("#prev-athlete")),
  nextAthlete: /** @type {HTMLButtonElement} */ (getRequiredElement("#next-athlete")),
  resultsList: /** @type {HTMLElement} */ (getRequiredElement("#results-list")),
  saveResults: /** @type {HTMLButtonElement} */ (getRequiredElement("#save-results")),
  exportResults: /** @type {HTMLButtonElement} */ (getRequiredElement("#export-results")),
  newRace: /** @type {HTMLButtonElement} */ (getRequiredElement("#new-race")),
  historyNav: /** @type {HTMLButtonElement} */ (getRequiredElement("#history-nav")),
  historyAthleteFilter: /** @type {HTMLSelectElement} */ (getRequiredElement("#history-athlete-filter")),
  historySportFilter: /** @type {HTMLSelectElement} */ (getRequiredElement("#history-sport-filter")),
  historyEventFilter: /** @type {HTMLSelectElement} */ (getRequiredElement("#history-event-filter")),
  historyList: /** @type {HTMLElement} */ (getRequiredElement("#history-list")),
  exportHistory: /** @type {HTMLButtonElement} */ (getRequiredElement("#export-history"))
};

/** @type {number | null} */
let liveTimerHandle = null;
/** @type {number | null} */
let touchStartX = null;

init();

function init() {
  state.athletes = loadJson(STORAGE_KEYS.athletes, []);
  state.history = loadJson(STORAGE_KEYS.history, []);
  state.setup = { ...defaultSetup, ...loadJson(STORAGE_KEYS.setup, {}) };

  renderSetupOptions();
  renderAthleteList();
  renderHistoryFilters();
  renderHistoryList();
  updateSetupSelections();
  bindEvents();
  updateStartButton();
}

function bindEvents() {
  elements.sportSelect.addEventListener("change", () => {
    state.setup.sport = elements.sportSelect.value;
    const distances = SPORT_CONFIG[state.setup.sport].distances;
    state.setup.distanceId = distances[0].id;
    persistSetup();
    renderSetupOptions();
  });

  elements.eventSelect.addEventListener("change", () => {
    state.setup.eventType = elements.eventSelect.value;
    persistSetup();
  });

  elements.distanceSelect.addEventListener("change", () => {
    state.setup.distanceId = elements.distanceSelect.value;
    persistSetup();
  });

  elements.startModeSelect.addEventListener("change", () => {
    state.setup.startMode = elements.startModeSelect.value;
    persistSetup();
  });

  elements.addAthlete.addEventListener("click", () => {
    const name = normalizeName(elements.athleteInput.value);
    if (!name) return;
    if (!state.athletes.includes(name)) {
      state.athletes.push(name);
      state.setup.selectedAthletes = Array.from(new Set([...state.setup.selectedAthletes, name]));
      persistAthletes();
      persistSetup();
    }
    elements.athleteInput.value = "";
    renderAthleteList();
    updateStartButton();
  });

  elements.athleteInput.addEventListener("keydown", /** @param {KeyboardEvent} event */ (event) => {
    if (event.key === "Enter") {
      elements.addAthlete.click();
    }
  });

  elements.startSetup.addEventListener("click", () => {
    if (state.setup.selectedAthletes.length === 0) return;
    createSession();
    showScreen("start");
    renderStartControls();
  });

  elements.startLive.addEventListener("click", () => {
    if (!state.session) return;
    if (!allAthletesStarted()) return;
    showScreen("live");
    startLiveTimer();
  });

  elements.backToSetup.addEventListener("click", () => {
    showScreen("setup");
  });
  elements.backToSetup2.addEventListener("click", () => {
    showScreen("setup");
  });

  elements.prevAthlete.addEventListener("click", () => switchAthlete(-1));
  elements.nextAthlete.addEventListener("click", () => switchAthlete(1));

  elements.lapButton.addEventListener("click", () => {
    recordLap();
  });

  elements.finishButton.addEventListener("click", () => {
    finishAthlete();
  });

  elements.saveResults.addEventListener("click", () => {
    saveResults();
    showScreen("history");
  });

  elements.exportResults.addEventListener("click", () => {
    if (state.resultsDraft.length === 0) return;
    downloadCsv(buildCsv(state.resultsDraft), "race-results.csv");
  });

  elements.newRace.addEventListener("click", () => {
    if (!state.resultsSaved && state.resultsDraft.length > 0) {
      const ok = confirm("Start a new race without saving results?");
      if (!ok) return;
    }
    resetSession();
    showScreen("setup");
  });

  elements.historyNav.addEventListener("click", () => {
    showScreen("history");
  });

  elements.exportHistory.addEventListener("click", () => {
    if (state.history.length === 0) return;
    downloadCsv(buildCsv(state.history), "all-results.csv");
  });

  elements.historyAthleteFilter.addEventListener("change", renderHistoryList);
  elements.historySportFilter.addEventListener("change", renderHistoryList);
  elements.historyEventFilter.addEventListener("change", renderHistoryList);

  elements.screens.live.addEventListener("touchstart", (event) => {
    const touchEvent = /** @type {TouchEvent} */ (event);
    touchStartX = touchEvent.touches[0].clientX;
  });

  elements.screens.live.addEventListener("touchend", (event) => {
    const touchEvent = /** @type {TouchEvent} */ (event);
    if (touchStartX === null) return;
    const endX = touchEvent.changedTouches[0].clientX;
    const delta = endX - touchStartX;
    if (Math.abs(delta) > 50) {
      switchAthlete(delta < 0 ? 1 : -1);
    }
    touchStartX = null;
  });
}

function renderSetupOptions() {
  elements.sportSelect.innerHTML = Object.entries(SPORT_CONFIG)
    .map(([id, config]) => `<option value="${id}">${config.label}</option>`)
    .join("");

  elements.eventSelect.innerHTML = EVENT_TYPES.map((event) => `<option value="${event}">${event}</option>`).join("");

  elements.startModeSelect.innerHTML = START_MODES.map(
    (mode) => `<option value="${mode.id}">${mode.label}</option>`
  ).join("");

  const distances = SPORT_CONFIG[state.setup.sport].distances;
  elements.distanceSelect.innerHTML = distances
    .map((distance) => `<option value="${distance.id}">${distance.label}</option>`)
    .join("");

  updateSetupSelections();
}

function updateSetupSelections() {
  elements.sportSelect.value = state.setup.sport;
  elements.eventSelect.value = state.setup.eventType;
  elements.startModeSelect.value = state.setup.startMode;
  elements.distanceSelect.value = state.setup.distanceId;
}

function renderAthleteList() {
  elements.athleteList.innerHTML = "";
  if (state.athletes.length === 0) {
    elements.athleteList.innerHTML = "<p class=\"muted\">Add athletes to begin.</p>";
    return;
  }

  state.athletes.forEach((name) => {
    const wrapper = document.createElement("div");
    wrapper.className = "athlete-pill";
    const label = document.createElement("label");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = state.setup.selectedAthletes.includes(name);
    checkbox.addEventListener("change", () => {
      if (checkbox.checked) {
        state.setup.selectedAthletes = Array.from(new Set([...state.setup.selectedAthletes, name]));
      } else {
        state.setup.selectedAthletes = state.setup.selectedAthletes.filter((athlete) => athlete !== name);
      }
      persistSetup();
      updateStartButton();
    });
    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(name));
    wrapper.appendChild(label);

    const actions = document.createElement("div");
    actions.className = "athlete-actions";
    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.className = "ghost";
    editButton.textContent = "Edit";
    editButton.addEventListener("click", () => editAthlete(name));
    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "ghost";
    deleteButton.textContent = "Remove";
    deleteButton.addEventListener("click", () => deleteAthlete(name));
    actions.appendChild(editButton);
    actions.appendChild(deleteButton);
    wrapper.appendChild(actions);
    elements.athleteList.appendChild(wrapper);
  });
}

function updateStartButton() {
  elements.startSetup.disabled = state.setup.selectedAthletes.length === 0;
}

function createSession() {
  const distance = findDistance(state.setup.distanceId);
  state.session = {
    sport: SPORT_CONFIG[state.setup.sport].label,
    eventType: state.setup.eventType,
    distance: distance.label,
    totalLaps: distance.totalLaps,
    startMode: state.setup.startMode,
    participants: [...state.setup.selectedAthletes],
    athleteTimings: {},
    activeIndex: 0
  };

  const session = /** @type {Session} */ (state.session);
  session.participants.forEach((name) => {
    session.athleteTimings[name] = {
      athleteName: name,
      totalLaps: distance.totalLaps,
      startTime: null,
      lapTimestamps: [],
      lapSplitsMs: [],
      finishTime: null
    };
  });

  state.resultsDraft = [];
  renderStartControls();
}

function renderStartControls() {
  if (!state.session) return;
  const { startMode, participants } = state.session;
  elements.startControls.innerHTML = "";
  elements.startContext.textContent = `${state.session.sport} · ${state.session.eventType} · ${state.session.distance}`;

  if (startMode === "mass") {
    const button = document.createElement("button");
    button.className = "primary xl";
    button.type = "button";
    button.textContent = "Start Race";
    button.addEventListener("click", () => {
      const now = Date.now();
      participants.forEach((name) => {
        startAthlete(name, now);
      });
      showScreen("live");
      startLiveTimer();
    });
    elements.startControls.appendChild(button);
    elements.startLive.disabled = true;
    return;
  }

  participants.forEach((name) => {
    const card = document.createElement("div");
    card.className = "athlete-pill";
    const label = document.createElement("div");
    label.textContent = name;
    const button = document.createElement("button");
    button.className = "primary";
    button.type = "button";
    button.textContent = "Start";
    button.disabled = Boolean(state.session?.athleteTimings[name].startTime);
    button.addEventListener("click", () => {
      startAthlete(name, Date.now());
      button.disabled = true;
      elements.startLive.disabled = !allAthletesStarted();
      if (allAthletesStarted()) {
        showScreen("live");
        startLiveTimer();
      }
    });
    card.appendChild(label);
    card.appendChild(button);
    elements.startControls.appendChild(card);
  });

  elements.startLive.disabled = !allAthletesStarted();
}

/**
 * @param {string} name
 * @param {number} startTime
 */
function startAthlete(name, startTime) {
  if (!state.session) return;
  const athlete = state.session.athleteTimings[name];
  if (!athlete || athlete.startTime !== null) return;
  athlete.startTime = startTime;
}

function allAthletesStarted() {
  if (!state.session) return false;
  return state.session.participants.every((name) => state.session?.athleteTimings[name].startTime !== null);
}

function startLiveTimer() {
  stopLiveTimer();
  updateLiveView();
  const tick = () => {
    updateLiveTimer();
    liveTimerHandle = requestAnimationFrame(tick);
  };
  liveTimerHandle = requestAnimationFrame(tick);
}

function stopLiveTimer() {
  if (liveTimerHandle !== null) {
    cancelAnimationFrame(liveTimerHandle);
    liveTimerHandle = null;
  }
}

function updateLiveTimer() {
  const athlete = getActiveAthleteTiming();
  if (!athlete || athlete.startTime === null) {
    elements.liveTimer.textContent = "00:00.000";
    return;
  }
  const finishTime = athlete.finishTime ?? Date.now();
  const total = computeTotalTime(athlete.startTime, finishTime) ?? 0;
  elements.liveTimer.textContent = formatDuration(total);
}

function recordLap() {
  const athlete = getActiveAthleteTiming();
  if (!athlete || athlete.startTime === null || athlete.finishTime !== null) return;
  const now = Date.now();
  athlete.lapTimestamps.push(now);
  athlete.lapSplitsMs = computeLapSplits(athlete.startTime, athlete.lapTimestamps);
  updateLiveView();
  flashButton(elements.lapButton);
}

function finishAthlete() {
  const athlete = getActiveAthleteTiming();
  if (!athlete || athlete.startTime === null || athlete.finishTime !== null) return;
  if (!canFinish(athlete.lapTimestamps, athlete.totalLaps)) return;
  athlete.finishTime = Date.now();
  updateLiveView();

  if (allAthletesFinished()) {
    finalizeResults();
    showScreen("results");
  }
}

function allAthletesFinished() {
  if (!state.session) return false;
  return state.session.participants.every((name) => state.session?.athleteTimings[name].finishTime !== null);
}

function finalizeResults() {
  const session = state.session;
  if (!session) return;
  const dateISO = new Date().toISOString();
  state.resultsDraft = session.participants.map((name) => {
    const athlete = session.athleteTimings[name];
    const totalTimeMs = computeTotalTime(athlete.startTime, athlete.finishTime);
    const averageLapMs = totalTimeMs ? Math.round(totalTimeMs / athlete.totalLaps) : null;
    return {
      id: `${dateISO}-${name}`,
      athleteName: name,
      sport: session.sport,
      eventType: session.eventType,
      distance: session.distance,
      totalLaps: athlete.totalLaps,
      startMode: session.startMode,
      startTime: athlete.startTime,
      lapTimestamps: [...athlete.lapTimestamps],
      lapSplitsMs: [...athlete.lapSplitsMs],
      finishTime: athlete.finishTime,
      totalTimeMs,
      averageLapMs,
      dateISO,
      notes: ""
    };
  });
  state.resultsSaved = false;
  renderResults();
}

function renderResults() {
  elements.resultsList.innerHTML = "";
  if (state.resultsDraft.length === 0) {
    elements.resultsList.innerHTML = "<p class=\"muted\">No results yet.</p>";
    return;
  }

  state.resultsDraft.forEach((result, index) => {
    const card = document.createElement("div");
    card.className = "result-card";
    const title = document.createElement("h3");
    title.textContent = result.athleteName;

    const total = document.createElement("p");
    total.textContent = `Total: ${result.totalTimeMs ? formatDuration(result.totalTimeMs) : "—"}`;

    const average = document.createElement("p");
    average.textContent = `Average Lap: ${result.averageLapMs ? formatDuration(result.averageLapMs) : "—"}`;

    const splitList = document.createElement("div");
    splitList.className = "split-list";
    if (result.lapSplitsMs.length === 0) {
      splitList.innerHTML = "<p class=\"muted\">No lap splits recorded.</p>";
    } else {
      result.lapSplitsMs.forEach((split, splitIndex) => {
        const splitItem = document.createElement("p");
        splitItem.textContent = `Lap ${splitIndex + 1}: ${formatDuration(split)}`;
        splitList.appendChild(splitItem);
      });
    }

    const notesLabel = document.createElement("label");
    notesLabel.className = "field";
    const notesSpan = document.createElement("span");
    notesSpan.textContent = "Notes";
    const notesInput = document.createElement("textarea");
    notesInput.value = result.notes || "";
    notesInput.addEventListener("input", () => {
      state.resultsDraft[index].notes = notesInput.value;
    });
    notesLabel.appendChild(notesSpan);
    notesLabel.appendChild(notesInput);

    card.appendChild(title);
    card.appendChild(total);
    card.appendChild(average);
    card.appendChild(splitList);
    card.appendChild(notesLabel);
    elements.resultsList.appendChild(card);
  });
}

function saveResults() {
  if (state.resultsDraft.length === 0) return;
  state.history = [...state.resultsDraft, ...state.history];
  state.resultsSaved = true;
  persistHistory();
  renderHistoryFilters();
  renderHistoryList();
}

function renderHistoryFilters() {
  const currentAthlete = elements.historyAthleteFilter.value;
  const currentSport = elements.historySportFilter.value;
  const currentEvent = elements.historyEventFilter.value;
  /** @param {string} label */
  const allOption = (label) => `<option value="">${label}</option>`;
  const athletes = Array.from(new Set(state.history.map((item) => item.athleteName)));
  const sports = Array.from(new Set(state.history.map((item) => item.sport)));
  const events = Array.from(new Set(state.history.map((item) => item.eventType)));

  elements.historyAthleteFilter.innerHTML = [allOption("All athletes"), ...athletes.map((name) => `<option value="${name}">${name}</option>`)].join("");
  elements.historySportFilter.innerHTML = [allOption("All sports"), ...sports.map((name) => `<option value="${name}">${name}</option>`)].join("");
  elements.historyEventFilter.innerHTML = [allOption("All events"), ...events.map((name) => `<option value="${name}">${name}</option>`)].join("");

  if (currentAthlete) elements.historyAthleteFilter.value = currentAthlete;
  if (currentSport) elements.historySportFilter.value = currentSport;
  if (currentEvent) elements.historyEventFilter.value = currentEvent;
}

function renderHistoryList() {
  const athleteFilter = elements.historyAthleteFilter.value;
  const sportFilter = elements.historySportFilter.value;
  const eventFilter = elements.historyEventFilter.value;

  const filtered = state.history.filter((item) => {
    if (athleteFilter && item.athleteName !== athleteFilter) return false;
    if (sportFilter && item.sport !== sportFilter) return false;
    if (eventFilter && item.eventType !== eventFilter) return false;
    return true;
  });

  elements.historyList.innerHTML = "";
  if (filtered.length === 0) {
    elements.historyList.innerHTML = "<p class=\"muted\">No saved results yet.</p>";
    return;
  }

  filtered.forEach((result) => {
    const card = document.createElement("div");
    card.className = "result-card";
    const title = document.createElement("h3");
    title.textContent = result.athleteName;
    const summary = document.createElement("p");
    summary.textContent = `${result.sport} · ${result.eventType} · ${result.distance}`;
    const total = document.createElement("p");
    total.textContent = `Total: ${result.totalTimeMs ? formatDuration(result.totalTimeMs) : "—"}`;
    const date = document.createElement("p");
    date.textContent = `Date: ${new Date(result.dateISO).toLocaleString()}`;

    const deleteButton = document.createElement("button");
    deleteButton.className = "ghost";
    deleteButton.type = "button";
    deleteButton.textContent = "Delete";
    deleteButton.addEventListener("click", () => {
      if (!confirm(`Delete result for ${result.athleteName}?`)) return;
      state.history = state.history.filter((item) => item.id !== result.id);
      persistHistory();
      renderHistoryFilters();
      renderHistoryList();
    });

    card.appendChild(title);
    card.appendChild(summary);
    card.appendChild(total);
    card.appendChild(date);
    card.appendChild(deleteButton);
    elements.historyList.appendChild(card);
  });
}

/**
 * @param {number} direction
 */
function switchAthlete(direction) {
  if (!state.session) return;
  const count = state.session.participants.length;
  if (count === 0) return;
  state.session.activeIndex = (state.session.activeIndex + direction + count) % count;
  updateLiveView();
}

function updateLiveView() {
  const athlete = getActiveAthleteTiming();
  if (!athlete || !state.session) return;
  const index = state.session.participants.indexOf(athlete.athleteName) + 1;
  elements.liveAthleteName.textContent = athlete.athleteName;
  elements.liveAthleteIndex.textContent = `${index} of ${state.session.participants.length}`;

  const lapCount = athlete.lapTimestamps.length;
  elements.lapCounter.textContent = `Lap ${lapCount} / ${athlete.totalLaps}`;
  const lastSplit = athlete.lapSplitsMs.at(-1);
  elements.lastSplit.textContent = lastSplit ? `Last split: ${formatDuration(lastSplit)}` : "Last split: —";

  const finishReady = canFinish(athlete.lapTimestamps, athlete.totalLaps);
  elements.finishButton.disabled = !finishReady || athlete.finishTime !== null;
  elements.lapButton.disabled = athlete.finishTime !== null;
}

/**
 * @returns {AthleteTiming | null}
 */
function getActiveAthleteTiming() {
  if (!state.session) return null;
  const name = state.session.participants[state.session.activeIndex];
  return state.session.athleteTimings[name];
}

/**
 * @param {keyof typeof elements.screens} name
 */
function showScreen(name) {
  Object.values(elements.screens).forEach((screen) => screen.classList.remove("active"));
  elements.screens[name].classList.add("active");
  document.body.classList.toggle("mode-live", name === "live");

  if (name !== "live") {
    stopLiveTimer();
  }

  if (name === "history") {
    renderHistoryFilters();
    renderHistoryList();
  }
}

function resetSession() {
  state.session = null;
  state.resultsDraft = [];
  state.resultsSaved = true;
  elements.resultsList.innerHTML = "";
}

/**
 * @param {string} name
 */
function editAthlete(name) {
  const next = normalizeName(prompt(`Edit athlete name for ${name}:`, name) ?? "");
  if (!next || next === name) return;
  if (state.athletes.includes(next)) {
    alert("That name already exists.");
    return;
  }
  state.athletes = replaceName(state.athletes, name, next);
  state.setup.selectedAthletes = replaceName(state.setup.selectedAthletes, name, next);
  if (state.history.length > 0) {
    state.history = replaceHistoryAthlete(state.history, name, next);
    persistHistory();
  }
  persistAthletes();
  persistSetup();
  renderAthleteList();
  renderHistoryFilters();
  renderHistoryList();
}

/**
 * @param {string} name
 */
function deleteAthlete(name) {
  const ok = confirm(`Remove ${name} from the athlete list?`);
  if (!ok) return;
  state.athletes = state.athletes.filter((athlete) => athlete !== name);
  state.setup.selectedAthletes = state.setup.selectedAthletes.filter((athlete) => athlete !== name);
  persistAthletes();
  persistSetup();
  renderAthleteList();
  updateStartButton();
}

function persistAthletes() {
  localStorage.setItem(STORAGE_KEYS.athletes, JSON.stringify(state.athletes));
}

function persistSetup() {
  localStorage.setItem(STORAGE_KEYS.setup, JSON.stringify(state.setup));
}

function persistHistory() {
  localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(state.history));
}

/**
 * @template T
 * @param {string} key
 * @param {T} fallback
 * @returns {T}
 */
function loadJson(key, fallback) {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

/**
 * @param {string} id
 * @returns {{ id: string, label: string, totalLaps: number }}
 */
function findDistance(id) {
  const configs = Object.values(SPORT_CONFIG).flatMap((sport) => sport.distances);
  return configs.find((distance) => distance.id === id) ?? configs[0];
}

/**
 * @param {string} contents
 * @param {string} filename
 */
function downloadCsv(contents, filename) {
  const blob = new Blob([contents], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/**
 * @param {HTMLElement} button
 */
function flashButton(button) {
  button.animate(
    [
      { transform: "scale(1)", filter: "brightness(1)" },
      { transform: "scale(1.02)", filter: "brightness(1.2)" },
      { transform: "scale(1)", filter: "brightness(1)" }
    ],
    { duration: 180, easing: "ease-out" }
  );
}

window.addEventListener("beforeunload", () => {
  persistSetup();
  persistAthletes();
});
