# Graph Hacks — Submission Answers (copy-paste)

Verified against the live system on 2026-10-17 at commit `71acbec`.
Every figure here is measured, not estimated.

---

## 1. Project title

```
KEYSTONE Pre-Mortem
```

---

## 2. Description — what problem does it solve, and who is it for?

```
Incident commanders can tell you what is broken right now. Almost none of them can tell
you what breaks NEXT, while the first failure is still unresolved — and that is when the
decisions that cost lives get made.

KEYSTONE is a pre-mortem decision agent for urban infrastructure. Given one observed
failure, it evaluates every possible second failure against the same network and reports
which critical facilities fall outside their response deadline, which mitigating action
survives the widest range of second failures, and — crucially — when no action is
defensible at all.

The question is unanswerable without a graph, because the failure does not stay in its
own layer. A flooded road corridor also carries a power feeder; that feeder powers a
telecom tower; that tower reaches the relay covering a trauma centre. Cutting one road
can take a hospital off the emergency alert network, three hops away in a different
domain. KEYSTONE models roads, power and telecom as one graph in FalkorDB and traverses
across all three.

It is built for emergency operations centres, utility and telecom network planners, and
any team doing N-1 contingency work — the B2B equivalent of a flight simulator for
infrastructure failure.

The result it is proudest of is a negative one. Across all 182 ordered failure pairs, at
a threshold fixed before any measurement, ZERO are genuine two-failure interactions:
104 are explained by the first failure alone, 48 by the second, 30 are unstressed. We
published that rather than moving the threshold, and the deck shows it on the main path.
KEYSTONE also abstains outright when no candidate action keeps every critical facility
inside its deadline, with a machine-readable reason code instead of a confident guess.
```

---

## 3. Track

```
Track 01 — Agents That Act on Connected Data
```

---

## 4. Repository

```
https://github.com/devprashant19/Keystone
```

> **BLOCKER — this repository is currently PRIVATE.** An unauthenticated request returns
> 404. Rule 10 requires a public source-code repository. Change it in
> Settings → General → Danger Zone → Change visibility → Public **before** submitting.

---

## 5. Demo video

```
<paste your YouTube link here — public or unlisted>
```

Film with [`DEMO_SCRIPT.md`](DEMO_SCRIPT.md); pre-flight in [`RECORDING.md`](RECORDING.md).

---

## 6. Live demo or deployment (optional field)

```
<your Vercel URL, or leave blank>
```

Rule 10 accepts "a live deployment, **or** complete local setup instructions if it cannot
be deployed." README §12 is a clean-clone reproduction guide, so leaving this blank is
compliant. Do not risk the submission on a last-minute deploy.

---

## 7. How did you use FalkorDB? — what technical problems you solved

```
FalkorDB is the execution engine, not a store behind the product. Remove it and there is
no product: every counterfactual is a real graph, and the evaluator only ever reads a
graph.

1. GRAPH.COPY as the counterfactual primitive.
The core operation is "what if THIS also failed?" — asked 182 times (14 primary corridors
x 13 remaining second failures). Each case clones the immutable base graph into its own
branch with GRAPH.COPY, mutates the clone (severing arcs, dropping feeders, darkening
towers), evaluates it, and deletes it in a finally block. The base graph is never written
to during a sweep. This is the single feature that made the design possible: in a
relational schema the equivalent is a transaction-per-scenario against shared tables, or
182 full copies. We measured GRAPH.COPY at 114-286 ms on this graph.

2. Multigraph topology as isolation.
One instance holds keystone_world (immutable base, protected by a SHA-256 content digest
guard), keystone_branch_{run}_{case} (disposable per-scenario clones), and keystone_memory
(append-only audit ledger of runs, mutation ledgers and commander decisions). No separate
deployments, no namespace collisions, and branch cleanup is a GRAPH.DELETE.

3. Cross-layer traversal is the actual question.
Road, power and telecom are one graph joined by ROAD_ARC -> carrier_corridor_id ->
FEEDS_TOWER -> ALERT_ARC -> COVERS. "Which hospitals lose alert coverage if this road
floods?" is one traversal across four relationship types and three hops. Alert
reachability is a bounded directed pattern, MATCH (s:Tower {is_command_source: true}),
(r:RelayContact {is_required_target: true}) WHERE (s)-[:ALERT_ARC*0..12]->(r) — bounded
deliberately, because an unbounded match on a cyclic mesh is a different question than
the one we are asking.

4. Graph algorithms as typed agent tools.
The agent has five Pydantic-typed tools — get_corridor_inventory, evaluate_contingency,
inspect_causal_chain, check_system_health, record_commander_decision — each a graph
operation, also exposed over MCP so an external agent can call the same operations. The
UI shows a TOOL SELECTION TRACE for every answer: which tool was chosen and with what
arguments. Answers carry a GROUNDED (DETERMINISTIC) badge, and if any figure in a
sentence cannot be traced to a tool result the agent refuses to narrate rather than
writing around the gap.

5. Decisions are written back to the graph.
A commander's decision and rationale are appended to keystone_memory alongside the run
and its mutation ledger, so the audit trail lives in the same graph as the analysis.

Honest note on shortest paths: weighted response times are computed with an
application-side Dijkstra over a topology fetched from FalkorDB, because each scenario
needs per-branch edge mutation and a custom cost model. We cross-check that
implementation against FalkorDB's own algo.SPpaths in the test battery and assert the
two agree, so the choice is a deliberate one rather than an avoidance.

Verification: 97 backend tests and 96 browser tests, including ablations that remove
relation context (the evaluator must abstain, not guess) and that recompute response
times independently with a plain stdlib Dijkstra to within 0.001 minutes.
```

---

## 8. Blog link (optional)

```
<leave blank unless you have one>
```

---

## 9. What did you like about FalkorDB?

```
GRAPH.COPY changed the architecture. Branch-per-scenario is the natural way to express a
counterfactual, and having it as a single server-side command meant the orchestrator is a
copy, a mutate, an evaluate and a delete — rather than a transaction-isolation problem.
I do not think I would have attempted exhaustive conditional N-1 analysis without it.

Holding many isolated graphs in one instance removed an entire class of operational work.
A pristine world, a disposable branch per case, and an append-only audit ledger all live
in the same instance with no extra deployments, and branch teardown is one command.

Traversals were fast enough to sit inside the loop rather than beside it, which is what
let the same evaluator serve the precomputed path and the live recompute and still produce
identical numbers — the property the whole credibility of the demo rests on.

Running it from a digest-pinned Docker image made the whole thing reproducible, which
mattered because every published number is stamped with the config hash and content
digest it was produced under.
```

---

## 10. What improvements would you like to see?

```
1. GRAPH.COPY latency dominates small-graph workloads. On a 60-node, 100-edge graph I
measured 114-286 ms per copy. For a 182-case sweep that is the single largest cost, and it
is clearly not proportional to the data. A fast path for small graphs, or copy-on-write
branching, would change what is feasible inside an agent loop.

2. A native content digest or graph version. I needed to know whether a precomputed result
was still valid for the current world, and ended up hashing an ordered projection of nodes
and edges myself and stamping it on every result. A server-side monotonic version or
content hash per graph would be more reliable than anything built in application code.

3. TTL or auto-expiry for ephemeral graphs. Branches are disposable by design, but every
code path that creates one needs a finally block, and a crashed process leaves orphans
behind. Being able to create a graph with a TTL would make the branch pattern safe by
default rather than safe by discipline.

4. Per-graph observability. With hundreds of short-lived graphs in one instance, I could
not easily answer "which graphs exist, how large, how old" without listing and inspecting
them. Per-graph size, age and query counts would make the multigraph pattern much easier
to operate.

5. Clearer guidance on when to use algo.* versus application-side traversal. I ended up
cross-checking my Dijkstra against algo.SPpaths to convince myself the choice was sound.
A note on cost models, mutation interaction and when each is appropriate would have saved
a day.
```

---

## Rule 10 checklist

| Required | Status |
|---|---|
| Public source-code repository | **PRIVATE — must be flipped to public** |
| README with setup instructions and graph data model | Done — §4 Graph Model & Schema, §12 Clean-Clone Reproduction |
| The Cypher queries / graph algorithms the product depends on | Done — §5 Production Cypher Queries (Q1–Q3) |
| Demo video showing the working project | **Not yet recorded** — use DEMO_SCRIPT.md |
| Live deployment, or complete local setup instructions | Done — §12 satisfies this; Vercel optional |
| The track you are entering | Track 01 |
| Rule 11 AI-assistant disclosure | Done — §14 and AI_DISCLOSURE.md |
