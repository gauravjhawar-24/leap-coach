import { mutation } from "./_generated/server";
import { v } from "convex/values";

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

      const firstWeekPlan = [
        "Day 1 - Run 1: 20 minutes, about 1.5-2 km, alternating 1 minute jogging and 2 minutes walking.",
        "Day 2 - Recovery: Rest or take an easy 20-30 minute walk.",
        "Day 3 - Strength: One easy-to-moderate strength session. Do not train to failure.",
        "Day 4 - Run 2: 20 minutes, about 1.5-2 km, using the same 1 minute jogging and 2 minutes walking pattern.",
        "Day 5 - Recovery: Rest or do gentle mobility. No running.",
        "Day 6 - Optional easy movement: 20-30 minute walk, or complete rest if tired.",
        "Day 7 - Rest and review: Rest, then check in with how the week felt so next week's plan can be adjusted."
      ].join(" ");

      await ctx.db.insert("plans", {
        userId: existingUser._id,
        targetWindow: "About 20 weeks, reviewed every week",
        phase: "Foundation",
        weeklyTarget: firstWeekPlan,
        nextSession: "Day 1 - Run 1: 20 minutes and about 1.5-2 km of easy run-walk. Repeat 1 minute jogging and 2 minutes walking, and stop at 20 minutes even if the distance is different.",
        reason: "starting conservatively from your current baseline and building consistency before distance",
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
