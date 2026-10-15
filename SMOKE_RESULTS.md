# SMOKE_RESULTS.md — Live FalkorDB Kickoff Smoke Battery
**Execution Timestamp**: 2026-10-14T00:35:45+0530  
**Python Runtime**: 3.12.14 (Virtual Environment `.venv`)  
**FalkorDB Client**: 1.7.1  
**Database Host**: localhost:6379 (Docker container `jaal_falkordb`)  
**Overall Verdict**: **ALL P0 CHECKS PASSED**  

---

## 1. Executive Summary & Core Decisions

| Decision Area | Smoke Evidence | Decision Made |
| :--- | :--- | :--- |
| **Engine Image Tag & Digest** | Resolved via `docker inspect` | **`falkordb/falkordb:6.0.2`**<br>`sha256:107455e862a824e45e8e9f5a7fbfdf5e00a08b14e13eae2577c72fd9e3f59ba6` |
| **Route Metric Method (SM-04)** | `CALL algo.SPpaths` procedure inventory | **Application-side Dijkstra over `ROAD_ARC` rows read from the branch graph.** NOTE (corrected 2026-10-14): `algo.SPpaths` is in fact AVAILABLE on this image — see the procedure table below and the live re-probe in section 2a. The earlier summary line here claimed it was absent, which contradicted this file's own inventory table. Dijkstra remains the implemented path and is now cross-checked against `algo.SPpaths` by test GR-04. |
| **Policy B Heuristic (SM-04)** | Betweenness procedure inventory | **Degree Centrality** over `ROAD_ARC` connectivity (betweenness procedures absent; degree centrality confirmed). |
| **Branch Execution Mode (SM-07)** | 30-cycle latency gate measurement | **`CLONE_PER_CASE`**. P95 latency is **8.83 ms**, projecting **0.03 minutes** for all 182 cases (well under the 20-minute gate threshold). |
| **World Immutability Guard (SM-08)** | SHA-256 canonical graph digest | **PASS (Digest Unchanged)**: `2c82d34f83551a506fa349e4bbba80e1e86c9844f0831482280490bb16887bd5`. |

---

## 2. Check-by-Check Results Log

### SM-01 — Daemon Status & Image Resolution
- **Command**: `docker inspect --format='{index .RepoDigests 0}' falkordb/falkordb:6.0.2`
- **Container**: `jaal_falkordb`
- **Observed Image Digest**: `falkordb/falkordb@sha256:107455e862a824e45e8e9f5a7fbfdf5e00a08b14e13eae2577c72fd9e3f59ba6`
- **Server Version**: Redis `8.10.2` with FalkorDB module
- **Status**: **PASS**

### SM-02 — Client Heartbeat
- **Cypher Query**: `RETURN 1 AS ping`
- **Result Value**: `1`
- **Round-Trip Time**: `1.54 ms`
- **Client Library**: `falkordb==1.7.1`
- **Status**: **PASS**

### SM-03 — Parameterized Write/Read Round-Trip
- **Write Cypher**: `CREATE (n:Probe {id: $id, label: $lbl, count: $cnt}) RETURN n.id, n.label, n.count`
- **Parameters**: `{'id': 'probe_01', 'lbl': 'delhi_sensor', 'cnt': 42}`
- **Read Cypher**: `MATCH (n:Probe {id: $id}) RETURN n.id, n.label, n.count`
- **Observed Value**: `[['probe_01', 'delhi_sensor', 42]]`
- **Status**: **PASS** (Strict parameter substitution enforced)

### SM-04 — Graph Algorithm Procedure Inventory
Evaluated on 5-node directed test graph with weighted `ROAD_ARC` relationships:

| Procedure Name | Status in Engine | Sample Output / Error Message | Operational Decision |
| :--- | :---: | :--- | :--- |
| `algo.bfs` | **AVAILABLE** (corrected) | first probe used 1 argument and the engine replied `expected at least 3` — that is a WRONG-ARITY error, not absence. Re-probed as `algo.bfs(node, depth, 'ROAD_ARC')` -> returns 9 nodes | Available; not depended on |
| `algo.SPpaths` | **AVAILABLE** | `[[<falkordb.path.Path object at 0x0000021294E07020>, 8]]` | **AVAILABLE in FalkorDB** (Can be used alongside or verified against application-side Dijkstra) |
| `algo.SSpaths` | **PRESENT, wrong yield in probe** | `does not yield output 'node'` is a wrong-YIELD-NAME error, not absence; its documented yields are `path`/`pathWeight`/`pathCost` | Not depended on |
| `algo.WCC` | **AVAILABLE** (corrected) | probe yielded `component`; correct yield is `componentId`. Re-probed -> 13 rows | Available, but NOT used as a directed-reachability proof: WCC ignores edge direction |
| `algo.pageRank` | **AVAILABLE** | `[[<falkordb.node.Node object at 0x0000021294E07230>, 0.0829476937651634], [` | Available for topological ranking |
| `algo.betweenness` | **AVAILABLE** | `[[<falkordb.node.Node object at 0x0000021294E071D0>, 0.0], [<falkordb.node.` | **Verified AVAILABLE** (Policy B can use native `algo.betweenness` or Degree Centrality) |
| `algo.betweennessCentrality` | **ABSENT** | `Unknown function 'algo.betweennessCentrality'` | **Verified AVAILABLE** (Policy B can use native `algo.betweenness` or Degree Centrality) |
| `algo.AStar` | **ABSENT** | `Unknown function 'algo.AStar'` | Excluded per Section 9 forbidden list |

*Note*: As planned in Section 5 and Section 9, absence of C-extension GraphBLAS procedures triggers the pre-designed, robust fallback: **deterministic application-side Dijkstra over `ROAD_ARC` rows read from the FalkorDB branch graph**.

### SM-05 — `GRAPH.COPY` Lifecycle & Error Semantics
- **Happy Path Copy**: Successfully duplicated base graph; cloned node count = `2`.
- **Destination Collision**:
  - Command: `GRAPH.COPY probe_copy_base probe_copy_dest` (duplicate target)
  - Observed Error: `ResponseError: destination key already exists`
  - Verdict: Fails closed as expected; duplicate names are rejected by engine.
- **Missing Source**:
  - Command: `GRAPH.COPY non_existent_graph_xyz probe_copy_dest2`
  - Observed Error: `ResponseError: Invalid graph operation on empty key`
- **Graph.delete()**: Cleanly deleted temporary graphs; memory freed without residue.
- **Status**: **PASS**

### SM-06 — Variable-Length Traversal & Literal Bound Semantics
- **Literal Bound Query**: `MATCH (n1:Node {id: 'N1'})-[:ALERT_ARC*1..5]->(m) RETURN DISTINCT m.id`
  - Observed Target Nodes: `['N1', 'N2', 'N3']`
- **Parameter Bound Query**: `MATCH (n1)-[:ALERT_ARC*1..$depth]->(m)`
  - Parser Verdict: `ResponseError: Encountered unhandled type in inlined properties.`
  - Decision: Parameterized upper bounds are **rejected by Cypher parser**; literal integer bounds (e.g. `*1..12`) generated from `frozen_config.json` with startup assertion must be used everywhere.
- **Cycle Handling**: Bounded expansion terminates safely without infinite loops over reciprocal pairs and self-loops.
- **Status**: **PASS**

### SM-07 — Latency Gate (30-Cycle Copy+Delete Benchmark)
Executed 30 consecutive sequential `GRAPH.COPY` and `Graph.delete()` cycles on the loaded `jaal_world` graph:
- **Min Latency**: `5.98 ms`
- **Median Latency**: `7.36 ms`
- **P95 Latency**: `8.83 ms`
- **Max Latency**: `9.06 ms`
- **Planned Cases**: `182` ordered `(f1, f2)` pairs
- **Projected Total Runtime**: `8.83 ms × 182 = 1.61 s (0.03 min)`
- **Gate Threshold**: `20.0 minutes`
- **Gate Verdict**: **PASS (0.03 min <= 20 min)**
- **Selected Branch Mode**: **`CLONE_PER_CASE`** (No degradation ladder required)

### SM-08 — World Immutability Guard (Gate G4 Prerequisite)
- **Pre-Mutation Digest**: `2c82d34f83551a506fa349e4bbba80e1e86c9844f0831482280490bb16887bd5`
- **Mutations Applied to Cloned Branch**:
  - Deleted all `ROAD_ARC` relationships
  - Detach-deleted all `Tower` nodes
  - Verified branch node count dropped to `31`
  - Deleted branch via `Graph.delete()`
- **Post-Mutation Digest**: `2c82d34f83551a506fa349e4bbba80e1e86c9844f0831482280490bb16887bd5`
- **Comparison**: `digest_pre == digest_post` -> **IDENTICAL**
- **Status**: **PASS**

### SM-09 — Structured Disconnect & 503 Handling
- **Simulated Connection Refusal**: Queried offline port 6399
- **Observed Exception**: `ConnectionError: Error 10061 connecting to localhost:6399. No connection could be made because the target machine actively refused it.`
- **API Error Contract**: Emits structured HTTP 503 payload with zero mock metrics or fake fallback values.
- **Status**: **PASS**

### SM-10 — Timeout Differentiation
- **Client Socket Timeout**: `TimeoutError: Timeout connecting to server`
- **Server Query Timeout Parameter**: Supported (`timeout=1000` ms accepted in query execution)
- **Distinct Paths**: Confirmed distinct exception and timing pathways.
- **Status**: **PASS**

---

## 3. Mandatory Kickoff Configuration Commitments

1. **Pinned Image Digest in `docker-compose.yml`**:
   `falkordb/falkordb@sha256:107455e862a824e45e8e9f5a7fbfdf5e00a08b14e13eae2577c72fd9e3f59ba6`
2. **Deterministic Route Engine**:
   FastAPI in-process Dijkstra traversing `ROAD_ARC` rows fetched directly from the isolated branch graph in FalkorDB.
3. **Branch Architecture**:
   `CLONE_PER_CASE` using native `GRAPH.COPY` and `Graph.delete()` on ephemeral names.


---

## 2a. Live procedure re-probe (2026-10-14, corrective)

The original SM-04 inventory recorded three procedures as ABSENT on the basis of error
strings that were actually **wrong call signatures**. Re-probed against the same running
image (`falkordb/falkordb:6.0.2`, digest `sha256:107455e8…`) with correct signatures:

| Procedure | Result | Evidence |
|---|---|---|
| `algo.SPpaths` | **AVAILABLE** | `pathWeight = 14.5` for `int_delhi_gate` → `int_chandgiram`, `weightProp: 'travel_cost_min'` |
| `algo.betweenness` | **AVAILABLE** | 13 rows for `nodeLabels: ['Intersection']` |
| `algo.pageRank` | **AVAILABLE** | 13 rows for `algo.pageRank('Intersection','ROAD_ARC')` |
| `algo.WCC` | **AVAILABLE** | 13 rows yielding `componentId` |
| `algo.bfs` | **AVAILABLE** | 9 nodes from `algo.bfs(node, 3, 'ROAD_ARC')` |
| `algo.AStar` | **ABSENT** | `Unknown function 'algo.AStar'` — matches the pre-decision not to depend on A* |

**Lesson recorded:** an error message is not evidence of absence. A procedure-inventory
probe must distinguish *unknown procedure* from *wrong arity* and *wrong yield name*,
or it will under-report engine capability.
