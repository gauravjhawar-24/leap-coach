# Coach Rules Manual Checks

These examples are the first verification set for `convex/coachRules.ts`. They are written as input and expected output until a test runner is added to the project.

## Baseline parsing

| Input | Expected result |
|---|---|
| `I can run 2 km in 20 minutes` | `{ distanceKm: 2, timeMinutes: 20 }` |
| `About 3 kilometers` | `{ distanceKm: 3, timeMinutes: undefined }` |
| `I can run for 20 minutes` | `{ distanceKm: undefined, timeMinutes: 20 }` |
| `I run sometimes` | `{ distanceKm: undefined, timeMinutes: undefined }` |

## Starting distance and weekly target

| Context | Expected result |
|---|---|
| `baselineDistanceKm: 2` | Starting distance `2`; Week target `1.5 km + 1.7 km = 3.2 km` |
| `baselineDistanceKm: 3` | Starting distance `3`; Week target `2.3 km + 2.6 km = 4.9 km` |
| only `baselineTimeMinutes: 20` | Starting distance `null`; ask for distance before creating a kilometer plan |

## Recovery choice

| Check-in | Expected result |
|---|---|
| soreness `none`, pain `none` | `walk` |
| soreness `some`, pain `none` | `walk` |
| soreness `high`, pain `none` | `rest` |
| soreness `none`, pain `possible` | `rest` |

## Plan validation

The validator should accept a seven-day plan with two runs, one named strength session, a concrete Day 6 walk or rest action, and a total equal to the run targets.

It should reject:

1. A plan with six or eight days.
2. A plan with a missing or duplicated day number.
3. A run without `targetKm`.
4. A strength day that only says `do strength`.
5. Day 6 labelled `optional easy movement`.
6. A plan total that does not equal the sum of its run targets.
7. A later plan more than 10% above the previous weekly total.
8. A run target above the runner's known comfortable distance.
