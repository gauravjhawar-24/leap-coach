# Leap Coach IDEA_SCOPE.md

> This document is the control plane for the build. Product code does not start until the active milestone and its acceptance test are clear.

## 0. Scope Status

| Field | Value |
|---|---|
| Event | GrowthX Build Week, treated as a fresh build starting 10 September 2026 |
| Builder | Gaurav, solo, with Codex |
| Build window | 10 to 13 September 2026, up to 40 hours |
| Submission target | 13 September 2026, 11:45 AM IST |
| Demo target | 13 September 2026, 3:00 PM IST |
| Current milestone | M0 |
| Live URL | Not created |
| Public repo | Not created |
| Last updated | 10 September 2026 |

### Status language

- **Specified:** decided here but not implemented.
- **Implemented:** code exists.
- **Working locally:** the golden path works in development.
- **Live:** the golden path works at the Vercel URL.
- **Verified:** acceptance tests passed on the live URL.
- **Demo-ready:** reset, fallback, timing, and evidence have been rehearsed.

## 1. Idea Lock

| Decision | Locked answer |
|---|---|
| One-sentence product | Leap Coach is a WhatsApp training companion that builds and adapts a beginner's complete path to their first 21K. |
| The one person | Aarav, 26, a beginner runner who goes to the gym and starts running occasionally but cannot stay consistent. |
| The one moment | Aarav decides to train for a first 21K but does not know whether he needs 12, 16, or 24 weeks, or how to fit running around strength sessions. |
| Current workaround | Generic training plans, YouTube searches, the Cult app for strength classes, and rebuilding the weekly schedule manually. |
| Core action | Aarav shares his baseline and constraints -> receives a coach-chosen 21K timeline, one next session, and daily check-ins that adapt the plan. |
| One outcome | Aarav completes a first comfortable 21K without the product forcing progression past his readiness. |
| Hard input | A beginner who misses a run, reports soreness, and has a hard leg-strength session in the same week. |
| Primary track | Revenue |
| Riskiest assumption | Beginners will complete daily WhatsApp check-ins and trust the coach to change a long-term 21K plan. |
| 30-minute no-code test | Optional validation task: manually simulate one week of adaptive check-ins with testers. It is not a blocker to locking the idea, but it remains required evidence before claiming strong pain. |
| First users | Shruti, Kalash, Chitranshu, and Ashlin, all reachable by WhatsApp. |
| Tuesday channel | Direct WhatsApp messages and relevant fitness or friend groups where these runners already spend time. |
| Personal artifact | A shareable 21K journey snapshot showing the current phase, target window, completed sessions, and why the next session changed. |
| Saturday numbers | 3 to 10 first-use signups, a live adaptive flow, 3 user conversations, and honest payment interest. |
| Library lineage | None. This is a founder-originated idea based on Gaurav's own gym-running problem. |

### Why this idea

#### The pain I feel

Gaurav spends time rebuilding a weekly schedule between gym and running, uses no current running product, and understands the repeated start-stop pattern from personal experience. He can reach four possible testers directly on WhatsApp.

#### Decisive proof

A stranger sends their baseline through WhatsApp, receives a realistic coach-chosen 21K timeline, reports a hard or missed session, and receives an adapted next session. The reviewer sees the stored plan history and the reason for the change.

## 2. User and Job

### User

- Who: Aarav, 26, beginner runner, regular gym user, inconsistent with running.
- Context: He wants to complete his first 21K but does not know what timeline is realistic.
- Frequency: Daily check-in; one or more planned training sessions each week.
- Existing behaviour: Tries generic plans, starts too hard, gets exhausted, misses sessions, and restarts.
- Cost: Lost time, repeated failed starts, confusion about progression, and risk of pushing too hard.

### Job to be done

> When a beginner wants to train for a first 21K, they need a plan that learns from their body and schedule, so that they can keep progressing without rebuilding the plan or forcing a bad week.

### Definition of completion

The job is complete only when:

1. The user has a baseline-informed 21K timeline with phases and weekly targets.
2. The user receives one clear next session through WhatsApp.
3. A check-in can change the timeline or next session with a visible reason.

A motivational message or static plan alone does not count.

## 3. Product Contract

### Golden path

1. User joins the WhatsApp testing channel and says they want to train for a first 21K.
2. Coach asks baseline, available run days, strength habits, constraints, and optional race date.
3. Coach proposes a safe target window and explains that safety overrides the date.
4. Coach sends the first week's targets and one next session.
5. User checks in after the session with completion, effort, soreness, and schedule changes.
6. Coach stores the check-in and sends an adjusted next session or confirms the plan remains unchanged.

### Inputs

| Input | Format/source | Hard characteristics | Validation |
|---|---|---|---|
| Current running ability | WhatsApp text | May be vague, such as "I can run 20 minutes" | Ask one follow-up if distance or time is missing |
| Days available to run | WhatsApp text | May change week to week | Store selected days and ask for a replacement day if needed |
| Strength training | WhatsApp text | May mention Cult class, gym, legs, or upper body | Map to easy, moderate, or hard load; do not prescribe medical advice |
| Schedule constraints | WhatsApp text | Work, travel, or classes can change | Store the constraint and adjust the next session |
| Soreness and effort | WhatsApp text or quick reply | Subjective and incomplete | Use plain choices: easy, right, hard; pain triggers rest guidance |
| Optional target date | WhatsApp text | May be unrealistic for baseline | Treat as a constraint, never as a command |
| Optional email | WhatsApp text | Must be valid-looking and optional | Save only when provided and valid-looking |

### Outputs and state changes

| Output/state change | Consumer | Required format | Proof of completion |
|---|---|---|---|
| Recommended timeline | Runner | Target window plus short reason | Visible WhatsApp message and stored plan |
| Weekly phase and targets | Runner | Running, strength, recovery targets | Plan row in Convex |
| Next session | Runner | Session type, duration or distance, effort cue, and stop rule | User can act without asking what to do |
| Daily check-in | Runner and coach | Completion, effort, soreness, availability | Check-in row in Convex |
| Adaptation | Runner | New next session or unchanged plan plus reason | Before and after plan state |
| Journey snapshot | Runner | Text or simple web link with current phase and target window | Screenshot-ready output |
| Signup/first-use event | Builder | Email plus completed onboarding or first-use event | Convex table screenshot |

### What the product must remember

- Within one session: baseline, schedule, strength sessions, target date, current phase, current next session, check-in, and adaptation reason.
- Across sessions in Convex: user identifier, optional email, plan versions, check-ins, completed sessions, and first-use timestamp.
- Deliberately forget: private message content not needed for training, health diagnoses, and unnecessary personal data.

### Human review boundary

- Can be automated: baseline parsing, timeline proposal, weekly target generation, next-session selection, check-in storage, and rule-based adaptation.
- Requires confirmation: target-date feasibility when the requested date is aggressive.
- Must be escalated: sharp pain, injury symptoms, medical conditions, or a request to train through pain.
- Uncertainty shown as: "I need more detail," "this is a conservative estimate," and "consider a professional before continuing" when risk signals appear.

## 4. What Makes It Different

### The obvious version

A static 12-week half-marathon plan delivered through a chat interface.

### The non-obvious choice

The coach owns the timeline. It can move the target window, hold progression, or reduce the next session when the runner's response or strength schedule calls for it.

### The moment they screenshot

"My 21K timeline moved from 16 weeks to 18 weeks because this week had hard leg training and higher soreness. The plan protected consistency instead of forcing distance."

### Ideas deliberately rejected

| Rejected mechanic | Reason |
|---|---|
| Nutrition coaching | Expands scope and introduces higher-stakes advice |
| Injury diagnosis | Unsafe and outside the product's role |
| Live pace tracking | Requires integrations and does not prove the adaptive loop |
| Full exercise library | Not needed to coordinate basic strength load |
| Native mobile app | WhatsApp is the required first surface |
| Generic motivational reminders | Advice without a changed plan is not the job |
| Automatic race registration | Unrelated to the training outcome |

## 5. Dependencies

### Verified capability matrix

| Required capability | Product/API/model | Exact endpoint/access | Limits | Verified how |
|---|---|---|---|---|
| WhatsApp send and receive for testing | Twilio WhatsApp testing environment or Sandbox | Twilio WhatsApp messaging API plus inbound webhook | Testers must join the Sandbox; production use has separate sender and template requirements | Official Twilio quickstart and Sandbox documentation checked 10 September 2026 |
| Public webhook | Vercel route | HTTPS webhook endpoint | Must be publicly reachable; local testing may need a tunnel | Official Twilio quickstart describes webhook configuration |
| Persistent plan data | Convex | Convex functions and tables | Credentials and schema must be configured in the project | Required fixed Build Week stack; setup still pending |
| Hosting | Vercel | Git-connected deployment | Public URL required for webhook and demo | Required fixed Build Week stack; project not connected yet |
| Coaching logic | TypeScript rules first, model optional | Local server function or Convex action | Model choice and cost are unverified until selected | Build rule: begin with deterministic adaptation for the critical path |
| Optional AI wording | OpenAI API only if needed | API access and current model choice to verify before use | Must not block the rule-based flow | Capability and pricing unverified; not critical path |

### Unsupported assumptions

- A production WhatsApp Business sender is not assumed.
- A Twilio account, WhatsApp Sandbox, verified recipient, webhook URL, and API credentials are not yet confirmed.
- Race-date feasibility cannot be guaranteed.
- The product does not claim medical safety or injury prevention.
- The first version does not assume Strava, Cult, Apple Health, Garmin, or wearable integrations.

### Secrets and access

Store Twilio credentials, Convex deployment values, and any model key only in local environment variables and Vercel or Convex environment settings. Never commit them to GitHub or place them in this file.

## 6. Rubric Strategy

Primary track: Revenue. Rubric version: 2.2.0.

### Primary track

| Decision | Answer |
|---|---|
| Primary track | Revenue |
| Why this fits | The product addresses Gaurav's own repeated planning problem, has named testers, and could become a paid adaptive coach |
| Track proof required | A named user completes the core flow and says the adaptive plan is useful enough to continue or pay for |

### Revenue rows

| Row | Weight | Max | Current level | Target level | Target points | Observable proof | Work required | Milestone |
|---|---:|---:|---|---|---:|---|---|---|
| Signups | 20x | 80 | L1: 0 | L2: 1-50 | 20 | Convex rows with optional email and completed first-use event | Onboarding and first-use write | M1-M3 |
| Live product quality | 8x | 32 | L1: not built | L3: working product, does what it claims | 16 | Stranger completes onboarding, receives plan, checks in, sees adaptation | Complete WhatsApp flow and reset path | M1-M5 |
| Revenue generated | 4x | 16 | L1: $0 | L1 initially | 0 | No payment claim | Add payment only if users ask to continue | M4-M5 |
| Waitlist | 4x | 16 | L1: 0 | L2: 1-150 | 4 | Optional interest capture | Add only after core flow works | M3-M5 |
| Pain point severity | 2x | 8 | L2: vague but personal | L4: named user, 3+ conversations | 6 | User notes and direct quotes | Watch three testers use it | M2-M4 |
| SOM | 2x | 8 | L1: no math | L3: correct users x annual price under ₹10 crore | 4 | Written calculation with assumptions | Pick a price only after user conversations | M5 |
| Right to win | 2x | 8 | L3: some domain exposure | L3 | 4 | Product reflects gym-plus-running constraints | Use lived workflow in onboarding and adaptation | M1-M5 |
| Why now | 1x | 4 | L2 at most | L3: clear recent tailwind | 2 | Verified capability and behaviour evidence | Keep claim modest and sourced | M5 |
| Moat and defensibility | 1x | 4 | L1 | L2: thin workflow lock-in | 2 | Plan history and adaptation memory | Store user-specific training history | M1-M5 |
| **Revenue total** | | **176** | | | **58 target base points** | | | |

### Bonus rows

No bonus work enters the critical path. Revenue signups and live product quality may also support cross-track bonus evidence if the relevant track requirements are met.

### Where the points are

The first build priority is:

1. Signups with a real first-use event.
2. Live product quality: onboarding to plan to check-in to adaptation.

### Competence floor

Payment, SOM, why now, and moat remain honest and lightweight. They must not delay the working WhatsApp loop.

### Rubric traps

- Counting Gaurav's own tests as signups.
- Calling a static plan an adaptive coach.
- Showing a dashboard instead of a user completing the WhatsApp flow.
- Claiming production WhatsApp access before the provider is configured.
- Giving medical or injury diagnoses.
- Spending time on multiple agents or a workout library.

## 7. GTM Plan

### Where the users already are

| Channel | Who is there | How to reach them | When |
|---|---|---|---|
| Direct WhatsApp | Shruti, Kalash, Chitranshu, Ashlin | Personal invite and observed first-use session | M2 |
| Fitness or friend WhatsApp groups | Beginner runners and gym users | Short launch message with one concrete example | M3 |
| Personal network | People who have started and stopped running | Direct invite with a 7-day adaptive trial | M3-M4 |

### Distribution posts, in my own words

- First user message: "I keep rebuilding my gym and running week from scratch, so I made a WhatsApp coach that changes the plan when the week goes wrong."
- Launch message: "Tell it your current running level, gym days, and any race date. It gives you a realistic path to your first 21K and one next session at a time."
- Daily update: Share what changed after a real check-in, without exposing private user data.
- Shipped post: Share the adaptive journey snapshot and the number of people who completed onboarding.

### Targets

| Row | Floor | Stretch | How I will know |
|---|---|---|---|
| Signups | 3 real first-use users | 10 real first-use users | Convex table screenshot |
| Live product quality | One stranger completes the flow | Three strangers complete it without help | Live URL recording and notes |
| Pain point severity | One conversation | Three conversations with confirming quotes | Written interview notes |
| Waitlist | 0 | 10 interested emails | Convex table |
| Revenue | $0 | One explicit willingness-to-pay signal | User conversation or payment link |

### Analytics setup

- Analytics tool: choose one simple analytics tool after the WhatsApp flow is live; do not delay M1.
- Read-only access: create before distribution.
- Signup/first-use: write to Convex after onboarding and after first plan generation.
- Payment link: none in the critical path.

## 8. Milestone Ladder

### M0 - feasibility and setup

**When:** 10 September 2026, first 4 hours.

**Purpose:** prove WhatsApp access and kill the riskiest dependency.

Required:

- Verify Twilio account or another chosen WhatsApp provider.
- Join a WhatsApp testing environment with one personal device.
- Receive an inbound message at a public webhook.
- Reply with one hardcoded message.
- Create the GitHub repository.
- Create the empty Next.js app in /Users/gaurav/buildweek/run5k.
- Deploy the empty app to Vercel.
- Create the Convex project and one empty user/check-in schema.

Acceptance test:

> A WhatsApp message reaches the public webhook and receives a reply; the empty app is live; the repo and Convex project exist.

If behind, cut to:

> Twilio WhatsApp testing environment, one webhook, one reply, and no AI model.

Stop condition:

> If no WhatsApp provider can receive and reply to a test message during M0, do not build the full product. Use a provider-approved test path or revisit the channel decision.

### M1 - one ugly complete flow

**When:** 10-11 September 2026.

**Purpose:** build the smallest complete adaptive coaching loop.

Required:

- Hardcoded onboarding questions.
- Baseline and constraints stored in Convex.
- Deterministic timeline proposal.
- One next-session message.
- Check-in message with completion, effort, soreness, and availability.
- One adaptation rule that visibly changes the next session.
- Vercel deployment and GitHub push.

Acceptance test:

> A tester completes onboarding, receives a 21K timeline and next session, checks in after a simulated hard week, and receives a reduced or delayed next session without explanation from Gaurav.

If behind, cut to:

> One onboarding script, one plan generator, one check-in, and two adaptation branches.

### M2 - first users

**When:** 11 September 2026.

**Purpose:** observe real use.

Required:

- Invite Shruti, Kalash, Chitranshu, and Ashlin.
- Get at least three first-use rows in Convex.
- Watch where each person stops.
- Write one sentence per user describing the blocker.
- Do not polish anything users have not tried.

Acceptance test:

> Three people other than Gaurav complete at least onboarding and receive a first next session.

If behind, cut to:

> One live screen-share with a tester and one complete observed run.

### M3 - distribute

**When:** 12 September 2026.

**Purpose:** get the product in front of more relevant people.

Required:

- Send direct WhatsApp invites.
- Post in one relevant group or personal channel.
- Track first-use events and replies.
- Set up analytics if the product includes a web handoff.
- Record the source of each user.

Acceptance test:

> The message is sent, direct invites are recorded, and Convex shows new first-use events.

If behind, cut to:

> Twenty direct messages and no public post.

### M4 - build, user calls, build again

**When:** 12-13 September 2026.

**Purpose:** fix the biggest blocker.

Required:

- One user conversation per evening.
- One blocker fixed and deployed.
- One adaptation rule improved.
- One CHANGELOG line after each deploy.
- Re-score the Revenue table.

Acceptance test:

> At least two improvements are deployed, and each one changes something a user can do.

If behind, cut to:

> Fix only the blocker that stops the most users.

### M5 - verify and submit

**When:** 13 September 2026, morning.

**Purpose:** protect the submission.

Required:

- Run the core flow twice from a fresh user.
- Verify messages, Convex writes, and adaptation history.
- Test logged out web surfaces on a phone.
- Make GitHub repository public.
- Confirm Vercel deployment.
- Capture Convex signup evidence and user notes.
- Write the one-paragraph product explanation.
- Submit before 11:45 AM IST.

Acceptance test:

> Two consecutive fresh runs work, including one run on another person's phone.

If behind, cut to:

> Submit the narrow flow with honest evidence and no unverified claims.

### M6 - demo

**When:** 13 September 2026, 3:00 PM.

Show the working product and numbers. Do not pitch future integrations.

## 9. Demo Contract

### One-sentence setup

Beginner runners do not need another static 21K plan; they need a coach that changes the journey when real weeks go wrong.

### Proof

| Time | What happens | What the reviewer sees | Row |
|---:|---|---|---|
| 0-15s | Explain Aarav's problem | One sentence and current workaround | Pain point severity |
| 15-60s | Fresh user starts on WhatsApp | Baseline, timeline, and next session | Live product quality |
| 60-90s | User reports a hard week | Check-in stored and next session changed | Live product quality |
| 90-120s | Show evidence | Convex first-use rows and user notes | Signups and pain |

### Live input

"I can run for 20 minutes twice a week, lift on Tuesday and Thursday, and I want to complete my first 21K. I have no race date."

### Fallback input

"I missed my run, my legs are sore after a hard strength class, and I can only train once this week."

### Number to lead with

Number of real first-use users who completed onboarding and received a plan.

### Claims I can prove

- The coach chooses a timeline from a stated baseline.
- The coach sends one next session.
- A check-in changes the next session.
- The product remembers the plan and check-in.

### Claims I must not make

- The plan prevents injury.
- The timeline is medically safe for every runner.
- The product has production WhatsApp access if only a Sandbox is configured.
- Users will definitely complete a 21K.
- The AI is more accurate than a qualified coach.

## 10. Test Plan

### Golden cases

| Case | Why representative | Expected final output | Status |
|---|---|---|---|
| Beginner with no race date | Default user | Conservative target window, weekly phase, next session | Not run |
| Beginner with a hard leg day | Core differentiation | Recovery-aware next session and reason | Not run |
| Beginner who misses a run | Core adaptation | Timeline holds or moves and next session reduces | Not run |

### Failure cases

| Failure | Expected behaviour | User recovery | Tested? |
|---|---|---|---|
| Ambiguous baseline | Ask one specific follow-up | User replies with time or distance | Not run |
| Unsupported medical request | Do not diagnose | Recommend rest and professional help | Not run |
| WhatsApp provider timeout | Store no false completion | Ask user to retry later | Not run |
| Empty or malformed reply | Repeat the available choices | User selects a simple option | Not run |
| Race date too soon | Explain that readiness wins | Offer a slower target window | Not run |
| Missed session | Do not punish or restart | Recalculate next session | Not run |

## 11. Risk Register

| Risk | Probability | Damage | Earliest test | Mitigation | Fallback |
|---|---|---|---|---|---|
| WhatsApp provider setup fails | High | Critical | M0 webhook test | Use Twilio testing path first | Narrow WhatsApp test with one provider |
| Testers do not join the Sandbox | Medium | High | Invite one tester in M0 | Give exact join instruction | Observe one tester on a screen share |
| Beginners distrust timeline changes | Medium | High | Show two before/after examples | Explain every change in plain language | Manual approval before sending adaptation |
| Product gives unsafe progression | Medium | Critical | Review adaptation rules | Conservative rules and pain escalation | Hold plan instead of increasing load |
| Daily check-ins feel like work | High | High | Ask testers after first check-in | Keep replies to four simple choices | Check-in only after training sessions |
| Scope grows into a full training platform | High | High | Review parking lot daily | Keep one next-session loop | Hardcode two training branches |
| No one wants to pay | Medium | Medium | Ask after observed use | Treat payment as evidence task, not core blocker | Stay at Revenue L2 with honest proof |

### Pre-mortem

It is submission morning and the product failed because:

1. WhatsApp setup took all the build time. Mitigation: test the provider before any UI or model work.
2. The product generated a plan but did not visibly adapt it. Mitigation: build two deterministic adaptation branches first.
3. Testers did not complete onboarding or daily check-ins. Mitigation: reduce onboarding to short WhatsApp replies and observe one user live.

## 12. Non-goals

1. Nutrition, sleep, injury diagnosis, or medical recommendations.
2. Strava, Cult, Garmin, Apple Health, or wearable integrations.
3. Native mobile apps, payments, public workout libraries, or race registration.

Any change to these requires a written scope decision.

## 13. Parking Lot

| Idea | Potential value | Why not now | Revisit after |
|---|---|---|---|
| Strava sync | Less manual reporting | Integration risk | After 3 users complete the loop |
| Cult class sync | Better strength scheduling | No verified API access | After manual strength input works |
| Voice notes | Easier check-ins | WhatsApp media parsing adds risk | After text check-ins work |
| Coach dashboard | Better review | User-facing WhatsApp loop comes first | After repeated use |
| Payments | Revenue proof | Can delay the core flow | After explicit willingness to pay |
| Multiple coaching personalities | Engagement | Does not improve adaptation | After retention evidence |

## 14. Current State

### Active milestone

M0 - feasibility and setup.

### Implemented

- Product direction selected.
- Revenue selected as primary track.
- First users identified.
- WhatsApp-only constraint selected.
- Scope approved in conversation.
- run5k workspace created.

### Working locally

- Nothing yet.

### Live

- Nothing yet.

### Verified

- GitHub account and SSH access.
- Vercel account and CLI access.
- Convex account exists.
- Official Twilio docs confirm a WhatsApp testing environment and inbound webhook path.
- Twilio account and WhatsApp testing setup are not yet verified.

### Current blocker

WhatsApp provider choice and first inbound webhook test.

### Next single action

Verify a Twilio WhatsApp testing environment and receive one inbound message at a public webhook before building the coaching logic.

## 15. Decision Log

| Time | Decision | Evidence/reason | Scope impact |
|---|---|---|---|
| 10 Sep 2026 | Start a fresh Build Week schedule today | Original event dates have passed | New four-day schedule used |
| 10 Sep 2026 | Work inside /Users/gaurav/buildweek/run5k | User instruction | Existing apps remain untouched |
| 10 Sep 2026 | Use WhatsApp only | User preference and product concept | Provider setup is M0 blocker |
| 10 Sep 2026 | Change goal from 5K to first 21K | User decision | Longer timeline and stronger safety boundaries |
| 10 Sep 2026 | Target beginner runners | User decision | Baseline assessment and conservative progression required |
| 10 Sep 2026 | Revenue is primary track | User decision and named testers | Signups and live product quality lead the build |
| 10 Sep 2026 | Skip the 30-minute validation text as a scope blocker | User personally experiences the problem | Validation remains evidence work, not idea approval |
