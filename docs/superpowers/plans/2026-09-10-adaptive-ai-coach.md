# Leap Coach Adaptive AI Coach Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Leap Coach's scripted onboarding and fixed Week 1 text with an AI coaching agent that understands a runner's current position, creates a validated seven-day plan with kilometer targets, and adapts the next session from daily check-ins.

**Architecture:** WhatsApp remains the message channel. The Next.js webhook passes messages to Convex. Convex stores the runner profile, plans, check-ins, and agent decisions. A Convex action calls the selected LLM provider, while deterministic code validates every plan before it is saved or sent. The LLM decides how to explain and adapt the plan; code controls the allowed structure, progression, and safety boundaries.

**Tech Stack:** Next.js 16, TypeScript, Convex, Meta WhatsApp Cloud API, Vercel, one LLM provider called through a small server-side adapter.

**Spec:** `PENDING_CHANGES.md`

## Global Constraints

- The live channel is Meta WhatsApp Cloud API; do not add Twilio back into the critical path.
- The current production Convex deployment is `https://dazzling-moose-185.convex.cloud`.
- Secrets stay in Convex or Vercel environment variables and never enter source files, WhatsApp messages, or this plan.
- The LLM cannot directly write an unvalidated plan to the database.
- Every generated week has exactly seven labelled days.
- Every running day has a kilometer target and a run-walk or running instruction.
- Pain or high soreness causes a reduction, rest instruction, or escalation message; it never causes automatic progression.
- The target date is optional and never overrides readiness or safety.
- Do not deploy after an individual code change; deploy only after the whole milestone batch passes review.
- The WhatsApp response must be understandable without the user knowing how the system works.

---

## Current State and File Map

The existing implementation is intentionally small but has too many responsibilities in one file.

| File | Current responsibility | Planned responsibility |
|---|---|---|
| `app/api/whatsapp/route.ts` | Receives Meta events, calls Convex, sends replies | Transport only: validate event, call the agent entry point, send the returned reply |
| `convex/coach.ts` | Onboarding state, hardcoded replies, fixed plan creation | Thin orchestration functions and persistence calls |
| `convex/schema.ts` | User, plan, and check-in tables | Add structured plan days and agent decision records |
| `PENDING_CHANGES.md` | Product requirements | Source requirements for this plan |
| `convex/coachRules.ts` | Does not exist | Pure validation, progression, scheduling, and safety rules |
| `convex/coachTypes.ts` | Does not exist | Shared TypeScript types for agent input and output |
| `convex/llm.ts` | Does not exist | Server-only provider adapter and structured-output parsing |
| `convex/coachAgent.ts` | Does not exist | LLM action, tool orchestration, and decision persistence |
| `docs/` | Does not exist as a plan area | Implementation plans and later verification notes |

The implementation should preserve the existing WhatsApp route and Convex deployment rather than replacing the working integration.

## Milestone 0: Freeze the product contract and choose the LLM provider

**Purpose:** Remove ambiguity before adding an AI call. The model provider and response format must be known before the agent is built.

**What problem this solves:** Right now the product requirement says "use an AI agent" but does not define what the model must decide, what data it may use, or what shape the application can safely accept. Without this contract, the model could return attractive but incomplete text that the app cannot validate.

**Expected outcome:** We have one documented provider, model, server-side credential plan, response format, timeout, and cost limit. A provider response can be tested before the rest of the product depends on it.

**Files:**

- Read: `PENDING_CHANGES.md`
- Modify: `PENDING_CHANGES.md` only if a decision changes the product contract
- Create: `docs/agent-decision-contract.md`

**Decisions to record:**

- The provider and exact model name available to this project.
- The server-side API endpoint and authentication method.
- The maximum response time acceptable for one WhatsApp message.
- The maximum spend allowed for one onboarding plan and one check-in.
- Whether the provider supports structured JSON output, or whether the adapter must parse and validate a JSON code block.

**Agent decision contract:** The model must return one object with these fields:

```ts
type CoachDecision = {
  reply: string;
  kind: "question" | "weekly_plan" | "check_in_response" | "safety_escalation";
  nextStep: "baseline" | "runDays" | "strength" | "targetDate" | "complete";
  plan?: {
    targetWindow: string;
    phase: string;
    totalKm: number;
    days: Array<{
      day: 1 | 2 | 3 | 4 | 5 | 6 | 7;
      type: "run" | "strength" | "walk" | "mobility" | "rest" | "check_in";
      title: string;
      instruction: string;
      targetKm?: number;
      durationMinutes?: number;
      effort: "easy" | "moderate" | "rest";
    }>;
    reason: string;
  };
  adjustment?: {
    reason: string;
    nextSessionChange: string;
  };
};
```

**Acceptance test:** A reviewed document exists with the provider, model, environment variable names, exact decision shape, timeout, and cost limit. No implementation begins until the model can return the required shape in a single test request.

**Fallback if blocked:** Keep the current scripted flow live and record the provider failure. Do not add a fake AI label to the current rule-based bot.

## Milestone 1: Create the data model for real coaching memory

**Purpose:** Give the agent enough structured history to make a decision from the runner's current position.

**What problem this solves:** The current app stores most answers as long text and creates a fixed plan. The agent cannot reliably tell whether a runner can run 1.5 km or 3 km, what happened last week, or which plan is currently active.

**Expected outcome:** Every runner has structured memory for baseline ability, availability, plans, check-ins, and agent decisions. A single context object can give the agent the information needed to make the next coaching decision.

**Files:**

- Modify: `convex/schema.ts`
- Create: `convex/coachTypes.ts`
- Modify: `convex/coach.ts`

**Data to store:**

- `users.baselineDistanceKm` as an optional number.
- `users.baselineTimeMinutes` as an optional number.
- `users.trainingDaysPerWeek` as an optional number.
- `users.strengthSchedule` as the user's original text.
- `users.targetDate` as optional text.
- `plans.totalKm` as a number.
- `plans.days` as the seven validated day objects.
- `plans.reason` as the explanation shown to the runner.
- `plans.status` as `active` or `superseded`.
- `checkIns.pain` as `none`, `possible`, or `high`.
- `checkIns.sessionDay` as a number from 1 to 7 when known.
- `agentRuns` with user ID, input summary, decision kind, validation result, latency, error text if any, and created time. Never store the API token or full secret-bearing request headers.

**Required functions:**

```ts
getRunnerContext(userId): Promise<RunnerContext>
saveCheckIn(input): Promise<CheckIn>
saveValidatedPlan(input): Promise<Plan>
saveAgentRun(input): Promise<AgentRun>
```

**Acceptance test:** A test runner can have a profile, one plan containing seven days, and one check-in stored in Convex. The data can be read back in one context object without relying on parsing a long text field.

**Fallback if blocked:** Store the new structured data alongside the existing text fields and keep the old fields for compatibility. Do not delete existing production data during this milestone.

## Milestone 2: Build deterministic training and safety rules

**Purpose:** Keep the LLM inside safe, predictable boundaries. This milestone must work without any LLM call.

**What problem this solves:** An LLM can misunderstand a distance, increase training too quickly, omit a day, or recommend training despite pain. Those errors cannot be left to wording instructions alone.

**Expected outcome:** Deterministic rules calculate allowed distance ranges, reject incomplete plans, choose recovery actions, and prevent unsafe or structurally invalid plans before they reach a runner.

**Files:**

- Create: `convex/coachRules.ts`
- Modify: `convex/coachTypes.ts`
- Create: `convex/coachRules.test-notes.md` with manually verified examples if no test runner is installed

**Pure functions:**

```ts
parseBaseline(text): { distanceKm?: number; timeMinutes?: number }
calculateStartingKm(context): number | null
calculateWeeklyKm(context): { run1Km: number; run2Km: number; totalKm: number }
validatePlan(plan, context): { ok: true } | { ok: false; errors: string[] }
chooseRecoveryAction(checkIn): "walk" | "rest"
```

**Rules:**

- If the runner provides only time and no distance, mark the baseline as incomplete and ask for distance before promising kilometer targets.
- Week 1 must begin at or below the runner's known comfortable distance per run.
- A later week may not increase total running distance by more than the agreed progression cap.
- A hard effort, high soreness, or pain must repeat, reduce, or pause the next run.
- A run day cannot also be labelled as rest or strength.
- The plan must have one strength day with named exercises or the user's known class.
- Day 6 must be a concrete walk or rest instruction, never "optional easy movement."
- Each run must have `targetKm`, `effort`, and an instruction.
- The validator rejects missing days, duplicate day numbers, impossible kilometer values, and missing safety language.

**Acceptance examples:**

1. Baseline `2 km in 20 minutes` produces a finite starting target.
2. Baseline `20 minutes` produces a request for distance, not a fabricated 1.5–2 km promise.
3. A hard effort and high soreness produces rest or a reduced next run.
4. A plan with no Day 6 action fails validation.
5. A plan with a generic `Run 1` but no kilometer target fails validation.

**Acceptance test:** Run every example against the pure functions and inspect the returned values. The same inputs always return the same output without network access.

**Fallback if blocked:** Use conservative fixed values only for a runner whose distance baseline is known, and refuse to create a kilometer plan when it is not known.

## Milestone 3: Add the LLM provider adapter

**Purpose:** Isolate vendor-specific API details from Leap Coach's domain logic.

**What problem this solves:** If Meta handling, Convex persistence, and provider-specific request code are mixed together, changing the model or diagnosing an API failure will risk the WhatsApp flow.

**Expected outcome:** Leap Coach has one server-only function that accepts coaching context and returns a typed decision, regardless of provider-specific request details. Invalid or failed model responses become controlled errors.

**Files:**

- Create: `convex/llm.ts`
- Modify: `convex/coachTypes.ts`
- Modify: Convex environment variables through the dashboard, never in source

**Interface:**

```ts
generateCoachDecision(input: {
  systemPrompt: string;
  context: RunnerContext;
  userMessage: string;
  tools: string[];
}): Promise<CoachDecision>
```

**Provider adapter requirements:**

- Read the API key and model name only on the server.
- Set a request timeout.
- Ask for the exact `CoachDecision` shape from Milestone 0.
- Parse the response as JSON.
- Return a typed error for timeout, rate limit, invalid JSON, or provider failure.
- Do not send the Meta access token, webhook verification token, or unrelated environment variables to the model.
- Keep the system prompt focused on coaching context, safety boundaries, and the required output format.

**Acceptance test:** A real provider request returns one valid `CoachDecision` for a known runner context, and an intentionally malformed response is rejected before it reaches Convex storage.

**Fallback if blocked:** Add a local fake provider behind the same interface for deterministic development, but label it as a test provider and never claim it is the live AI coach.

## Milestone 4: Build the AI agent orchestration and tools

**Purpose:** Make the LLM useful as an agent: it reads state, makes a decision, calls safe application functions, and remembers the result.

**What problem this solves:** A plain chatbot can answer the latest message but cannot reliably retrieve the runner's history, save a new plan, record a check-in, or adjust the next session. That would make the product a chat wrapper rather than a coach.

**Expected outcome:** The agent can complete a full loop: read context, reason about the message, use controlled application functions, validate the result, save it, and return an explanation to the runner.

**Files:**

- Create: `convex/coachAgent.ts`
- Modify: `convex/coach.ts`
- Modify: `convex/coachRules.ts`
- Modify: `convex/schema.ts` if agent-run fields are not already present

**Agent flow:**

1. Receive the WhatsApp number and message text.
2. Load the runner context from Convex.
3. Classify the message as onboarding input, check-in, reset, or unclear input.
4. Ask the LLM for the next decision using the context and safe output contract.
5. Validate any plan or adjustment with deterministic rules.
6. If validation fails, make one repair request with the validation errors included.
7. If the repaired result still fails, send a clear fallback message and log the failure.
8. Save the validated plan, check-in, or profile update.
9. Save an agent-run record with the decision and validation result.
10. Return the final WhatsApp-safe reply.

**Tools exposed to the agent:**

```ts
getRunnerProfile(userId)
getRecentPlans(userId)
getRecentCheckIns(userId)
recordProfileAnswer(userId, answer)
recordCheckIn(userId, checkIn)
createWeeklyPlan(userId, validatedPlan)
adjustNextSession(userId, validatedAdjustment)
```

The tools are application functions controlled by Convex. The model cannot execute arbitrary database queries or arbitrary code.

**Acceptance test:**

- A fresh runner with a complete baseline receives a seven-day plan based on that baseline.
- A runner with an incomplete distance baseline is asked for the missing distance.
- A runner reporting an easy session receives a normal next step.
- A runner reporting hard effort or high soreness receives a reduced or recovery next step.
- The plan and the agent-run record are visible in Convex after each successful request.

**Fallback if blocked:** Use the fake provider from Milestone 3 with the same validation and tool flow. Do not bypass validation to make the live provider appear to work.

## Milestone 5: Replace the WhatsApp route's scripted call

**Purpose:** Connect the real WhatsApp conversation to the agent without changing Meta webhook behavior.

**What problem this solves:** The current WhatsApp route calls the scripted Convex mutation directly. Even if the agent works internally, users will still receive the old fixed replies unless the transport path is changed.

**Expected outcome:** A WhatsApp message reaches the AI agent and the validated reply returns through Meta, while webhook verification, event filtering, and secret handling continue to work.

**Files:**

- Modify: `app/api/whatsapp/route.ts`
- Modify: `convex/coachAgent.ts`
- Modify: `convex/coach.ts`

**Transport behavior:**

- Keep GET webhook verification unchanged.
- Keep the existing Meta message extraction.
- Pass `message.from` and `message.text.body` to the agent entry point.
- Send only the agent's final `reply` to WhatsApp.
- Return a useful 500 response when Convex or the LLM fails, while logging a safe error summary.
- Ignore delivery-status events and messages without text bodies.
- Do not log access tokens, full user context, or private health details.

**WhatsApp response rules:**

- Use short paragraphs and one clear question at a time.
- Preserve the Day 1 to Day 7 labels.
- Include kilometer targets for every run.
- Include concrete strength exercises.
- Use explicit words such as `walk for 20 minutes` or `rest`; never `optional easy movement`.
- Explain one reason when the plan changes.

**Acceptance test:** A Meta test message travels through Vercel and Convex, the agent returns a reply, and WhatsApp receives it. A non-message webhook event returns successfully without sending a reply.

**Fallback if blocked:** Route only reset and onboarding messages through the fake provider while keeping the webhook operational. Record the blocked provider request in `agentRuns`.

## Milestone 6: Add the full seven-day plan and check-in experience

**Purpose:** Make the output useful in real life rather than merely AI-generated.

**What problem this solves:** A plan can technically be AI-generated and still be too vague to follow. "Run 1," "strength," and "easy movement" leave the beginner to make the important decisions themselves.

**Expected outcome:** Every runner receives a complete Day 1–Day 7 schedule with individual kilometer targets, a specific strength routine, a concrete recovery action, and a clear next check-in. Different starting abilities produce different plans.

**Files:**

- Modify: `convex/coachAgent.ts`
- Modify: `convex/coachRules.ts`
- Modify: `convex/coachTypes.ts`
- Modify: `convex/coach.ts`

**Required plan behavior:**

- Day 1: run with distance, time or run-walk structure, and effort.
- Day 2: explicit recovery action.
- Day 3: specific strength exercises or the runner's scheduled class.
- Day 4: second run with its own distance target.
- Day 5: explicit rest or mobility instruction.
- Day 6: a chosen walk or rest action, not an optional category.
- Day 7: rest and weekly review check-in.

The agent must be able to produce different plans for:

- A runner starting at 1.5 km.
- A runner starting at 3 km.
- A runner with two available training days.
- A runner already attending Cult strength classes.
- A runner whose recent check-in says the last run was hard.

**Acceptance test:** Run all five profiles through the same agent entry point and compare the saved plans. The plans must differ where the inputs differ, while preserving the seven-day shape and validation rules.

**Fallback if blocked:** Ship only the known-baseline, two-run, one-strength flow and explicitly ask for missing data before planning further.

## Milestone 7: Failure handling, observability, and manual recovery

**Purpose:** Make failures understandable and recoverable while testing with real users.

**What problem this solves:** LLM calls, WhatsApp events, database writes, and user inputs can all fail. Without recovery behavior, one bad response could overwrite a valid plan or leave the user with no useful next step.

**Expected outcome:** The user receives a plain-language recovery message, the last valid plan remains available, and the builder can identify the failure from a safe agent-run record without exposing secrets.

**Files:**

- Modify: `convex/coachAgent.ts`
- Modify: `app/api/whatsapp/route.ts`
- Modify: `convex/schema.ts`
- Create: `docs/agent-verification.md`

**Failures to handle:**

- Empty WhatsApp message.
- Unsupported message type such as an image or audio message.
- Ambiguous baseline such as `I run sometimes`.
- Invalid or incomplete LLM output.
- LLM timeout or rate limit.
- Convex save failure.
- Meta send failure.
- User reports pain or high soreness.
- User asks for diagnosis or asks to ignore a safety adjustment.

**Required behavior:**

- Send a short recovery question instead of exposing a stack trace.
- Preserve the last valid plan when a new plan fails validation.
- Mark the agent run as failed with a safe reason.
- Give the builder enough logs to find the user, run ID, failure type, and latency.
- Never claim a plan was saved if the database write failed.

**Acceptance test:** Trigger each failure with a controlled test message or mocked provider response. Confirm the user receives a useful reply and the last valid plan remains intact.

**Fallback if blocked:** Disable automatic plan replacement and send the last valid next session with a manual-review notice stored in the agent run log.

## Milestone 8: Local verification and one batched deployment

**Purpose:** Verify the complete golden path before changing production.

**What problem this solves:** Deploying after every small change makes it difficult to know which version is live and increases the chance of exposing a partially implemented agent to users.

**Expected outcome:** One reviewed batch is tested locally, deployed to Convex once, deployed to Vercel once, and verified end to end with two different runner profiles and two different check-in outcomes.

**Files:**

- Read: all files modified in Milestones 1–7
- Create or update: `docs/agent-verification.md`

**Verification sequence:**

1. Run `npm run build` and confirm TypeScript and Next.js compilation pass.
2. Deploy Convex once with the full batch using `npx convex deploy --yes`.
3. Push the complete source batch to GitHub.
4. Wait for one Vercel production deployment to report `Ready`.
5. Send `reset` from the WhatsApp test phone.
6. Provide a baseline with both distance and time, for example `2 km in 20 minutes`.
7. Complete the training-days, strength, and target-date questions one message at a time.
8. Verify the returned message has seven labelled days, running kilometer targets, strength details, and a concrete Day 6 action.
9. Send a check-in saying the run was easy and verify the next session is not unnecessarily reduced.
10. Reset a second test runner and report hard effort plus high soreness. Verify the next session is reduced or recovery-focused.
11. Check Convex for the runner profile, plan, check-in, and agent-run record.
12. Record the final live URL, GitHub commit, provider/model, and known limitations in `docs/agent-verification.md`.

**Acceptance test:** Two independent test runners complete onboarding and receive materially different plans from different baselines. One check-in changes the next session. No secret appears in source, logs, or WhatsApp output.

**Fallback if blocked:** Keep the previous production deployment live and document the exact failed acceptance test. Do not partially deploy an unvalidated agent.

## Milestone 9: Real-user pilot and controlled iteration

**Purpose:** Test whether the AI coach helps real beginners, not just whether the API responds.

**What problem this solves:** A technically valid plan can still be confusing, too demanding, or irrelevant to the runner's actual schedule. Only real users can show where the conversation stops making sense.

**Expected outcome:** At least three real people receive and understand a plan, complete or attempt the first action, and submit a check-in. Their biggest blocker becomes the next scoped improvement instead of adding speculative features.

**Files:**

- Modify: `docs/agent-verification.md`
- Modify: `PENDING_CHANGES.md` when a product decision changes
- Modify: `CHANGELOG.md` if the project creates it during this milestone

**Pilot:**

- Invite Shruti, Kalash, Chitranshu, and Ashlin one at a time.
- Observe whether each person understands the first action without explanation.
- Record where each person stops, what they ask, and whether they complete the first session.
- Do not count a test account as a real signup or product result.
- Change one major behavior at a time so the effect of each iteration is visible.

**Acceptance test:** At least three people receive a plan, can identify today's action, and can submit a check-in. The agent's largest real-world blocker is written down before any new feature is added.

**Fallback if blocked:** Return to the smallest working flow: known baseline, one validated seven-day plan, one check-in, and one adjusted next session.

## Definition of done

This batch is complete only when:

- Leap Coach uses an LLM for coaching decisions.
- The model is isolated behind a server-only adapter.
- The agent reads stored runner context and recent check-ins.
- Every saved plan passes deterministic validation.
- Every week has seven labelled days.
- Every running day has a kilometer target.
- Strength work is specific.
- Day 6 is a concrete walk or rest action.
- A check-in changes the next session when the evidence requires it.
- The last valid plan survives an LLM or deployment failure.
- The WhatsApp golden path works on the live Vercel URL.
- The implementation and limits are documented in `docs/agent-verification.md`.

## Self-review against the spec

- Current-position planning: Milestones 1, 2, 4, and 6.
- Kilometer targets per run and per week: Milestones 2 and 6.
- Specific strength content: Milestones 2 and 6.
- Concrete Day 6 action: Milestones 2 and 6.
- AI agent rather than scripted bot: Milestones 0, 3, 4, and 5.
- Check-in adaptation: Milestones 1, 4, and 6.
- Safety boundaries: Milestone 2 and Global Constraints.
- Failure handling: Milestone 7.
- Single batched deployment: Milestone 8.
- Real-user proof: Milestone 9.
