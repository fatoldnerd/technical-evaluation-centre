# Verification — 23 October 2026

## Automated checks

- **20 / 20 Vitest tests passed.** They cover fixture validity, independent activity completion, evidence versus finding and acceptance, persistent critical gaps, valid resolution, insufficient evidence, explicit acceptance, acceptance invalidation, overdue rules, unique-opportunity pattern counts, source references, blocker ownership, reviewed plays, persistence, corrupt storage, storage failure, evidence unlink/relink and invalid calendar dates.
- **TypeScript check passed.** Strict mode, including the browser specifications.
- **ESLint passed.** One documented rule exception permits initial browser-storage hydration after server rendering.
- **Production build passed.** Next.js 16.4.2 generated the static production export in `out/`.
- **Formatting checked** with Prettier.

## Browser verification

The shell sandbox rejected local server listening (`listen EPERM`) and direct Chromium launch (`MachPortRendezvousServer: Permission denied`). The available Playwright browser connector was used instead. It fulfilled requests for `http://localhost:3017` from the actual generated files in `out/`, so the browser ran the production JavaScript and CSS without a listening server. This was browser testing of the build artifacts, not an HTTP-server or deployment check.

A complete scripted run passed these 14 checks with **zero captured page runtime errors**:

1. Northstar starts with 12 completed activities and an inconclusive critical criterion.
2. The linked anonymous-test evidence exposes its authenticated-session limitation.
3. Customer acceptance is rejected while the criterion remains unproven.
4. A representative result can establish an explicit met finding, leaving acceptance pending.
5. A named, dated customer action can be assigned.
6. Manager interventions recalculate: critical evidence and missing-plan issues disappear while acceptance and overdue decision issues remain.
7. The identity pattern counts two distinct supporting opportunities and links to its source.
8. A full reload preserves the result and action.
9. Print media displays the brief and hides navigation; pending acceptance remains visible.
10. The reviewed Vellum play is available.
11. A new play starts as a draft and becomes ready only after explicit named review.
12. Reset restores the original criterion and removes the added action and play, surviving reload.
13. The mobile region filter shows the two DACH evaluations and search produces a clear empty state.
14. At 390 × 844 there is no page-wide horizontal overflow.

Additional browser checks passed for adding and editing a criterion, unlinking and relinking evidence, valid customer acceptance, logging a blocker and changing the next customer decision and date. Demo state was restored afterward.

Desktop portfolio, mobile portfolio and the print-media brief were visually inspected. Screenshots and the connector replay are retained locally in the ignored `work/` directory.

## Boundaries of this verification

The committed `npm run test:e2e` specifications could not execute in the shell because the sandbox prevents direct Chromium launch. Equivalent checks were completed through the browser connector as described above. The local development/preview server was not verified as a listening process. Start it from a normal terminal using the README instructions.

The browser Print dialog, physical printing and PDF page pagination were not exercised. Print-media content and styling were checked. Safari, Firefox, assistive-technology navigation and multi-tab conflicts were not tested. There is no public deployment, authenticated service or live customer integration in this version.

## Writing review

The README and five-minute script passed the local SlopMonster pattern checker at 5/5 after manual review. This score does not establish factual accuracy. Humanizer could not launch because its installed application executable is missing. The rival editing CLI could not initialise under the sandbox. Those two editorial passes did not complete; the script was manually checked against the implemented workflow and fictional data.
