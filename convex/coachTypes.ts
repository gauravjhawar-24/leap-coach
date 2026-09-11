export type PlanDayNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type PlanDayType =
  | "run"
  | "strength"
  | "walk"
  | "mobility"
  | "rest"
  | "check_in";

export type PlanEffort = "easy" | "moderate" | "rest";

export type CheckInEffort = "easy" | "right" | "hard";

export type SorenessLevel = "none" | "some" | "high";

export type PainLevel = "none" | "possible" | "high";

export type PlanDay = {
  day: PlanDayNumber;
  type: PlanDayType;
  title: string;
  instruction: string;
  targetKm?: number;
  durationMinutes?: number;
  effort: PlanEffort;
};

export type RunnerContext = {
  baselineDistanceKm?: number;
  baselineTimeMinutes?: number;
  trainingDaysPerWeek?: number;
  strengthSchedule?: string;
  targetDate?: string;
  currentPlanTotalKm?: number;
  recentCheckIns?: Array<{
    effort: CheckInEffort;
    soreness: SorenessLevel;
    pain: PainLevel;
  }>;
};

export type WeeklyKmTarget = {
  run1Km: number;
  run2Km: number;
  totalKm: number;
};

export type WeeklyPlan = {
  targetWindow: string;
  phase: string;
  totalKm: number;
  days: PlanDay[];
  reason: string;
};

export type CoachDecisionKind =
  | "question"
  | "weekly_plan"
  | "check_in_response"
  | "safety_escalation";

export type ProfileUpdate = {
  field: "baseline" | "runDays" | "strengthSchedule" | "targetDate";
  value: string;
};

export type CheckInData = {
  completed: boolean;
  effort: CheckInEffort;
  soreness: SorenessLevel;
  pain: PainLevel;
  note: string;
};

export type CoachDecision = {
  reply: string;
  kind: CoachDecisionKind;
  nextStep: "baseline" | "runDays" | "strength" | "targetDate" | "complete";
  profileUpdate: ProfileUpdate | null;
  checkIn: CheckInData | null;
  plan: WeeklyPlan | null;
  adjustment: {
    reason: string;
    nextSessionChange: string;
  } | null;
};

export type PlanValidationResult =
  | { ok: true }
  | { ok: false; errors: string[] };
