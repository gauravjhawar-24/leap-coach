import type { CoachDecision, RunnerContext } from "./coachTypes";

const coachDecisionSchema = {
  type: "object",
  additionalProperties: false,
  required: ["reply", "kind", "nextStep", "plan", "adjustment"],
  properties: {
    reply: { type: "string" },
    kind: {
      type: "string",
      enum: ["question", "weekly_plan", "check_in_response", "safety_escalation"]
    },
    nextStep: {
      type: "string",
      enum: ["baseline", "runDays", "strength", "targetDate", "complete"]
    },
    plan: {
      anyOf: [
        {
          type: "object",
          additionalProperties: false,
          required: ["targetWindow", "phase", "totalKm", "days", "reason"],
          properties: {
            targetWindow: { type: "string" },
            phase: { type: "string" },
            totalKm: { type: "number" },
            days: {
              type: "array",
              minItems: 7,
              maxItems: 7,
              items: {
                type: "object",
                additionalProperties: false,
                required: [
                  "day",
                  "type",
                  "title",
                  "instruction",
                  "targetKm",
                  "durationMinutes",
                  "effort"
                ],
                properties: {
                  day: { type: "number", enum: [1, 2, 3, 4, 5, 6, 7] },
                  type: {
                    type: "string",
                    enum: ["run", "strength", "walk", "mobility", "rest", "check_in"]
                  },
                  title: { type: "string" },
                  instruction: { type: "string" },
                  targetKm: { type: ["number", "null"] },
                  durationMinutes: { type: ["number", "null"] },
                  effort: { type: "string", enum: ["easy", "moderate", "rest"] }
                }
              }
            },
            reason: { type: "string" }
          }
        },
        { type: "null" }
      ]
    },
    adjustment: {
      anyOf: [
        {
          type: "object",
          additionalProperties: false,
          required: ["reason", "nextSessionChange"],
          properties: {
            reason: { type: "string" },
            nextSessionChange: { type: "string" }
          }
        },
        { type: "null" }
      ]
    }
  }
} as const;

const systemPrompt = `You are Leap Coach, a careful beginner running coach helping someone build toward their first 21K.

Use the runner context and latest message to decide the next useful coaching action. You must not diagnose injuries, promise injury prevention, or force progression to meet a target date.

When creating a plan, use exactly seven days labelled 1 through 7. Every run must have a kilometer target. Day 3 must contain named strength exercises or the runner's known class. Day 6 must be a concrete walk or rest action. Keep the plan conservative and explain the reason for the choice.

If distance is missing from the baseline, ask for distance before promising a kilometer target. If the latest check-in mentions pain or high soreness, prefer rest or a reduced next session.

Return only the requested structured decision. Keep reply text short enough for WhatsApp and ask one question at a time.`;

function isCoachDecision(value: unknown): value is CoachDecision {
  if (!value || typeof value !== "object") {
    return false;
  }

  const decision = value as Partial<CoachDecision>;
  return (
    typeof decision.reply === "string" &&
    typeof decision.kind === "string" &&
    typeof decision.nextStep === "string" &&
    (decision.plan === null || typeof decision.plan === "object") &&
    (decision.adjustment === null || typeof decision.adjustment === "object")
  );
}

function normalizeDecision(decision: CoachDecision): CoachDecision {
  if (!decision.plan) {
    return decision;
  }

  return {
    ...decision,
    plan: {
      ...decision.plan,
      days: decision.plan.days.map((day) => {
        const { targetKm, durationMinutes, ...dayWithoutNullableFields } = day as typeof day & {
          targetKm?: number | null;
          durationMinutes?: number | null;
        };

        return {
          ...dayWithoutNullableFields,
          ...(targetKm === null || targetKm === undefined ? {} : { targetKm }),
          ...(durationMinutes === null || durationMinutes === undefined
            ? {}
            : { durationMinutes })
        };
      })
    }
  };
}

export async function generateCoachDecision(input: {
  context: RunnerContext & Record<string, unknown>;
  userMessage: string;
}): Promise<CoachDecision> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY_NOT_CONFIGURED");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  const startedAt = Date.now();

  try {
    const model = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
      method: "POST",
      signal: controller.signal,
      headers: {
        "x-goog-api-key": apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemPrompt }]
        },
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `Runner context:\n${JSON.stringify(input.context)}\n\nLatest WhatsApp message:\n${input.userMessage}`
              }
            ]
          }
        ],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: coachDecisionSchema,
          temperature: 0.2,
          maxOutputTokens: 4000
        }
      })
      }
    );

    if (!response.ok) {
      throw new Error(`GEMINI_REQUEST_FAILED_${response.status}`);
    }

    const payload = (await response.json()) as {
      candidates?: Array<{
        content?: {
          parts?: Array<{ text?: string }>;
        };
      }>;
    };
    const outputText = payload.candidates?.[0]?.content?.parts
      ?.map((part) => part.text ?? "")
      .join("")
      .trim();

    if (!outputText) {
      throw new Error("GEMINI_EMPTY_OUTPUT");
    }

    const parsed: unknown = JSON.parse(outputText);
    if (!isCoachDecision(parsed)) {
      throw new Error("GEMINI_INVALID_DECISION");
    }

    return normalizeDecision(parsed);
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`GEMINI_TIMEOUT_${Date.now() - startedAt}MS`);
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
