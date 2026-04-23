# Software Factory Automation Workshop

One hour. One codebase. One automation of your own design, running against
a real repo by the end.

## A note before we start

Automating the SDLC with AI is a new and fast-moving topic. The speakers
will show you what Ona does today — but today's tools aren't silver
bullets, and the industry is still figuring out what "good" looks like.

Treat this session as a **joint discussion** as much as a hands-on
workshop. What works? What's missing? What do your customers need that
nobody is shipping yet? The goal is to leave with a shared view of where
this space is, where it's going, and how to help AWS customers navigate
it.

## Objectives

By the end of the hour you should be able to:

- **Understand Ona and automations** — what they are, how they fit into
  a developer's workflow
- **Understand the dev-environment connection** — why automations depend
  on a configured environment, and what breaks when that's wrong
- **Understand outer-loop SDLC automation** — how agents can handle the
  work *around* coding (reviews, tests, docs, cleanup) rather than just
  the coding itself
- **Understand the limitations** — where this approach falls down today,
  what requires human judgement, what the industry hasn't solved
- **Speak clearly to AWS customers** — describe the benefits, the use
  cases, and the caveats of a solution like Ona, without over-claiming

All of this comes from hands-on learning. You'll design and ship an
automation, hit real problems, and we'll debrief together.

## The repo

You'll be working on a fork Lou has prepared:
**[`loujaybee/serverless-full-stack-webapp-starter-kit`](https://github.com/loujaybee/serverless-full-stack-webapp-starter-kit)**
— a Next.js + Prisma + Postgres todo app, designed to be readable for
both humans and agents.

You have two options for working on it:

1. **PR against Lou's fork** — simpler, everyone's work is visible in one
   place
2. **Clone to your own fork** — copy the configuration files across if
   you want to work independently

Either way works. Your facilitator will share the URL during the session.

## What you'll do

1. **Explore (10 min)** — Open the repo in Ona (you'll be invited to the
   workshop org) and use an **Ona agent** to walk you through the
   codebase. Ask it: *"What does this app do? Where's the pain? What
   would you automate?"* Write down three things that look painful to
   deal with every week.
2. **Design (15 min)** — Pick one pain. Fill in the canvas below. A
   facilitator will poke holes in your design before you build.
3. **Build (20 min)** — Turn the design into a working automation in
   Ona. Run it. Iterate.
4. **Share (5 min)** — 60 seconds to the room:
   - What pain were you solving?
   - What did you build?
   - Did it work?
   - **What limitations or challenges did you hit?** ← the important one
5. **Debrief (5 min)** — Patterns across teams. What's Ona good at?
   What's missing? What would you want to tell your customers? What
   would you want the industry to build next?

## Before the session

**Don't skip this — the session is too short to fix setup problems live.**

1. Sign in to [app.ona.com](https://app.ona.com) with GitHub.
2. Accept the invite to the workshop Ona org. The org has credits
   attached so you can run agents and automations during the session.
   Your facilitator will share the invite URL in chat.
3. Confirm you can open the shared repo in Ona and that an environment
   boots cleanly.

If any step fails, flag it to the facilitator before the session starts.

---

## The Automation Canvas

Fill this out before you build anything. The design is the workshop — the
building is just verification.

### 1. The pain

What repetitive, boring, or error-prone thing does your automation
remove? Be specific. *"Fixes bugs"* is too vague. *"Every time we add a
new endpoint, nobody updates the OpenAPI examples"* is a pain.

> _Your answer:_

**Check:** Would a teammate understand exactly what annoyance you're
removing, without asking a question?

### 2. Trigger

When does this run? Pick one.

- [ ] **Manual** — a human presses a button
- [ ] **PR event** — opened, labelled, merged, or commented on
- [ ] **Schedule** — cron. When? _____________
- [ ] **Webhook** — from what? _____________

**Check:** How often will this fire? Too much? Too little?

### 3. Steps

Walk through what the automation does, in order. Mark each step as
**[P]rompt**, **[S]hell**, **[PR]** (pull-request operation), or
**[R]eport**.

> 1. \[__\] _______________________________________________
> 2. \[__\] _______________________________________________
> 3. \[__\] _______________________________________________
> 4. \[__\] _______________________________________________

**Check:** If step 2 fails, what happens?

### 4. Dev environment needs

This is the box most people get wrong. What must be installed, running,
or configured for the steps above to work?

- **Tools on PATH** (e.g. `node`, `docker`, `psql`):
- **Services running** (e.g. Postgres, the Next.js dev server):
- **Secrets or credentials** (e.g. a GitHub token):
- **Files or state** (e.g. installed deps, applied migrations):

The dev environment for this repo has already been configured for you.
Your job is to reason about whether that configuration is *enough* for
your automation — and if not, what would need to change.

### 5. Success looks like

How will you know it worked?

> _Your answer:_

### 6. How it could go wrong

Name one plausible failure mode. What's your guardrail?

> **Failure:**
>
> **Guardrail:**

---

## Building your automation

Once a facilitator has poked a hole in your canvas, create your
automation in Ona.

**Use the Ona UI.** Open the Automations page for the repo and create a
new automation. Set the trigger, write the prompt, and run it. The UI is
the fastest path for a one-hour workshop.

If you want to commit your automation so it lives alongside the code
(and can be reused by your team), there's also an Ona CLI that exports
the automation as YAML you can PR into the repo. You don't need that
today — but know it exists.

### Common ways prompts fail

1. **Too vague.** *"Fix the bugs"* isn't a prompt. *"Find Next.js routes
   without input validation and add Zod schemas"* is.
2. **No stop condition.** Tell the agent when to stop — after N files,
   when tests pass, when one endpoint is done.
3. **No verification.** Give the agent something to check its own work
   against. *"Run `npm test`. If it fails, revert and report."*

### When you're stuck

- **Stuck in the UI** → grab a facilitator
- **Stuck on the prompt** → read canvas box 3 aloud; is the prompt doing
  what those steps say?
- **Stuck on the environment** → check box 4; does the pre-configured
  environment actually have what your steps need?
- **Stuck conceptually** → ask yourself what a junior engineer would
  need to do this task. Then tell the agent that.

---

## Winning

Four awards, decided at the end:

- **Clearest pain** — the canvas item that reads most like a real weekly
  annoyance
- **Most creative trigger** — room vote
- **Best dev-env reasoning** — the team that noticed something the
  environment couldn't yet support and explained why
- **Shipped to main** — the team whose automation actually merged a PR

A team whose automation didn't quite run can still win on design. That's
deliberate — the *limitations* you hit are at least as valuable as the
wins. Bring them to the debrief.