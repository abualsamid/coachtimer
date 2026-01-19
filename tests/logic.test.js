import { describe, expect, it } from "vitest";
import {
  buildCsv,
  canFinish,
  coerceLapCount,
  computeAverageLap,
  buildSupDistances,
  computeLapSplits,
  computeTotalTime,
  formatDuration,
  normalizeName,
  replaceHistoryAthlete,
  replaceName,
  requiredLapCount
} from "../src/logic.js";

describe("timing helpers", () => {
  it("computes lap splits from a start time", () => {
    const splits = computeLapSplits(1000, [2000, 3500, 5000]);
    expect(splits).toEqual([1000, 1500, 1500]);
  });

  it("handles missing start times", () => {
    expect(computeLapSplits(null, [2000])).toEqual([]);
  });

  it("computes total time", () => {
    expect(computeTotalTime(1000, 4500)).toBe(3500);
  });

  it("computes average lap", () => {
    expect(computeAverageLap([1000, 1000], 2)).toBe(1000);
  });

  it("formats duration with minutes, seconds, millis", () => {
    expect(formatDuration(61500)).toBe("01:01.500");
  });

  it("normalizes athlete names", () => {
    expect(normalizeName("  Ada   Lovelace ")).toBe("Ada Lovelace");
  });

  it("requires full laps for integer distances", () => {
    expect(requiredLapCount(4)).toBe(4);
    expect(canFinish([1, 2, 3], 4)).toBe(false);
    expect(canFinish([1, 2, 3, 4], 4)).toBe(true);
  });

  it("allows finish after full laps for half-lap distances", () => {
    expect(requiredLapCount(12.5)).toBe(12);
    expect(canFinish(new Array(12).fill(0), 12.5)).toBe(true);
  });

  it("replaces athlete names in lists", () => {
    expect(replaceName(["Ada", "Grace"], "Ada", "Ada Lovelace")).toEqual(["Ada Lovelace", "Grace"]);
  });

  it("builds SUP distances up to a max lap count", () => {
    const distances = buildSupDistances(3);
    expect(distances).toHaveLength(3);
    expect(distances[2].label).toBe("3 laps");
  });

  it("coerces lap counts to step and bounds", () => {
    expect(coerceLapCount(12.3, 0.5, 200, 0.5)).toBe(12.5);
    expect(coerceLapCount(0.1, 0.5, 200, 0.5)).toBe(0.5);
  });
});

describe("CSV export", () => {
  it("builds CSV rows with headers", () => {
    const csv = buildCsv([
      {
        id: "2024-01-01-Alex",
        athleteName: "Alex",
        sport: "Cycling",
        eventType: "Practice",
        distance: "5k",
        totalLaps: 12.5,
        startMode: "mass",
        startTime: 1000,
        lapTimestamps: [2000, 3200],
        finishTime: 5000,
        totalTimeMs: 4000,
        averageLapMs: 320,
        lapSplitsMs: [1000, 1200],
        dateISO: "2024-01-01T00:00:00.000Z",
        notes: "Strong finish"
      }
    ]);

    const lines = csv.split("\n");
    expect(lines[0]).toContain("athleteName");
    expect(lines[1]).toContain("Alex");
    expect(lines[1]).toContain("1000|1200");
  });

  it("updates athlete names in history records", () => {
    const updated = replaceHistoryAthlete(
      [
        { id: "2024-01-01-Sam", athleteName: "Sam", sport: "Cycling", eventType: "Practice", distance: "5k", totalLaps: 12.5, startMode: "mass", startTime: 0, lapTimestamps: [80], finishTime: 1000, totalTimeMs: 1000, averageLapMs: 80, lapSplitsMs: [80], dateISO: "2024-01-01", notes: "" },
        { id: "2024-01-01-Lee", athleteName: "Lee", sport: "SUP", eventType: "Practice", distance: "1 lap", totalLaps: 1, startMode: "mass", startTime: 0, lapTimestamps: [1000], finishTime: 1000, totalTimeMs: 1000, averageLapMs: 1000, lapSplitsMs: [1000], dateISO: "2024-01-01", notes: "" }
      ],
      "Sam",
      "Samantha"
    );
    expect(updated[0].athleteName).toBe("Samantha");
    expect(updated[1].athleteName).toBe("Lee");
  });
});
