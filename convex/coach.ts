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
        weeklyTarget: "2 easy run-walk sessions of about 1.5-2 km each, 1 easy-to-moderate strength session, and at least 1 rest or easy day between runs",
        nextSession: "20 minutes and about 1.5-2 km of easy run-walk: repeat 1 minute jogging and 2 minutes walking. Stop at 20 minutes even if the distance is different.",
        reason: "starting conservatively from your current baseline and building consistency before distance",
        version: 1,
        createdAt: Date.now()
      });

      return {
        reply: "Your first plan is ready. Timeline: about 20 weeks, reviewed weekly. Week 1: 2 easy run-walk sessions, each about 1.5-2 km, plus 1 easy-to-moderate strength session. Leave at least 1 rest or easy day between runs. First session: 20 minutes and about 1.5-2 km, alternating 1 minute jogging with 2 minutes walking. Keep it easy enough to speak in full sentences; stop at 20 minutes even if your distance is different.",
        step: "complete"
      };
    }

    return {
      reply: "Your setup is saved. Send me how today's training felt and I will adjust the next step.",
      step: existingUser.onboardingStep ?? "complete"
    };
  }
});
