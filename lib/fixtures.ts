import type { Criterion, Evaluation, State } from "./model";
export const DEMO_DATE = "2026-10-23";
const criterion = (
  id: string,
  statement: string,
  status: Criterion["status"] = "Validation planned",
  priority: Criterion["priority"] = "Critical",
): Criterion => ({
  id,
  statement,
  priority,
  status,
  method: "Customer-observed test against the agreed sample and threshold",
  owner: "",
  evidenceIds: [],
  acceptance: "Pending",
  acceptanceBy: "",
  acceptanceDate: "",
  explanation: "",
});
export function seed(): State {
  const specs = [
    [
      "northstar",
      "Northstar Travel",
      "UK & Ireland",
      "Amara Cole",
      "Lena Brooks",
      "Next.js application migration",
      "Keep authenticated booking sessions intact during a phased Next.js migration.",
      420000,
    ],
    [
      "alder",
      "Alder Support",
      "DACH",
      "Jonas Keller",
      "Eva Hartmann",
      "AI-assisted customer service",
      "Establish grounded answers and safe escalation on a customer-owned support dataset.",
      280000,
    ],
    [
      "solstice",
      "Solstice Commerce",
      "Southern Europe",
      "Ines Duarte",
      "Marco Riva",
      "Ecommerce performance",
      "Validate product-page response under the agreed regional traffic profile.",
      360000,
    ],
    [
      "kestrel",
      "Kestrel Engineering",
      "DACH",
      "Mira Vogel",
      "Eva Hartmann",
      "Developer platform assessment",
      "Support approval-controlled releases into an isolated build environment.",
      510000,
    ],
    [
      "meridian",
      "Meridian Services",
      "UK & Ireland",
      "Theo Grant",
      "Lena Brooks",
      "Phased modernisation",
      "Agree a bounded first service migration without disrupting the legacy estate.",
      240000,
    ],
    [
      "vellum",
      "Vellum Logistics",
      "Southern Europe",
      "Luca Marin",
      "Marco Riva",
      "AI document processing",
      "Validate invoice extraction with human review for uncertain fields.",
      190000,
    ],
  ] as const;
  const evaluations: Evaluation[] = specs.map(
    ([id, customer, region, sa, manager, project, objective, value], i) => ({
      id,
      customer,
      region,
      sa,
      manager,
      project,
      objective,
      value,
      stage: i === 5 ? "Completed" : "Validation",
      decisionDate:
        i === 4
          ? ""
          : i === 0
            ? "2026-10-20"
            : i === 5
              ? "2026-10-19"
              : "2026-11-06",
      nextDecision:
        i === 5
          ? "Approve delivery handover"
          : "Customer to review findings and agree next step",
      decisionOutcome: i === 5 ? "Proceed" : "Pending",
      commercialOutcome:
        "Not recorded; technical decision does not establish a sale.",
      discovery: `${customer} has agreed a bounded technical evaluation with its architecture and operating teams. ${objective}`,
      stakeholders: [
        `${["Ruth Ellis", "Felix Brandt", "Sofia Costa", "Anika Berg", "Daniel Ward", "Elena Moretti"][i]} — customer technical approver`,
        `${["Owen Price", "Clara Weiss", "Luis Serra", "Paul Adler", "Maya Shaw", "Matteo Rossi"][i]} — business sponsor; investment decision`,
        `${sa} — validation owner; ${manager} — coaching and escalation`,
      ],
      architecture: [
        "Next.js frontend alongside a legacy booking API and shared identity provider.",
        "Support portal, retrieval index and a human agent queue.",
        "React storefront, catalogue API and regional content cache.",
        "Git-based delivery with approval gates and isolated runners.",
        "Legacy Java estate with an API facade and shared database.",
        "Document queue, extraction service and human review console.",
      ][i],
      constraints: [
        "No session loss; customer identity configuration required for representative testing.",
        "Customer-approved redacted dataset only; human escalation required.",
        "Use agreed traffic mix and customer staging catalogue; no production claims.",
        "Build execution must have no public network path.",
        "Shared schema cannot change in the first phase.",
        "Customer sample is English and Italian invoices only.",
      ][i],
      scope: [
        "One booking journey and identity continuity across old and new routes.",
        "Forty redacted support cases, retrieval grounding and escalation.",
        "Product-page latency on the agreed 2,000-user staging workload.",
        "Release controls and network-isolated build execution.",
        "One account-profile service behind the existing facade.",
        "One hundred labelled invoices and review routing.",
      ][i],
      exclusions: [
        "Payment migration, production rollout and disaster recovery.",
        "Autonomous refunds, multilingual rollout and production operation.",
        "Checkout redesign, production capacity guarantees and SEO impact.",
        "Entire CI replacement and compliance certification.",
        "Billing, reporting and database replacement.",
        "Handwriting, other languages and automated payment approval.",
      ][i],
      scopeChanged: i === 4,
      scopeAligned: i !== 4,
      questions:
        i === 4
          ? ["Does the requested billing migration belong in phase one?"]
          : ["Who signs off delivery readiness after technical acceptance?"],
      handover:
        "Transfer test procedure, sample inventory, open limitations and operating ownership to delivery. Revalidate against production conditions before launch.",
      criteria: [],
      evidence: [],
      activities: [],
      blockers: [],
      actions: [],
      observations: [],
    }),
  );
  evaluations.forEach((e, i) => {
    e.criteria = [
      criterion(
        `${e.id}-c1`,
        [
          "Authenticated sessions survive all 20 agreed cross-route booking cases with no forced re-login.",
          "At least 36 of 40 agreed support cases have grounded answers; all unsafe requests escalate.",
          "Product-page p95 is below 800 ms for the agreed 2,000-user regional staging profile.",
          "Release builds execute without a public network path using customer-approved controls.",
          "Account-profile changes deploy independently without a legacy schema change.",
          "At least 95 of 100 labelled invoices meet the customer field-accuracy rubric.",
        ][i],
        i === 0
          ? "Inconclusive"
          : i === 3
            ? "Criterion not met"
            : i === 4
              ? "Not assessed"
              : "Criterion met",
      ),
      criterion(
        `${e.id}-c2`,
        [
          "The customer can restore the previous route configuration using the agreed rollback runbook.",
          "A support supervisor can inspect answer provenance and take over the conversation.",
          "The storefront team can invalidate a changed product without clearing the entire catalogue.",
          "Two-person approval is retained for release to the customer test environment.",
          "The customer has agreed boundaries and owners for the initial service migration.",
          "Every invoice below the confidence threshold enters the human review queue.",
        ][i],
        i === 4 ? "Validation planned" : "Criterion met",
        "Supporting",
      ),
    ];
    e.criteria.forEach((c, j) => {
      c.owner = e.sa;
      c.explanation =
        i === 0 && j === 0
          ? "Existing tests used anonymous sessions. They cannot establish authenticated identity continuity."
          : i === 3 && j === 0
            ? "The evaluated configuration requires a public network path. No approved isolated alternative was demonstrated."
            : i === 4
              ? "Scope must be agreed before representative validation."
              : "";
      if (i === 0 && j === 0) c.method = "";
      if (c.status !== "Not assessed" && c.status !== "Validation planned") {
        const ev = {
          id: `${e.id}-e${j + 1}`,
          criterionId: c.id,
          summary:
            i === 0 && j === 0
              ? "18 anonymous route tests passed; authenticated scenarios were excluded."
              : i === 3 && j === 0
                ? "Customer-observed configuration review found a required public dependency."
                : i === 1 && j === 0
                  ? "37 of 40 cases met the agreed grounding rubric; all 6 unsafe cases escalated."
                  : i === 2 && j === 0
                    ? "Staging p95 was 742 ms on the agreed traffic profile."
                    : i === 5 && j === 0
                      ? "96 of 100 invoices met the field rubric. Four entered manual correction."
                      : "Customer-observed test met the agreed criterion within the bounded sample.",
          method: c.method || "Anonymous route smoke tests",
          environment: `Isolated fictional ${e.customer} staging; customer-owned synthetic sample`,
          date: "2026-10-19",
          limitations:
            i === 0 && j === 0
              ? "No authenticated sessions or customer identity-provider configuration."
              : "Bounded staging sample only; no production, security or compliance guarantee.",
          supports: !((i === 0 || i === 3) && j === 0),
          fictional: true as const,
        };
        e.evidence.push(ev);
        c.evidenceIds.push(ev.id);
      }
      if (i === 2 || i === 5) {
        c.acceptance = "Accepted";
        c.acceptanceBy = e.stakeholders[0].split(" —")[0];
        c.acceptanceDate = "2026-10-20";
      }
    });
    e.activities = Array.from({ length: i === 0 ? 12 : 3 }, (_, j) => ({
      id: `${e.id}-a${j}`,
      title:
        i === 0
          ? [
              "Route inventory",
              "Build review",
              "Anonymous smoke test",
              "Cache review",
              "Rollback rehearsal",
              "API contract review",
              "Redirect review",
              "Asset check",
              "Preview review",
              "Error route check",
              "Dependency review",
              "Demo readout",
            ][j]
          : ["Discovery workshop", "Representative test", "Customer readout"][
              j
            ],
      criterionId: e.criteria[j === 0 ? 0 : 1].id,
      owner: e.sa,
      complete: i === 0 || i === 5 || j < 2,
    }));
    e.actions = [
      {
        id: `${e.id}-next`,
        title:
          i === 0
            ? "Agree an authenticated session test with Ruth Ellis"
            : "Arrange customer evidence review",
        owner: e.sa,
        date: "2026-10-27",
        done: i === 5,
      },
    ];
  });
  evaluations[0].blockers = [
    {
      id: "northstar-b1",
      title: "Customer identity configuration is not yet available",
      owner: "Amara Cole",
      open: true,
    },
  ];
  evaluations[3].blockers = [
    {
      id: "kestrel-b1",
      title:
        "No validated network-isolated build option in evaluated configuration",
      owner: "",
      open: true,
    },
  ];
  const obs = (
    e: number,
    key: string,
    category: Evaluation["observations"][number]["category"],
    finding: string,
    sourceIds: string[],
    workaround = "No agreed workaround",
    question = "What additional evidence would change the decision?",
  ) =>
    evaluations[e].observations.push({
      key,
      category,
      finding,
      sourceIds,
      workaround,
      question,
    });
  obs(
    0,
    "identity",
    "Technical objection",
    "Identity continuity needs a representative customer test.",
    ["northstar-c1", "northstar-e1"],
  );
  obs(
    4,
    "identity",
    "Technical objection",
    "Legacy identity dependencies need discovery before the first service is isolated.",
    ["meridian-c1"],
  );
  obs(
    0,
    "representative",
    "Delay",
    "Anonymous tests do not cover the decisive customer requirement.",
    ["northstar-e1"],
  );
  obs(
    4,
    "representative",
    "Delay",
    "Expanded scope has no revised success criteria or date.",
    ["meridian-c1"],
  );
  obs(1, "acceptance", "Delay", "Technical findings await customer review.", [
    "alder-c1",
    "alder-e1",
  ]);
  obs(
    3,
    "isolation",
    "Validated product gap",
    "Evaluated configuration cannot meet the agreed isolated-build requirement.",
    ["kestrel-c1", "kestrel-e1"],
    "Customer-managed isolated runner proposed; not tested",
    "Can an isolated runner satisfy the release controls without the public dependency?",
  );
  obs(
    4,
    "isolation",
    "Product request",
    "Customer asked whether an isolated migration runner could be supported.",
    ["meridian-c1"],
    "Not assessed",
    "Is isolation a requirement for phase one?",
  );
  obs(
    2,
    "sample",
    "Effective approach",
    "Agree the workload and review results with the customer.",
    ["solstice-c1", "solstice-e1"],
  );
  obs(
    5,
    "sample",
    "Effective approach",
    "Use a labelled sample and agree the review rubric before testing.",
    ["vellum-c1", "vellum-e1"],
  );
  obs(
    5,
    "document-play",
    "Play opportunity",
    "Completed bounded extraction evaluation can become a reviewed play.",
    ["vellum-c1", "vellum-e1"],
  );
  const state: State = { version: 1, evaluations, plays: [] };
  state.plays = [
    {
      ...draftPlay(evaluations[5]),
      id: "invoice-play",
      title: "Invoice extraction with human review",
      status: "Ready",
      reviewer: "Marco Riva",
      reviewDate: "2026-10-21",
    },
  ];
  return state;
}
export function draftPlay(e: Evaluation) {
  return {
    id: `play-${e.id}`,
    evaluationId: e.id,
    title: `${e.project} — evaluation play`,
    status: "Draft" as const,
    reviewer: "",
    reviewDate: "",
    sections: [
      {
        title: "When appropriate",
        text: `A bounded evaluation with a customer objective similar to: ${e.objective}`,
      },
      {
        title: "Discovery questions",
        text: "Who owns the decision? Which sample represents the requirement? What finding would prevent proceeding?",
      },
      { title: "Prerequisites", text: e.constraints },
      {
        title: "Acceptance criteria",
        text: e.criteria.map((c) => c.statement).join("\n"),
      },
      {
        title: "Validation steps",
        text: e.criteria
          .map((c) => c.method || "Agree a representative validation method.")
          .join("\n"),
      },
      {
        title: "Evidence to collect",
        text: "Capture sample, method, environment, result, date, limitations and the customer review record.",
      },
      {
        title: "Common objections",
        text:
          e.observations.map((o) => o.finding).join("\n") ||
          "Ask the customer about operating ownership and representative test coverage.",
      },
      {
        title: "Known limitations",
        text: `${e.exclusions} Findings from this fictional evaluation do not establish repeatability.`,
      },
      { title: "Handover requirements", text: e.handover },
    ],
  };
}
