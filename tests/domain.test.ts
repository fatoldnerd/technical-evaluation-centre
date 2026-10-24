import { describe, it, expect } from "vitest";
import { seed, DEMO_DATE } from "../lib/fixtures";
import { transition } from "../lib/commands";
import { criticalGaps, issues, overdue, patterns } from "../lib/rules";
import { stateSchema, type State } from "../lib/model";
import { createRepository, STORAGE_KEY } from "../lib/repository";
const result = (state: State) =>
  transition(state, {
    type: "result",
    evaluationId: "northstar",
    evidence: {
      id: "new-result",
      criterionId: "northstar-c1",
      summary: "All 20 authenticated booking cases retained the session.",
      method: "Customer-observed identity continuity test",
      environment: "Customer-configured fictional staging identity provider",
      date: DEMO_DATE,
      limitations: "Only agreed cases; no production guarantee.",
      supports: true,
      fictional: true,
    },
    status: "Criterion met",
    explanation: "",
  });
describe("evidence-led evaluation rules", () => {
  it("fixtures have six evaluations across three teams and valid shapes", () => {
    const s = stateSchema.parse(seed());
    expect(s.evaluations).toHaveLength(6);
    expect(new Set(s.evaluations.map((e) => e.region)).size).toBe(3);
  });
  it("completed activity cannot satisfy a criterion", () => {
    const s = seed();
    const before = structuredClone(s.evaluations[0].criteria);
    const next = transition(s, {
      type: "activity",
      evaluationId: "northstar",
      activityId: "northstar-a0",
      complete: true,
    });
    expect(next.evaluations[0].criteria).toEqual(before);
    expect(criticalGaps(next.evaluations[0])).toHaveLength(1);
  });
  it("recorded evidence does not imply a met finding or acceptance", () => {
    const s = seed();
    const next = transition(s, {
      type: "result",
      evaluationId: "northstar",
      evidence: { ...s.evaluations[0].evidence[0], id: "partial" },
      status: "Evidence collected",
      explanation: "Authenticated cases remain untested.",
    });
    expect(next.evaluations[0].criteria[0].status).toBe("Evidence collected");
    expect(next.evaluations[0].criteria[0].acceptance).toBe("Pending");
    expect(criticalGaps(next.evaluations[0])).toHaveLength(1);
  });
  it("unresolved critical criterion stays in manager list", () => {
    expect(
      issues(seed().evaluations[0], DEMO_DATE).some((i) =>
        i.id.endsWith("c1-gap"),
      ),
    ).toBe(true);
  });
  it("valid resolution removes evidence gap while preserving acceptance intervention", () => {
    const s = seed();
    const next = result(s);
    const list = issues(next.evaluations[0], DEMO_DATE);
    expect(list.some((i) => i.id.endsWith("c1-gap"))).toBe(false);
    expect(list.some((i) => i.id.endsWith("c1-plan"))).toBe(false);
    expect(list.some((i) => i.id.endsWith("c1-acceptance"))).toBe(true);
    expect(s.evaluations[0].criteria[0].status).toBe("Inconclusive");
  });
  it("cannot mark met using insufficient evidence", () => {
    const s = seed();
    expect(() =>
      transition(s, {
        type: "result",
        evaluationId: "northstar",
        evidence: { ...s.evaluations[0].evidence[0], id: "bad" },
        status: "Criterion met",
        explanation: "",
      }),
    ).toThrow("supporting evidence");
  });
  it("cannot accept an unresolved criterion", () => {
    expect(() =>
      transition(seed(), {
        type: "accept",
        evaluationId: "northstar",
        criterionId: "northstar-c1",
        acceptance: "Accepted",
        by: "Ruth Ellis",
        date: DEMO_DATE,
      }),
    ).toThrow("supported met");
  });
  it("explicit customer acceptance removes the acceptance intervention only", () => {
    const next = transition(result(seed()), {
      type: "accept",
      evaluationId: "northstar",
      criterionId: "northstar-c1",
      acceptance: "Accepted",
      by: "Ruth Ellis",
      date: DEMO_DATE,
    });
    expect(
      issues(next.evaluations[0], DEMO_DATE).some((i) =>
        i.id.endsWith("c1-acceptance"),
      ),
    ).toBe(false);
    expect(next.evaluations[0].decisionOutcome).toBe("Pending");
    expect(overdue(next.evaluations[0], DEMO_DATE)).toBe(true);
  });
  it("new result invalidates old acceptance", () => {
    const s = seed();
    const e = s.evaluations[2];
    const next = transition(s, {
      type: "result",
      evaluationId: e.id,
      evidence: { ...e.evidence[0], id: "rerun" },
      status: "Criterion met",
      explanation: "",
    });
    expect(next.evaluations[2].criteria[0].acceptance).toBe("Pending");
  });
  it("overdue is date-based, pending only, and not overdue on the intended day", () => {
    const e = seed().evaluations[0];
    expect(overdue(e, "2026-10-20")).toBe(false);
    expect(overdue(e, DEMO_DATE)).toBe(true);
    expect(overdue({ ...e, decisionOutcome: "Proceed" }, DEMO_DATE)).toBe(
      false,
    );
  });
  it("counts unique supporting opportunities and separates requests from gaps", () => {
    const s = seed();
    s.evaluations[0].observations.push(s.evaluations[0].observations[0]);
    const ps = patterns(s.evaluations);
    expect(
      ps.find((p) => p.key === "Technical objection:identity")?.supports,
    ).toHaveLength(2);
    expect(
      ps.find((p) => p.key === "Validated product gap:isolation")?.supports,
    ).toHaveLength(1);
    expect(
      ps.find((p) => p.key === "Product request:isolation")?.supports,
    ).toHaveLength(1);
    for (const p of ps)
      for (const support of p.supports) {
        const e = support.evaluation;
        const ids = [...e.criteria, ...e.evidence, ...e.blockers].map(
          (r) => r.id,
        );
        expect(support.recordIds.every((id) => ids.includes(id))).toBe(true);
      }
  });
  it("unowned blocker surfaces and assigning an owner removes that intervention", () => {
    const s = seed();
    expect(
      issues(s.evaluations[3], DEMO_DATE).some((i) =>
        i.title.includes("no owner"),
      ),
    ).toBe(true);
    const n = transition(s, {
      type: "blocker-owner",
      evaluationId: "kestrel",
      blockerId: "kestrel-b1",
      owner: "Mira Vogel",
      open: true,
    });
    expect(
      issues(n.evaluations[3], DEMO_DATE).some((i) =>
        i.title.includes("no owner"),
      ),
    ).toBe(false);
    expect(criticalGaps(n.evaluations[3])).toHaveLength(1);
  });
  it("draft play requires named review and does not change evaluation findings", () => {
    const s = seed();
    const n = transition(s, { type: "draft", evaluationId: "northstar" });
    expect(n.plays[1].status).toBe("Draft");
    expect(() =>
      transition(n, {
        type: "review-play",
        playId: "play-northstar",
        reviewer: "",
        date: DEMO_DATE,
        sections: n.plays[1].sections,
      }),
    ).toThrow("Reviewer");
    expect(
      transition(n, {
        type: "review-play",
        playId: "play-northstar",
        reviewer: "Lena Brooks",
        date: DEMO_DATE,
        sections: n.plays[1].sections,
      }).plays[1].status,
    ).toBe("Ready");
    expect(n.evaluations).toEqual(s.evaluations);
  });
});
describe("repository persistence boundary", () => {
  function storage() {
    const data = new Map<string, string>();
    return {
      data,
      getItem: (k: string) => data.get(k) || null,
      setItem: (k: string, v: string) => {
        data.set(k, v);
      },
    };
  }
  it("persists edits and reset restores fixtures", () => {
    const store = storage(),
      repo = createRepository(store);
    const next = result(repo.load());
    repo.save(next);
    expect(createRepository(store).load()).toEqual(next);
    expect(repo.reset()).toEqual(seed());
    expect(repo.load()).toEqual(seed());
  });
  it("invalid saved data reports an error and preserves original until explicit reset", () => {
    const store = storage();
    store.data.set(STORAGE_KEY, "broken");
    const repo = createRepository(store);
    expect(() => repo.load()).toThrow("incompatible");
    expect(store.getItem(STORAGE_KEY)).toBe("broken");
    expect(repo.reset()).toEqual(seed());
  });
  it("storage failures do not report a successful save", () => {
    const repo = createRepository({
      getItem: () => null,
      setItem: () => {
        throw new Error("Quota exceeded");
      },
    });
    expect(() => repo.save(seed())).toThrow("Quota");
  });
});

describe("evidence linkage and review invalidation", () => {
  it("unlinking decisive evidence exposes the gap and linking restores support without acceptance", () => {
    const s = result(seed());
    const n = transition(s, {
      type: "unlink",
      evaluationId: "northstar",
      criterionId: "northstar-c1",
      evidenceId: "new-result",
    });
    expect(criticalGaps(n.evaluations[0])).toHaveLength(1);
    const restored = transition(n, {
      type: "link",
      evaluationId: "northstar",
      criterionId: "northstar-c1",
      evidenceId: "new-result",
    });
    expect(criticalGaps(restored.evaluations[0])).toHaveLength(0);
    expect(restored.evaluations[0].criteria[0].acceptance).toBe("Pending");
  });
  it("cannot relabel a failed criterion as met using negative evidence", () => {
    const s = seed();
    const c = {
      ...s.evaluations[3].criteria[0],
      status: "Criterion met" as const,
    };
    expect(() =>
      transition(s, {
        type: "criterion",
        evaluationId: "kestrel",
        criterion: c,
      }),
    ).toThrow("supporting evidence");
  });
  it("changing a technical finding requires fresh customer review", () => {
    const s = seed();
    const c = {
      ...s.evaluations[2].criteria[0],
      status: "Inconclusive" as const,
      explanation: "Customer changed the agreed load profile.",
    };
    const n = transition(s, {
      type: "criterion",
      evaluationId: "solstice",
      criterion: c,
    });
    expect(n.evaluations[2].criteria[0].acceptance).toBe("Pending");
  });
  it("does not accept a date normalized to a different calendar day", () => {
    expect(() =>
      transition(seed(), {
        type: "action",
        evaluationId: "northstar",
        title: "Review result",
        owner: "Ruth Ellis",
        date: "2026-02-31",
      }),
    ).toThrow("valid date");
  });
});
