# Pending Changes

These changes are approved for discussion but are **not deployed yet**. Batch them into one implementation and deployment.

## Change 1: Build each week from the runner's current position

The plan must start from the runner's actual baseline, not a generic beginner template.

Use these inputs:

- Current comfortable running ability: distance and, if available, time.
- Number of training days available each week.
- Strength-training days and current strength experience.
- Optional target date.
- Recent check-ins: completed session, effort, soreness, and notes.

Rules:

- The runner's current ability is the starting point for Week 1.
- Each new week must be based on the most recent completed sessions and check-ins.
- Increase distance only when the runner is coping well; repeat or reduce the target when effort or soreness is high.
- The target date never overrides safety or readiness.
- If the runner gives only a time and no distance, ask for distance before promising a kilometer target. Do not invent false precision.

## Change 2: Every running session needs a kilometer target

Every week must show:

- Target kilometers for Run 1.
- Target kilometers for Run 2.
- Total planned running kilometers for the week.
- The time or run-walk structure for each run.
- A clear rule that the runner should stop or slow down if pain appears.

Example format:

```text
Week 1 target: 3.5 km total
Run 1: 1.5 km easy run-walk
Run 2: 2.0 km easy run-walk
```

The numbers must be calculated from the runner's baseline and recent check-ins. They must not be copied unchanged for every user.

## Change 3: Every day from Day 1 to Day 7 must have a specific purpose

Do not use labels such as "Run 1" or "optional easy movement" without telling the runner exactly what to do.

Each day must include one of these explicit actions:

- Run: distance target, effort, and run-walk structure.
- Strength: named exercises, sets, repetitions or time, and effort level.
- Walking: exact duration and an easy pace.
- Mobility: named movements and duration.
- Rest: no training, with a short recovery instruction.
- Check-in: what the runner should report.

The schedule should respect the runner's stated strength days where possible. If a requested schedule creates back-to-back demanding sessions, the coach should explain the conflict and move the session.

## Change 4: Replace the vague Day 3 strength session

Day 3 must contain a beginner-appropriate strength routine, adjusted when the runner already attends strength classes.

Default home routine for a runner without a stated strength plan:

- Chair squat: 2 sets of 8 repetitions.
- Glute bridge: 2 sets of 10 repetitions.
- Calf raise: 2 sets of 12 repetitions.
- Step-back lunge or supported split squat: 2 sets of 6 per side.
- Plank: 2 sets of 20 seconds.
- Rest about 60-90 seconds between sets.
- Keep 3-4 repetitions in reserve; do not train to failure.

If the runner has a gym or Cult class schedule, show that schedule instead and give a simple instruction to keep the session easy-to-moderate during the running build.

## Change 5: Replace "optional easy movement"

Day 6 must be a concrete recovery choice, not an open-ended exercise category.

Default Day 6:

```text
Day 6 - Recovery walk: Walk for 20 minutes at a comfortable pace. Do not jog or run.
If soreness is high, replace this with complete rest.
```

The plan should choose one action for Day 6 based on the check-in. It should not ask the beginner to decide between walking, jogging, running, or another exercise.

## Change 6: Daily check-ins must drive the next plan

After each planned session, ask for:

- What they completed.
- How hard it felt: easy, right, or hard.
- Soreness: none, some, or high.
- Any pain or unusual symptom.

Use the answer to adjust the next scheduled session and the next week's kilometer target. Store the adjustment reason so the runner can understand why the plan changed.

## Change 7: Replace the scripted bot with an AI coaching agent

Leap Coach should use an LLM as the reasoning layer. The current fixed replies are useful for testing the WhatsApp connection, but they are not the product.

The agent should:

- Read the runner's baseline, schedule, current plan, previous check-ins, and target date.
- Ask only the next useful question during onboarding.
- Create a complete seven-day plan based on the runner's current position.
- Explain why the timeline, distance, run-walk pattern, strength work, or recovery changed.
- Read daily check-ins and adjust the next session without waiting for a weekly reset.
- Remember the runner's history across WhatsApp messages.
- Tell the runner when a target date is no longer realistic instead of forcing progression.

The LLM must not have unrestricted control over training numbers. Code should validate:

- The plan contains seven labelled days.
- Every run has a kilometer target.
- Weekly distance does not increase beyond the agreed progression limit.
- Strength and running sessions are not scheduled as unsafe back-to-back hard sessions.
- Pain or high soreness produces rest, a reduction, or an escalation message.
- The agent never presents medical diagnosis or promises injury prevention.

The agent needs clear tools or functions, rather than only generating text:

1. `getRunnerProfile` - read the current runner profile.
2. `getRecentCheckIns` - read recent completed sessions and symptoms.
3. `createWeeklyPlan` - save a validated seven-day plan.
4. `recordCheckIn` - save the runner's check-in.
5. `adjustNextSession` - update the next session after a check-in.

The WhatsApp route remains the delivery channel. Meta should only transport the message; it should not contain the coaching logic.

## Acceptance test for the batch

After implementation, reset a test runner with a known baseline and verify that the WhatsApp message includes:

1. A Week 1 total kilometer target based on that baseline.
2. A kilometer target for every running day.
3. A specific strength routine on the strength day.
4. A specific walk or rest instruction on Day 6.
5. Day 1 through Day 7 labels in order.
6. A clear explanation of how check-ins will change the next session.

Do not deploy until all six checks pass locally and the final message has been reviewed.
