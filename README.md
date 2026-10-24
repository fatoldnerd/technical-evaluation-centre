# Technical Evaluation Command Centre

A local demonstration of evidence-led technical evaluation management for an EMEA Solutions Architecture organisation. Six fictional opportunities show why completed activities, supported findings and customer acceptance must remain separate.

## Run locally

Requires Node.js 22 or later (Node 24 recommended) and npm.

```sh
cd technical-evaluation-centre
npm ci
npm run dev -- --port 3017
```

Open http://localhost:3017. If you are already in the project root, omit the `cd` command. No environment variables, accounts or external services are required. All edits stay in this browser and origin. **Reset demo** restores the original fixtures after confirmation.

Use **Northstar Travel** for the five-minute walkthrough in [DEMO.md](DEMO.md). The fixed reference date is 23 October 2026, displayed in the app. This keeps overdue-decision rules reproducible when presenting later.

## What the first version supports

- Portfolio filters for region, SA owner, manager, overdue decisions, critical evidence gaps and open blockers, plus customer/objective search.
- Detailed workspaces connecting outcomes, criteria, activities, fictional evidence, customer acceptance and technical decisions.
- Forms to add or edit criteria, record results, link evidence, log or resolve blockers, assign dated actions, record acceptance and update scope or the next decision.
- Transparent manager interventions, each with supporting record links, a coaching question and a next action.
- Field observations counted by unique supporting opportunity, with separate request and validated-gap categories and Product feedback.
- A reviewed reusable play from Vellum, draft creation from other evaluations, editable review sections and explicit named review before reuse.
- A print-focused evaluation brief, browser persistence and demo reset.

All customer names, people, figures, test results and review records are synthetic. None establish vendor performance, security, compliance, adoption or revenue impact.

## Architecture and data model

Next.js App Router serves a server-rendered layout and page around an interactive client workspace. Browser APIs are accessed after mounting, following the [official client-component guidance](https://nextjs.org/docs/app/getting-started/server-and-client-components). Installation follows the [official Next.js setup documentation](https://nextjs.org/docs/app/getting-started/installation). The production build uses the documented [static export mode](https://nextjs.org/docs/app/guides/static-exports).

- `lib/model.ts`: TypeScript types derived from Zod schemas for storage validation.
- `lib/fixtures.ts`: six independent evaluation scenarios, source observations and the seeded play.
- `lib/rules.ts`: pure derived summaries, manager interventions and unique-opportunity pattern aggregation.
- `lib/commands.ts`: immutable, explicit transitions with validation. No UI component writes directly into records.
- `lib/repository.ts`: `Repository` interface (`load`, `save`, `reset`) and versioned localStorage implementation. A future database adapter can replace this boundary.
- `app/workspace.tsx`: five views, focused forms and printable brief. Hash links preserve the selected view, evaluation and source record on refresh.
- `app/globals.css`: neutral workspace with one green accent, responsive navigation, text-supported statuses, focus styles and print layout.

An `Evaluation` owns criteria, evidence, activities, blockers, actions and observations. Each criterion has its own validation status and customer acceptance record. Evidence references a criterion and records its method, environment, result, date, limitations and whether it supports the finding. The technical decision and commercial outcome live separately on the evaluation. Plays retain their source evaluation and require a review record.

Edits save before the UI adopts the new state. Storage failures surface an error. Malformed or incompatible saved data is preserved and reported, with explicit reset available. This is a single-user repository: it has no multi-tab conflict resolution or shared audit log.

## Business rules

1. **Critical evidence gap:** a critical criterion remains unresolved unless its explicit status is `Criterion met` and at least one linked evidence record belongs to that criterion and supports the finding. Completed activities do not affect this rule. “Criterion not met” remains a visible critical issue, even when the evidence establishes the failure.
2. **Missing validation plan:** a critical criterion without a method and without a met finding triggers coaching. A newly recorded result supplies its method when no plan was previously recorded.
3. **Evidence quality:** the SA explicitly records whether evidence supports the stated finding. Insufficient evidence cannot accompany a met finding. This version cannot independently judge test validity. A criterion statement or method with existing evidence cannot be rewritten; create a new criterion when the requirement changes.
4. **Customer acceptance:** `Pending`, `Accepted` and `Rejected` are independent of technical status. Acceptance requires a supported met finding and a customer review recorded with its date. Recording any new result returns acceptance to pending. Merely linking a record does not alter either status.
5. **Overdue decision:** the intended date is earlier than the displayed reference date and the technical decision remains pending. A missing date is a separate intervention. Recording a technical decision does not imply acceptance or a commercial outcome.
6. **Unowned blocker:** an open blocker with a blank owner is an intervention. Assigning ownership removes this intervention, while the blocker and underlying criterion remain open until separately resolved.
7. **Scope:** a recorded scope change without reviewed success criteria triggers intervention. The scope form records an explicit user attestation of review; it cannot verify the customer conversation.
8. **Pattern aggregation:** group observations by category and observation key; count each supporting evaluation once. Requests and validated gaps are distinct groups even when their theme matches. Historical observations remain as original context after the underlying finding changes. Every observation links to source records. Repetition in six synthetic evaluations does not establish a market-wide trend.
9. **Commercial context:** Product feedback displays supplied fictional pipeline values per affected evaluation. It makes no calculation of revenue lost, expected win probability or productivity improvement.
10. **Reuse:** creating a play produces a draft. Marking it ready requires reviewed sections, a reviewer and review date. No evaluation status changes as a side effect.

The supported-finding flag represents human judgement, with limitations visible. It is not an automated certification of technical truth.

## Checks

```sh
npm test
npm run typecheck
npm run lint
npm run build
npm run test:e2e
```

The browser suite uses `playwright/test` and a Chromium browser. If Chromium is missing, install it with `npx playwright install chromium`. Run `npm run build` first. The browser suite fulfils requests from `out/` directly, so it tests the production artifacts without needing a server port. See [VERIFICATION.md](VERIFICATION.md) for the actual results from this implementation session.

## Vercel preparation

The repository builds a Next.js static export because this version has no server-side features. `npm start -- --port 3017` previews that export after a build. The repository is ready for a normal Next.js project import. Public deployment is intentionally deferred until Brad reviews the local app.

- Set the project root to `technical-evaluation-centre` if importing its parent directory.
- Framework: Next.js. Build command: `npm run build`. Install command: `npm ci`. Output directory: `out` (Next.js static export).
- Use Node.js 24. No database, API key or environment variable is required for this version.
- Browser data is tied to the origin. Local edits do not move to a preview or production URL.
- No `vercel.ts` is needed because there are no platform overrides, custom routes, cron jobs or integrations.

The Vercel CLI is not installed in this environment. I strongly recommend installing it with `npm i -g vercel` when preparing deployment, to enable `vercel env pull`, `vercel deploy` and `vercel logs`. Review the local app before deploying. No public deployment was requested for this session.

## Limitations and useful next improvements

The current state is browser-local, with no authentication, attachments, concurrent editing, server database or audit history. Observation tags are seeded, not inferred from free text. Criterion owners and acceptance reviewers are plain text. Activities can be marked complete but cannot be created in the interface. Delivery notes and commercial outcomes are fixture content. Print uses the browser dialog rather than a PDF service.

The most useful next work is a durable repository with an audit trail and named acceptance records, followed by evidence attachments and evidence-review workflow. Add scoped access before real customer data. Then introduce explicit observation review and play versioning so field feedback remains traceable as evaluations change.
