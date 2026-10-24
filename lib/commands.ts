import {
  criterionSchema,
  evidenceSchema,
  type Criterion,
  type Evidence,
  type State,
} from "./model";
import { draftPlay } from "./fixtures";
import { supportingEvidence } from "./rules";
export type Command =
  | { type: "criterion"; evaluationId: string; criterion: Criterion }
  | {
      type: "result";
      evaluationId: string;
      evidence: Evidence;
      status: Criterion["status"];
      explanation: string;
    }
  | {
      type: "unlink";
      evaluationId: string;
      criterionId: string;
      evidenceId: string;
    }
  | {
      type: "link";
      evaluationId: string;
      criterionId: string;
      evidenceId: string;
    }
  | {
      type: "accept";
      evaluationId: string;
      criterionId: string;
      acceptance: Criterion["acceptance"];
      by: string;
      date: string;
    }
  | {
      type: "activity";
      evaluationId: string;
      activityId: string;
      complete: boolean;
    }
  | { type: "blocker"; evaluationId: string; title: string; owner: string }
  | {
      type: "blocker-owner";
      evaluationId: string;
      blockerId: string;
      owner: string;
      open: boolean;
    }
  | {
      type: "action";
      evaluationId: string;
      title: string;
      owner: string;
      date: string;
    }
  | {
      type: "decision";
      evaluationId: string;
      text: string;
      date: string;
      outcome: "Pending" | "Proceed" | "Do not proceed" | "Conditional";
    }
  | { type: "scope"; evaluationId: string; scope: string; aligned: boolean }
  | { type: "draft"; evaluationId: string }
  | {
      type: "review-play";
      playId: string;
      reviewer: string;
      date: string;
      sections: { title: string; text: string }[];
    };
export function transition(state: State, command: Command): State {
  const next = structuredClone(state);
  const required = (s: string, label: string) => {
    if (!s.trim()) throw new Error(`${label} is required.`);
  };
  const date = (s: string) => {
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(s) ||
      Number.isNaN(Date.parse(s)) ||
      new Date(s).toISOString().slice(0, 10) !== s
    )
      throw new Error("Use a valid date.");
  };
  if (command.type === "review-play") {
    required(command.reviewer, "Reviewer");
    date(command.date);
    if (command.sections.some((s) => !s.text.trim()))
      throw new Error("Review every play section.");
    const p = next.plays.find((p) => p.id === command.playId);
    if (!p) throw new Error("Play not found.");
    Object.assign(p, {
      status: "Ready",
      reviewer: command.reviewer,
      reviewDate: command.date,
      sections: command.sections,
    });
    return next;
  }
  const e = next.evaluations.find((e) => e.id === command.evaluationId);
  if (!e) throw new Error("Evaluation not found.");
  switch (command.type) {
    case "criterion": {
      const c = criterionSchema.parse(command.criterion);
      if (c.status === "Criterion met" && !supportingEvidence(e, c).length)
        throw new Error("A met finding requires linked supporting evidence.");
      if (c.status !== "Criterion met" && !c.explanation.trim())
        throw new Error("Explain what remains unresolved.");
      const old = e.criteria.find((x) => x.id === c.id);
      if (old) {
        if (
          (old.statement !== c.statement || old.method !== c.method) &&
          old.evidenceIds.length
        )
          throw new Error(
            "A criterion with evidence cannot change its statement or method. Add a new criterion for a changed requirement.",
          );
        const changed = old.status !== c.status;
        Object.assign(old, {
          ...c,
          acceptance: changed ? "Pending" : old.acceptance,
          acceptanceBy: changed ? "" : old.acceptanceBy,
          acceptanceDate: changed ? "" : old.acceptanceDate,
          evidenceIds: old.evidenceIds,
        });
      } else
        e.criteria.push({
          ...c,
          acceptance: "Pending",
          acceptanceBy: "",
          acceptanceDate: "",
          evidenceIds: [],
        });
      break;
    }
    case "result": {
      const v = evidenceSchema.parse(command.evidence);
      date(v.date);
      const c = e.criteria.find((c) => c.id === v.criterionId);
      if (!c) throw new Error("Criterion not found.");
      if (command.status === "Criterion met" && !v.supports)
        throw new Error("A met finding needs supporting evidence.");
      if (command.status !== "Criterion met")
        required(command.explanation, "Unresolved explanation");
      e.evidence.push(v);
      c.evidenceIds.push(v.id);
      c.status = command.status;
      if (!c.method.trim()) c.method = v.method;
      c.explanation = command.explanation;
      c.acceptance = "Pending";
      c.acceptanceBy = "";
      c.acceptanceDate = "";
      break;
    }
    case "unlink": {
      const c = e.criteria.find((c) => c.id === command.criterionId);
      if (!c) throw new Error("Criterion not found.");
      c.evidenceIds = c.evidenceIds.filter((id) => id !== command.evidenceId);
      c.acceptance = "Pending";
      c.acceptanceBy = "";
      c.acceptanceDate = "";
      break;
    }
    case "link": {
      const c = e.criteria.find((c) => c.id === command.criterionId);
      const v = e.evidence.find((v) => v.id === command.evidenceId);
      if (!c || !v || v.criterionId !== c.id)
        throw new Error("Select evidence recorded for this criterion.");
      if (!c.evidenceIds.includes(v.id)) c.evidenceIds.push(v.id);
      break;
    }
    case "accept": {
      const c = e.criteria.find((c) => c.id === command.criterionId);
      if (!c) throw new Error("Criterion not found.");
      if (command.acceptance !== "Pending") {
        required(command.by, "Customer reviewer");
        date(command.date);
      }
      if (
        command.acceptance === "Accepted" &&
        (c.status !== "Criterion met" || !supportingEvidence(e, c).length)
      )
        throw new Error(
          "Establish a supported met finding before customer acceptance.",
        );
      Object.assign(c, {
        acceptance: command.acceptance,
        acceptanceBy: command.by,
        acceptanceDate: command.date,
      });
      break;
    }
    case "activity": {
      const a = e.activities.find((a) => a.id === command.activityId);
      if (!a) throw new Error("Activity not found.");
      a.complete = command.complete;
      break;
    }
    case "blocker":
      required(command.title, "Blocker");
      e.blockers.push({
        id: crypto.randomUUID(),
        title: command.title,
        owner: command.owner,
        open: true,
      });
      break;
    case "blocker-owner": {
      const b = e.blockers.find((b) => b.id === command.blockerId);
      if (!b) throw new Error("Blocker not found.");
      b.owner = command.owner;
      b.open = command.open;
      break;
    }
    case "action":
      required(command.title, "Action");
      required(command.owner, "Owner");
      date(command.date);
      e.actions.push({
        id: crypto.randomUUID(),
        title: command.title,
        owner: command.owner,
        date: command.date,
        done: false,
      });
      break;
    case "decision":
      required(command.text, "Next customer decision");
      if (command.date) date(command.date);
      if (command.outcome !== "Pending" && !command.date)
        throw new Error("Record a decision date.");
      Object.assign(e, {
        nextDecision: command.text,
        decisionDate: command.date,
        decisionOutcome: command.outcome,
      });
      break;
    case "scope":
      required(command.scope, "Scope");
      e.scope = command.scope;
      e.scopeAligned = command.aligned;
      break;
    case "draft":
      if (next.plays.some((p) => p.evaluationId === e.id))
        throw new Error("This evaluation already has a play.");
      next.plays.push(draftPlay(e));
      break;
  }
  return next;
}
