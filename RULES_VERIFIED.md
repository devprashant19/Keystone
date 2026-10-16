# Graph Hacks — Official Rules Verification
**Project**: Jaal Pre-Mortem  
**Hackathon**: Graph Hacks: Context for AI Agents (WeMakeDevs × FalkorDB)  
**Track**: Track 01 — Agents That Act on Connected Data  
**Team**: `codeXHW9QQ` ("Parser") — Solo Entry (1 of 4 seats)  
**Verified on:** 2026-10-16 (Kickoff & Submission Window Review)  

---

## 1. Submission Schedule & Administrative Facts

- **Official Window:** Submissions **OPEN 17 Oct 2026 01:03 IST** and **CLOSE 18 Oct 2026 23:59 IST**.
- **Team Immutability:** Once submitted, team composition cannot be altered in the portal.
- **Team Size:** Team `codeXHW9QQ` is registered as a solo participant (1 of 4 allowed seats utilized).
- **Submission Buffer Policy:** Submissions will be finalized well before the 23:59 IST deadline to prevent portal congestion or last-minute verification issues.

---

## 2. Requirement-by-Requirement Verification

### Rule 2 & Rule 3: FalkorDB Primary & Central Requirement — VERIFIED

- **Rule 2:** *"FalkorDB must be the primary graph database"* and support a central component of the product.
- **Rule 3 (Strict Reading):** **Official Rule 3 literally states that if the product still works once FalkorDB is removed, the graph is decoration.**
  *(Correction Note: An earlier planning note categorized this as a paraphrase. That was incorrect; the official text explicitly establishes that if removing FalkorDB leaves the product fully operational, the graph serves merely as decorative UI).*
- **Jaal Compliance Proof (AB-02):**
  - Jaal strictly satisfies this requirement. Removing FalkorDB immediately terminates the core decision loop:
    1. Ephemeral branch isolation (`GRAPH.COPY`) fails, preventing secondary failure simulation.
    2. Cross-layer dependency queries (`PowerFeeder -> FEEDS_TOWER -> ALERT_ARC -> RelayContact -> COVERS -> Facility`) cannot execute.
    3. The shared multi-criteria evaluator cannot compute road Dijkstra and alert walks.
    4. The system raises `AB-02` / `503 Service Unavailable`, disabling all commander decisions.

### Rule 6 & Rule 9: Data Provenance & Allowable Data — VERIFIED

- Projects must use data they are allowed to use: *"public, synthetic, or your own."* No private, login-protected, or restricted data.
- **Jaal Compliance Proof:**
  - Real-world arterial road coordinates derived from public OpenStreetMap Delhi data.
  - July 2023 Yamuna River flood hazard polygons derived from Delhi flood records.
  - Power grid and alert microwave layers are explicitly synthetic benchmarks, clearly disclosed across UI and code with zero mock data.

### Rule 8: Kickoff & Fresh Work Requirement — VERIFIED

- *"The main coding and design work must begin after the hackathon starts."*
- **Jaal Compliance Proof:**
  - All application code, FastAPI endpoints, agent controllers, and React UI components were developed inside the official competition window.

### Rule 10: Mandatory Deliverables — VERIFIED

- Public source-code repository with complete local setup instructions.
- README detailing the graph data model, Cypher traversals, and architecture.
- Working local Docker Compose reproduction path.

### Rule 11, 12, 13: AI Assistant Disclosure & Technical Comprehension — VERIFIED

- AI assistant usage disclosed in [`AI_DISCLOSURE.md`](AI_DISCLOSURE.md) and [`README.md`](README.md).
- Zero hallucination policy: Every metric, entity ID, and claim is verified against running FalkorDB instances.

---

## 3. Summary of Corrections to Earlier Notes

| Topic | Earlier Planning Note | Verified Official Fact & Correction |
|---|---|---|
| Rule 3 text | "Removing FalkorDB must not leave the same product working" was called a paraphrase | **Correction:** It is the literal, official Rule 3 standard. The build satisfies the stricter reading via AB-02 abstention and branch isolation. |
| Video duration | Assumed 3–5 minute strict rule | Portal indicates recommended demo; internal 90-second one-take capture satisfies local and presentation needs. |
| Scoring rubrics | Speculated on numeric point breakdowns | No unannounced numeric rubric used; evaluation is grounded against Track 01 criteria. |
| Submissions open | Kickoff assumed to open submissions immediately | Submissions open **17 Oct 2026 01:03 IST** and close **18 Oct 23:59 IST**. |
