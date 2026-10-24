import type { Criterion, Evaluation } from "./model";
export type Issue = {
  id: string;
  evaluationId: string;
  title: string;
  recordIds: string[];
  why: string;
  question: string;
  action: string;
};
export function supportingEvidence(e: Evaluation, c: Criterion) {
  return e.evidence.filter(
    (v) => c.evidenceIds.includes(v.id) && v.criterionId === c.id && v.supports,
  );
}
export function criticalGaps(e: Evaluation) {
  return e.criteria.filter(
    (c) =>
      c.priority === "Critical" &&
      (c.status !== "Criterion met" || supportingEvidence(e, c).length === 0),
  );
}
export function overdue(e: Evaluation, today: string) {
  return (
    !!e.decisionDate &&
    e.decisionDate < today &&
    e.decisionOutcome === "Pending"
  );
}
export function issues(e: Evaluation, today: string): Issue[] {
  const out: Issue[] = [];
  const add = (
    id: string,
    title: string,
    recordIds: string[],
    why: string,
    question: string,
    action: string,
  ) =>
    out.push({
      id: `${e.id}:${id}`,
      evaluationId: e.id,
      title,
      recordIds,
      why,
      question,
      action,
    });
  for (const c of e.criteria) {
    if (
      c.priority === "Critical" &&
      !c.method.trim() &&
      c.status !== "Criterion met"
    )
      add(
        `${c.id}-plan`,
        "Critical criterion has no validation plan",
        [c.id],
        "Completed activities cannot close an untested decision requirement.",
        "What customer-observed test would establish this requirement?",
        "Agree a representative validation method and owner.",
      );
    if (
      c.priority === "Critical" &&
      (c.status !== "Criterion met" || !supportingEvidence(e, c).length)
    )
      add(
        `${c.id}-gap`,
        "Critical requirement remains unproven",
        [c.id, ...c.evidenceIds],
        c.explanation ||
          "A critical criterion requires a supported finding before it is met.",
        "Does this evidence establish the customer’s stated requirement?",
        "Run a representative test and record an explicit finding.",
      );
    else if (c.evidenceIds.length && !supportingEvidence(e, c).length)
      add(
        `${c.id}-weak`,
        "Evidence does not establish the criterion",
        [c.id, ...c.evidenceIds],
        "The linked result does not support this requirement.",
        "What does the result establish, and what remains unknown?",
        "Replace or supplement evidence against this criterion.",
      );
    if (c.status === "Criterion met" && c.acceptance !== "Accepted")
      add(
        `${c.id}-acceptance`,
        "Technical success awaits customer acceptance",
        [c.id, ...c.evidenceIds],
        "The technical finding is separate from the customer’s acceptance.",
        "Who must review and accept this finding?",
        "Arrange customer review and record their decision.",
      );
  }
  if (overdue(e, today))
    add(
      "overdue",
      "Customer decision is overdue",
      ["decision"],
      `The intended date was ${e.decisionDate}; no technical decision is recorded.`,
      "What prevents the customer from making the next decision?",
      "Agree a new decision date and an accountable customer action.",
    );
  if (!e.decisionDate && e.decisionOutcome === "Pending")
    add(
      "no-date",
      "No agreed decision date",
      ["decision"],
      "There is no time-bound customer decision.",
      "Which customer decision closes this phase?",
      "Agree a bounded scope and decision date.",
    );
  for (const b of e.blockers.filter((b) => b.open && !b.owner.trim()))
    add(
      `${b.id}-owner`,
      "Open blocker has no owner",
      [b.id],
      b.title,
      "Who can take responsibility for this blocker?",
      "Assign an owner and a dated next action.",
    );
  if (e.scopeChanged && !e.scopeAligned)
    add(
      "scope",
      "Scope changed without revised success criteria",
      ["scope", ...e.criteria.map((c) => c.id)],
      "New requests can invalidate the evaluation boundary.",
      "Which new requirement belongs in this decision?",
      "Revise the scope and criteria with the customer.",
    );
  return out;
}
export function health(e: Evaluation, today: string) {
  const n = criticalGaps(e).length;
  const pending = e.criteria.filter(
    (c) => c.status === "Criterion met" && c.acceptance !== "Accepted",
  ).length;
  return (
    [
      n
        ? `${n} critical ${n === 1 ? "criterion lacks" : "criteria lack"} a supported finding`
        : null,
      pending
        ? `${pending} technical ${pending === 1 ? "finding awaits" : "findings await"} customer acceptance`
        : null,
      overdue(e, today) ? "customer decision is overdue" : null,
      e.blockers.some((b) => b.open) ? "open blocker" : null,
      e.scopeChanged && !e.scopeAligned ? "scope needs agreement" : null,
    ]
      .filter(Boolean)
      .join("; ") ||
    "Criteria supported and accepted; confirm the next customer decision."
  );
}
export function patterns(evaluations: Evaluation[]) {
  const map = new Map<
    string,
    {
      key: string;
      category: string;
      finding: string;
      supports: {
        evaluation: Evaluation;
        recordIds: string[];
        finding: string;
        workaround: string;
        question: string;
      }[];
    }
  >();
  for (const e of evaluations)
    for (const o of e.observations) {
      const key = `${o.category}:${o.key}`;
      const p = map.get(key) || {
        key,
        category: o.category,
        finding: o.finding,
        supports: [],
      };
      if (!p.supports.some((s) => s.evaluation.id === e.id))
        p.supports.push({
          evaluation: e,
          recordIds: o.sourceIds,
          finding: o.finding,
          workaround: o.workaround,
          question: o.question,
        });
      map.set(key, p);
    }
  return [...map.values()];
}
