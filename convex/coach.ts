import { internalMutation, internalQuery, mutation } from "./_generated/server";
import { v } from "convex/values";
import type { PlanDay } from "./coachTypes";
import { parseBaseline } from "./coachRules";

const planDayValidator = v.object({
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
});

export const getRunnerContext = internalQuery({
  args: { phone: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_phone", (query) => query.eq("phone", args.phone))
      .unique();

    if (!user) {
      return null;
    }

    const currentPlan = await ctx.db
      .query("plans")
      .withIndex("by_user", (query) => query.eq("userId", user._id))
      .order("desc")
      .first();

    const recentCheckIns = await ctx.db
      .query("checkIns")
      .withIndex("by_user", (query) => query.eq("userId", user._id))
      .order("desc")
      .take(5);

    return {
      userId: user._id,
      baseline: user.baseline,
      baselineDistanceKm: user.baselineDistanceKm,
      baselineTimeMinutes: user.baselineTimeMinutes,
      trainingDaysPerWeek: user.trainingDaysPerWeek,
      runDays: user.runDays,
      strengthSchedule: user.strengthSchedule,
      targetDate: user.targetDate,
      onboardingStep: user.onboardingStep,
      currentPlan: currentPlan
        ? {
            targetWindow: currentPlan.targetWindow,
            phase: currentPlan.phase,
            totalKm: currentPlan.totalKm,
            days: currentPlan.days,
            reason: currentPlan.reason,
            version: currentPlan.version
          }
        : null,
      recentCheckIns: recentCheckIns.map((checkIn) => ({
        completed: checkIn.completed,
        effort: checkIn.effort,
        soreness: checkIn.soreness,
        pain: checkIn.pain ?? "none",
        availability: checkIn.availability,
        note: checkIn.note,
        createdAt: checkIn.createdAt
      }))
    };
  }
});

export const createRunner = internalMutation({
  args: { phone: v.string() },
  handler: async (ctx, args) => {
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_phone", (query) => query.eq("phone", args.phone))
      .unique();

    if (existingUser) {
      return existingUser._id;
    }

    return await ctx.db.insert("users", {
      phone: args.phone,
      onboardingStep: "baseline",
      reminderHour: 20,
      createdAt: Date.now()
    });
  }
});

export const applyProfileUpdate = internalMutation({
  args: {
    phone: v.string(),
    field: v.union(
      v.literal("baseline"),
      v.literal("runDays"),
      v.literal("strengthSchedule"),
      v.literal("targetDate")
    ),
    value: v.string(),
    nextStep: v.string()
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_phone", (query) => query.eq("phone", args.phone))
      .unique();

    if (!user) {
      throw new Error("RUNNER_NOT_FOUND");
    }

    if (args.field === "baseline") {
      const parsed = parseBaseline(args.value);
      await ctx.db.patch(user._id, {
        baseline: args.value,
        baselineDistanceKm: parsed.distanceKm,
        baselineTimeMinutes: parsed.timeMinutes,
        onboardingStep: args.nextStep
      });
    } else if (args.field === "runDays") {
      const numberMatch = args.value.match(/\d+/);
      const trainingDaysPerWeek = numberMatch ? Number(numberMatch[0]) : undefined;
      await ctx.db.patch(user._id, {
        runDays: args.value,
        trainingDaysPerWeek,
        onboardingStep: args.nextStep
      });
    } else if (args.field === "strengthSchedule") {
      await ctx.db.patch(user._id, {
        strengthSchedule: args.value,
        onboardingStep: args.nextStep
      });
    } else {
      await ctx.db.patch(user._id, {
        targetDate: args.value,
        onboardingStep: args.nextStep
      });
    }

    return user._id;
  }
});

export const saveAgentRun = internalMutation({
  args: {
    userId: v.id("users"),
    decisionKind: v.union(
      v.literal("question"),
      v.literal("weekly_plan"),
      v.literal("check_in_response"),
      v.literal("safety_escalation")
    ),
    validationStatus: v.union(v.literal("passed"), v.literal("failed")),
    latencyMs: v.optional(v.number()),
    errorCode: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("agentRuns", {
      ...args,
      createdAt: Date.now()
    });
  }
});

export const saveCheckIn = internalMutation({
  args: {
    userId: v.id("users"),
    completed: v.boolean(),
    effort: v.union(v.literal("easy"), v.literal("right"), v.literal("hard")),
    soreness: v.union(v.literal("none"), v.literal("some"), v.literal("high")),
    pain: v.union(v.literal("none"), v.literal("possible"), v.literal("high")),
    note: v.string()
  },
  handler: async (ctx, args) => {
    const checkInId = await ctx.db.insert("checkIns", {
      ...args,
      createdAt: Date.now()
    });

    await ctx.db.patch(args.userId, { lastCheckInAt: Date.now() });
    return checkInId;
  }
});

export const adjustNextSession = internalMutation({
  args: {
    userId: v.id("users"),
    nextSession: v.string(),
    reason: v.string()
  },
  handler: async (ctx, args) => {
    const activePlan = await ctx.db
      .query("plans")
      .withIndex("by_user", (query) => query.eq("userId", args.userId))
      .order("desc")
      .first();

    if (!activePlan) {
      return null;
    }

    await ctx.db.patch(activePlan._id, {
      nextSession: args.nextSession,
      reason: args.reason
    });

    return activePlan._id;
  }
});

export const saveValidatedPlan = internalMutation({
  args: {
    userId: v.id("users"),
    targetWindow: v.string(),
    phase: v.string(),
    weeklyTarget: v.string(),
    nextSession: v.string(),
    reason: v.string(),
    totalKm: v.number(),
    days: v.array(planDayValidator),
    version: v.number()
  },
  handler: async (ctx, args) => {
    const activePlans = await ctx.db
      .query("plans")
      .withIndex("by_user", (query) => query.eq("userId", args.userId))
      .collect();

    for (const plan of activePlans) {
      if (plan.status !== "superseded") {
        await ctx.db.patch(plan._id, { status: "superseded" });
      }
    }

    return await ctx.db.insert("plans", {
      ...args,
      status: "active",
      createdAt: Date.now()
    });
  }
});

export const completeOnboarding = internalMutation({
  args: {
    phone: v.string(),
    targetDate: v.string()
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_phone", (query) => query.eq("phone", args.phone))
      .unique();

    if (!user) {
      throw new Error("RUNNER_NOT_FOUND");
    }

    await ctx.db.patch(user._id, {
      targetDate: args.targetDate,
      onboardingStep: "complete"
    });

    return user._id;
  }
});

export const receiveMessage = mutation({
  args: {
    phone: v.string(),
    text: v.string()
  },
  handler: async (ctx, args) => {
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_phone", (query) => query.eq("phone", args.phone))
      .unique();

    if (existingUser && args.text.trim().toLowerCase() === "reset") {
      await ctx.db.patch(existingUser._id, {
        baseline: undefined,
        runDays: undefined,
        strengthSchedule: undefined,
        targetDate: undefined,
        onboardingStep: "baseline",
        lastCheckInAt: undefined
      });

      return {
        reply: "Let's start fresh. How long can you run comfortably today? Example: 20 minutes or 2 km.",
        step: "baseline"
      };
    }

    if (!existingUser) {
      await ctx.db.insert("users", {
        phone: args.phone,
        baseline: args.text,
        onboardingStep: "runDays",
        createdAt: Date.now()
      });

      return {
        reply: "Great. How many days can you realistically train each week? Reply with a number, like 2 or 3.",
        step: "runDays"
      };
    }

    if (existingUser.onboardingStep === "baseline") {
      await ctx.db.patch(existingUser._id, {
        baseline: args.text,
        onboardingStep: "runDays"
      });

      return {
        reply: "Thanks. How many days can you realistically train each week? Reply with a number, like 2 or 3.",
        step: "runDays"
      };
    }

    if (existingUser.onboardingStep === "runDays") {
      await ctx.db.patch(existingUser._id, {
        runDays: args.text,
        onboardingStep: "strength"
      });

      return {
        reply: "Got it. Tell me about strength training: which days do you usually lift or attend a class? Reply with days, or say none.",
        step: "strength"
      };
    }

    if (existingUser.onboardingStep === "strength") {
      await ctx.db.patch(existingUser._id, {
        strengthSchedule: args.text,
        onboardingStep: "targetDate"
      });

      return {
        reply: "Last setup question: are you training for a specific 21K date? Reply with a date, or say no date.",
        step: "targetDate"
      };
    }

    if (existingUser.onboardingStep === "targetDate") {
      await ctx.db.patch(existingUser._id, {
        targetDate: args.text,
        onboardingStep: "complete"
      });

      const firstWeekDays: PlanDay[] = [
        {
          day: 1,
          type: "run",
          title: "Run 1",
          instruction: "20 minutes and about 1.5-2 km, alternating 1 minute jogging and 2 minutes walking.",
          targetKm: 1.75,
          durationMinutes: 20,
          effort: "easy"
        },
        {
          day: 2,
          type: "rest",
          title: "Recovery",
          instruction: "Rest or take an easy 20-30 minute walk.",
          durationMinutes: 30,
          effort: "rest"
        },
        {
          day: 3,
          type: "strength",
          title: "Strength",
          instruction: "Complete one easy-to-moderate strength session. Do not train to failure.",
          effort: "moderate"
        },
        {
          day: 4,
          type: "run",
          title: "Run 2",
          instruction: "20 minutes and about 1.5-2 km, alternating 1 minute jogging and 2 minutes walking.",
          targetKm: 1.75,
          durationMinutes: 20,
          effort: "easy"
        },
        {
          day: 5,
          type: "mobility",
          title: "Recovery",
          instruction: "Rest or do 10 minutes of gentle mobility. Do not run.",
          durationMinutes: 10,
          effort: "rest"
        },
        {
          day: 6,
          type: "walk",
          title: "Recovery walk",
          instruction: "Walk for 20 minutes at a comfortable pace. Do not jog or run.",
          durationMinutes: 20,
          effort: "easy"
        },
        {
          day: 7,
          type: "check_in",
          title: "Rest and review",
          instruction: "Rest, then tell Leap Coach how the week felt so next week's plan can be adjusted.",
          effort: "rest"
        }
      ];
      const firstWeekPlan = firstWeekDays
        .map((planDay) => `Day ${planDay.day} - ${planDay.title}: ${planDay.instruction}`)
        .join(" ");

      await ctx.db.insert("plans", {
        userId: existingUser._id,
        targetWindow: "About 20 weeks, reviewed every week",
        phase: "Foundation",
        weeklyTarget: firstWeekPlan,
        nextSession: "Day 1 - Run 1: 20 minutes and about 1.5-2 km of easy run-walk. Repeat 1 minute jogging and 2 minutes walking, and stop at 20 minutes even if the distance is different.",
        reason: "starting conservatively from your current baseline and building consistency before distance",
        totalKm: 3.5,
        days: firstWeekDays,
        status: "active",
        version: 1,
        createdAt: Date.now()
      });

      return {
        reply: `Your first plan is ready. Timeline: about 20 weeks, reviewed weekly.\n\nWeek 1:\n${firstWeekPlan.replaceAll(". ", ".\n") }\n\nKeep every run easy enough to speak in full sentences. After each day, send me how it felt so I can adjust the next session.`,
        step: "complete"
      };
    }

    return {
      reply: "Your setup is saved. Send me how today's training felt and I will adjust the next step.",
      step: existingUser.onboardingStep ?? "complete"
    };
  }
});
