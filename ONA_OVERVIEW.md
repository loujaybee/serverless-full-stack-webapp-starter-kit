# Ona on AWS — Workshop Guide

A practical guide to the main aspects and components of Ona for a technical audience. Each section includes the docs to read, commands to run, and YAML you can copy.

> **Note on naming.** The CLI is `ona`. Inside an environment, runtime variables still use the `GITPOD_` prefix (e.g., `GITPOD_ENVIRONMENT_ID`) for backward compatibility.

---

## Contents

- [0. Introduction](#0-introduction)
  - [What Ona is](#what-ona-is)
  - [The building blocks](#the-building-blocks)
  - [How they fit together](#how-they-fit-together)
  - [The software-factory build loop](#the-software-factory-build-loop)
  - [Where configuration lives](#where-configuration-lives)
  - [Index of things you can configure](#index-of-things-you-can-configure)
- [1. Projects](#1-projects)
- [2. Dev containers](#2-dev-containers)
  - [The fields that matter](#the-fields-that-matter)
  - [Three ways to set up your dev container](#three-ways-to-set-up-your-dev-container)
  - [The iteration loop](#the-iteration-loop)
  - [Verification checklist](#verification-checklist)
- [3. Tasks & services (`.ona/automations.yaml`)](#3-tasks--services-onaautomationsyaml)
  - [Services vs. tasks vs. devcontainer hooks](#services-vs-tasks-vs-devcontainer-hooks)
  - [Triggers available here](#triggers-available-here)
  - [Editing workflow](#editing-workflow)
  - [Generate from natural language](#generate-from-natural-language)
- [4. Automations (scheduled & PR-triggered agent runs)](#4-automations-scheduled--pr-triggered-agent-runs)
  - [Mental model](#mental-model)
  - [Trigger types](#trigger-types)
  - [Anatomy of an Automation](#anatomy-of-an-automation)
  - [Set one up](#set-one-up)
  - [Templates to start from](#templates-to-start-from)
- [5. Authentication & secrets](#5-authentication--secrets)
  - [5.1 Where secrets can live](#51-where-secrets-can-live)
  - [5.2 OIDC — the recommended path for cloud access](#52-oidc--the-recommended-path-for-cloud-access)
  - [5.3 Decision guide](#53-decision-guide)
- [6. Building a software factory with Ona](#6-building-a-software-factory-with-ona)
  - [Pick the events first](#pick-the-events-first)
  - [Design the human-in-the-loop checkpoint](#design-the-human-in-the-loop-checkpoint)
  - [Make sure the dev environment is bulletproof](#make-sure-the-dev-environment-is-bulletproof)
  - [Build one Automation, then copy it](#build-one-automation-then-copy-it)
  - [Anti-patterns](#anti-patterns)
- [7. MCP & integrations](#7-mcp--integrations)
  - [7.1 MCP servers](#71-mcp-servers)
  - [7.2 First-party integrations](#72-first-party-integrations)
  - [7.3 Skills](#73-skills)
- [Appendix A — CLI cheat sheet](#appendix-a--cli-cheat-sheet)
- [Appendix B — Troubleshooting quick reference](#appendix-b--troubleshooting-quick-reference)
- [Appendix C — Where to go next](#appendix-c--where-to-go-next)

---

## 0. Introduction

### What Ona is

Ona gives you standardized, reproducible cloud development environments and agentic workflows that run on **your AWS account**. The control plane is hosted by Ona; the data plane (the VMs your environments run in) lives in your AWS account, which means your code, secrets, and network policies never leave your perimeter.

### The building blocks

| Block | What it is |
|---|---|
| **Runner** | An AWS account + region where Ona provisions environments. One per account/region. |
| **Project** | A repo URL + default config + access rules. The unit you launch environments from. |
| **Environment** | An ephemeral or persistent dev VM created from a project. |
| **Agent** | An LLM-driven session attached to an environment. Uses the same setup humans do. |
| **Tasks & services** | Long-running services and one-shot commands that run **inside** an environment. Defined in `.ona/automations.yaml`. Covered in §3. |
| **Automations** (the product) | Named workflows that run an **agent** on a trigger (manual / cron / PR). Defined in the dashboard. Covered in §4. |

> ⚠️ "Tasks & services" and "Automations" are two distinct features that share the word *automation* in the product. Keep them straight: §3 = inside one environment, §4 = spawns environments to run agents.

### How they fit together

```
                ┌───────────────────────────────────────────┐
                │            Ona control plane              │
                │  (auth, projects, automations, secrets)   │
                └──────────────────┬────────────────────────┘
                                   │ OIDC / API
                ┌──────────────────┴────────────────────────┐
                │           Your AWS account                │
                │                                           │
                │   ┌─────────────────────────────────┐     │
                │   │           Runner                │     │
                │   │   (one per AWS account+region)  │     │
                │   └────────────────┬────────────────┘     │
                │                    │ provisions VMs       │
                │   ┌────────────────┴────────────────┐     │
                │   │           Project A             │     │
                │   │  ┌──────────────┬───────────┐   │     │
                │   │  │ Environment  │ Prebuilds │   │     │
                │   │  │  (human or   │   Warm    │   │     │
                │   │  │   agent)     │  pools    │   │     │
                │   │  └──────┬───────┴───────────┘   │     │
                │   │         │ runs                  │     │
                │   │  ┌──────┴───────────────────┐   │     │
                │   │  │ devcontainer.json        │   │     │
                │   │  │ + .ona/automations.yaml  │   │     │
                │   │  │ + .ona/mcp-config.json   │   │     │
                │   │  └──────────────────────────┘   │     │
                │   └─────────────────────────────────┘     │
                │                                           │
                │   Project B, C, …                         │
                └───────────────────────────────────────────┘
```

### The software-factory build loop

You don't build a factory in one shot. You ship one piece at a time, and each piece feeds the next.

```
        ┌──────────────────────────────────────────────┐
        │  1. Get the dev environment working          │
        │     • Write devcontainer.json                │
        │     • ona environment devcontainer rebuild   │
        │     • Iterate until tests run                │
        └──────────────────┬───────────────────────────┘
                           │  reproducible env
                           ▼
        ┌──────────────────────────────────────────────┐
        │  2. Codify in-environment work               │
        │     • Add services + tasks to                │
        │       .ona/automations.yaml                  │
        │     • ona automations update                 │
        │     • Verify humans + agents both use them   │
        └──────────────────┬───────────────────────────┘
                           │  repeatable commands
                           ▼
        ┌──────────────────────────────────────────────┐
        │  3. Wire up an Automation                    │
        │     • Pick a trigger (cron / PR / manual)    │
        │     • Write the Prompt step                  │
        │     • Add a Report step (Slack / PR / Linear)│
        │     • Run manually first, then enable        │
        └──────────────────┬───────────────────────────┘
                           │  agent does work
                           ▼
        ┌──────────────────────────────────────────────┐
        │  4. Add the human-in-the-loop checkpoint     │
        │     • Draft PR (not auto-merge)              │
        │     • Required reviewer or label gate        │
        │     • Notification to the right channel      │
        └──────────────────┬───────────────────────────┘
                           │  works in production
                           ▼
        ┌──────────────────────────────────────────────┐
        │  5. Repeat for the next workflow             │
        │     ──► back to step 3 with a new Automation │
        └──────────────────────────────────────────────┘
```

### Where configuration lives

| Lives in… | Examples |
|---|---|
| **The repo** | `.devcontainer/devcontainer.json`, `.ona/automations.yaml`, `.ona/mcp-config.json`, `AGENTS.md` |
| **Ona dashboard** | Projects, Automations, secrets, integrations, OIDC token config, skills, runners |
| **AWS** | OIDC identity provider, IAM roles + trust policies, the runner CloudFormation stack |

### Index of things you can configure

A quick index so you know what exists before you go looking. Each row links to the section that covers it.

| Thing | Where it lives | What it does | Section |
|---|---|---|---|
| **Project** | Ona dashboard | Connects a repo to a runner; defines defaults | §1 |
| **Devcontainer** | `.devcontainer/devcontainer.json` in repo | Base image, runtimes, tools, VS Code extensions | §2 |
| **Tasks & services** | `.ona/automations.yaml` in repo | Long-running services and on-demand commands inside an environment | §3 |
| **Automations** (the product) | Ona dashboard | Scheduled / PR-triggered agent runs | §4 |
| **Project secrets** | Ona dashboard or `ona project secret` | Per-repo tokens (DB URLs, API keys) | §5.1 |
| **User secrets** | Ona dashboard or `ona user secret` | Per-user tokens that follow you across projects | §5.1 |
| **Container registry secrets** | Same as project/user, with `--registry-host` | Pull from private registries (e.g., ECR) | §5.1 |
| **OIDC** | AWS IAM + Ona dashboard (token config) | Short-lived AWS credentials, no static keys | §5.2 |
| **Prebuilds** | Ona dashboard (per project) | Pre-warm dev containers on `main` so environments start fast | §6 |
| **Warm pools** | Ona dashboard (per project) | Pre-provisioned environments waiting for users | §6 |
| **MCP servers** | `.ona/mcp-config.json` in repo | Extend agents with external tools (GitHub, Linear, browser, custom) | §7.1 |
| **First-party integrations** | Ona dashboard → Org Settings → Integrations | Linear, Sentry, Atlassian, Notion, Granola | §7.2 |
| **Skills** | Org-level via dashboard | Reusable prompts agents discover; available as `/slash` commands | §7.3 |
| **Runners** | Ona dashboard + AWS account | The AWS account/region where environments execute | §6 |

### Read first

- [Getting started](https://ona.com/docs/ona/getting-started)
- [Quickstart](https://ona.com/docs/ona/quickstart)
- [Environments overview](https://ona.com/docs/ona/environments/overview)
- [AWS Runner overview](https://ona.com/docs/ona/runners/aws/overview)

---

## 1. Projects

A project ties a repo to a default environment configuration and a set of access rules. One repo can have many projects (e.g., one per branch family or per team).

> **Note.** Automations (§4) don't strictly require a project — you can point one at a raw repository — but a project is recommended. A project gives the Automation a stable runner, devcontainer, secrets, and prebuild config, so every run starts from the same baseline. Without a project, the agent has to bootstrap from scratch every time.

### What a project owns

- The repo URL and default branch
- Default environment class (CPU/memory/disk tier)
- Default editor (VS Code, JetBrains, terminal)
- Access rules (who can launch environments, who can edit config)
- Project secrets (see §5)
- Prebuilds and warm pool config (see §6)

### Create a project

The dashboard is the recommended path — it walks you through repo selection, runner, environment class, and access in one flow. Use **Projects → New Project**.

If you prefer the CLI, it works **both inside an Ona environment and on your local machine** (after `ona login`). Same commands, same behavior:

```bash
# List existing projects
ona project list

# Create one (positional repo URL; --class-id can be repeated for multiple classes)
ona project create "https://github.com/<org>/<repo>" \
  --name "workshop-app" \
  --class-id <class-id>

# Inspect
ona project get <project-id>
```

Launch an environment from it (also works inside or outside the environment):

```bash
ona environment create --project <project-id>
```

### Read first

- [Projects overview](https://ona.com/docs/ona/projects/overview)
- [Create your first project](https://ona.com/docs/ona/create-first-project)
- [Project secrets](https://ona.com/docs/ona/projects/project-secrets)
- [Project sharing](https://ona.com/docs/ona/projects/project-sharing)
- [Recommended editors](https://ona.com/docs/ona/projects/recommended-editors)

---

## 2. Dev containers

Ona uses the open [dev container spec](https://containers.dev). The file lives at `.devcontainer/devcontainer.json` in your repo. If it's missing, Ona uses a default image, but you should always commit one — it's how you make the environment reproducible.

### The fields that matter

| Field | Use |
|---|---|
| `image` | Base image. Pin to a digest for reproducibility. |
| `features` | Pre-built install scripts (Node, Go, AWS CLI, Terraform, etc.). |
| `customizations.vscode.extensions` | Auto-installed VS Code extensions. |
| `forwardPorts` | Ports automatically exposed in the dashboard. |
| `onCreateCommand` | Runs once when the container is first created. |
| `postCreateCommand` | Runs after `onCreateCommand`, after the workspace is mounted. |
| `postStartCommand` | Runs every time the container starts. |

### Three ways to set up your dev container

Pick whichever matches how much you want to think about it.

#### Option A — Let an agent do it (recommended for first time)

Start an environment on the repo with no dev container and ask Ona:

> Create a high-quality, fully working "development environment as code" configuration for the current environment.

Ona will read your repo, look at existing CI / contribution docs, write a `.devcontainer/devcontainer.json` and `.ona/automations.yaml`, and iterate until the environment builds and the project's tests/dev server actually run. The full prompt template is in the [quickstart](https://ona.com/docs/ona/quickstart) under "Optimize your environment."

This is the fastest path for the workshop — attendees get a working setup in one prompt and can read the result to learn the spec.

#### Option B — Generate piece-by-piece from the CLI

Use the agent in the dashboard (Option A) for `automations.yaml` and write the devcontainer by hand using the [features registry](https://containers.dev/features) for the building blocks. Good when you want fine-grained control but don't want to write everything from scratch.

#### Option C — Write it manually

Drop the example below into `.devcontainer/devcontainer.json`, edit, push.

#### Example: Node + AWS CLI + Terraform

```json
{
  "name": "Workshop Dev",
  "image": "mcr.microsoft.com/devcontainers/base:ubuntu-22.04",
  "features": {
    "ghcr.io/devcontainers/features/node:1": { "version": "20" },
    "ghcr.io/devcontainers/features/aws-cli:1": {},
    "ghcr.io/devcontainers/features/terraform:1": {}
  },
  "forwardPorts": [3000, 8080],
  "postCreateCommand": "npm ci",
  "customizations": {
    "vscode": {
      "extensions": [
        "hashicorp.terraform",
        "amazonwebservices.aws-toolkit-vscode"
      ]
    }
  }
}
```

(Replacing the earlier example block — same content, kept here so the section reads top-to-bottom.)

### The iteration loop

Editing a dev container is a tight feedback cycle. Use these four commands.

```bash
# 1. Validate the file before you push (catches syntax + schema errors)
ona environment devcontainer validate .devcontainer/devcontainer.json

# 2. Rebuild the current environment with your changes (no need to recreate)
ona environment devcontainer rebuild

# 3. Tail the build logs in another terminal so you see failures live
ona environment devcontainer logs --no-follow   # one-shot
ona environment devcontainer logs               # follow

# 4. Once it's green, commit so teammates and agents pick it up
git add .devcontainer/devcontainer.json && git commit -m "devcontainer: add aws + terraform"
```

You can target a specific environment by passing its ID: `ona environment devcontainer rebuild <env-id>`.

#### A typical workshop iteration

1. Add a feature to `devcontainer.json` (e.g., `python:1`).
2. `ona environment devcontainer validate .devcontainer/devcontainer.json` — catches typos.
3. `ona environment devcontainer rebuild` — rebuilds in place.
4. `ona environment devcontainer logs` — watch the feature install.
5. If it fails, edit and rebuild again. No need to destroy the environment.
6. Once green, commit and push.

### Verification checklist

After a rebuild, confirm the setup actually works inside the environment:

```bash
node --version
aws --version
terraform version
npm test            # if your repo has tests
npm run dev         # if your repo has a dev server
```

If your project's commands work here, agents will be able to run them too.

### Tips

- **Pin image digests** (`@sha256:…`) for true reproducibility.
- Move heavy install steps into a custom Dockerfile or a published base image — `postCreateCommand` runs on every fresh environment; image build runs once and is cached.
- Use **prebuilds** (§6) to amortize even that cost across the team.
- Don't fight the spec — if you need something exotic, prefer a custom image referenced from `image:` over a 50-line `postCreateCommand`.

### Read first

- [Dev container overview](https://ona.com/docs/ona/configuration/devcontainer/overview)
- [Getting started](https://ona.com/docs/ona/configuration/devcontainer/getting-started)
- [Optimizing startup times](https://ona.com/docs/ona/configuration/devcontainer/optimizing-startup-times)
- [Dotfiles](https://ona.com/docs/ona/configuration/dotfiles) (your personal layer on top)

---

## 3. Tasks & services (`.ona/automations.yaml`)

> **Heads up: two features share the word "automation."** This section covers the **in-environment** kind: tasks and services defined in `.ona/automations.yaml` that run *inside* one environment. The **product feature** also called "Automations" — scheduled or PR-triggered **agent runs** that span environments — is covered in §4. They use different triggers, different CLI verbs, and different docs.

`.ona/automations.yaml` is where you define long-running **services** and one-shot **tasks** that should be available in every environment of a project. Think of it as `docker-compose.yml` + a Makefile, scoped to one environment.

### Top-level structure

```yaml
services:   # long-running processes (dev server, database, MCP server)
tasks:      # one-shot commands (seed DB, run tests, build)
```

### Services vs. tasks vs. devcontainer hooks

| Use… | When |
|---|---|
| Devcontainer `postCreateCommand` | One-time setup tied to the container itself (install deps that aren't in the image) |
| Service in `automations.yaml` | A process that should stay running for the life of the environment |
| Task in `automations.yaml` | A repeatable command a human or agent might run on demand or at environment start |

### Triggers available here

These are **environment lifecycle** triggers — they fire based on what's happening inside one environment, not based on calendar time or PR events.

| Trigger | Fires when |
|---|---|
| `manual` | A user or agent explicitly runs it (CLI or dashboard) |
| `postDevcontainerStart` | After the dev container finishes starting (first start or rebuild). Does not fire during prebuilds. |
| `postEnvironmentStart` | Every time the environment starts or resumes |
| `prebuild` | During prebuild execution only (no user secrets available) |

There is no `cron` and no `postPullRequest` here — those belong to §4.

### Minimal example

```yaml
services:
  api:
    name: API server
    description: Runs the local API on :8080
    triggeredBy: [postDevcontainerStart]
    commands:
      start: npm run dev
      ready: curl -sf http://localhost:8080/health

tasks:
  seedDb:
    name: Seed database
    triggeredBy: [manual]
    command: ./scripts/seed.sh

  test:
    name: Run tests
    triggeredBy: [manual]
    command: npm test
```

The `ready` command is a readiness gate — other services and tasks can depend on it. This is how you order startup (services themselves don't support `dependsOn`; tasks do).

### Editing workflow

```bash
# List what's defined and running in this environment
ona automations service list
ona automations task list

# Apply edits to the running environment without committing first
ona automations update .ona/automations.yaml

# Manage services
ona automations service start api
ona automations service stop  api
ona automations service logs  api          # follows by default; --no-follow for one-shot

# Run a task
ona automations task start seedDb
ona automations task logs  seedDb
```

Once the file works, commit it. Fresh environments and prebuilds will pick it up.

### Generate from natural language

There is no `ona automations generate` CLI subcommand. To generate `automations.yaml` from a description, ask Ona in the dashboard:

> Add an `.ona/automations.yaml` to this repo. I need a Postgres service on :5432 and a `migrate` task that runs `prisma migrate deploy`.

The agent will write the file, validate it, and commit it.

You can also bootstrap an empty file and edit:

```bash
ona automations init
```

### Cross-references

- If a task needs **cloud access**, use OIDC (§5.2) — never put AWS keys in the YAML.
- If a task needs an **API token**, use a project or org secret (§5.1).

### Read first

- [Tasks & services overview](https://ona.com/docs/ona/configuration/tasks-and-services/overview)
- [`automations.yaml` schema reference](https://ona.com/docs/ona/reference/automations-yaml-schema)
- [Examples](https://ona.com/docs/ona/configuration/tasks-and-services/examples)
- [Generating tasks & services](https://ona.com/docs/ona/configuration/tasks-and-services/generating-tasks-and-services)

---

## 4. Automations (scheduled & PR-triggered agent runs)

> This is the **product feature** called Automations — distinct from the tasks and services in §3. An Automation here is a **named workflow that runs an agent** (one or more Prompt steps) against a project, on a trigger you configure in the dashboard.

### Mental model

| §3: Tasks & services | §4: Automations |
|---|---|
| Defined in repo (`automations.yaml`) | Defined in the dashboard (per project/org) |
| Runs **inside** an existing environment | **Spawns a fresh environment** each run |
| Triggered by environment lifecycle | Triggered by `manual`, `cron`, or `pullrequest` |
| Steps are shell commands | Steps are **Prompt steps** (agent runs) + **Report step** |
| `ona automations service|task …` | Dashboard "Automations" tab; Linear/Slack templates |

You can — and should — use both together. An Automation typically launches an environment, the environment's `automations.yaml` gets that environment ready (services start, deps install), and then the Automation's Prompt step runs an agent inside.

### Trigger types

| Trigger | Use for |
|---|---|
| **Manual** | On-demand runs from the dashboard. |
| **Time-based (cron)** | Nightly Linear triage, weekly dep updates, scheduled compliance scans. |
| **Pull request** | Runs an agent when a PR is opened/updated/approved. **Enterprise plan only**, GitHub and GitLab. |

#### Time-based options

| Frequency | Configurable fields |
|---|---|
| Hourly | minute |
| Daily | hour, minute |
| Weekly | day of week, hour, minute |
| Monthly | day of month, hour, minute |

#### Pull request events

`Opened`, `Updated`, `Ready for review`, `Review requested`, `Approved` — pick one or more.

### Anatomy of an Automation

Every Automation is a sequence of steps. Two step types:

- **Prompt step** — runs an agent in a fresh environment with the prompt you supply
- **Report step** — posts the result somewhere (Slack, GitHub PR comment, Linear comment)

A typical scheduled Automation:

```
[trigger: cron 0 3 * * *]
  → Prompt step: "Pick the top open Linear issue assigned to ona-bot.
                  Implement it. Run tests. Open a draft PR."
  → Report step: post the PR link to #engineering in Slack
```

### Set one up

In the dashboard:

1. **Automations → New Automation**
2. Pick a project (defines the runner, repo, devcontainer, secrets)
3. Choose a trigger (Manual / Time-based / Pull request)
4. Add a Prompt step with your instructions
5. Optionally add a Report step
6. Save → click **Run** to test, or wait for the trigger

### Templates to start from

Rather than write your first Automation from scratch, copy a template:

- **10x engineer** — daily, picks top Linear issue, implements, opens draft PR
- **Scan recent commits for bugs** — proposes minimal fixes
- **Sentry triage and fix** — top unresolved error → fix → PR
- **Weekly release notes** — drafts from the week's merged PRs
- **CVE / dependency updates** — scans, updates, opens PR
- **Daily standup generator** — pulls Linear + git activity into Slack

Browse them at [ona.com/templates](https://ona.com/templates).

### Why each Automation needs a healthy `automations.yaml`

Every Automation run starts a fresh environment. If your repo doesn't have a working devcontainer (§2) and `automations.yaml` (§3), the agent has to set everything up before it can do real work — slow, flaky, and uses your credits. Get §2 and §3 right *first*, then §4 becomes reliable.

### Plan & access notes

- Pull request triggers require [webhooks](https://ona.com/docs/ona/automations/webhooks) — **Enterprise plan only**.
- Use a [service account](https://ona.com/docs/ona/organizations/service-accounts) for PR Automations so agent activity is distinguishable from human work.
- See [plans and limits](https://ona.com/docs/ona/automations/plans-and-limits) for run quotas.

### Read first

- [Automations overview](https://ona.com/docs/ona/automations/overview)
- [Configure Automations](https://ona.com/docs/ona/automations/configure-automations)
- [Automations as code](https://ona.com/docs/ona/automations/automations-as-code)
- [Manual trigger](https://ona.com/docs/ona/automations/triggers/manual)
- [Time-based / cron](https://ona.com/docs/ona/automations/triggers/timebased)
- [Pull request trigger](https://ona.com/docs/ona/automations/triggers/pullrequest)
- [Running Automations](https://ona.com/docs/ona/automations/running-automations)
- [Report step](https://ona.com/docs/ona/automations/report-step)
- [Webhooks](https://ona.com/docs/ona/automations/webhooks)
- [Guardrails](https://ona.com/docs/ona/automations/guardrails)
- [Plans & limits](https://ona.com/docs/ona/automations/plans-and-limits)
- [Troubleshooting](https://ona.com/docs/ona/automations/troubleshooting)
- [Create your first Automation](https://ona.com/docs/ona/create-first-automation)

---

## 5. Authentication & secrets

There are two questions to answer for any environment: **how does it get cloud credentials**, and **how does it get other secrets** (API tokens, database URLs, registry credentials)? Ona has clean answers for both.

### 5.1 Where secrets can live

| Scope | Managed in | Use for | Example |
|---|---|---|---|
| **Organization secrets** (Enterprise) | Dashboard: Settings → Organization → Secrets | Org-wide values shared across projects | `DATADOG_API_KEY` |
| **Project secrets** | Dashboard or `ona project secret` | Per-repo values, available to every environment of that project | `DATABASE_URL`, `STRIPE_TEST_KEY` |
| **User secrets** | Dashboard or `ona user secret` | Personal tokens that follow a user across projects | personal `GH_TOKEN` |

Each secret can be mounted as an **environment variable** (`--env-var`), a **file** (`--file-path /path/in/env`), or a **container registry credential** (`--registry-host`). Precedence: user > project > organization, so individuals can override defaults.

#### Create secrets from the CLI

```bash
# Per-project — as an environment variable
ona project secret create <project-id> \
  --name DATABASE_URL \
  --value "postgres://…" \
  --env-var

# Per-project — from a file (avoids leaking via shell history)
ona project secret create <project-id> \
  --name STRIPE_TEST_KEY \
  --value-from-file ./stripe.key \
  --env-var

# Per-user — mounted as a file at a specific path
ona user secret create \
  --name SSH_KEY \
  --value-from-file ~/.ssh/id_rsa \
  --file-path /home/gitpod/.ssh/id_rsa
```

> Organization secrets are created in the dashboard only — there is no `ona organization secret` subcommand.

#### Use a secret in a task

```yaml
# .ona/automations.yaml — secrets mounted as env vars are just present in the environment
tasks:
  publish:
    triggeredBy: [manual]
    command: |
      npm publish --access public --token "$NPM_TOKEN"
```

### 5.2 OIDC — the recommended path for cloud access

> **Requires Enterprise plan.** AWS OIDC federation is part of the Enterprise tier.

For AWS access, **don't store access keys**. Use OIDC: the Ona CLI generates a short-lived JWT, AWS STS exchanges it for temporary credentials, and the environment uses those credentials.

#### How it works

1. The Ona CLI mints an OIDC ID token for the current environment, signed by `https://app.gitpod.io`.
2. AWS verifies the token against the OIDC identity provider you registered in IAM.
3. The trust policy on the role decides which tokens are accepted (scope by organization, project, environment, user).
4. STS returns short-lived credentials.

#### One-time AWS setup

Register Ona as an OIDC identity provider in IAM:

- **Provider URL:** `https://app.gitpod.io`
- **Audience:** `sts.amazonaws.com`

Or via the AWS CLI:

```bash
aws iam create-open-id-connect-provider \
  --url https://app.gitpod.io \
  --client-id-list sts.amazonaws.com \
  --thumbprint-list ""
```

Then create an IAM role with a trust policy like this — scoped to one project:

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {
      "Federated": "arn:aws:iam::<ACCOUNT_ID>:oidc-provider/app.gitpod.io"
    },
    "Action": "sts:AssumeRoleWithWebIdentity",
    "Condition": {
      "StringEquals": {
        "app.gitpod.io:aud": "sts.amazonaws.com"
      },
      "StringLike": {
        "app.gitpod.io:sub": "organization_id:<ORG_ID>:project_id:<PROJECT_ID>:*"
      }
    }
  }]
}
```

The `sub` claim format is `organization_id:<ORG_ID>:project_id:<PROJECT_ID>:*` (or `:environment_id:<ENV_ID>` for ad-hoc environments not in a project). Find your org/project IDs in the dashboard URL or via `ona project list`.

Inspect the actual claims your environment will send before writing the trust policy:

```bash
ona idp token --audience sts.amazonaws.com --decode
```

#### Use it from a task

```yaml
# .ona/automations.yaml — runs inside an environment
tasks:
  deployPreview:
    name: Deploy preview to S3
    triggeredBy: [manual]
    command: |
      ona idp login aws --role-arn arn:aws:iam::123456789012:role/OnaPreviewDeploy
      aws s3 sync ./dist s3://preview-$GITPOD_ENVIRONMENT_ID/
```

`ona idp login aws` writes temporary credentials to the AWS config under the `default` profile (override with `--profile`). A human or agent can then run `ona automations task start deployPreview`, or an Automation (§4) can have its agent run the task as part of a larger workflow.

You can also auto-login on every environment start:

```yaml
tasks:
  awsLogin:
    name: AWS login
    triggeredBy: [postDevcontainerStart]
    command: ona idp login aws --role-arn arn:aws:iam::<ACCOUNT_ID>:role/<ROLE_NAME>
```

### 5.3 Decision guide

| You need… | Use |
|---|---|
| AWS access from environments | **OIDC** (Enterprise plan) |
| GCP / Azure / Vault access | OIDC (separate provider per cloud) |
| Third-party API token (Stripe, OpenAI, Slack) | Project or organization secret |
| Personal Git/SSH credentials | User secret |
| Pull from a private container registry (e.g., ECR) | Project or org secret with `--registry-host` |
| Long-lived service credentials | Avoid — use OIDC + short-lived tokens |

### Read first

- [Secrets overview](https://ona.com/docs/ona/configuration/secrets/overview)
- [Environment variables](https://ona.com/docs/ona/configuration/secrets/environment-variables)
- [File-mounted secrets](https://ona.com/docs/ona/configuration/secrets/files)
- [Container registry secrets](https://ona.com/docs/ona/configuration/secrets/container-registry-secret)
- [User secrets](https://ona.com/docs/ona/configuration/secrets/user-secrets)
- [Organization secrets](https://ona.com/docs/ona/organizations/organization-secrets)
- [Project secrets](https://ona.com/docs/ona/projects/project-secrets)
- [Add your first secret](https://ona.com/docs/ona/add-first-secret)
- [OIDC overview](https://ona.com/docs/ona/configuration/oidc)
- [AWS OIDC setup](https://ona.com/docs/ona/identity/aws-oidc)
- [GCP OIDC](https://ona.com/docs/ona/identity/gcp-oidc) · [Azure OIDC](https://ona.com/docs/ona/identity/azure-oidc) · [Vault OIDC](https://ona.com/docs/ona/identity/vault-oidc)

---

## 6. Building a software factory with Ona

A "software factory" is a set of **Automations that react to events**, run agents in **reproducible environments**, and surface their work to humans at the right checkpoint. Once you have one, building the next one is mostly copy-paste.

The build loop diagram in §0 ("The software-factory build loop") is the recipe. This section is the playbook.

### Pick the events first

Start by listing the events that should trigger work, and what should happen at each. This is the spec. Without it, you'll build Automations that don't map to anything anyone needed.

| Event | Automation | Human checkpoint |
|---|---|---|
| New issue lands in Linear `triage` | Agent investigates, drafts a fix or asks for repro | Maintainer reviews draft PR |
| PR opened | Agent runs review, posts inline comments | Reviewer reads + decides |
| Sentry error fires N times in M minutes | Agent traces to source, opens draft PR | On-call engineer reviews |
| Cron, weekly | Agent updates dependencies, opens PR | Reviewer merges if green |
| Cron, daily | Agent posts standup from git + Linear | Team reads in Slack |

The pattern is always **event → agent run → artifact + notification → human decides**.

### Design the human-in-the-loop checkpoint

This is the part that's easy to skip and expensive to skip. For each Automation, decide:

- **What artifact does the agent produce?** (Draft PR, Linear comment, Slack message, dashboard update.)
- **Who is the named reviewer or channel?** Anonymous artifacts get ignored.
- **What's the merge gate?** Required reviewer, label check, CI status, manual `/approve`. Never auto-merge from an Automation in the early days.
- **What does failure look like?** If the agent can't do the job, where does it leave the work? (Draft PR with notes, comment on the issue, message in `#agent-failures`.)

A good rule: an Automation is ready for production when **no human has to go look for its output**. It comes to them.

### Make sure the dev environment is bulletproof

Every Automation run starts a fresh environment. If your devcontainer (§2) or `automations.yaml` (§3) is flaky, every Automation is flaky.

Before you wire up Automations:

- The devcontainer builds clean from `main` and runs the project's tests.
- `.ona/automations.yaml` exposes the standard tasks (`test`, `lint`, `build`, whatever the agent will need).
- Prebuilds are enabled on `main` so fresh environments start fast.
- AGENTS.md exists and documents conventions the agent should follow.

If a human can't onboard to the repo by clicking "Create environment" and getting work done in 60 seconds, an agent won't either.

### Build one Automation, then copy it

The first Automation is the hardest because you're learning the surface. After that, they're a template.

For each one:

1. Run the Prompt step manually a few times against a test environment. Refine the prompt until the agent reliably produces the artifact you want.
2. Wrap it in an Automation, trigger = manual.
3. Add the Report step (Slack / PR comment / Linear comment).
4. Test with a real reviewer in the loop. Did they see the artifact? Did they trust it?
5. Switch the trigger to cron or PR.
6. Watch it for a week. Adjust the prompt and the report step based on what reviewers actually do.

Then start the next one.

### Anti-patterns

- **No checkpoint.** Auto-merging agent PRs in week 1. Reviewers lose trust before they gain it.
- **Wrong reviewer.** Routing an Automation's output to a channel no one watches.
- **Bootstrapping in the prompt.** Asking the agent to install dependencies because the devcontainer is broken. Fix §2/§3 instead.
- **One Automation that does everything.** A daily cron that triages Linear *and* updates deps *and* posts standups. Split it; each one fails for different reasons and needs different reviewers.
- **No failure path.** When the agent can't finish, the work disappears. Always leave an artifact, even if it's "I tried this, here's why I stopped."

---

## 7. MCP & integrations

The factory becomes more useful once it can reach into the rest of your stack — issue trackers, observability, docs, and arbitrary external tools. This section is deliberately last because none of the earlier pieces depend on it; you can ship a working factory with no integrations and add them as needs arise.

There are three distinct extension surfaces. They do different things and configure in different places.

| Surface | Configured in | Who uses it |
|---|---|---|
| **MCP servers** | `.ona/mcp-config.json` in the repo | Agents inside any environment of that repo |
| **First-party integrations** | Ona dashboard → Org Settings → Integrations | Agents across your whole org |
| **Skills** | Ona dashboard → Skills (org-level) | Agents and humans (as `/slash` commands) |

### 7.1 MCP servers

[Model Context Protocol (MCP)](https://modelcontextprotocol.io/) is a standard for letting agents call external tools and read external context. Each server is a separate process the agent talks to over stdio or HTTP.

**Configure in `.ona/mcp-config.json`** in your repo. Servers are per-environment (anyone working in this repo gets them). Example:

```json
{
  "mcpServers": {
    "github": {
      "name": "github",
      "command": "docker",
      "args": [
        "run", "-i", "--rm",
        "-e", "GITHUB_PERSONAL_ACCESS_TOKEN",
        "ghcr.io/github/github-mcp-server"
      ],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${exec:gh auth token}"
      }
    },
    "playwright": {
      "name": "playwright",
      "command": "npx",
      "args": ["-y", "@executeautomation/playwright-mcp-server"]
    }
  },
  "globalTimeout": 30
}
```

You can use `${exec:...}` and `${file:...}` interpolation to pull tokens from shell commands or files at runtime — keep secrets out of the JSON.

Common servers worth wiring up:

- **GitHub MCP** — richer SCM operations (issues, PRs, search) than the built-in tools
- **Playwright MCP** — browser automation for an agent that needs to test UIs
- **Linear / Notion / Slack MCPs** — read-write access to those products

Check status from the **MCP Integrations** button in the chat input.

### 7.2 First-party integrations

These are configured **in the Ona dashboard**, not the CLI — there is no `ona integration` subcommand. An admin enables them per organization.

| Category | Integrations |
|---|---|
| Issue trackers & docs | Linear, Atlassian (Jira/Confluence), Notion, Granola |
| Observability | Sentry |
| Source control | GitHub, GitLab, Bitbucket, Azure DevOps (under **Source control** settings) |
| Developer surfaces | CLI, SDK, browser extension, README button, Ona URL, personal access tokens, ports |

**To enable an integration:** Org Settings → Integrations → pick one → follow the OAuth flow.

> **Why isn't AWS in the Integrations UI?** AWS isn't a "click to connect" integration — it's an OIDC trust relationship configured **in your AWS account** (IAM identity provider + role with trust policy). The Ona side is just a token issuer. See §5.2 for the setup. The doc page at [/ona/integrations/aws](https://ona.com/docs/ona/integrations/aws) is a guide, not a UI feature.

### 7.3 Skills

Skills are **`SKILL.md` files** with step-by-step workflow instructions. Agents discover them by description and follow them when a task matches. There are two flavors:

| Type | Location | Scope |
|---|---|---|
| **Repository skills** | `.ona/skills/<name>/SKILL.md` in the repo | One repo |
| **Organization skills** | Dashboard → Skills | All repos in the org; can be invoked as `/slash` commands |

They're how you codify "the way we review code here" or "the steps to cut a release" so the whole team (and every agent) gets the same expert behavior — not just the senior who wrote the prompt.

Good first skills to ship:

- `create-pr` — your team's PR conventions, branch naming, template
- `triage-sentry` — how to investigate a Sentry error
- `write-test` — your test conventions and assertion style
- `cut-release` — the steps for a release

### Read first

- [MCP overview](https://ona.com/docs/ona/mcp)
- [Skills](https://ona.com/docs/ona/skills)
- [Integrations overview](https://ona.com/docs/ona/integrations/overview)
- [Linear](https://ona.com/docs/ona/integrations/configure-linear) · [Atlassian](https://ona.com/docs/ona/integrations/configure-atlassian) · [Notion](https://ona.com/docs/ona/integrations/configure-notion) · [Sentry](https://ona.com/docs/ona/integrations/configure-sentry) · [Granola](https://ona.com/docs/ona/integrations/configure-granola)
- [AWS OIDC setup](https://ona.com/docs/ona/identity/aws-oidc) (the "AWS integration")
- [CLI](https://ona.com/docs/ona/integrations/cli) · [SDK](https://ona.com/docs/ona/integrations/sdk) · [Personal access token](https://ona.com/docs/ona/integrations/personal-access-token)
- [Ports](https://ona.com/docs/ona/integrations/ports) · [Browser extension](https://ona.com/docs/ona/integrations/browser-extension)

---

## Appendix A — CLI cheat sheet

Verified against the `ona` CLI as of 2026-04. Run `ona <cmd> --help` for the full surface — only the flags called out in workshop sections are listed below.

```bash
# Auth & context
ona login
ona whoami
ona organization list
ona organization switch <org-id>

# Projects
ona project list
ona project get <project-id>
ona project create <repo-url> --name <n> --class-id <class-id>
ona project secret create <project-id> --name <NAME> --value <v> --env-var
ona project configure-prebuilds <project-id>

# Environments (positional repo URL or project ID — no --project flag)
ona environment list
ona environment create <repo-url|project-id>
ona environment start  <env-id>
ona environment stop   <env-id>
ona environment port open <port>
ona environment port list

# Dev containers (iterate without destroying the environment)
ona environment devcontainer validate .devcontainer/devcontainer.json
ona environment devcontainer rebuild   [env-id]
ona environment devcontainer logs      [env-id]      # add --no-follow for one-shot

# Tasks & services (lives in .ona/automations.yaml)
ona automations init                                  # bootstrap an empty file
ona automations validate .ona/automations.yaml
ona automations update   .ona/automations.yaml
ona automations service  list
ona automations service  start  <id>
ona automations service  stop   <id>
ona automations service  logs   <id>
ona automations task     list
ona automations task     start  <id>
ona automations task     logs   <id>

# User secrets (project secrets shown above; org secrets are dashboard-only)
ona user secret create --name <NAME> --value <v> --env-var
ona user secret create --name SSH_KEY --value-from-file ~/.ssh/id_rsa --file-path /home/gitpod/.ssh/id_rsa

# Identity (OIDC)
ona idp login aws --role-arn <arn> [--profile <name>] [--duration-seconds <n>]
ona idp token --audience sts.amazonaws.com --decode

# Other useful surfaces
ona runner list
ona prebuild list --project <project-id>
ona audit-logs list
```

> Note: `ona integration ...` does **not** exist. First-party integrations (Linear, Sentry, Atlassian, Notion, Granola) are configured in the dashboard under Org Settings → Integrations. Org secrets are likewise dashboard-only.

## Appendix B — Troubleshooting quick reference

| Symptom | Where to look |
|---|---|
| Devcontainer build fails | Run `ona environment devcontainer validate` first; then `ona environment devcontainer logs` for the build output |
| Service stuck in `STARTING` | The `ready` command isn't returning 0. Run it manually inside the env; tail `ona automations service logs <id>` |
| Task ran but produced nothing | `ona automations task list-executions` to see history; `logs` on the execution ID |
| Automation (the product) didn't fire on schedule | Check the trigger config in the dashboard; check the run history tab |
| OIDC `AccessDenied` | `ona idp token --audience sts.amazonaws.com --decode` and compare claims against trust policy `sub`/`aud` |
| Runner OOM or capacity errors | [Capacity planning](https://ona.com/docs/ona/runners/aws/capacity-planning) |
| Slow cold starts | Enable [devcontainer image cache](https://ona.com/docs/ona/runners/aws/devcontainer-image-cache); add prebuilds |
| Private image pull fails | [Container registry secret](https://ona.com/docs/ona/configuration/secrets/container-registry-secret) — note `--registry-host` |

## Appendix C — Where to go next

- [API reference](https://ona.com/docs/ona/api-reference)
- [Best practices](https://ona.com/docs/ona/best-practices)
- [Skills](https://ona.com/docs/ona/skills)
- [SDK](https://ona.com/docs/ona/integrations/sdk)
- [`automations.yaml` schema reference](https://ona.com/docs/ona/reference/automations-yaml-schema)