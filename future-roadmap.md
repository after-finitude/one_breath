# Future Enhancements Roadmap

## 1. Offline-First Sync Strategy

### Objective

Allow journaling while offline and reconcile data when reconnected without data loss or conflicts.

### Technical Considerations

- **Data Layer:** Existing storage relies on SQLite via `bun:sqlite`. For offline operation in the browser, we need a client-side persistence layer (IndexedDB via Dexie, LocalForage, or Bun’s experimental persistence when available). Server-side SQLite remains the source of truth.
- **Sync Model:** Evaluate optimistic writes with a queue that replays on reconnect. Need a deterministic conflict resolution policy (e.g., latest timestamp wins, or merge based on `replacedAt` semantics).
- **Service Worker:** Required for offline caching of assets/API requests. Consider using Workbox or a custom Bun-served SW.
- **API Contract:** Must expose sync endpoints: fetch delta since timestamp, submit batched mutations. Requires versioning or incrementing sync token.
- **Testing:** Add integration tests simulating offline mode; ensure no data corruption upon reconnect.

### Open Questions

- Do we need real-time collaboration or single-device sync?
- What is the expected maximum offline duration?
- How to handle conflicting edits across devices?

### Next Steps

1. Prototype client-side queue using IndexedDB and fetch retry logic.
2. Design sync protocol (payload schema, conflict resolution).
3. Plan service worker integration and asset caching strategy.

---

## 2. User Preferences Page

### Objective

Provide UI for managing language, timezone, and export defaults, consolidating state from existing contexts.

### Technical Considerations

- **State Management:** Leverage new context providers (`LanguageProvider`, `TimezoneProvider`, forthcoming PreferencesContext) to read/write settings.
- **Storage:** Persist preferences to localStorage or future backend profile endpoint. Ensure SSR/CSR parity is not required (app is client-only).
- **Routing:** Add `/settings` route via Wouter. Update navigation (desktop and mobile) to include link with active state.
- **Accessibility:** Reuse dialog primitives for confirmation prompts (e.g., reset data). Ensure form controls have labels and error states.
- **Testing:** Component/unit tests verifying preference changes propagate across app; E2E flow toggling language/timezone.

### Open Questions

- Should preferences sync across devices once backend auth exists?
- Do we expose advanced settings (export format defaults, analytics opt-in) initially?

### Next Steps

1. Draft wireframes for the settings page (forms, toggles).
2. Define PreferencesContext API (load, update, reset).
3. Implement route + UI, update navigation, and integrate with contexts.

---

## 3. Analytics / Telemetry Hooks

### Objective

Collect aggregated usage metrics with explicit user consent to inform product decisions.

### Technical Considerations

- **Consent Management:** Add preference toggle stored locally and optionally on server. Default to opt-out.
- **Event Pipeline:** Start with lightweight client-side implementation (e.g., send anonymized events to Bun endpoint that logs or writes to analytics provider).
- **Privacy:** Document data collected. Avoid storing content; focus on app usage (e.g., entry created, export triggered).
- **Performance:** Ensure analytics calls are non-blocking and resilient to network failures.
  ,.. Test instrumentation for reliability (unit tests for consent gating).

### Open Questions

- What analytics provider (if any) will be used? Self-hosted vs. third-party (PostHog, Plausible, etc.).
- Legal/compliance requirements (GDPR, CCPA). Need policy updates.
- Do we need per-event sampling or batching?

### Next Steps

1. Identify metrics and define event schema.
2. Evaluate vendors vs. self-hosted solution.
3. Implement consent UI and stub analytics client behind feature flag.

---

## Dependencies & Research Items

- **Service Worker Support in Bun:** Confirm timeline for native SW bundling; otherwise, integrate manual build step. _Owner:_ Platform team. _Status:_ Research open.
- **Client Persistence Library:** Evaluate IndexedDB wrappers (Dexie, idb, LocalForage) for compatibility with Bun bundler. _Owner:_ Frontend. _Status:_ Spike required.
- **Backend APIs:** Offline sync and analytics require new endpoints (delta sync, analytics ingest). Coordinate with backend roadmap. _Owner:_ Full-stack. _Status:_ Needs API design session.
- **Design Input:** Preferences UI, consent flows, and offline states need UX review. _Owner:_ Design. _Status:_ Schedule workshop.
- **Security & Privacy Review:** Especially for analytics/telemetry before collecting data. _Owner:_ Legal/Compliance. _Status:_ Not started.
- **CI Enhancements:** Ensure future tests (Playwright, sync simulations) run within pipeline constraints. _Owner:_ DevOps. _Status:_ Pending.

---

## Recommendations

1. **Prioritize user preferences page** – immediate UX benefits, leverages existing contexts, minimal infrastructural risk.
2. **Prototype offline queue after preferences** – requires deeper architectural work; schedule design spike.
3. **Delay analytics until consent & privacy policies defined** – gather requirements before implementation.

---

## Implementation Outline (Draft)

### A. Preferences Page Milestone

1. Create RFC covering UX flow, route structure, and storage contract.
2. Implement `PreferencesContext` with persistence service (localStorage wrapper) and integrate into `AppProviders`.
3. Build `/settings` page with form components, reuse dialog for destructive actions, and add navigation entry.
4. Add unit tests for context reducers and component-level behavior; extend Playwright smoke test to toggle settings.

### B. Offline Sync Milestone (Prototype)

1. Author spike document evaluating IndexedDB libraries and service worker tooling compatible with Bun.
2. Implement client queue abstraction with retry/backoff; mock sync endpoint for testing.
3. Extend server with basic delta endpoint guarded behind feature flag; run integration tests to avoid data loss.
4. Design conflict resolution strategy and document user-facing messaging for conflicts.

### C. Analytics Milestone

1. Document event taxonomy and consent requirements; align with privacy policy updates.
2. Add analytics client stub (no-op until flag enabled) and preference toggle.
3. Implement server endpoint or third-party integration, ensuring batching and error resilience.
4. Provide unit tests for consent gating and manual QA checklist before rollout.

Keep this document updated as discovery progresses or decisions are made. Link related RFCs/PRs here when available.
