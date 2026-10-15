# Jaal Pre-Mortem: Graph-Native Incident Decision Assistant
**Hackathon**: Graph Hacks: Context for AI Agents (WeMakeDevs × FalkorDB)  
**Track**: Track 01 — Agents That Act on Connected Data  

---

## 1. Project Overview
When an initial arterial road corridor in Delhi is observed severed, Jaal Pre-Mortem isolates counterfactual scenarios on ephemeral FalkorDB graph branches to evaluate all remaining candidate corridor failures in parallel. 

It evaluates cross-layer cascades spanning arterial corridors, power feeders, communication towers, and alert relays. Using a single deterministic evaluator, Jaal compares reactive no-action, static network heuristics, and conditional N-1 pre-mortem evaluation. Crucially, when no single action guarantees zero critical SLA violations across all potential second failures, Jaal explicitly **abstains** rather than guessing.

---

## 2. Pinned Engine & Stack
- **Database**: FalkorDB `6.0.2` (`falkordb/falkordb@sha256:107455e862a824e45e8e9f5a7fbfdf5e00a08b14e13eae2577c72fd9e3f59ba6`)
- **Python**: 3.12 via `uv`
- **Driver**: `falkordb==1.7.1`
- **Backend**: FastAPI + Uvicorn
- **Frontend**: Vite + React + TypeScript (Plain Canvas/SVG)
- **Deployment**: Local all-in-one workstation (`127.0.0.1`)

---

## 3. Verified Graph Data Model
- **`(:Intersection)`**: 13 strategic North-Central Delhi arterial junctions.
- **`(:Intersection)-[:ROAD_ARC]->(:Intersection)`**: 28 directed arcs (14 pairs sharing `corridor_id`).
- **`(:Facility)`**: 10 critical facilities with `[:ACCESS_VIA]` snapping to road intersections.
- **`(:HazardZone)`**: 6 historical Yamuna riverine flood breach polygons (July 2023).
- **`(:Depot)` & `(:Responder)`**: 2 emergency depots and 2 stationed ambulances.
- **`(:PowerFeeder)`**: Grid feeders carried by road corridors.
- **`(:Tower)` & `(:RelayContact)`**: Telecom towers linked via `[:ALERT_ARC]` and covering critical facilities via `[:COVERS]`.
