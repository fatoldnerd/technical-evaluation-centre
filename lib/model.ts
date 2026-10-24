import { z } from "zod";
export const statuses = [
  "Not assessed",
  "Validation planned",
  "Evidence collected",
  "Criterion met",
  "Criterion not met",
  "Inconclusive",
] as const;
export const criterionSchema = z.object({
  id: z.string(),
  statement: z.string().min(8),
  priority: z.enum(["Critical", "Supporting"]),
  method: z.string(),
  owner: z.string().min(2),
  status: z.enum(statuses),
  evidenceIds: z.array(z.string()),
  acceptance: z.enum(["Pending", "Accepted", "Rejected"]),
  acceptanceBy: z.string(),
  acceptanceDate: z.string(),
  explanation: z.string(),
});
export type Criterion = z.infer<typeof criterionSchema>;
export const evidenceSchema = z.object({
  id: z.string(),
  criterionId: z.string(),
  summary: z.string().min(8),
  method: z.string().min(3),
  environment: z.string().min(3),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  limitations: z.string().min(3),
  supports: z.boolean(),
  fictional: z.literal(true),
});
export type Evidence = z.infer<typeof evidenceSchema>;
const activitySchema = z.object({
  id: z.string(),
  title: z.string(),
  criterionId: z.string(),
  owner: z.string(),
  complete: z.boolean(),
});
const blockerSchema = z.object({
  id: z.string(),
  title: z.string(),
  owner: z.string(),
  open: z.boolean(),
});
const actionSchema = z.object({
  id: z.string(),
  title: z.string(),
  owner: z.string().min(2),
  date: z.string(),
  done: z.boolean(),
});
const observationSchema = z.object({
  key: z.string(),
  category: z.enum([
    "Technical objection",
    "Product request",
    "Validated product gap",
    "Delay",
    "Effective approach",
    "Play opportunity",
  ]),
  finding: z.string(),
  sourceIds: z.array(z.string()),
  workaround: z.string(),
  question: z.string(),
});
export const evaluationSchema = z.object({
  id: z.string(),
  customer: z.string(),
  region: z.string(),
  sa: z.string(),
  manager: z.string(),
  project: z.string(),
  objective: z.string(),
  stage: z.string(),
  decisionDate: z.string(),
  nextDecision: z.string(),
  decisionOutcome: z.enum([
    "Pending",
    "Proceed",
    "Do not proceed",
    "Conditional",
  ]),
  commercialOutcome: z.string(),
  value: z.number(),
  discovery: z.string(),
  stakeholders: z.array(z.string()),
  architecture: z.string(),
  constraints: z.string(),
  scope: z.string(),
  exclusions: z.string(),
  scopeChanged: z.boolean(),
  scopeAligned: z.boolean(),
  questions: z.array(z.string()),
  handover: z.string(),
  criteria: z.array(criterionSchema),
  evidence: z.array(evidenceSchema),
  activities: z.array(activitySchema),
  blockers: z.array(blockerSchema),
  actions: z.array(actionSchema),
  observations: z.array(observationSchema),
});
export type Evaluation = z.infer<typeof evaluationSchema>;
const playSchema = z.object({
  id: z.string(),
  evaluationId: z.string(),
  title: z.string(),
  status: z.enum(["Draft", "Ready"]),
  reviewer: z.string(),
  reviewDate: z.string(),
  sections: z.array(z.object({ title: z.string(), text: z.string() })),
});
export type Play = z.infer<typeof playSchema>;
export const stateSchema = z.object({
  version: z.literal(1),
  evaluations: z.array(evaluationSchema).length(6),
  plays: z.array(playSchema),
});
export type State = z.infer<typeof stateSchema>;
