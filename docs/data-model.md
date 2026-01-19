# Data Model

## Core Entities

### Athlete (roster)
- `name` (string)

### Session Setup
- `sport` (string): Cycling, SUP
- `eventType` (string): Practice, Area Games, Regional Games, State Games
- `distanceId` (string): maps to sport distances
- `startMode` (string): `mass` or `staggered`
- `selectedAthletes` (string[])

### Result Record
Saved per athlete per race and includes lap-level data:
- `athleteName` (string)
- `sport` (string)
- `eventType` (string)
- `distance` (string label)
- `totalLaps` (number)
- `startMode` (string)
- `startTime` (number | null)
- `lapTimestamps` (number[])
- `lapSplitsMs` (number[])
- `finishTime` (number | null)
- `totalTimeMs` (number | null)
- `averageLapMs` (number | null)
- `dateISO` (string)
- `notes` (string)

## Storage Keys
- `coachtimer:athletes`
- `coachtimer:setup`
- `coachtimer:history`
