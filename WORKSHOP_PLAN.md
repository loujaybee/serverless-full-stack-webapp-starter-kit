# Software Factory Automation Workshop

One hour. One codebase. One automation of your own design, running against
a real repo by the end.

## A note before we start

Automating the SDLC with AI is fast-moving and unsettled. We'll show you
what Ona does today — the tools aren't silver bullets, and the industry
is still figuring out what "good" looks like. Treat this as a joint
discussion as much as a hands-on workshop: what works, what's missing,
what your customers need.

## Objectives

By the end of the hour you should be able to:

- Explain what Ona is and how automations fit into a developer's workflow
- Explain why automations depend on a configured dev environment
- Describe what outer-loop SDLC automation means in practice
- Name where this approach falls down today
- Pitch Ona to AWS customers without over-claiming

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

1. **Explore & design (20 min)** — Open the repo in Ona (you'll be
   invited to the workshop org) and use an **Ona agent** to walk you
   through the codebase. Ask it: *"What does this app do? Where's the
   pain? What would you automate?"* Pick one pain and fill in the canvas
   below. A facilitator will poke holes in your design before you build.
2. **Build (20 min)** — Turn the design into a working automation in
   Ona. Run it. Iterate.
3. **Share (15 min)** — Each team takes a couple of minutes to the room:
   - What pain were you solving?
   - What did you build?
   - Did it work?
   - **What limitations or challenges did you hit?** ← the important one
4. **Debrief (5 min)** — Patterns across teams. What's Ona good at?
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