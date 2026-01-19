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
 * @param {number | null} startTime
 * @param {number[]} lapTimestamps
 * @returns {number[]}
 */
export function computeLapSplits(startTime, lapTimestamps) {
  if (startTime === null) return [];
  const splits = [];
  let prev = startTime;
  for (const ts of lapTimestamps) {
    splits.push(Math.max(0, ts - prev));
    prev = ts;
  }
  return splits;
}

/**
 * @param {number | null} startTime
 * @param {number | null} finishTime
 * @returns {number | null}
 */
export function computeTotalTime(startTime, finishTime) {
  if (startTime === null || finishTime === null) return null;
  return Math.max(0, finishTime - startTime);
}

/**
 * @param {number[]} lapSplits
 * @param {number} totalLaps
 * @returns {number | null}
 */
export function computeAverageLap(lapSplits, totalLaps) {
  if (!totalLaps) return null;
  if (lapSplits.length === 0) return null;
  const sum = lapSplits.reduce((acc, ms) => acc + ms, 0);
  return Math.round(sum / totalLaps);
}

/**
 * @param {number} ms
 * @returns {string}
 */
export function formatDuration(ms) {
  const safe = Math.max(0, Math.floor(ms));
  const totalSeconds = Math.floor(safe / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const millis = safe % 1000;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(millis).padStart(3, "0")}`;
}

/**
 * @param {string} value
 * @returns {string}
 */
export function normalizeName(value) {
  return value.trim().replace(/\s+/g, " ");
}

/**
 * @param {AthleteTiming} athlete
 * @returns {AthleteTiming}
 */
export function recalcTiming(athlete) {
  const lapSplits = computeLapSplits(athlete.startTime, athlete.lapTimestamps);
  return {
    ...athlete,
    lapSplitsMs: lapSplits
  };
}

/**
 * @param {Object} params
 * @param {string} params.athleteName
 * @param {number} params.totalLaps
 * @returns {AthleteTiming}
 */
export function createAthleteTiming({ athleteName, totalLaps }) {
  return {
    athleteName,
    totalLaps,
    startTime: null,
    lapTimestamps: [],
    lapSplitsMs: [],
    finishTime: null
  };
}

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
 * @property {number | null} finishTime
 * @property {number | null} totalTimeMs
 * @property {number | null} averageLapMs
 * @property {number[]} lapSplitsMs
 * @property {string} dateISO
 * @property {string} notes
 */

/**
 * @param {ResultRecord[]} results
 * @returns {string}
 */
export function buildCsv(results) {
  const headers = [
    "athleteName",
    "sport",
    "eventType",
    "distance",
    "totalLaps",
    "startMode",
    "startTime",
    "finishTime",
    "totalTimeMs",
    "averageLapMs",
    "lapSplitsMs",
    "dateISO",
    "notes"
  ];
  const rows = results.map((result) => {
    const lapSplits = Array.isArray(result.lapSplitsMs) ? result.lapSplitsMs.join("|") : "";
    const values = [
      result.athleteName,
      result.sport,
      result.eventType,
      result.distance,
      String(result.totalLaps ?? ""),
      result.startMode,
      String(result.startTime ?? ""),
      String(result.finishTime ?? ""),
      String(result.totalTimeMs ?? ""),
      String(result.averageLapMs ?? ""),
      lapSplits,
      result.dateISO,
      result.notes ?? ""
    ];
    return values.map(escapeCsv).join(",");
  });
  return [headers.join(","), ...rows].join("\n");
}

/**
 * @param {string} value
 * @returns {string}
 */
function escapeCsv(value) {
  const needsQuotes = /[",\n]/.test(value);
  const escaped = value.replace(/"/g, '""');
  return needsQuotes ? `"${escaped}"` : escaped;
}

/**
 * @param {number[]} lapTimestamps
 * @param {number} totalLaps
 * @returns {boolean}
 */
export function canFinish(lapTimestamps, totalLaps) {
  return lapTimestamps.length >= requiredLapCount(totalLaps);
}

/**
 * @param {number} totalLaps
 * @returns {number}
 */
export function requiredLapCount(totalLaps) {
  if (Number.isInteger(totalLaps)) return totalLaps;
  return Math.floor(totalLaps);
}

/**
 * @param {string[]} list
 * @param {string} from
 * @param {string} to
 * @returns {string[]}
 */
export function replaceName(list, from, to) {
  return list.map((value) => (value === from ? to : value));
}

/**
 * @param {ResultRecord[]} history
 * @param {string} from
 * @param {string} to
 * @returns {ResultRecord[]}
 */
export function replaceHistoryAthlete(history, from, to) {
  return history.map((record) =>
    record.athleteName === from
      ? {
          ...record,
          athleteName: to
        }
      : record
  );
}
