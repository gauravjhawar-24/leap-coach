import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    phone: v.string(),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    baseline: v.optional(v.string()),
    baselineDistanceKm: v.optional(v.number()),
    baselineTimeMinutes: v.optional(v.number()),
    runDays: v.optional(v.string()),
    trainingDaysPerWeek: v.optional(v.number()),
    strengthSchedule: v.optional(v.string()),
    targetDate: v.optional(v.string()),
    onboardingStep: v.optional(v.string()),
    createdAt: v.number(),
    lastCheckInAt: v.optional(v.number()),
    reminderHour: v.optional(v.number()),
    lastReminderSentAt: v.optional(v.number())
  }).index("by_phone", ["phone"]),

  plans: defineTable({
    userId: v.id("users"),
    targetWindow: v.string(),
    phase: v.string(),
    weeklyTarget: v.string(),
    nextSession: v.string(),
    reason: v.string(),
    totalKm: v.optional(v.number()),
    days: v.optional(
      v.array(
        v.object({
          day: v.number(),
          type: v.union(
            v.literal("run"),
            v.literal("strength"),
            v.literal("walk"),
            v.literal("mobility"),
            v.literal("rest"),
            v.literal("check_in")
          ),
          title: v.string(),
          instruction: v.string(),
          targetKm: v.optional(v.number()),
          durationMinutes: v.optional(v.number()),
          effort: v.union(v.literal("easy"), v.literal("moderate"), v.literal("rest"))
        })
      )
    ),
    status: v.optional(v.union(v.literal("active"), v.literal("superseded"))),
    version: v.number(),
    createdAt: v.number()
  }).index("by_user", ["userId"]),

  checkIns: defineTable({
    userId: v.id("users"),
    completed: v.boolean(),
    effort: v.union(v.literal("easy"), v.literal("right"), v.literal("hard")),
    soreness: v.union(v.literal("none"), v.literal("some"), v.literal("high")),
    pain: v.optional(v.union(v.literal("none"), v.literal("possible"), v.literal("high"))),
    availability: v.optional(v.string()),
    note: v.optional(v.string()),
    createdAt: v.number()
  }).index("by_user", ["userId"]),

  agentRuns: defineTable({
    userId: v.id("users"),
    decisionKind: v.union(
      v.literal("question"),
      v.literal("weekly_plan"),
      v.literal("check_in_response"),
      v.literal("safety_escalation")
    ),
    validationStatus: v.union(v.literal("passed"), v.literal("failed")),
    latencyMs: v.optional(v.number()),
    errorCode: v.optional(v.string()),
    createdAt: v.number()
  }).index("by_user", ["userId"])
});
