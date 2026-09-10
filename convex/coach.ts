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

      await ctx.db.insert("plans", {
        userId: existingUser._id,
        targetWindow: "About 20 weeks, reviewed every week",
        phase: "Foundation",
        weeklyTarget: "2 easy run-walk sessions, 1 strength session, and recovery between hard days",
        nextSession: "20 minutes of easy run-walk: 1 minute jogging, 2 minutes walking",
        reason: "starting conservatively from your current baseline and building consistency before distance",
        version: 1,
        createdAt: Date.now()
      });

      return {
        reply: "Your first plan is ready. Timeline: about 20 weeks, reviewed weekly. Week 1: 2 easy run-walk sessions, 1 strength session, and recovery between hard days. First session: 20 minutes, alternating 1 minute jogging with 2 minutes walking. Keep it easy enough to speak in full sentences.",
        step: "complete"
      };
    }

    return {
      reply: "Your setup is saved. Send me how today's training felt and I will adjust the next step.",
      step: existingUser.onboardingStep ?? "complete"
    };
  }
});
