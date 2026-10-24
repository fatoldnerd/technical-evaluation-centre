# Technical Evaluation Command Centre

Purpose: demonstrate evidence-led enterprise technical evaluations and manager coaching for an SA organisation.
Scope: six fictional EMEA evaluations; five connected views; browser persistence. No authentication, CRM, billing or autonomous agents. Keep independent of adjacent projects.
Architecture: Next.js App Router static export + React + strict TypeScript. `npm start` previews `out/`; `npm run dev` is the Next.js development server. Pure domain rules and explicit commands in lib/; typed fixtures; repository interface isolates localStorage. No automatic advancement from activity to evidence, finding, acceptance or commercial outcome.
Evidence: label synthetic data. Findings require criterion-linked evidence with method, environment, date, result and limitations. Customer acceptance and technical decision are explicit records. Patterns count unique supporting evaluations and link to sources; pipeline is not lost revenue.
Verification: test rules, command transitions, persistence and reset. Run npm test, npm run typecheck, npm run lint and npm run build. Browser-check the demonstration, print layout and mobile. Browser tests route requests to built assets without a server. Run npm run format:check. Report actual coverage.
Commands: npm install; npm run dev -- --port 3017; npm test; npm run test:e2e; npm run typecheck; npm run lint; npm run build; npm start -- --port 3017.
Deployment: local review first. No public deployment without Brad's instruction. No secrets required.
