# lt-mini 🏥

A highly optimized, high-performance, single-page application built on top of React 19, TypeScript, and Mantine v9 CSS designed to instantly query, decrypt, and cache clinical summaries and nursing logs from the EHR system.

## ⚡️ Key Features

- **Dynamic Encounters Autocomplete**: Search field with integrated Popover showing recently loaded/cached records dynamically from browser client storage.
- **Embedded Clinical Summary Rendering**: Sanitizes and formats legacy EHR clinical summaries on-the-fly, ensuring appropriate subsection wrapping and zero horizontal layout merging.
- **Ultra-Lightweight & Modular**: High split code-base keeping individual component sizes minimal (<300 lines) with pure Mantine styling tokens (zero raw external CSS files!).
- **Unified Cache Control Panel**: Dashboard modal to inspect, query, remove, and manage client-side compressed IndexedDB storage cache.
- **Pure Bun Environment**: Built and deployed entirely using the Bun runtime, providing sub-second transpilation and deployment routines.

---

## 🛠️ Architecture Setup

The client-side layout is split into highly isolated, specialized modules:
- `src/App.tsx`: Main state controller coordinating actions and top-level responsive layout framework.
- `src/components/NavigationTabs.tsx`: Top UI view tab selector and counter badges.
- `src/components/VisitsTimeline.tsx`: Detailed patient visit history table with Self Pay highlighting and encounter badges.
- `src/components/ClaimHistoryTable.tsx`: Claim history ledger rendering file submission details and RA totals.
- `src/components/ActivitiesTable.tsx`: Advanced RCM activities grid with status badges, denial codes, and prior auth derivation.
- `src/components/ActiveDiagnoses.tsx`: Diagnoses table with ICD codes and principal diagnosis markers.
- `src/components/RemarksAndResubmissionsCard.tsx`: Resubmissions and RA remarks timeline overview.
- `src/components/LabResults.tsx`: Lab & radiology result reports table.
- `src/components/ClinicalSummary.tsx`: Parses raw legacy EHR HTML templates on-the-fly and applies theme-adaptive rules.
- `src/components/BulkExtractionPanel.tsx`: Medical Necessity & Repeat Tracker batch extraction workspace.
- `src/components/LogsView.tsx`: Real-time backend system trace log stream viewer.
- `src/components/SettingsModal.tsx`: Visual database cache dashboard managing local IndexedDB compressions.
- `src/services/BrowserDbService.ts`: IndexedDB gateway executing compression (Gzip) and search index caching.
- `src/services/EhrService.ts`: Direct client connector querying secure EHR server gateways with tiered search pipeline.

---

## 🚀 Commands

This project is optimized and configured exclusively for **Bun**:

```bash
# Install dependencies
bun install

# Start local hot-reload server
bun run dev

# Run Prettier style formatter
bun run format

# Compile production-ready builds
bun run build

# Deploy compiled pages live to GitHub Pages
bun run deploy
```

---

## 🛡️ Guidelines for AI Coding Agents

Before editing, please check [AGENTS.md](./AGENTS.md) for strict architectural mapping, token rules, and coding boundaries.
