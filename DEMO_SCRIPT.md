# KEYSTONE — Demo Script

**4:40 · 1440×900 · light theme · record immediately after a fresh seed.**
Every figure below was measured on the live system. If the screen disagrees, say the screen.

---

## PRE-ROLL (before you press record)

```
1. python scripts/seed_demo.py                 -> wait for DEMO READY
2. Open the Copilot and ask these three ONCE (warms them, ~5s):
      List all corridors in the inventory
      What fails if monastery_chandgiram floods?
      Inspect the causal chain for monastery_chandgiram
   Each must show GROUNDED (DETERMINISTIC). Then reload.
3. API on :8000, web on :5173
4. Hard-reload. No "results stale" banner, no "DATABASE UNAVAILABLE"
5. 1440x900 exactly. Tabs closed, bookmarks hidden, notifications off
6. Land on the landing page. Mouse still.
```

---

## BEAT 1 · 0:00–0:20 · Landing page

**DO:** Nothing. Let the three counters settle. Do not move the mouse.

**SAY:**
> "Every operations team has the same question, and almost nobody can answer it quickly:
> what breaks if this goes down? Not what is broken now — what breaks **next**, and what
> should we do about it **before** it happens.
> This is Keystone. It answers that question on a graph."

**CHECK:** Counters read **14 corridors · 182 cases · 60/100 topology**, live from
`/api/world/summary`. Provenance strip at the bottom names the MIT licence and labels the
synthetic layers.

---

## BEAT 2 · 0:20–0:45 · Click BREAK SOMETHING → Command Deck

**DO:** Click `BREAK SOMETHING`. Let the deck populate. Pause two seconds.

**SAY:**
> "This is a real Delhi arterial network — fourteen corridors, thirteen junctions, ten
> critical facilities, from an open dataset. The power and telecom layers on top are
> synthetic, and labelled as such everywhere you'll see them.
> One click, and we already have a complete analysis. Thirteen second-failure cases
> evaluated. No loading screen, because all fourteen corridor sweeps are precomputed and
> validated against this exact graph digest. I'll come back and recompute one live."

**CHECK:** `CASES: 13 / 13 ✓ 100% COMPLETE` · `BREACH 7` · `DEGRADED 6` · `INTERACTION 0`.
Hero reads **2 / 9 critical facilities outside SLA**. The first case is auto-selected, so
the blast radius shows f1 **and** f2: `2 / 14 corridors`, `2 / 7 feeders`.

---

## BEAT 3 · 0:45–1:15 · Schematic Topology — the multi-hop

**DO:** Click **Schematic Topology**. Hover one vertical connector. Trace the chain slowly
with the cursor: road → feeder → tower → relay → facility.

**SAY:**
> "Here's why this is a graph problem. Three layers — roads, power feeders, telecom.
> Watch the vertical connectors. This road corridor **carries** a power feeder. That feeder
> powers a tower. That tower reaches the relay covering Sushruta Trauma Centre.
> So cutting one road doesn't just block an ambulance. It can take a hospital off the
> emergency alert network. That chain is four relationship types and four hops. It's one
> traversal in FalkorDB, and it's a nightmare in a relational schema."

**CHECK:** Three bands visible, vertical connectors between them.

---

## BEAT 4 · 1:15–1:50 · Blast radius, and the honest zero

**DO:** Back to **Geographic Map**. Click `Layer 1 · Road Arteries`, then
`Layer 2 · Power Feeders`, then `Layer 3 · Alert & Telecom`. Then select
**Delhi Gate Connector** from the corridor dropdown.

**SAY (on the three layers):**
> "The blast radius walks all three layers. Two of fourteen road arteries severed. Two of
> seven feeders dark — Chandrawal and Connaught Place, named. Two of eight towers
> unpowered, two of twelve relays isolated. Every entity named, nothing aggregated away."

**SAY (after selecting Delhi Gate Connector):**
> "Now watch this one. This corridor carries no power feeder at all. So Keystone says
> **zero feeders dark** — not 'about one', not a plausible-looking guess. Seven of the
> fourteen corridors are like this, and on every one of them it reports zero."

**CHECK:** Power band reads `0 / 7 feeders dark` with "no feeder carried on this corridor".

---

## BEAT 5 · 1:50–2:35 · The Copilot — tool selection ⭐ THE TRACK 01 BEAT

**DO:** Click `Copilot`. Ask each question, pausing on each trace before the next.

| Type exactly | Trace shows |
|---|---|
| `List all corridors in the inventory` | `get_corridor_inventory()` |
| `What fails if monastery_chandgiram floods?` | `evaluate_contingency(f1_corridor_id=road_ring_monastery_chandgiram)` |
| `Inspect the causal chain for monastery_chandgiram` | `inspect_causal_chain(f1_corridor_id=…, f2_corridor_id=…)` |

**SAY:**
> "Keystone also has a copilot, and this is the part I care most about.
> Three questions in plain language. Watch the **tool selection trace**.
> First, it picks `get_corridor_inventory`. Second, `evaluate_contingency` — and it resolves
> 'monastery_chandgiram' to the real corridor id. Third, `inspect_causal_chain`, and it
> chooses the second failure itself.
> Same agent, three different graph tools, selected from intent. And every answer carries
> **GROUNDED, DETERMINISTIC**. That badge means every number in the sentence came back from
> a typed tool call against FalkorDB. If a figure weren't traceable to a tool result, it
> would say *narration unavailable* rather than write a sentence around it.
> Five of these tools, also exposed over MCP, so an external agent can call the same
> operations. And look at the header — that's the live branch, a `GRAPH.COPY` clone of the
> base graph, named on screen."

**CHECK:** `TOOL SELECTION TRACE:` chip per call · `GROUNDED (DETERMINISTIC)` ·
`CITATIONS & IDENTIFIERS` · branch `keystone_branch_golden_demo_…` in the header.

**IF a badge says NARRATION UNAVAILABLE:** move to the next question. Don't explain it.

---

## BEAT 6 · 2:35–3:00 · Evidence — every number drills to the graph

**DO:** Click `Inspect Proof` / `Open Evidence`. Scroll the dependency chain. Point at the
arithmetic. Return to the deck.

**SAY:**
> "Nothing here is a black box. Every number drills to the graph entities behind it.
> L.N.J.P. Hospital: three minutes dispatch, zero kilometres of road because the depot sits
> on that junction, plus a one-point-two-five minute access offset — four-point-two-five
> minutes total. The parts add up to the number on screen, and a test recomputes it with a
> plain Dijkstra and asserts they agree to a thousandth of a minute.
> Each severance carries a reason code from the mutation ledger. Where the ledger has no
> row, it says *cause not recorded* rather than inventing one."

---

## BEAT 7 · 3:00–3:25 · Recompute live — not a fixture

**DO:** Click `RECOMPUTE LIVE`. Let the elapsed time appear. Wait for it to settle.

**SAY:**
> "And this isn't a cached JSON file pretending to be a database.
> This throws away the precomputed answer and runs the sweep live against FalkorDB. Every
> scenario clones the base graph with `GRAPH.COPY` into its own branch, mutates the clone,
> evaluates it, then deletes it — the base graph is never touched.
> Three graphs do the work: `keystone_world`, the immutable base; a disposable
> `keystone_branch` per case; and `keystone_memory`, the audit ledger. A hundred and
> eighty-two ordered cases, and a test asserts the live numbers come out identical to the
> precomputed ones."

**IF it stalls past ~30s:** stop talking, let it finish, or cut here.

---

## BEAT 8 · 3:25–4:00 · The honest part

**DO:** Open the policy comparison. Scroll to the null-result panel.

**SAY:**
> "Now the part most demos skip.
> Keystone evaluates all one hundred and eighty-two ordered failure pairs. At our
> pre-registered six-point-eight kilometre threshold, **zero** of them are genuine
> two-failure interactions. A hundred and four are explained by the first failure alone,
> forty-eight by the second, thirty are unstressed.
> So on this fixture, at this threshold, pre-mortem conditioning does **not** beat acting
> reactively. We fixed that threshold before we ran anything, and we didn't move it when we
> saw the result.
> And in the policy table — Policy C doesn't dominate Policy B here. We report that rather
> than hiding it."

**CHECK:** Exposed second failures out of 182 — **A 13/182 · B 13/182 · C 7/182**. Read
them off the screen.

---

## BEAT 9 · 4:00–4:25 · Abstention, and writing back to the graph

**DO:** Select `Mahatma Gandhi Ring Road (Kashmere Gate to Monastery)`. Scroll to the
decision block. Click `REJECT PLAN`. Type the rationale. Confirm.

Rationale:
```
Verified unresolvable secondary contingency risk across 13 failure branches; logged concurrence.
```

**SAY:**
> "When no candidate action keeps every critical facility inside its deadline, Keystone
> refuses to recommend one. **Abstain — no robust plan**, with a machine-readable reason
> code: `NO_PLAN_PRESERVES_ALL_CRITICAL_REQUIREMENTS`, and the cases that stay exposed.
> Approve is disabled — and it's disabled on all fourteen corridors, because at this
> threshold no action saves everyone anywhere on this network. A tool that always has an
> answer is a tool you can't trust.
> What the commander *can* do is record the decision with a rationale, and that goes back
> into FalkorDB — into `keystone_memory`, beside the run and its mutation ledger. The audit
> trail lives in the graph too."

---

## BEAT 10 · 4:25–4:40 · Method page, and close

**DO:** Click the provenance badge to open `/method`. Scroll once, slowly.

**SAY:**
> "Everything I've claimed is on one page: data provenance, the frozen configuration, all
> three denominators, the full threshold sweep, and the limits — no probabilities, no
> forecasting, no claim of real-world validation.
> Ninety-seven backend tests, ninety-six browser tests. The repo has the graph model, the
> Cypher the product depends on, and a clean-clone setup guide.
> Keystone. Find what breaks before it breaks you."

---

## NEVER SAY

| Never | Say instead |
|---|---|
| "predict" / "forecast" | "evaluate", "explore counterfactual branches" |
| "probability" / "risk score" | "SLA margin", "critical access boundary" |
| "real-time" | "precomputed", "no loading step" |
| "sub-10 milliseconds" | "precomputed and digest-validated, so there's no loading step" |
| "Policy C has zero breaches" | "Policy C, 7 of 182 exposed — and it abstains here" |
| "novel" / "first" | "graph-native", "branch-isolated" |
| "validated" | "asserted by the verification battery" |

---

## DELIVERY

- Pause 400 ms before every click. The viewer's eye has to arrive first.
- Let the cascade animation finish — 420 ms plus stagger. It carries the argument.
- Say the zero out loud **twice**: zero interaction-only cases, and zero feeders on Delhi
  Gate Connector. Both are you volunteering a weakness. Both are why you're believable.
- Name **`GRAPH.COPY`** and **"tool selection trace"** explicitly. Those two phrases are
  what a FalkorDB Track 01 judge is listening for.
- Botched take: re-record the beat. Never cut between states in a way that implies a
  result the system didn't produce.
