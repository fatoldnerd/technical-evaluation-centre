"use client";
import {
  useEffect,
  useRef,
  useId,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  ArrowUpRight,
  ArrowLeft,
  ArrowRight,
  LayoutDashboard,
  ClipboardCheck,
  Users,
  Layers,
  BookOpen,
  RotateCcw,
  Plus,
  Printer,
  Check,
  Search,
  PanelTop,
  ChevronRight,
  AlertCircle,
  X,
} from "lucide-react";
import {
  type Criterion,
  type Evaluation,
  type State,
  type Play,
  statuses,
} from "@/lib/model";
import { DEMO_DATE, seed } from "@/lib/fixtures";
import { criticalGaps, health, issues, overdue, patterns } from "@/lib/rules";
import { transition, type Command } from "@/lib/commands";
import { createRepository } from "@/lib/repository";
const views = [
  "Portfolio",
  "Evaluation Workspace",
  "Manager Review",
  "Field Patterns",
  "Reusable Plays",
] as const;
type View = (typeof views)[number];
type Editor = {
  kind:
    | "criterion"
    | "result"
    | "accept"
    | "link"
    | "action"
    | "blocker"
    | "decision"
    | "scope"
    | "blocker-owner";
  criterionId?: string;
  blockerId?: string;
};
const icons = [LayoutDashboard, ClipboardCheck, Users, Layers, BookOpen];
const date = (v: string) =>
  v
    ? new Date(`${v}T12:00:00Z`).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      })
    : "Not agreed";
function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: string;
}) {
  return <span className={`badge ${tone}`}>{children}</span>;
}
function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}
function Input({
  label,
  name,
  value = "",
  type = "text",
  required = true,
}: {
  label: string;
  name: string;
  value?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <Field label={label}>
      <input name={name} defaultValue={value} type={type} required={required} />
    </Field>
  );
}
function Textarea({
  label,
  name,
  value = "",
  required = true,
}: {
  label: string;
  name: string;
  value?: string;
  required?: boolean;
}) {
  return (
    <Field label={label}>
      <textarea name={name} defaultValue={value} required={required} rows={3} />
    </Field>
  );
}
function Empty({ children }: { children: ReactNode }) {
  return <div className="empty">{children}</div>;
}
export default function CommandCentre() {
  const [state, setState] = useState<State | null>(null),
    [view, setView] = useState<View>("Portfolio"),
    [selected, setSelected] = useState("northstar"),
    [record, setRecord] = useState(""),
    [editor, setEditor] = useState<Editor | null>(null),
    [brief, setBrief] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [resetting, setResetting] = useState(false);
  const [region, setRegion] = useState("All regions"),
    [owner, setOwner] = useState("All owners"),
    [manager, setManager] = useState("All managers"),
    [filter, setFilter] = useState("All evaluations"),
    [search, setSearch] = useState("");
  // Hydrate the browser-only repository once after SSR; no derived state is computed here.
  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- One-time browser repository hydration.
      setState(createRepository(localStorage).load());
    } catch (e) {
      setError((e as Error).message);
    }
    const applyHash = () => {
      const [v, id, r] = location.hash
        .slice(1)
        .split("/")
        .map((part) => {
          try {
            return decodeURIComponent(part);
          } catch {
            return "";
          }
        });
      if (views.includes(v as View)) setView(v as View);
      if (seed().evaluations.some((e) => e.id === id)) setSelected(id);
      setRecord(r || "");
    };
    applyHash();
    window.addEventListener("hashchange", applyHash);
    return () => window.removeEventListener("hashchange", applyHash);
  }, []);
  useEffect(() => {
    if (record && state && view === "Evaluation Workspace")
      document
        .getElementById(record)
        ?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [record, state, view]);
  const navigate = (v: View, id = selected, r = "") => {
    setView(v);
    setSelected(id);
    setRecord(r);
    setBrief(false);
    setError("");
    location.hash = [v, id, r].map(encodeURIComponent).join("/");
    window.scrollTo({ top: 0 });
  };
  const dispatch = (command: Command) => {
    if (!state) return false;
    try {
      const next = transition(state, command);
      createRepository(localStorage).save(next);
      setState(next);
      setError("");
      setNotice("Saved in this browser. Review lists have been recalculated.");
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    }
  };
  const reset = () => {
    try {
      setState(createRepository(localStorage).reset());
      setResetting(false);
      setSearch("");
      setRegion("All regions");
      setOwner("All owners");
      setManager("All managers");
      setFilter("All evaluations");
      setError("");
      setNotice("Demonstration restored to its original records.");
      navigate("Portfolio", "northstar");
    } catch {
      setError(
        "Browser storage is unavailable. Enable local storage to save or reset the demo.",
      );
    }
  };
  if (!state)
    return (
      <main className="loading">
        <h1>Technical Evaluation Command Centre</h1>
        {error ? (
          <>
            <p role="alert">{error}</p>
            <button onClick={reset}>Reset saved demo</button>
          </>
        ) : (
          <p>Opening demonstration portfolio…</p>
        )}
      </main>
    );
  const e =
    state.evaluations.find((e) => e.id === selected) || state.evaluations[0];
  const filtered = state.evaluations.filter(
    (e) =>
      (region === "All regions" || e.region === region) &&
      (owner === "All owners" || e.sa === owner) &&
      (manager === "All managers" || e.manager === manager) &&
      `${e.customer} ${e.project} ${e.objective}`
        .toLowerCase()
        .includes(search.toLowerCase()) &&
      (filter === "All evaluations" ||
        (filter === "Overdue decisions" && overdue(e, DEMO_DATE)) ||
        (filter === "Critical evidence gaps" && criticalGaps(e).length > 0) ||
        (filter === "Open blockers" && e.blockers.some((b) => b.open))),
  );
  const allIssues = filtered.flatMap((e) => issues(e, DEMO_DATE));
  const groups = patterns(state.evaluations);
  const open = (
    kind: Editor["kind"],
    criterionId?: string,
    blockerId?: string,
  ) => {
    setError("");
    setEditor({ kind, criterionId, blockerId });
  };
  const filters = (
    <div className="filters">
      <div className="search">
        <Search size={16} />
        <input
          aria-label="Search evaluations"
          placeholder="Search customer or objective"
          value={search}
          onChange={(x) => setSearch(x.target.value)}
        />
      </div>
      <select
        aria-label="Region"
        value={region}
        onChange={(x) => setRegion(x.target.value)}
      >
        <option>All regions</option>
        {[...new Set(state.evaluations.map((e) => e.region))].map((x) => (
          <option key={x}>{x}</option>
        ))}
      </select>
      <select
        aria-label="SA owner"
        value={owner}
        onChange={(x) => setOwner(x.target.value)}
      >
        <option>All owners</option>
        {state.evaluations.map((e) => (
          <option key={e.sa}>{e.sa}</option>
        ))}
      </select>
      <select
        aria-label="Manager"
        value={manager}
        onChange={(x) => setManager(x.target.value)}
      >
        <option>All managers</option>
        {[...new Set(state.evaluations.map((e) => e.manager))].map((x) => (
          <option key={x}>{x}</option>
        ))}
      </select>
      <select
        aria-label="Issue filter"
        value={filter}
        onChange={(x) => setFilter(x.target.value)}
      >
        {[
          "All evaluations",
          "Overdue decisions",
          "Critical evidence gaps",
          "Open blockers",
        ].map((x) => (
          <option key={x}>{x}</option>
        ))}
      </select>
    </div>
  );
  return (
    <div className="shell">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <aside className="sidebar no-print">
        <a
          className="brand"
          href="#Portfolio/northstar"
          onClick={() => navigate("Portfolio")}
        >
          <span className="brand-icon">
            <PanelTop size={20} />
          </span>
          <span>
            Technical Evaluation<strong>Command Centre</strong>
          </span>
        </a>
        <div className="nav-label">EMEA WORKSPACE</div>
        <nav aria-label="Main navigation">
          {views.map((v, i) => {
            const Icon = icons[i];
            return (
              <button
                key={v}
                className={view === v ? "active" : ""}
                aria-current={view === v ? "page" : undefined}
                onClick={() => navigate(v)}
              >
                <Icon size={18} />
                <span>{v}</span>
                {view === v && <ChevronRight size={14} />}
              </button>
            );
          })}
        </nav>
        <div className="sidebar-note">
          <span className="tiny-label">THE OPERATING PRINCIPLE</span>
          <p>
            Completed activities do not establish customer decision readiness.
          </p>
        </div>
        <div className="profile">
          <span className="avatar">BT</span>
          <div>
            <strong>Brad Towers</strong>
            <small>SA leadership · EMEA</small>
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar no-print">
          <div>
            EMEA <ChevronRight size={13} /> {view}
          </div>
          <span className="demo-label">Demonstration data</span>
          <button className="quiet" onClick={() => setResetting(true)}>
            <RotateCcw size={14} />
            Reset demo
          </button>
        </header>
        <main id="main">
          <div className="demo-strip no-print">
            All businesses, people, evidence and commercial figures are
            fictional. <span>Demo reference date: {date(DEMO_DATE)}</span>
          </div>
          {notice && (
            <div className="notice no-print" role="status">
              <Check size={16} />
              {notice}
              <button
                aria-label="Dismiss notification"
                onClick={() => setNotice("")}
              >
                <X size={15} />
              </button>
            </div>
          )}
          {error && !editor && (
            <div className="error" role="alert">
              {error}
            </div>
          )}
          {brief ? (
            <EvaluationBrief evaluation={e} close={() => setBrief(false)} />
          ) : (
            <>
              <div className="page-heading">
                <div className="eyebrow">
                  {view === "Portfolio"
                    ? "EVIDENCE BEFORE CONFIDENCE"
                    : view === "Evaluation Workspace"
                      ? e.region
                      : "EMEA TECHNICAL PRACTICE"}
                </div>
                <h1>
                  {view === "Evaluation Workspace"
                    ? e.customer
                    : view === "Reusable Plays"
                      ? "Reusable plays & handover"
                      : view === "Manager Review"
                        ? "Where should we intervene?"
                        : view === "Field Patterns"
                          ? "What is the field telling us?"
                          : "Evaluation portfolio"}
                </h1>
                <p>
                  {view === "Portfolio"
                    ? "Understand what is proven, what is accepted and what the customer needs to decide."
                    : view === "Evaluation Workspace"
                      ? e.project
                      : view === "Manager Review"
                        ? "Transparent review rules connect coaching to the records that need attention."
                        : view === "Field Patterns"
                          ? "Trace observations to their sources before turning them into field or Product guidance."
                          : "Turn reviewed evaluation evidence into a better starting point for the next team."}
                </p>
              </div>
              {view === "Portfolio" && (
                <>
                  <div className="summary-row">
                    <div>
                      <span>Evaluations in view</span>
                      <strong>
                        {filtered.length}
                        <small>
                          {" "}
                          across{" "}
                          {
                            [...new Set(filtered.map((e) => e.region))].length
                          }{" "}
                          regional teams
                        </small>
                      </strong>
                    </div>
                    <div>
                      <span>Unresolved critical criteria</span>
                      <strong>
                        {filtered.reduce(
                          (n, e) => n + criticalGaps(e).length,
                          0,
                        )}
                        <small> require supported findings</small>
                      </strong>
                    </div>
                    <div>
                      <span>Awaiting customer acceptance</span>
                      <strong>
                        {filtered.reduce(
                          (n, e) =>
                            n +
                            e.criteria.filter(
                              (c) =>
                                c.status === "Criterion met" &&
                                c.acceptance !== "Accepted",
                            ).length,
                          0,
                        )}
                        <small> technically met criteria</small>
                      </strong>
                    </div>
                  </div>
                  <section className="attention">
                    <div>
                      <span className="tiny-label">START THE REVIEW</span>
                      <h2>Activity can hide the decisive gap.</h2>
                      <p>
                        Northstar’s{" "}
                        {
                          state.evaluations[0].activities.filter(
                            (a) => a.complete,
                          ).length
                        }{" "}
                        completed activities sit alongside{" "}
                        {criticalGaps(state.evaluations[0]).length} unresolved
                        critical{" "}
                        {criticalGaps(state.evaluations[0]).length === 1
                          ? "criterion"
                          : "criteria"}
                        . Inspect what the evidence actually establishes.
                      </p>
                    </div>
                    <button
                      className="primary"
                      onClick={() =>
                        navigate(
                          "Evaluation Workspace",
                          "northstar",
                          "northstar-c1",
                        )
                      }
                    >
                      Review Northstar <ArrowRight size={16} />
                    </button>
                  </section>
                  {filters}
                  <div className="list-header">
                    <h2>Customer evaluations</h2>
                    <span>
                      {filtered.length} of {state.evaluations.length}{" "}
                      evaluations
                    </span>
                  </div>
                  {!filtered.length ? (
                    <Empty>
                      No evaluations match these filters. Change a filter or
                      clear your search.
                    </Empty>
                  ) : (
                    <div className="portfolio-list">
                      {filtered.map((e) => (
                        <article className="portfolio-row" key={e.id}>
                          <div className="customer-cell">
                            <div className="row-meta">
                              {e.region}
                              <Badge
                                tone={
                                  e.stage === "Completed" ? "good" : "neutral"
                                }
                              >
                                {e.stage}
                              </Badge>
                            </div>
                            <button
                              className="customer-link"
                              onClick={() =>
                                navigate("Evaluation Workspace", e.id)
                              }
                            >
                              {e.customer}
                              <ArrowUpRight size={18} />
                            </button>
                            <p>{e.objective}</p>
                            <div className="muted">
                              SA: {e.sa} · Manager: {e.manager}
                            </div>
                          </div>
                          <div className="criteria-cell">
                            <span className="tiny-label">
                              CRITICAL ACCEPTANCE CRITERIA
                            </span>
                            {e.criteria
                              .filter((c) => c.priority === "Critical")
                              .map((c) => (
                                <div key={c.id}>
                                  <button
                                    className="text-link criterion-link"
                                    onClick={() =>
                                      navigate(
                                        "Evaluation Workspace",
                                        e.id,
                                        c.id,
                                      )
                                    }
                                  >
                                    {c.statement}
                                  </button>
                                  <div>
                                    <Badge
                                      tone={
                                        criticalGaps(e).includes(c)
                                          ? "warn"
                                          : "good"
                                      }
                                    >
                                      {c.status}
                                    </Badge>
                                    <small>
                                      {" "}
                                      Customer: {c.acceptance.toLowerCase()}
                                    </small>
                                  </div>
                                </div>
                              ))}
                            <p className="health">{health(e, DEMO_DATE)}</p>
                          </div>
                          <div className="decision-cell">
                            <span className="tiny-label">
                              NEXT CUSTOMER DECISION
                            </span>
                            <p>{e.nextDecision}</p>
                            <strong
                              className={overdue(e, DEMO_DATE) ? "overdue" : ""}
                            >
                              {date(e.decisionDate)}
                            </strong>
                            <small>
                              Principal blocker:{" "}
                              {e.blockers.find((b) => b.open)?.title ||
                                "None recorded"}
                            </small>
                            <small>
                              Next:{" "}
                              {e.actions.find((a) => !a.done)?.title ||
                                "Delivery handover"}{" "}
                              · {e.actions.find((a) => !a.done)?.owner || e.sa}
                            </small>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </>
              )}
              {view === "Evaluation Workspace" && (
                <>
                  <div className="workspace-toolbar">
                    <button onClick={() => navigate("Portfolio")}>
                      <ArrowLeft size={15} /> Portfolio
                    </button>
                    <select
                      aria-label="Selected evaluation"
                      value={e.id}
                      onChange={(x) =>
                        navigate("Evaluation Workspace", x.target.value)
                      }
                    >
                      {state.evaluations.map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.customer}
                        </option>
                      ))}
                    </select>
                    <button onClick={() => setBrief(true)}>
                      <Printer size={16} />
                      Printable brief
                    </button>
                    <button
                      onClick={() => {
                        if (dispatch({ type: "draft", evaluationId: e.id }))
                          navigate("Reusable Plays", e.id);
                      }}
                    >
                      <BookOpen size={16} />
                      Create draft play
                    </button>
                  </div>
                  <div className="finding-banner">
                    <AlertCircle size={19} />
                    <div>
                      <strong>{health(e, DEMO_DATE)}</strong>
                      <span>
                        {e.activities.filter((a) => a.complete).length} /{" "}
                        {e.activities.length} activities complete ·{" "}
                        {e.evidence.length} evidence records · Technical
                        decision: {e.decisionOutcome}
                      </span>
                    </div>
                  </div>
                  <section className="panel outcome">
                    <span className="tiny-label">CUSTOMER OUTCOME</span>
                    <h2>{e.objective}</h2>
                    <p>{e.discovery}</p>
                    <div className="chain">
                      <span>Customer outcome</span>
                      <ChevronRight />
                      <span>Acceptance criterion</span>
                      <ChevronRight />
                      <span>Validation</span>
                      <ChevronRight />
                      <span>Evidence</span>
                      <ChevronRight />
                      <span>Customer decision</span>
                    </div>
                  </section>
                  <div className="workspace-grid">
                    <div className="workspace-primary">
                      <section className="panel">
                        <div className="section-title">
                          <h2>Acceptance criteria</h2>
                          <button onClick={() => open("criterion")}>
                            <Plus size={15} />
                            Add criterion
                          </button>
                        </div>
                        <p className="muted">
                          A technical finding and customer acceptance are
                          recorded separately.
                        </p>
                        {e.criteria.map((c) => (
                          <CriterionCard
                            key={c.id}
                            criterion={c}
                            evaluation={e}
                            selected={record === c.id}
                            open={open}
                            dispatch={dispatch}
                          />
                        ))}
                      </section>
                      <section className="panel">
                        <div className="section-title">
                          <h2>Evidence register</h2>
                          <span className="muted">
                            {e.evidence.length} fictional records
                          </span>
                        </div>
                        {e.evidence.length ? (
                          e.evidence.map((v) => (
                            <article
                              id={v.id}
                              key={v.id}
                              className={`evidence ${record === v.id ? "highlight" : ""}`}
                            >
                              <div className="row-meta">
                                <Badge>Fictional evidence</Badge>
                                <span>
                                  {date(v.date)} · {v.id}
                                </span>
                              </div>
                              <h3>{v.summary}</h3>
                              <p>
                                <strong>Criterion:</strong>{" "}
                                {
                                  e.criteria.find((c) => c.id === v.criterionId)
                                    ?.statement
                                }
                              </p>
                              <dl>
                                <dt>Method</dt>
                                <dd>{v.method}</dd>
                                <dt>Environment</dt>
                                <dd>{v.environment}</dd>
                                <dt>Limitations</dt>
                                <dd>{v.limitations}</dd>
                                <dt>Finding support</dt>
                                <dd>
                                  {v.supports
                                    ? "Supports the stated finding within these limitations"
                                    : "Does not establish this criterion"}
                                </dd>
                              </dl>
                            </article>
                          ))
                        ) : (
                          <Empty>
                            No evidence recorded. Record a validation result
                            from a criterion.
                          </Empty>
                        )}
                      </section>
                      <section className="panel">
                        <h2>Validation activities</h2>
                        <p className="muted">
                          Completion records work done. It does not change
                          criterion or acceptance status.
                        </p>
                        <div className="activities">
                          {e.activities.map((a) => (
                            <label key={a.id}>
                              <input
                                type="checkbox"
                                checked={a.complete}
                                onChange={(x) =>
                                  dispatch({
                                    type: "activity",
                                    evaluationId: e.id,
                                    activityId: a.id,
                                    complete: x.target.checked,
                                  })
                                }
                              />
                              <span>
                                {a.title}
                                <small>
                                  {a.owner} ·{" "}
                                  {
                                    e.criteria.find(
                                      (c) => c.id === a.criterionId,
                                    )?.statement
                                  }
                                </small>
                              </span>
                              <Badge>
                                {a.complete ? "Complete" : "Planned"}
                              </Badge>
                            </label>
                          ))}
                        </div>
                      </section>
                      <section className="panel" id="scope">
                        <div className="section-title">
                          <h2>Architecture & evaluation boundary</h2>
                          <button onClick={() => open("scope")}>
                            Update scope
                          </button>
                        </div>
                        <dl>
                          <dt>Current architecture</dt>
                          <dd>{e.architecture}</dd>
                          <dt>Constraints</dt>
                          <dd>{e.constraints}</dd>
                          <dt>Agreed scope</dt>
                          <dd>{e.scope}</dd>
                          <dt>Explicit exclusions</dt>
                          <dd>{e.exclusions}</dd>
                        </dl>
                        {e.scopeChanged && (
                          <Badge tone={e.scopeAligned ? "good" : "warn"}>
                            {e.scopeAligned
                              ? "Scope and criteria reviewed"
                              : "Scope changes need revised criteria"}
                          </Badge>
                        )}
                      </section>
                    </div>
                    <aside className="workspace-secondary">
                      <section className="panel" id="decision">
                        <div className="section-title">
                          <h2>Next customer decision</h2>
                          <button onClick={() => open("decision")}>Edit</button>
                        </div>
                        <p>{e.nextDecision}</p>
                        <strong>{date(e.decisionDate)}</strong>
                        <dl>
                          <dt>Technical decision</dt>
                          <dd>{e.decisionOutcome}</dd>
                          <dt>Commercial outcome</dt>
                          <dd>{e.commercialOutcome}</dd>
                        </dl>
                      </section>
                      <section className="panel">
                        <div className="section-title">
                          <h2>Actions & ownership</h2>
                          <button
                            aria-label="Assign an action"
                            onClick={() => open("action")}
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                        {e.actions.map((a) => (
                          <div className="action" key={a.id}>
                            <strong>{a.title}</strong>
                            <small>
                              {a.owner} · {date(a.date)} ·{" "}
                              {a.done ? "Complete" : "Open"}
                            </small>
                          </div>
                        ))}
                      </section>
                      <section className="panel">
                        <div className="section-title">
                          <h2>Blockers</h2>
                          <button
                            aria-label="Log a blocker"
                            onClick={() => open("blocker")}
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                        {e.blockers.length ? (
                          e.blockers.map((b) => (
                            <div className="action" key={b.id} id={b.id}>
                              <strong>{b.title}</strong>
                              <small>
                                {b.owner || "Unowned"} ·{" "}
                                {b.open ? "Open" : "Resolved"}
                              </small>
                              <button
                                className="text-link"
                                onClick={() =>
                                  open("blocker-owner", undefined, b.id)
                                }
                              >
                                Update owner or resolution
                              </button>
                            </div>
                          ))
                        ) : (
                          <p className="muted">No blockers recorded.</p>
                        )}
                      </section>
                      <section className="panel">
                        <h2>Stakeholders</h2>
                        {e.stakeholders.map((s) => (
                          <p key={s}>{s}</p>
                        ))}
                      </section>
                      <section className="panel">
                        <h2>Open questions</h2>
                        {e.questions.map((q) => (
                          <p key={q}>{q}</p>
                        ))}
                      </section>
                      <section className="panel">
                        <h2>Delivery handover</h2>
                        <p>{e.handover}</p>
                        <button onClick={() => setBrief(true)}>
                          Open evaluation brief <ArrowUpRight size={14} />
                        </button>
                      </section>
                    </aside>
                  </div>
                </>
              )}
              {view === "Manager Review" && (
                <>
                  {filters}
                  <div className="list-header">
                    <h2>
                      {allIssues.length} interventions across{" "}
                      {new Set(allIssues.map((i) => i.evaluationId)).size}{" "}
                      evaluations
                    </h2>
                    <span>Recalculated from current records</span>
                  </div>
                  <p className="muted">
                    Evidence gaps remain visible until a critical criterion has
                    a supported met finding. Customer acceptance is a separate
                    intervention.
                  </p>
                  {!allIssues.length ? (
                    <Empty>
                      No interventions match these filters. This means the
                      listed rules found no issues; it does not establish
                      commercial readiness.
                    </Empty>
                  ) : (
                    <div className="review-list">
                      {allIssues.map((i) => {
                        const ev = state.evaluations.find(
                          (e) => e.id === i.evaluationId,
                        )!;
                        return (
                          <article className="review-item" key={i.id}>
                            <div>
                              <span className="tiny-label">
                                {ev.customer} · {ev.sa}
                              </span>
                              <h2>{i.title}</h2>
                              <p>{i.why}</p>
                              <div className="source-links">
                                {i.recordIds.map((id) => (
                                  <button
                                    key={id}
                                    onClick={() =>
                                      navigate(
                                        "Evaluation Workspace",
                                        ev.id,
                                        id,
                                      )
                                    }
                                  >
                                    {id} <ArrowUpRight size={12} />
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div className="coaching">
                              <span className="tiny-label">
                                COACHING QUESTION
                              </span>
                              <h3>{i.question}</h3>
                              <p>
                                <strong>Next action:</strong> {i.action}
                              </p>
                              <button
                                onClick={() => {
                                  navigate(
                                    "Evaluation Workspace",
                                    ev.id,
                                    i.recordIds[0],
                                  );
                                }}
                              >
                                Inspect & act <ArrowRight size={14} />
                              </button>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
              {view === "Field Patterns" && (
                <>
                  <div className="callout">
                    <strong>
                      Observations from {state.evaluations.length} fictional
                      evaluations.
                    </strong>
                    <p>
                      Counts represent unique supporting opportunities, not
                      frequency over time. These records do not establish a
                      market trend. Observations retain their original context
                      after a finding changes.
                    </p>
                  </div>
                  <div className="patterns">
                    {groups.map((p) => (
                      <section className="panel" key={p.key}>
                        <div className="row-meta">
                          <Badge>{p.category}</Badge>
                          <strong>
                            {p.supports.length}{" "}
                            {p.supports.length === 1
                              ? "opportunity"
                              : "opportunities"}
                          </strong>
                        </div>
                        <h2>{p.finding}</h2>
                        <p className="muted">
                          {p.supports.length > 1
                            ? "Repeated observation in this sample."
                            : "Single observation; further validation needed."}
                        </p>
                        {p.supports.map((s) => (
                          <div className="pattern-source" key={s.evaluation.id}>
                            <button
                              className="text-link"
                              onClick={() =>
                                navigate(
                                  "Evaluation Workspace",
                                  s.evaluation.id,
                                  s.recordIds[0],
                                )
                              }
                            >
                              {s.evaluation.customer}
                              <ArrowUpRight size={14} />
                            </button>
                            <p>{s.finding}</p>
                            <div className="source-links">
                              {s.recordIds.map((id) => (
                                <button
                                  key={id}
                                  onClick={() =>
                                    navigate(
                                      "Evaluation Workspace",
                                      s.evaluation.id,
                                      id,
                                    )
                                  }
                                >
                                  {id}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </section>
                    ))}
                  </div>
                  <section className="panel product-feedback">
                    <h2>Product feedback</h2>
                    <p className="muted">
                      A customer request is not a validated product gap.
                      Commercial figures are fictional opportunity context, not
                      revenue lost.
                    </p>
                    {groups
                      .filter(
                        (p) =>
                          p.category === "Product request" ||
                          p.category === "Validated product gap",
                      )
                      .map((p) => (
                        <article key={p.key}>
                          <Badge
                            tone={
                              p.category === "Validated product gap"
                                ? "warn"
                                : "neutral"
                            }
                          >
                            {p.category}
                          </Badge>
                          <h3>{p.finding}</h3>
                          {p.supports.map((s) => (
                            <div key={s.evaluation.id}>
                              <p>
                                <strong>Affected evaluation:</strong>{" "}
                                <button
                                  className="text-link"
                                  onClick={() =>
                                    navigate(
                                      "Evaluation Workspace",
                                      s.evaluation.id,
                                      s.recordIds[0],
                                    )
                                  }
                                >
                                  {s.evaluation.customer}
                                </button>
                              </p>
                              <p>
                                <strong>Supporting records:</strong>{" "}
                                {s.recordIds.join(", ")}
                              </p>
                              <p>
                                <strong>Existing workaround:</strong>{" "}
                                {s.workaround}
                              </p>
                              <p>
                                <strong>Commercial context:</strong> €
                                {s.evaluation.value.toLocaleString("en-GB")}{" "}
                                fictional pipeline; loss and attribution not
                                established.
                              </p>
                              <p>
                                <strong>Open question:</strong> {s.question}
                              </p>
                            </div>
                          ))}
                        </article>
                      ))}
                  </section>
                </>
              )}
              {view === "Reusable Plays" && (
                <>
                  <div className="callout">
                    <strong>Reuse the method. Revalidate the finding.</strong>
                    <p>
                      Drafts require an explicit review before they are ready
                      for reuse. A play does not establish that another
                      customer’s criterion is met.
                    </p>
                  </div>
                  {state.plays.map((p) => (
                    <PlayCard
                      key={p.id}
                      play={p}
                      dispatch={dispatch}
                      source={() =>
                        navigate("Evaluation Workspace", p.evaluationId)
                      }
                    />
                  ))}
                  <section className="panel">
                    <h2>Create a play from an evaluation</h2>
                    <p>
                      Carry forward the scope, criteria, validation method and
                      limitations for review.
                    </p>
                    <div className="play-creation">
                      {state.evaluations
                        .filter(
                          (e) =>
                            !state.plays.some((p) => p.evaluationId === e.id),
                        )
                        .map((e) => (
                          <button
                            key={e.id}
                            onClick={() =>
                              dispatch({ type: "draft", evaluationId: e.id })
                            }
                          >
                            <Plus size={16} />
                            {e.customer}
                          </button>
                        ))}
                    </div>
                  </section>
                </>
              )}
            </>
          )}
          <footer>
            Technical Evaluation Command Centre · Fictional demonstration ·
            Browser-local workspace
          </footer>
        </main>
      </div>
      {editor && (
        <EditorDialog
          editor={editor}
          evaluation={e}
          error={error}
          close={() => {
            setEditor(null);
            setError("");
          }}
          submit={(command) => {
            if (dispatch(command)) setEditor(null);
          }}
        />
      )}
      {resetting && (
        <Modal title="Reset demonstration?" close={() => setResetting(false)}>
          <p>
            This replaces this project’s saved browser edits with the original
            six fictional evaluations and seeded play.
          </p>
          <div className="form-actions">
            <button onClick={() => setResetting(false)}>Keep edits</button>
            <button className="primary" onClick={reset}>
              Restore original demo
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
function CriterionCard({
  criterion: c,
  evaluation: e,
  selected,
  open,
  dispatch,
}: {
  criterion: Criterion;
  evaluation: Evaluation;
  selected: boolean;
  open: (kind: Editor["kind"], criterionId?: string) => void;
  dispatch: (c: Command) => boolean;
}) {
  return (
    <article id={c.id} className={`criterion ${selected ? "highlight" : ""}`}>
      <div className="row-meta">
        <Badge tone={c.priority === "Critical" ? "accent" : "neutral"}>
          {c.priority}
        </Badge>
        <span>{c.id}</span>
      </div>
      <h3>{c.statement}</h3>
      <div className="status-line">
        <Badge tone={c.status === "Criterion met" ? "good" : "warn"}>
          {c.status}
        </Badge>
        <Badge>Customer acceptance: {c.acceptance}</Badge>
      </div>
      <dl>
        <dt>Validation method</dt>
        <dd>{c.method || "No validation plan agreed"}</dd>
        <dt>Owner</dt>
        <dd>{c.owner}</dd>
        <dt>Evidence</dt>
        <dd>
          {c.evidenceIds.length
            ? c.evidenceIds.map((id) => (
                <span className="evidence-link" key={id}>
                  <a
                    href={`#Evaluation%20Workspace/${e.id}/${id}`}
                    onClick={() =>
                      document
                        .getElementById(id)
                        ?.scrollIntoView({ block: "center" })
                    }
                  >
                    {id}{" "}
                  </a>
                  <button
                    aria-label={`Unlink evidence ${id}`}
                    onClick={() =>
                      dispatch({
                        type: "unlink",
                        evaluationId: e.id,
                        criterionId: c.id,
                        evidenceId: id,
                      })
                    }
                  >
                    Unlink
                  </button>
                </span>
              ))
            : "None linked"}
        </dd>
        {c.explanation && (
          <>
            <dt>Unresolved finding</dt>
            <dd>{c.explanation}</dd>
          </>
        )}
        {c.acceptanceBy && (
          <>
            <dt>Customer review</dt>
            <dd>
              {c.acceptanceBy} · {date(c.acceptanceDate)}
            </dd>
          </>
        )}
      </dl>
      <div className="button-row">
        <button onClick={() => open("result", c.id)}>
          Record validation result
        </button>
        <button onClick={() => open("criterion", c.id)}>Edit criterion</button>
        <button onClick={() => open("link", c.id)}>Link evidence</button>
        <button onClick={() => open("accept", c.id)}>
          Record customer acceptance
        </button>
      </div>
    </article>
  );
}
function Modal({
  title,
  children,
  close,
}: {
  title: string;
  children: ReactNode;
  close: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const el = ref.current;
    el?.showModal();
    return () => el?.close();
  }, []);
  return (
    <dialog ref={ref} onCancel={close} aria-labelledby={titleId}>
      <div className="dialog-heading">
        <h2 id={titleId}>{title}</h2>
        <button onClick={close} aria-label="Close dialog">
          <X size={18} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
function EditorDialog({
  editor,
  evaluation: e,
  error,
  close,
  submit,
}: {
  editor: Editor;
  evaluation: Evaluation;
  error: string;
  close: () => void;
  submit: (c: Command) => void;
}) {
  const c = e.criteria.find((c) => c.id === editor.criterionId),
    b = e.blockers.find((b) => b.id === editor.blockerId);
  const titles = {
    criterion: c ? "Edit acceptance criterion" : "Add acceptance criterion",
    result: "Record validation result",
    accept: "Record customer acceptance",
    link: "Link existing evidence",
    action: "Assign a customer action",
    blocker: "Log a blocker",
    decision: "Update customer decision",
    scope: "Review evaluation scope",
    "blocker-owner": "Update blocker",
  };
  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget),
      s = (n: string) => String(data.get(n) || "");
    const base = { evaluationId: e.id };
    switch (editor.kind) {
      case "criterion":
        submit({
          ...base,
          type: "criterion",
          criterion: {
            id: c?.id || crypto.randomUUID(),
            statement: s("statement"),
            priority: s("priority") as Criterion["priority"],
            method: s("method"),
            owner: s("owner"),
            status: s("status") as Criterion["status"],
            explanation: s("explanation"),
            evidenceIds: c?.evidenceIds || [],
            acceptance: c?.acceptance || "Pending",
            acceptanceBy: c?.acceptanceBy || "",
            acceptanceDate: c?.acceptanceDate || "",
          },
        });
        break;
      case "result":
        submit({
          ...base,
          type: "result",
          evidence: {
            id: crypto.randomUUID(),
            criterionId: c!.id,
            summary: s("summary"),
            method: s("method"),
            environment: s("environment"),
            date: s("date"),
            limitations: s("limitations"),
            supports: s("supports") === "yes",
            fictional: true,
          },
          status: s("status") as Criterion["status"],
          explanation: s("explanation"),
        });
        break;
      case "accept":
        submit({
          ...base,
          type: "accept",
          criterionId: c!.id,
          acceptance: s("acceptance") as Criterion["acceptance"],
          by: s("by"),
          date: s("date"),
        });
        break;
      case "link":
        submit({
          ...base,
          type: "link",
          criterionId: c!.id,
          evidenceId: s("evidenceId"),
        });
        break;
      case "action":
        submit({
          ...base,
          type: "action",
          title: s("title"),
          owner: s("owner"),
          date: s("date"),
        });
        break;
      case "blocker":
        submit({
          ...base,
          type: "blocker",
          title: s("title"),
          owner: s("owner"),
        });
        break;
      case "blocker-owner":
        submit({
          ...base,
          type: "blocker-owner",
          blockerId: b!.id,
          owner: s("owner"),
          open: s("open") === "yes",
        });
        break;
      case "decision":
        submit({
          ...base,
          type: "decision",
          text: s("text"),
          date: s("date"),
          outcome: s("outcome") as Evaluation["decisionOutcome"],
        });
        break;
      case "scope":
        submit({
          ...base,
          type: "scope",
          scope: s("scope"),
          aligned: data.has("aligned"),
        });
        break;
    }
  }
  return (
    <Modal title={titles[editor.kind]} close={close}>
      <form onSubmit={save}>
        {c && <p className="form-context">{c.statement}</p>}
        {editor.kind === "criterion" && (
          <>
            <Textarea
              label="Criterion statement"
              name="statement"
              value={c?.statement}
            />
            <Field label="Priority">
              <select name="priority" defaultValue={c?.priority || "Critical"}>
                <option>Critical</option>
                <option>Supporting</option>
              </select>
            </Field>
            <Textarea
              label="Validation method"
              name="method"
              value={c?.method}
            />
            <Input
              label="Criterion owner"
              name="owner"
              value={c?.owner || e.sa}
            />
            <Field label="Criterion status">
              <select
                name="status"
                defaultValue={c?.status || "Validation planned"}
              >
                {statuses.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </Field>
            <Textarea
              label="Unresolved explanation (required unless met)"
              name="explanation"
              value={c?.explanation}
              required={false}
            />
            <p className="muted">
              A met finding needs supporting evidence. Add a new criterion for a
              changed requirement once evidence exists.
            </p>
          </>
        )}
        {editor.kind === "result" && (
          <>
            <p className="muted">
              Record a fictional test result. This resets customer acceptance to
              pending for review of the new finding.
            </p>
            <Textarea label="Result summary" name="summary" />
            <Textarea label="Method used" name="method" value={c?.method} />
            <Input label="Test environment" name="environment" />
            <Input
              label="Result date"
              name="date"
              type="date"
              value={DEMO_DATE}
            />
            <Textarea label="Limitations" name="limitations" />
            <Field label="Does this evidence establish that the criterion is met?">
              <select name="supports">
                <option value="no">No — partial or insufficient</option>
                <option value="yes">Yes — within stated limitations</option>
              </select>
            </Field>
            <Field label="Explicit criterion finding">
              <select name="status" defaultValue="Evidence collected">
                {statuses.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </Field>
            <Textarea
              label="What remains unresolved? (required unless met)"
              name="explanation"
              required={false}
            />
          </>
        )}
        {editor.kind === "accept" && (
          <>
            <Field label="Customer acceptance">
              <select name="acceptance" defaultValue={c?.acceptance}>
                <option>Pending</option>
                <option>Accepted</option>
                <option>Rejected</option>
              </select>
            </Field>
            <Input
              label="Customer reviewer"
              name="by"
              value={c?.acceptanceBy}
            />
            <Input
              label="Customer review date"
              name="date"
              type="date"
              value={c?.acceptanceDate || DEMO_DATE}
            />
            <p className="muted">
              Acceptance requires an explicit customer review and a supported
              met finding.
            </p>
          </>
        )}
        {editor.kind === "link" && (
          <>
            <Field label="Evidence for this criterion">
              <select name="evidenceId" required defaultValue="">
                <option value="" disabled>
                  Select a record
                </option>
                {e.evidence
                  .filter((v) => v.criterionId === c?.id)
                  .map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.id} — {v.summary}
                    </option>
                  ))}
              </select>
            </Field>
            <p className="muted">
              Linking evidence changes neither the technical finding nor
              customer acceptance. New validation results are linked
              automatically.
            </p>
          </>
        )}
        {editor.kind === "action" && (
          <>
            <Textarea label="Next customer action" name="title" />
            <Input label="Action owner" name="owner" value={e.sa} />
            <Input
              label="Action due date"
              name="date"
              type="date"
              value="2026-10-27"
            />
          </>
        )}
        {editor.kind === "blocker" && (
          <>
            <Textarea label="Blocker description" name="title" />
            <Input
              label="Blocker owner (optional)"
              name="owner"
              value={e.sa}
              required={false}
            />
            <p className="muted">
              An unowned blocker will appear in Manager Review.
            </p>
          </>
        )}
        {editor.kind === "blocker-owner" && (
          <>
            <p>{b?.title}</p>
            <Input
              label="Blocker owner"
              name="owner"
              value={b?.owner}
              required={false}
            />
            <Field label="Blocker status">
              <select name="open" defaultValue={b?.open ? "yes" : "no"}>
                <option value="yes">Open</option>
                <option value="no">Resolved</option>
              </select>
            </Field>
          </>
        )}
        {editor.kind === "decision" && (
          <>
            <Textarea
              label="Next customer decision"
              name="text"
              value={e.nextDecision}
            />
            <Input
              label="Intended decision date"
              name="date"
              type="date"
              value={e.decisionDate}
              required={false}
            />
            <Field label="Technical decision">
              <select name="outcome" defaultValue={e.decisionOutcome}>
                {["Pending", "Proceed", "Do not proceed", "Conditional"].map(
                  (s) => (
                    <option key={s}>{s}</option>
                  ),
                )}
              </select>
            </Field>
            <p className="muted">
              A technical decision does not change criterion status, customer
              acceptance or commercial outcome.
            </p>
          </>
        )}
        {editor.kind === "scope" && (
          <>
            <Textarea label="Evaluation scope" name="scope" value={e.scope} />
            <label className="check-label">
              <input
                type="checkbox"
                name="aligned"
                defaultChecked={e.scopeAligned}
              />
              I have reviewed the success criteria with the customer and updated
              them where required.
            </label>
          </>
        )}
        {error && (
          <div className="error" role="alert">
            {error}
          </div>
        )}
        <div className="form-actions">
          <button type="button" onClick={close}>
            Cancel
          </button>
          <button className="primary" type="submit">
            Save record
          </button>
        </div>
      </form>
    </Modal>
  );
}
function PlayCard({
  play: p,
  dispatch,
  source,
}: {
  play: Play;
  dispatch: (c: Command) => boolean;
  source: () => void;
}) {
  const [review, setReview] = useState(false);
  return (
    <section className="panel play-card">
      <div className="row-meta">
        <Badge tone={p.status === "Ready" ? "good" : "warn"}>
          {p.status === "Ready"
            ? "Reviewed · Ready for reuse"
            : "Draft · Review required"}
        </Badge>
        <button className="text-link" onClick={source}>
          Source evaluation
          <ArrowUpRight size={14} />
        </button>
      </div>
      <h2>{p.title}</h2>
      {p.reviewer && (
        <p className="muted">
          Reviewed by {p.reviewer} · {date(p.reviewDate)} · fictional review
        </p>
      )}
      <div className="play-sections">
        {p.sections.map((s) => (
          <div key={s.title}>
            <h3>{s.title}</h3>
            <p>{s.text}</p>
          </div>
        ))}
      </div>
      {p.status === "Draft" && (
        <button className="primary" onClick={() => setReview(true)}>
          Review draft for reuse
        </button>
      )}
      {review && (
        <Modal title="Review play for reuse" close={() => setReview(false)}>
          <form
            onSubmit={(ev) => {
              ev.preventDefault();
              const d = new FormData(ev.currentTarget);
              if (
                dispatch({
                  type: "review-play",
                  playId: p.id,
                  reviewer: String(d.get("reviewer")),
                  date: String(d.get("date")),
                  sections: p.sections.map((s, i) => ({
                    ...s,
                    text: String(d.get(`section-${i}`)),
                  })),
                })
              )
                setReview(false);
            }}
          >
            <p>
              Review the source evaluation, edit each section and confirm the
              limitations before reuse.
            </p>
            {p.sections.map((s, i) => (
              <Textarea
                key={s.title}
                label={s.title}
                name={`section-${i}`}
                value={s.text}
              />
            ))}
            <Input label="Reviewer name" name="reviewer" />
            <Input
              label="Review date"
              name="date"
              type="date"
              value={DEMO_DATE}
            />
            <label className="check-label">
              <input type="checkbox" required />I reviewed the evidence,
              applicability and limitations of this play.
            </label>
            <div className="form-actions">
              <button type="button" onClick={() => setReview(false)}>
                Cancel
              </button>
              <button type="submit" className="primary">
                Mark ready for reuse
              </button>
            </div>
          </form>
        </Modal>
      )}
    </section>
  );
}
function EvaluationBrief({
  evaluation: e,
  close,
}: {
  evaluation: Evaluation;
  close: () => void;
}) {
  return (
    <article className="brief">
      <div className="button-row no-print">
        <button onClick={close}>
          <ArrowLeft size={16} />
          Back to workspace
        </button>
        <button className="primary" onClick={() => window.print()}>
          <Printer size={16} />
          Print / save PDF
        </button>
      </div>
      <div className="eyebrow">FICTIONAL DEMONSTRATION · {date(DEMO_DATE)}</div>
      <h1>{e.customer}</h1>
      <p className="brief-subtitle">Technical evaluation brief · {e.project}</p>
      <h2>Customer objective</h2>
      <p>{e.objective}</p>
      <h2>Scope & exclusions</h2>
      <p>{e.scope}</p>
      <p>
        <strong>Excludes:</strong> {e.exclusions}
      </p>
      <h2>Findings against acceptance criteria</h2>
      {e.criteria.map((c) => (
        <section key={c.id}>
          <h3>
            {c.priority}: {c.statement}
          </h3>
          <p>
            <strong>Technical finding:</strong> {c.status}. {c.explanation}
          </p>
          <p>
            <strong>Customer acceptance:</strong> {c.acceptance}
            {c.acceptanceBy
              ? ` — ${c.acceptanceBy}, ${date(c.acceptanceDate)}`
              : ""}
          </p>
          {e.evidence
            .filter((v) => c.evidenceIds.includes(v.id))
            .map((v) => (
              <p key={v.id}>
                <strong>Fictional evidence {v.id}:</strong> {v.summary} Method:{" "}
                {v.method}. Environment: {v.environment}. Date: {date(v.date)}.
                Limitations: {v.limitations}
              </p>
            ))}
        </section>
      ))}
      <h2>Outstanding risks</h2>
      <p>{health(e, DEMO_DATE)}</p>
      {e.blockers
        .filter((b) => b.open)
        .map((b) => (
          <p key={b.id}>
            {b.title} · {b.owner || "Unowned"}
          </p>
        ))}
      <h2>Next decision</h2>
      <p>
        {e.nextDecision} · {date(e.decisionDate)} · Technical decision:{" "}
        {e.decisionOutcome}
      </p>
      <h2>Customer actions</h2>
      {e.actions
        .filter((a) => !a.done)
        .map((a) => (
          <p key={a.id}>
            {a.title} · {a.owner} · {date(a.date)}
          </p>
        ))}
      <h2>Delivery handover notes</h2>
      <p>{e.handover}</p>
      <p>
        <strong>Commercial outcome:</strong> {e.commercialOutcome}
      </p>
    </article>
  );
}
