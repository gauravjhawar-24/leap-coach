import type {
  PlanValidationResult,
  RunnerContext,
  WeeklyKmTarget,
  WeeklyPlan
} from "./coachTypes";

const roundToTenth = (value: number) => Math.round(value * 10) / 10;

export function parseBaseline(text: string): {
  distanceKm?: number;
  timeMinutes?: number;
} {
  const distanceMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:km|kilometers?|kilometres?)/i);
  const timeMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:min|mins|minutes?)/i);

  return {
    distanceKm: distanceMatch ? Number(distanceMatch[1]) : undefined,
    timeMinutes: timeMatch ? Number(timeMatch[1]) : undefined
  };
}

export function calculateStartingKm(context: RunnerContext): number | null {
  if (!context.baselineDistanceKm || context.baselineDistanceKm <= 0) {
    return null;
  }

  return roundToTenth(context.baselineDistanceKm);
}

export function calculateWeeklyKm(context: RunnerContext): WeeklyKmTarget | null {
  const startingKm = calculateStartingKm(context);

  if (startingKm === null) {
    return null;
  }

  const run1Km = roundToTenth(Math.max(1, startingKm * 0.75));
  const run2Km = roundToTenth(Math.max(1, startingKm * 0.85));
  const totalKm = roundToTenth(run1Km + run2Km);

  return { run1Km, run2Km, totalKm };
}

export function chooseRecoveryAction(
  checkIn: Pick<NonNullable<RunnerContext["recentCheckIns"]>[number], "soreness" | "pain">
): "walk" | "rest" {
  if (checkIn.pain !== "none" || checkIn.soreness === "high") {
    return "rest";
  }

  return "walk";
}

export function validatePlan(
  plan: WeeklyPlan,
  context: RunnerContext
): PlanValidationResult {
  const errors: string[] = [];
  const expectedDays = [1, 2, 3, 4, 5, 6, 7];
  const actualDays = plan.days.map((day) => day.day);
  const startingKm = calculateStartingKm(context);
  const runDays = plan.days.filter((day) => day.type === "run");
  const strengthDays = plan.days.filter((day) => day.type === "strength");
  const daySix = plan.days.find((day) => day.day === 6);

  if (plan.days.length !== 7) {
    errors.push("The plan must contain exactly seven days.");
  }

  if (actualDays.some((day, index) => day !== expectedDays[index])) {
    errors.push("The plan days must be labelled Day 1 through Day 7 in order.");
  }

  if (runDays.length === 0) {
    errors.push("The plan must contain at least one running day.");
  }

  for (const runDay of runDays) {
    if (!runDay.targetKm || runDay.targetKm <= 0) {
      errors.push(`Day ${runDay.day} needs a positive kilometer target.`);
    }

    if (!runDay.instruction.trim()) {
      errors.push(`Day ${runDay.day} needs a running instruction.`);
    }

    if (runDay.effort === "rest") {
      errors.push(`Day ${runDay.day} cannot be a rest effort when it is a run.`);
    }

    if (startingKm !== null && runDay.targetKm && runDay.targetKm > startingKm) {
      errors.push(`Day ${runDay.day} is above the runner's known comfortable distance.`);
    }
  }

  if (strengthDays.length !== 1) {
    errors.push("The plan must contain exactly one strength day.");
  }

  const strengthInstruction = strengthDays[0]?.instruction.toLowerCase() ?? "";
  const hasSpecificStrength = /squat|bridge|calf|lunge|plank|class|gym/.test(strengthInstruction);
  if (strengthDays.length === 1 && !hasSpecificStrength) {
    errors.push("The strength day needs named exercises or the runner's class or gym session.");
  }

  if (!daySix || !["walk", "rest"].includes(daySix.type)) {
    errors.push("Day 6 must be a concrete walk or rest action.");
  }

  const daySixInstruction = daySix?.instruction.toLowerCase() ?? "";
  if (daySixInstruction.includes("optional easy movement")) {
    errors.push("Day 6 cannot use the phrase optional easy movement.");
  }

  const calculatedTotalKm = roundToTenth(
    runDays.reduce((total, day) => total + (day.targetKm ?? 0), 0)
  );
  if (roundToTenth(plan.totalKm) !== calculatedTotalKm) {
    errors.push("The weekly kilometer total must equal the sum of the run targets.");
  }

  if (context.currentPlanTotalKm && plan.totalKm > context.currentPlanTotalKm * 1.1) {
    errors.push("The weekly kilometer target increases by more than 10%.");
  }

  return errors.length > 0 ? { ok: false, errors } : { ok: true };
}
