# Study Buddy (Actora fork — working name) — Product Roadmap & Backlog

**Status:** Strategy agreed, pre-development
**Parent product:** Actora (PhD data-collection artifact; not to be merged with this commercial fork)
**Last updated:** 2026-06-01

---

## 1. Strategic decisions

| # | Decision |
|---|----------|
| D1 | Build as a **fork of Actora**, not a rebuild. Reuse the core engine: dynamic→fixed ontology, artifact ingestion + summarisation, classification, concept linking, graph visualisation, grounded chat. |
| D2 | Treat the engine as a **horizontal platform** with three vertical products on top, shipped in sequence (D3). |
| D3 | **Sequence:** Phase 1 = research core (PhD / MSc-by-research) → Phase 2 = taught students (BSc / taught MSc), for reach/popularity → Phase 3 = QDA / NVivo-style coding features. |
| D4 | **Positioning:** not "another AI research tool." Lead on the two things incumbents lack — *dialectical* concept linking (similarity **and** tension) and **viva/exam prep**. |
| D5 | **Do not over-promise integrations.** Launch with Zotero + OpenAlex (clean, free APIs) + Obsidian export. Mendeley / Google Scholar are P2/optional only. |
| D6 | Phase 3 (QDA) is a **separate product line** sharing the engine, not a feature of Phase 1. Do not start it until Phase 1 has paying users. |
| D7 | **Phase 1 is single-user.** No library sharing or multi-user collaboration in Phase 1 or Phase 2. Re-evaluate when planning Phase 3 (which is also explicitly single-user — see Q-08 removal). |
| D8 | **Phase 2 product principle: support students, do not do their work for them.** Excludes essay-writing assistance, lecture-note auto-generation, and any feature that creates friction with academic-integrity policies. Phase 2 ships study aids, not academic-misconduct surface. |

### Watch-outs (track as risks, not backlog items)

| Risk ID | Risk | Mitigation |
|---------|------|------------|
| RK1 | **IP / ethics entanglement** — Actora is the PhD's data-collection instrument; commercialising a fork mid-PhD may conflict with university IP policy and ethics approval. | Confirm IP position with university tech-transfer office **before** building. Keep commercial fork's data separate from research data. |
| RK2 | **Unit economics** — heavy chat users can exceed subscription value (LLM inference dominates cost at scale). | Build prompt caching, batch ingestion, and cheap-model routing from day one (see FND-06). Usage caps on low tiers. |
| RK3 | **Scope dilution** — three buyers (researcher / student / QDA analyst) with different economics; risk of a thin product winning none. | Enforce the sequence in D3. Gate each phase on the prior phase's validation. |
| RK4 | **Phase 2 economics** — students are price-sensitive, seasonal, high-churn, with free competitors (NotebookLM, ChatGPT, Quizlet). | Treat as funnel/brand, not institutional-margin business (institutional access deliberately out of Phase 2 — see D8). |

---

## 2. Backlog conventions

- **ID prefixes:** `FND` = foundational/cross-cutting · `R` = Phase 1 research · `S` = Phase 2 students · `Q` = Phase 3 QDA · `C` = Commercial / GTM (section 8).
- **Priority:** `P0` = required to launch that phase · `P1` = important · `P2` = later / optional.
- **Status:** `Existing` = already in Actora · `Adapt` = exists, needs modification · `New` = build from scratch · `Inherited` = carried over from Actora via the fork (no new build).
- IDs are stable. When a row is removed during cleanup, its ID is retired (not reused) so prior references stay interpretable.
- Each row below is intended to map to one epic or story when imported into PM software.

---

## 3. Phase 0 — Foundational / cross-cutting

*Prerequisites for any commercial launch (the "unglamorous 80%"). Required before Phase 1 can be sold.*

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FND-01 | Multi-tenancy with strict per-tenant data isolation | P0 | New |
| FND-02 | Authentication & user management — SSO/OAuth + email/password fallback (vendor choice: see ADR-002, currently planned to reuse Clerk from Actora) | P0 | Inherited |
| FND-03 | Subscription billing with at least three tiers (free / individual / power) — billing-vendor choice tracked in ADR-003 | P0 | New |
| FND-04 | Usage metering and per-tier caps (papers/month, chat turns) | P0 | New |
| FND-05 | User onboarding flow + empty-state guidance | P0 | New |
| FND-06 | LLM-attributable cost per active user stays within a defined % of subscription revenue across all tiers — target & enforcement specified in ADR-006 (caching, batch ingestion, cheap-model routing are implementation levers, not requirements) | P0 | New |
| FND-07a | Error tracking on all services (Sentry, inherited from Actora) | P1 | Inherited |
| FND-07b | Per-tenant LLM cost monitoring with alerts when a tenant approaches their tier cap | P1 | New |
| FND-08 | **Per-tenant graph data isolation: no tenant can read another tenant's nodes/edges/properties, enforced at the storage layer** (vendor choice — self-hosted Neo4j vs AuraDB vs alternative — tracked in ADR-008) | P0 | New |
| ~~FND-09~~ | *Retired — vector-search implementation choice; covered functionally by R-C2 (similarity-based concept linking).* | — | — |
| FND-10 | Data export / account deletion (GDPR / UK compliance) | P0 | New |

---

## 4. Phase 1 — Research core (PhD / MSc-by-research)

*Closest to current Actora build. Goal: validate the engine with paying researchers. Single-user only (D7).*

### Epic R-A: Reference & source management
| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| R-A1 | Zotero integration (import library + citations) | P0 | New |
| R-A2 | OpenAlex integration (find/search papers) | P0 | New |
| R-A3 | Mendeley integration | P2 | New |
| R-A4 | Google Scholar discovery (no official API — best-effort) | P2 | New |
| R-A5 | Multiple libraries per user (a researcher can keep separate projects / topics isolated within one account) | P0 | New |
| R-A6 | Search & browse within a library — by title, author, concept, year | P0 | New |

### Epic R-B: Ingestion & enrichment
| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| R-B1 | Artifact (paper/PDF) upload | P0 | Existing |
| R-B2 | Automatic summarisation | P0 | Existing |
| R-B3 | Fixed research ontology (papers, authors, publications, concepts, studies) | P0 | Adapt |
| R-B4 | Classification of artifacts against the fixed ontology | P0 | Adapt |

### Epic R-C: Concept linking & graph (differentiator)
| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| R-C1 | Concept extraction from artifacts | P0 | Existing |
| R-C2 | Similarity-based linking between concepts | P0 | Existing |
| R-C3 | **Tension/contradiction linking between concepts** (key differentiator) | P0 | Adapt |
| R-C4 | Graph visualisation of artifacts & concepts | P0 | Existing |

### Epic R-D: Interaction & output
| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| R-D1 | Grounded chatbot over the user's library (cited to source) | P0 | Adapt |
| R-D2 | Obsidian export of notes | P0 | New |
| R-D3 | **Viva / exam-prep coach** — "examiner mode" Q&A on thesis + reading (acquisition wedge) | P0 | New |
| R-D4 | Notion export of notes (second export target alongside Obsidian, R-D2) | P2 | New |
| R-D5 | Machine-readable citation export (BibTeX, RIS) — richer integrations (Word, Google Docs) deferred to later phases | P0 | New |
| R-D6 | Human-readable citation styles in essays / prose (Harvard, APA, etc.) — used by both researchers (thesis prose) and students (Phase 2 essays); shared engineering surface with R-D5 | P1 | New |

---

## 5. Phase 2 — Taught students (BSc / traditional MSc)

*Goal: reach and popularity. Tilt from discovery toward comprehension & retention (aligns with the PhD's knowledge-retention thesis).*

**Scope guardrail (D8):** support students, don't do their work for them. No essay-writing assistance, no lecture-note auto-generation, no academic-misconduct surface. Institutional licensing deliberately out of Phase 2 — Phase 2 is a B2C reach/funnel play, not a B2B sale.

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| S-01 | Active-recall: auto-generate flashcards/quizzes from uploaded materials | P0 | New |
| S-02 | Spaced-repetition scheduling | P0 | New |
| S-03 | Mock exam / past-paper-style question generation | P1 | New |
| S-04 | Concept-map revision view (surface cross-module tensions) | P1 | Adapt |
| S-05 | Source-grounded explanations with "explain like a beginner" / jargon simplification | P0 | Adapt |
| ~~S-06~~ | *Retired — lecture capture → transcription → structured notes. Removed under D8 (note-taking is part of the learning).* | — | — |
| ~~S-07~~ | *Promoted to R-D6 (Phase 1) — human-readable citation styles are needed by both researchers and students; engineering surface is shared.* | — | — |
| ~~S-08~~ | *Retired — essay scaffolding. Removed under D8 (academic-misconduct surface).* | — | — |
| ~~S-09~~ | *Retired — institutional / cohort licensing. Removed under D8 (Phase 2 is B2C only).* | — | — |

---

## 6. Phase 3 — QDA / NVivo-style features

*Separate product line on the same engine. Different buyer (primary-qualitative researchers). Do not start until Phase 1 is validated. Engine fit is strong: coding ≈ classification against a codebook; code relationships ≈ linking; queries ≈ graph queries.*

**Scope guardrail:** Phase 3 is also single-user (D7). Team-coding workflows (multi-coder projects, inter-rater reliability) are out. Re-evaluate after Phase 3 has paying users.

### Table stakes (to be credible vs NVivo / ATLAS.ti / MAXQDA)
| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| Q-01 | Passage/segment-level coding (highlight text, assign code, retain exact passage) | P0 | New |
| Q-02 | User-editable, hierarchical codebooks with code definitions (mutable per-project ontology) | P0 | Adapt |
| Q-03 | Support multiple data types: transcripts, PDFs, audio/video, open-ended survey columns | P0 | New |
| Q-04 | Transcription (multi-language) | P1 | New |
| Q-05 | Query & cross-tabulation (matrix coding; theme frequency by attribute) | P0 | New |
| Q-06 | Memoing & analytic notes linked to passages/codes | P0 | New |
| ~~Q-07~~ | *Retired — audit trail (who coded what, when). Removed with the no-team decision; can be reintroduced if/when team coding lands.* | — | — |
| ~~Q-08~~ | *Retired — inter-rater reliability / team coding. Out under the single-user guardrail; reintroduce if Phase 3 traction demands teams.* | — | — |
| Q-09 | **REFI-QDA (.qpdx) import/export** (switching-cost wedge + anti-lock-in) | P0 | New |

### Differentiators (how to win, not just match)
| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| Q-10 | AI-native auto-coding: code each transcript against the codebook on arrival, every theme cited to exact passage, human review/override | P0 | New |
| Q-11 | Similarity/tension graph as an analytical lens over codes | P1 | Adapt |
| Q-12 | "Interview the data" grounded chat over the coded corpus | P1 | Adapt |

### Non-functional / data governance
| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| Q-13a | **No-LLM-training guarantee** — contractually with every model vendor + technically enforced (no prompt logs feed training) | P0 | New |
| Q-13b | **Data residency** — tenant-selectable region (UK + EU at minimum; US optional) | P0 | New |
| Q-13c | **On-prem / private-cloud deployment option** — only if a deal demands it (high lift; gate on a signed contract) | P1 | New |

---

## 7. Commercial / GTM backlog

*Business-development work tracked alongside engineering for visibility, but filtered out of engineering Project views. These rows are sales/marketing/partnership commitments, not engineering tickets.*

| ID | Requirement | Phase | Priority |
|----|-------------|-------|----------|
| C-Q14 | Methodological credibility for Phase 3: alignment to named methods (thematic analysis, grounded theory, framework analysis); methodologist endorsement; published validation paper | Phase 3 | P0 |
| C-Q15 | Institutional / site-licence procurement path for Phase 3 (universities, government, healthcare) | Phase 3 | P1 |
