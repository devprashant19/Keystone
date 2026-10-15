# AI_DISCLOSURE.md — Rule 11 Compliance Disclosure
**Project**: Jaal Pre-Mortem  
**Hackathon**: Graph Hacks: Context for AI Agents (WeMakeDevs × FalkorDB)  
**Track**: Track 01 — Agents That Act on Connected Data  

---

## 1. Disclosure of AI Assistant Usage
In compliance with Hackathon Rule 11:
- An AI coding assistant (Google Antigravity / Gemini) was utilized during the development of Jaal Pre-Mortem for drafting boilerplate tests, executing diagnostic checks, and code navigation.
- All system architectures, Cypher queries, graph schemas, and benchmark protocols were designed and verified under human direction and pre-authorized planning specifications.

---

## 2. Technical Comprehension and Defense (Rule 12 & 13)
The participant thoroughly understands and can technically defend:
1. **The Graph Data Model**:
   - `Intersection`, `ROAD_ARC` (paired directed arcs sharing `corridor_id`), `Facility`, `Depot`, `Responder`.
   - The coupled cross-layer dependency chain: `PowerFeeder` carrying power along road corridors -> `FEEDS_TOWER` -> `Tower` -> `ALERT_ARC` -> `RelayContact` -> `COVERS` -> `Facility`.
2. **Branching & Scenario Isolation**:
   - Usage of native `GRAPH.COPY` to create ephemeral counterfactual branches (`jaal_branch_*`) for evaluating candidate corridor failures.
   - Deterministic cleanup using `Graph.delete()` with pre- and post-run SHA-256 graph digest assertions ensuring world immutability.
3. **The Shared Evaluator & Three Policies**:
   - Single shared evaluation function calculating access deadlines via Dijkstra and alert delivery over bounded directed walks.
   - Three-way case decomposition (`f1`-alone, `f2`-alone, and interaction-only).
   - Lexicographical objective function and first-class abstention mechanics.
