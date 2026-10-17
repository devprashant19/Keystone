# KEYSTONE — Shot-by-Shot Demo Script (Track 01)

**Target runtime 4:40. Record at 1440×900, light theme, immediately after a fresh seed.**

Operational pre-flight, recovery and the naming audit live in [`RECORDING.md`](RECORDING.md).
This file is the filming script: timecode, screen, exact clicks, narration, fallback.

Every number below was measured against the live stack on 2026-10-17. Quote nothing from
memory. If a number on screen disagrees with this script, **say what is on screen**.

---

## Pre-roll (before you press record)

```
1. python scripts/seed_demo.py          -> wait for the DEMO READY block
2. Warm the three agent questions once (~5s total) so each answers instantly on camera:
      List all corridors in the inventory
      What fails if monastery_chandgiram floods?
      Inspect the causal chain for monastery_chandgiram
   Ask each in the Copilot panel, confirm GROUNDED (DETERMINISTIC), then reload.
3. Start API on :8000 and the web app on :5173
4. Hard-reload. Confirm NO "results stale" and NO "DATABASE UNAVAILABLE" banner
5. Browser exactly 1440x900, other tabs closed, bookmarks hidden, notifications off
6. Open on the landing page
```

> **Why step 2 matters.** The agent caches tool results per `(run_id, tool, args)`.
> `seed_demo.py` warms only two questions. Warming all three keeps the agent beat under ten
> seconds instead of a cold traversal. This caches *tool results*, not answers — the trace
> and the grounding you show on camera are produced the same way either time.

---

## BEAT 1 · 0:00–0:20 — The question

**Screen:** Landing page, still. Headline, red call to action, three live counters, three
capability cards, provenance strip along the bottom.

**Clicks:** none. Let the counters settle. Do not move the mouse.

> "Every operations team has the same question, and almost nobody can answer it quickly:
> what breaks if this goes down? Not what is broken now — what breaks **next**, and what
> should we do about it **before** it happens.
> This is Keystone. It answers that question on a graph."

**On screen:** counters read **14** corridors, **182** cases, **60/100** graph topology, all
pulled live from `/api/world/summary`. Provenance strip reads "Real Delhi arterial geometry,
MIT-licensed. Power and telecom layers synthetic and labelled." plus FalkorDB 6.0.2.

**Fallback:** counters showing `—` means the API is unreachable. Stop; restart it on :8000.

---

## BEAT 2 · 0:20–0:45 — One click, already analysed

**Clicks:** `#break-something-btn` ("BREAK SOMETHING").

**Screen:** instant transition to the Command Deck, golden scenario fully populated.

> "This is a real Delhi arterial network — fourteen corridors, thirteen junctions, ten
> critical facilities, from an open dataset. The power and telecom layers on top are
> synthetic, and labelled as such everywhere you will see them.
> One click, and we are already looking at a complete analysis. No loading screen, because
> all fourteen corridor sweeps are precomputed and validated against this exact graph
> digest. I will come back and recompute one live."

**Why this scores:** a working product inside thirty seconds, and you have pre-empted "is
this just a fixture?" before anyone asks.

---

## BEAT 3 · 0:45–1:15 — The thing a table cannot do *(multi-hop)*

**Clicks:** switch to **Schematic**. Hover one vertical `carries` connector. Trace the chain
slowly with the cursor: road → feeder → tower → relay → facility.

> "Here is why this is a graph problem. Three layers — roads, power feeders, telecom.
> Watch the vertical connectors. This road corridor **carries** a power feeder. That feeder
> powers a tower. That tower reaches the relay covering Sushruta Trauma Centre.
> So cutting one road does not just block an ambulance. It can take a hospital off the alert
> network. That chain is four relationship types and four hops. It is one traversal in
> FalkorDB, and it is a nightmare in a relational schema."

**Why this scores:** Track 01 asks for **multi-hop reasoning**, and this is the clearest
thirty seconds of it in the demo. Move the cursor slowly — the judge has to follow the hop.

---

## BEAT 4 · 1:15–1:45 — Blast radius, and the honest zero

**Clicks:** back to **Geographic**. Click `#blast-band-road`, `#blast-band-power`,
`#blast-band-alert`. Then select `Delhi Gate Connector` from `#corridor-select`.

> "Click any corridor and Keystone shows the blast radius across all three layers — the road
> severed, the feeder it carries going dark, the towers and relays downstream of it.
> Now watch this one."

*(after selecting Delhi Gate Connector)*

> "This corridor carries no power feeder at all. So Keystone says **zero feeders dark** — not
> 'about one', not a plausible-looking guess. Seven of the fourteen corridors are like this,
> and on every one of them the panel reports zero."

**On screen:** the power band reads `0 / 7 feeders dark` with "no feeder carried on this
corridor".

> Note: loading a scenario auto-selects the first case, so the deck opens showing f1 **and**
> f2 together. On the golden case that is `2 / 14 corridors severed` and `2 / 7 feeders dark`
> (`pf_chandrawal` + `pf_cp`). Read the counts off the screen rather than from this document.

**Why this scores:** almost nobody else will have this beat. You volunteer a case where your
own product has nothing to show, and demonstrate that it invents nothing to fill the space.
Guarded by a regression test (`honesty_blast.spec.ts`).

**Fallback:** if any count here shows a non-zero number, stop and reseed — that is the exact
defect the test guards, and it must not reach camera.

---

## BEAT 5 · 1:45–2:30 — The agent, and visible tool selection ⭐

**This is the Track 01 centrepiece. Do not rush it.**

**Clicks:** `#toggle-agent-panel`. Then type each question into `#agent-query-input` and
press `#agent-submit-btn`, pausing on each trace before moving on.

| # | Type exactly | Tool the agent selects | Shown |
|---|---|---|---|
| 1 | `List all corridors in the inventory` | `get_corridor_inventory()` | 14 corridors returned |
| 2 | `What fails if monastery_chandgiram floods?` | `evaluate_contingency(f1_corridor_id=road_ring_monastery_chandgiram)` | 13 cases · 13 f1-alone · 0 interaction-only · ABSTAIN |
| 3 | `Inspect the causal chain for monastery_chandgiram` | `inspect_causal_chain(f1=…monastery_chandgiram, f2=…kashmere_monastery)` | 1 breach, status true |

> "Keystone also has a copilot, and this is the part I care most about.
> I ask it three different questions in plain language. Watch the **tool selection trace**.
> First question, it picks `get_corridor_inventory`. Second, `evaluate_contingency` — and it
> resolves 'monastery_chandgiram' to the actual corridor id. Third, `inspect_causal_chain`,
> and it chooses the second failure itself.
> Same agent, three different graph tools, selected from intent — and every answer carries
> **GROUNDED, DETERMINISTIC**. That badge means every number in the sentence came back from a
> typed tool call against FalkorDB. If a figure were not traceable to a tool result, the
> panel would say *narration unavailable* rather than write a sentence around it.
> There are five of these tools, and they are exposed over MCP as well, so an external agent
> can call the same graph operations."

**On screen:** `TOOL SELECTION TRACE:` with a monospace chip per call showing the tool name
and its arguments, then the `GROUNDED (DETERMINISTIC)` badge, the answer, and citations.

**Why this scores:** this one beat hits four of Track 01's five stated focus areas — graph
queries as agent tools, tool selection through MCP, actions based on what the graph shows,
and explainable results. Say the phrase "tool selection trace" out loud.

**Fallback:** a badge reading "NARRATION UNAVAILABLE" means that question was not warmed.
Move to the next question rather than re-asking, and do not explain the cache on camera.

---

## BEAT 6 · 2:30–2:55 — Every number drills to the graph

**Clicks:** `#open-evidence-btn`. Scroll the dependency chain. Point at the arithmetic. Return
with `Back to Command Deck`.

> "Nothing here is a black box. Every number drills to the graph entities behind it.
> For L.N.J.P. Hospital: three minutes dispatch, zero kilometres of road because the depot
> sits on that junction, plus a one-point-two-five minute access offset — four-point-two-five
> minutes in total. The parts add up to the number on screen, and an independent test
> recomputes it with a plain Dijkstra and asserts the two agree to a thousandth of a minute.
> Each severance carries a reason code from the mutation ledger. Where the ledger has no row,
> it says *cause not recorded* rather than inventing one."

**Why this scores:** "Show the path behind an answer" is on the brief verbatim.

---

## BEAT 7 · 2:55–3:20 — Not a fixture

**Clicks:** `#recompute-live-btn`. Let the elapsed time show. Wait for it to settle.

> "And this is not a cached JSON file pretending to be a database.
> This button throws away the precomputed answer and runs the sweep live against FalkorDB.
> Every scenario clones the base graph with `GRAPH.COPY` into its own branch, mutates the
> copy, evaluates it, then deletes it — so the base graph is never touched.
> That is a hundred and eighty-two ordered cases across fourteen corridors, and a test
> asserts the live numbers come out identical to the precomputed ones."

**On screen:** three graphs do the work — `keystone_world` (immutable base),
`keystone_branch_{run}_{case}` (per-scenario clones), `keystone_memory` (audit ledger).

**Why this scores:** Rule 3 says that if the product still works once FalkorDB is removed,
the graph is decoration. This beat is your direct answer. Branch-per-scenario is also what
FalkorDB is specifically good at, so name `GRAPH.COPY` explicitly.

**Fallback:** if the recompute stalls past ~30 s, let it finish in silence or cut here. Never
narrate over a spinner.

---

## BEAT 8 · 3:20–3:55 — The honest part

**Clicks:** `#toggle-policy-table`, then scroll to `#null-result-panel`.

> "Now the part most demos skip.
> Keystone evaluates all one hundred and eighty-two ordered failure pairs. At our
> pre-registered six-point-eight kilometre threshold, **zero** of them are genuine two-failure
> interactions. A hundred and four are explained by the first failure alone, forty-eight by
> the second, and thirty are unstressed.
> So on this fixture, at this threshold, pre-mortem conditioning does **not** beat acting
> reactively. We fixed that threshold before we ran anything, and we did not move it when we
> saw the result.
> And in the policy table, Policy C does not dominate Policy B here. We report that rather
> than hiding it."

**On screen:** exposed second failures out of 182 — **Policy A 13/182, Policy B 13/182,
Policy C 7/182**. Read them off the screen.

**Why this scores:** a judge who has watched twenty demos has heard twenty products that only
win. Volunteering your weakest result is the most credible thirty seconds available to you,
and it costs nothing, because the engineering is the point.

---

## BEAT 9 · 3:55–4:20 — Abstention, and a decision written to the graph

**Clicks:** select `road_ring_kashmere_monastery`. Scroll to `#decision-action-block`. Click
`#reject-action-btn`. Fill `#rationale-input`, then confirm.

Rationale to type:

```
Verified unresolvable secondary contingency risk across 13 failure branches; logged concurrence.
```

> "When no candidate action keeps every critical facility inside its deadline, Keystone
> refuses to recommend one. **Abstain — no robust plan**, with a machine-readable reason code,
> `NO_PLAN_PRESERVES_ALL_CRITICAL_REQUIREMENTS`, and the cases that stay exposed.
> Approve is disabled — and it is disabled on all fourteen corridors, because at this
> threshold no action saves everyone anywhere on this network. A tool that always has an
> answer is a tool you cannot trust.
> What the commander *can* do is record the decision with a rationale, and that goes back into
> FalkorDB — into `keystone_memory`, alongside the run and the mutation ledger. The audit
> trail lives in the graph too."

**Why this scores:** "Remember across sessions" and "connect people, projects and decisions"
are both on the brief. Here the graph is being written to, not only read.

**Fallback:** if the modal will not close, `#decision-cancel-btn`, then confirm
`:8000/api/health` is green.

---

## BEAT 10 · 4:20–4:40 — Proof on one page, then close

**Clicks:** `#provenance-badge` to open `/method`. Scroll once, slowly.

> "Everything I just claimed is on one page: data provenance, the frozen configuration, all
> three denominators, the full threshold sweep, and the limits — no probabilities, no
> forecasting, no claim of real-world validation.
> Ninety-seven backend tests, ninety-six browser tests, and the repository carries the graph
> model, the Cypher the product depends on, and a clean-clone setup guide.
> Keystone. Find what breaks before it breaks you."

---

## Things never to say

| Never | Why | Say instead |
|---|---|---|
| "predict" / "forecast" | Keystone evaluates counterfactuals; it forecasts nothing. | "evaluate", "explore counterfactual branches" |
| "probability" / "risk score" | Deterministic SLA thresholds, not floats. | "SLA margin", "critical access boundary" |
| "real-time" | Implies live telemetry. There is none. | "precomputed", "no loading step" |
| "sub-10 milliseconds" | **Unsupported.** Measured: fetch 235–280 ms, `GRAPH.COPY` 114–286 ms, frame p95 17.8 ms. | "precomputed and digest-validated, so there is no loading step" |
| "Policy C has zero breaches" | **False on every corridor.** The minimum anywhere is 5. | "Policy C, 7 of 182 exposed — and it abstains here" |
| "novel" / "first" | Unverifiable. | "graph-native", "branch-isolated" |
| "validated" | No external emergency validation exists. | "asserted by the verification battery" |

---

## Delivery notes

- **Pause 400 ms before each click**, so the viewer's eye arrives before the change does.
- **Let the cascade animation finish** — 420 ms plus stagger, and it is the one animation
  carrying the argument.
- **Say the zero out loud twice:** zero interaction-only cases, and zero feeders on Delhi Gate
  Connector. Both are you volunteering a weakness, and both are why you are believable.
- **Name `GRAPH.COPY` and "tool selection trace" explicitly.** Those are the two phrases a
  Track 01 judge is listening for.
- If a take goes wrong, re-record the beat. Never cut between states in a way that implies a
  result the system did not produce.

---

## Beat → Track 01 criteria

| Track 01 focus | Beat |
|---|---|
| Multi-hop reasoning | 3, 6 |
| Graph queries and algorithms as agent tools | 5 |
| Tool selection through MCP | 5 |
| Actions based on what the graph shows | 4, 9 |
| Explainable results | 5, 6, 8, 10 |
| Rule 3 — the graph does real work | 7 |
| Remember across sessions | 9 |
