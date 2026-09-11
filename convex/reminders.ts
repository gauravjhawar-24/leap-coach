import { internalAction, internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { v } from "convex/values";

const indiaOffsetMs = 5.5 * 60 * 60 * 1000;

type DueRunner = {
  userId: Id<"users">;
  phone: string;
};

type ReminderResult = {
  attempted: number;
};

export const getDueRunners = internalQuery({
  args: {
    dayStart: v.number(),
    hour: v.number()
  },
  handler: async (ctx, args) => {
    const users = await ctx.db.query("users").collect();

    return users
      .filter((user) => {
        const reminderHour = user.reminderHour ?? 20;
        return (
          user.onboardingStep === "complete" &&
          reminderHour === args.hour &&
          (!user.lastReminderSentAt || user.lastReminderSentAt < args.dayStart)
        );
      })
      .map((user) => ({ userId: user._id, phone: user.phone }));
  }
});

export const markReminderSent = internalMutation({
  args: { userId: v.id("users"), sentAt: v.number() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, { lastReminderSentAt: args.sentAt });
  }
});

export const sendDueCheckIns = internalAction({
  args: {},
  handler: async (ctx): Promise<ReminderResult> => {
    const now = Date.now();
    const localNow = new Date(now + indiaOffsetMs);
    const hour = localNow.getUTCHours();
    const dayStart = Date.UTC(
      localNow.getUTCFullYear(),
      localNow.getUTCMonth(),
      localNow.getUTCDate()
    ) - indiaOffsetMs;

    const runners: DueRunner[] = await ctx.runQuery(internal.reminders.getDueRunners, {
      dayStart,
      hour
    });

    const accessToken = process.env.META_ACCESS_TOKEN;
    const phoneNumberId = process.env.META_PHONE_NUMBER_ID;
    const graphApiVersion = process.env.META_GRAPH_API_VERSION ?? "v25.0";
    const templateName = process.env.META_CHECKIN_TEMPLATE_NAME ?? "leap_coach_daily_checkin";
    const templateLanguage = process.env.META_CHECKIN_TEMPLATE_LANGUAGE ?? "en_US";

    if (!accessToken || !phoneNumberId) {
      throw new Error("META_REMINDER_ENV_NOT_CONFIGURED");
    }

    for (const runner of runners) {
      const response = await fetch(
        `https://graph.facebook.com/${graphApiVersion}/${phoneNumberId}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: runner.phone,
            type: "template",
            template: {
              name: templateName,
              language: { code: templateLanguage }
            }
          })
        }
      );

      if (response.ok) {
        await ctx.runMutation(internal.reminders.markReminderSent, {
          userId: runner.userId,
          sentAt: now
        });
      } else {
        console.error("Daily check-in reminder failed", {
          status: response.status,
          userId: runner.userId
        });
      }
    }

    return { attempted: runners.length };
  }
});
