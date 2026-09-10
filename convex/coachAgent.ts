import { action } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { v } from "convex/values";
import { validatePlan } from "./coachRules";
import { generateCoachDecision } from "./llm";

type AgentReply = {
  reply: string;
  kind?: string;
  validationStatus?: string;
  step?: string;
};

export const processMessage = action({
  args: {
    phone: v.string(),
    text: v.string()
  },
  handler: async (ctx, args): Promise<AgentReply> => {
    const startedAt = Date.now();
    let runner = await ctx.runQuery(internal.coach.getRunnerContext, {
      phone: args.phone
    });

    if (!runner) {
      return await ctx.runMutation(api.coach.receiveMessage, args);
    }

    const normalizedText = args.text.trim().toLowerCase();
    if (normalizedText === "reset") {
      return await ctx.runMutation(api.coach.receiveMessage, args);
    }

    if (runner.onboardingStep && runner.onboardingStep !== "complete") {
      if (runner.onboardingStep === "targetDate") {
        await ctx.runMutation(internal.coach.completeOnboarding, {
          phone: args.phone,
          targetDate: args.text
        });
        runner = await ctx.runQuery(internal.coach.getRunnerContext, {
          phone: args.phone
        });
      } else {
        return await ctx.runMutation(api.coach.receiveMessage, args);
      }
    }

    if (!runner) {
      return {
        reply: "I could not load your setup. Please send reset to start again.",
        kind: "question",
        validationStatus: "failed"
      };
    }

    try {
      const decision = await generateCoachDecision({
        context: runner,
        userMessage: args.text
      });

      if (decision.plan) {
        const validation = validatePlan(decision.plan, {
          baselineDistanceKm: runner.baselineDistanceKm,
          baselineTimeMinutes: runner.baselineTimeMinutes,
          trainingDaysPerWeek: runner.trainingDaysPerWeek,
          strengthSchedule: runner.strengthSchedule,
          targetDate: runner.targetDate,
          currentPlanTotalKm: runner.currentPlan?.totalKm,
          recentCheckIns: runner.recentCheckIns
        });

        if (!validation.ok) {
          await ctx.runMutation(internal.coach.saveAgentRun, {
            userId: runner.userId,
            decisionKind: decision.kind,
            validationStatus: "failed",
            latencyMs: Date.now() - startedAt,
            errorCode: "PLAN_VALIDATION_FAILED"
          });

          return {
            reply: "I could not safely update your plan yet. Send me your current comfortable distance and I will try again.",
            kind: "safety_escalation",
            validationStatus: "failed"
          } as const;
        }

        const firstRun = decision.plan.days.find((day) => day.type === "run");
        await ctx.runMutation(internal.coach.saveValidatedPlan, {
          userId: runner.userId,
          targetWindow: decision.plan.targetWindow,
          phase: decision.plan.phase,
          weeklyTarget: decision.plan.days
            .map((day) => `Day ${day.day} - ${day.title}: ${day.instruction}`)
            .join(" "),
          nextSession: firstRun
            ? `Day ${firstRun.day} - ${firstRun.title}: ${firstRun.instruction}`
            : "Check in with Leap Coach before your next session.",
          reason: decision.plan.reason,
          totalKm: decision.plan.totalKm,
          days: decision.plan.days,
          version: (runner.currentPlan?.version ?? 0) + 1
        });
      }

      await ctx.runMutation(internal.coach.saveAgentRun, {
        userId: runner.userId,
        decisionKind: decision.kind,
        validationStatus: "passed",
        latencyMs: Date.now() - startedAt
      });

      return {
        reply: decision.reply,
        kind: decision.kind,
        validationStatus: "passed"
      } as const;
    } catch (error) {
      await ctx.runMutation(internal.coach.saveAgentRun, {
        userId: runner.userId,
        decisionKind: "question",
        validationStatus: "failed",
        latencyMs: Date.now() - startedAt,
        errorCode: error instanceof Error ? error.message.slice(0, 80) : "AGENT_FAILED"
      });

      return {
        reply: "I am unable to update your plan right now. Your last saved plan is still active. Please try again in a few minutes.",
        kind: "question",
        validationStatus: "failed"
      } as const;
    }
  }
});
