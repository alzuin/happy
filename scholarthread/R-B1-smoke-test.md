# R-B1 smoke test — web / iOS / Android

Unified checklist. Run each section on every platform you ship; results should be the same. Each row has a checkbox so you can mark progress as you go.

**Tester:** _________________  **Date:** _________________  **Platform:** ⬜ Web  ⬜ iOS  ⬜ Android  ⬜ All

---

## Setup (once per device)

- [ ] Signed in with the test account
- [ ] (Optional) Zotero connected via Settings, at least one collection imported

---

## A — Paper detail rendering (R-B1 PR1)

- [ ] **A1.** Open any **Zotero** paper from the list
  - [ ] Title + year visible at top
  - [ ] **Creators** section shows real names with role labels (`· author`, `· editor`, …) — not a flat comma list
  - [ ] Date / Language / Tags appear where present
  - [ ] Per-itemType **Details** section shows volume / issue / publisher / etc.
- [ ] **A2.** Open a paper imported pre-Slice-3a (if any)
  - [ ] Falls back to flat **Authors** section (no roles)

---

## B — Local collections sidebar CRUD (PR2)

- [ ] **B1.** Tap **+** next to "Local" → type `Test collection` → submit
  - [ ] Row appears, selected
  - [ ] Middle pane shows empty state ("This collection is empty.")
- [ ] **B2.** Rename row (web: double-click • iOS: swipe / long-press • Android: long-press → dropdown) → **Rename** → submit
  - [ ] Row updates with the new name
- [ ] **B3.** Same gesture → **Delete** → confirm
  - [ ] Row disappears
  - [ ] If it was selected, middle pane snaps back to "All papers"
- [ ] **B4.** Tap chevron next to **Zotero** and **Local** headers
  - [ ] Each section collapses/expands independently

---

## C — Schema-driven Add (PR3)

- [ ] **C1.** Switch to "All Local" → tap **+ Add paper**
  - [ ] Item-type dropdown lists ~40 Zotero types (Journal Article, Book, Thesis, Preprint, …)
- [ ] **C2.** Switch type from `Journal Article` → `Book`
  - [ ] The "Type-specific" extras section updates (publisher / edition / etc.)
- [ ] **C3.** Fill in:
  - Title: `Smoke test paper`
  - Creator 1: First `Test`, Last `Author`, role `Author`
  - Tap "Add creator" → Creator 2: name `Some Org`, role `Editor`
  - Year: `2026`
  - Tags: `smoke-test`
- [ ] **C4.** Submit
  - [ ] Row appears in the list (instant on web, optimistic on mobile)
  - [ ] Open the new paper — Creators section shows both creators with their roles

---

## D — Edit existing paper (PR3)

- [ ] **D1.** Open the C4 paper → tap **Edit**
  - [ ] Sheet opens with all fields pre-populated
- [ ] **D2.** Change title to `Smoke test paper (edited)` → Save
  - [ ] Detail view shows new title without a refresh / navigate-away
- [ ] **D3.** Open a **Zotero-imported** paper
  - [ ] Edit button NOT visible (gated on `isWritable`)

---

## E — Multi-attachment UX (PR4 + post-merge refresh fix)

- [ ] **E1.** Open the C4 paper → Attachments → **Upload** → pick a small PDF
  - [ ] **Row appears immediately** (if you have to navigate away and back, that's a regression of fix #51 / #81)
- [ ] **E2.** Tap **Download** icon on the attachment row
  - Web: browser downloads the file
  - iOS: share sheet → Save to Files / open in another app
  - Android: chooser → Save to Files / open in another app
- [ ] **E3.** Tap **Delete** icon → confirm
  - [ ] Row vanishes immediately
  - [ ] (Web mobile/touch) Delete icon is **always visible**, not hover-only (fix #82)
- [ ] **E4.** Open a Zotero paper
  - [ ] No Upload button, no Delete icons
- [ ] **E5.** (Mobile only) Toggle airplane mode
  - [ ] Upload button disabled

---

## F — Context menus + trash (PR5)

- [ ] **F1.** Long-press / right-click / menu on a row → **Move to collection** → pick the C1 collection
  - [ ] Open the collection — row is there
- [ ] **F2.** In the C1 collection → menu on a row → **Remove from collection**
  - [ ] Row leaves the collection but stays in "All papers"
- [ ] **F3.** Menu on a row → **Move to trash**
  - [ ] Row vanishes from "All papers"
  - [ ] Open **Trash** — row is there
- [ ] **F4.** In Trash → menu on the row → **Restore from trash**
  - [ ] Row reappears in "All papers", gone from Trash
- [ ] **F5.** Add 2–3 throwaway papers, move them to trash, then in Trash → **Empty bin** → confirm
  - [ ] Banner appears: `Emptied — N papers, M files removed` (auto-dismisses after 5s)
  - [ ] Trash is empty

---

## G — Cross-platform consistency

- [ ] **G1.** Add a paper on **web** → switch to iOS → pull to refresh
  - [ ] Row appears on iOS
- [ ] **G2.** Same web → Android
  - [ ] Row appears on Android
- [ ] **G3.** Add a local collection on **iOS** → switch to web
  - [ ] Collection appears in sidebar
- [ ] **G4.** Move a paper to trash on **Android** → check web + iOS
  - [ ] Row in Trash on both, absent from "All papers"

---

## Clean-up

- [ ] Delete the `Test collection` (B-step) and any throwaway papers/attachments

---

## Reference — PR map

| Surface | Web | iOS | Android |
|---|---|---|---|
| PR1 — PaperFields | W1 | #44 | #36 |
| PR2 — Local collections | W2 | #45 | #37 |
| PR3 — Schema forms | W3 | #46 | #40 |
| PR4 — Attachments | W4 | #49 | #45 |
| PR5 — Context menus + Empty bin | W5–W7 | #50 | #46 |
| Post-merge: attachment refresh | #81 | #51 | (baked in) |
| Post-merge: mobile delete icon | #82 | n/a | n/a |
| Backend slices | api Slices 0–8 | — | — |

If any test fails, note the **letter/step** and platform and we can dig into the relevant PR.
