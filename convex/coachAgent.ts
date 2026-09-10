import { action } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { v } from "convex/values";
import { parseBaseline, validatePlan } from "./coachRules";
import { generateCoachDecision } from "./llm";

type AgentReply = {
  reply: string;
  kind?: string;
  validationStatus?: string;
  step?: string;
};

function questionForStep(step: string | undefined): string {
  if (step === "baseline") {
    return "How long or how far can you run comfortably today? Reply with both if you can, for example: 2 km in 20 minutes.";
  }

  if (step === "runDays") {
    return "How many days can you realistically train each week? Reply with a number like 2 or 3.";
  }

  if (step === "strength") {
    return "Which days do you usually do strength training or attend a class? Reply with the days, or say none.";
  }

  if (step === "targetDate") {
    return "Are you training for a specific 21K date? Reply with a date, or say no date.";
  }

  return "Tell me how today's training felt: easy, right, or hard. Also mention any soreness or pain.";
}

function isSimpleGreeting(text: string): boolean {
  return /^(hi|hello|hey|okay|ok|thanks|thank you)$/i.test(text.trim());
}

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
      await ctx.runMutation(internal.coach.createRunner, { phone: args.phone });
      runner = await ctx.runQuery(internal.coach.getRunnerContext, {
        phone: args.phone
      });
    }

    const normalizedText = args.text.trim().toLowerCase();
    if (normalizedText === "reset") {
      return await ctx.runMutation(api.coach.receiveMessage, args);
    }

    if (!runner) {
      return {
        reply: "I could not load your setup. Please send reset to start again.",
        kind: "question",
        validationStatus: "failed"
      };
    }

    if (runner.onboardingStep !== "complete" && isSimpleGreeting(args.text)) {
      return {
        reply: questionForStep(runner.onboardingStep),
        kind: "question",
        validationStatus: "passed"
      };
    }

    if (runner.onboardingStep === "baseline") {
      const baseline = parseBaseline(args.text);
      if (baseline.distanceKm !== undefined) {
        await ctx.runMutation(internal.coach.applyProfileUpdate, {
          phone: args.phone,
          field: "baseline",
          value: args.text,
          nextStep: "runDays"
        });

        await ctx.runMutation(internal.coach.saveAgentRun, {
          userId: runner.userId,
          decisionKind: "question",
          validationStatus: "passed",
          latencyMs: 0
        });

        return {
          reply: "Got it. How many days can you realistically train each week? Reply with a number like 2 or 3.",
          kind: "question",
          validationStatus: "passed"
        };
      }
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

        if (decision.profileUpdate) {
          await ctx.runMutation(internal.coach.applyProfileUpdate, {
            phone: args.phone,
            field: decision.profileUpdate.field,
            value: decision.profileUpdate.value,
            nextStep: decision.nextStep
          });
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
      } else if (decision.profileUpdate) {
        await ctx.runMutation(internal.coach.applyProfileUpdate, {
          phone: args.phone,
          field: decision.profileUpdate.field,
          value: decision.profileUpdate.value,
          nextStep: decision.nextStep
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
      console.error("Leap Coach agent error", {
        step: runner.onboardingStep,
        error: error instanceof Error ? error.message : "AGENT_FAILED"
      });

      await ctx.runMutation(internal.coach.saveAgentRun, {
        userId: runner.userId,
        decisionKind: "question",
        validationStatus: "failed",
        latencyMs: Date.now() - startedAt,
        errorCode: error instanceof Error ? error.message.slice(0, 80) : "AGENT_FAILED"
      });

      return {
        reply:
          runner.onboardingStep !== "complete"
            ? questionForStep(runner.onboardingStep)
            : "I could not understand that check-in. Tell me whether the session felt easy, right, or hard, and mention any soreness or pain.",
        kind: "question",
        validationStatus: "failed"
      } as const;
    }
  }
});
