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

      return {
        reply: "I have enough to shape your first week. I will suggest a realistic 21K timeline and your first session next.",
        step: "complete"
      };
    }

    return {
      reply: "Your setup is saved. Send me how today's training felt and I will adjust the next step.",
      step: existingUser.onboardingStep ?? "complete"
    };
  }
});
