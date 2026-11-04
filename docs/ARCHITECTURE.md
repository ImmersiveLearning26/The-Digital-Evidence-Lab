# Architecture and simulation logic

## Code map

| File | Responsibility |
|---|---|
| src/app.js | Desktop orchestration, event delegation, dialogs and routing |
| src/pages/01…16 | Per-screen render functions and semantic controls |
| src/core/state.js | Authoritative immutable reducer and progression gates |
| src/core/domain.js | Encoding, storage, output validators and scoring formula |
| src/core/clock.js | Shared pausable delay queue |
| src/core/audio.js | Synthesised SFX and media pause interface |
| src/three/equipment.js | Optional named-node GLB adapter and camera tween |
| assets/asset-manifest.json | User asset locations, hotspot map and clip names |
| tests/domain.test.mjs | Regression coverage for fidelity, gates and saved-version reviews |

These are ES modules. There is no bundler requirement for the starter. `npm start` serves the project with Node's standard library. Claude may convert the UI to a component framework, but the reducer should remain a standalone testable domain module.

## State boundaries

Domain state includes learner identity, briefing, intake inspections/risk/objective, hardware, verified acquisition, working-copy availability, editor choices, saved file versions, submitted snapshot, approvals, handover, reflection and completion. UI state includes window/view, active menu/modal, focus, attachment selection, call joining, pause and developer panel. Keep the two separate.

A page change is not a domain achievement. Opening a software window does not open its evidence file. Opening a file does not confirm its representation. Saving does not submit. Sending does not approve. Approval does not launch another application.

The starter's app windows use a single visible shell; all editor/domain state persists. Claude should implement a window registry with id/app/title/rect/z/minimised/lastFocus, store open windows separately from activeWindowId, and mount editors without losing internal state. Close means close the window, not delete the file or reset the task. Allow Alt+Tab/taskbar switching within the simulation and ensure key handling does not trap the browser.

## Progression

Opening → physical power → sign-in → Chat/Drive → briefing → intake → blocker/drive → FTK acquisition/verification → exported copies → text → image → tape/interface/headphones → audio → handover → closing Meet/debrief → Finish.

Risk ranking is logged but never blocks the task order; equipment scheduling explains why the most vulnerable tape is processed later. Wrong preservation objectives require correction. Wrong saved outputs receive specific feedback. All previously completed work remains available.

## File model

The starter stores metadata and exact text fixture/settings in memory/localStorage. It does not create genuine E01 disk images, encode actual FLAC audio, or generate a 4000 × 3000 photograph. Those are deliberately simulated or missing media; do not claim otherwise.

Production model:

```ts
type EvidenceFile = {
  id: string; name: string; kind: 'text'|'image'|'audio'|'log';
  version: number; sourceId: string; readOnly: boolean;
  blobKey?: string; actualBytes?: number; allocationEstimateBytes: number;
  settings: Record<string, unknown>; checksum?: string;
};
type Approval = { fileId: string; version: number; checkedAt: number };
```

Immutable source objects live in an evidence-store namespace excluded from processing allocation. Each working derivative points to its source. Save writes a new version and invalidates approval/handover for that derivative. Attach creates a reference and submission snapshot, not a second counted copy. Retained alternative files count against allocation. Removing an optional copy is explicit and logged; no hidden deletion to make the budget pass.

Use IndexedDB for Blob assets and localStorage only for small session preferences/IDs, or use a proper backend if the destination project requires it. Schema versions and migrations must prevent old sessions from silently satisfying new validation rules. Restore draft controls, original snapshot identities and window positions. Pending reviews resume once; do not send duplicate messages after reload.

## Submission transaction

1. Learner selects a saved file in the picker and clicks Open.
2. Show its filename/version in the Chat composer.
3. Send snapshots that version; disable duplicate sends while pending.
4. Queue an authored “reviewing” state on the pausable clock.
5. Validate saved data, source identity, required checks and allocation.
6. If its saved version changed during review, cancel and ask for resubmission.
7. Pass records an approval for that exact version and posts the next assignment message. Failure posts the specific correction without restarting other work.

Amina is scripted by validation outcomes. An LLM is not necessary for technical correctness or task release. If Claude adds optional AI guidance, it must not override validators, invent case facts or approve files.

## Calculations and evidence content

Canonical text is in domain.js; 92 Unicode code points, 112 UTF-8 bytes without BOM or final newline. Do not count UTF-16 code units as characters. ASCII replacement preserves 83/92; Latin-1 preserves 84/92. Conversion trials derive from the unchanged baseline. Wrong decoding is a separate demonstration, not a claim that Latin-1 encoding produces mojibake.

Image allocation = width × height × 3 bytes. It is an uncompressed RGB estimate; actual PNG/JPEG bytes are different. Fixed 10 × 7.5-inch print needs inches × PPI pixels; PPI alone changes no pixel data. Prepare the source image so the native plate region is approximately 250 px wide and clearly readable. Derive actual RGB readings and scaled plate widths from the asset.

Mono 10-minute PCM estimate = rate × (bits/8) × 600. FLAC's 55% factor is a storyboard teaching estimate, not universal compression. For a real encoder, show actual bytes separately or explain the allocation model. Captured digital samples, internal float processing and export settings are distinct.

## Assessment

Weights: handling 15%, text 25%, image 30%, audio 30%. Handling sub-contributions: intake/text 40%, image 20%, audio/handover 40%. Speed is never scored. Revisions have no score penalty.

The storyboard supplies technical pass criteria and grade bands but does not fully define intra-strand point deductions. Therefore the starter reports required-check completion and leaves numeric grading pending. The weightedScore function is ready for approved inputs and reproduces the storyboard's 87/100 example. Claude must not turn retries, hints or elapsed time into deductions. An SME-approved rubric must reconcile successful correction with the intended final strand values.

## Production rendering

Use a real DOM text editor, a Canvas2D/WebGL image inspector backed by the actual source pixels, and Web Audio/HTML audio for prepared comparison assets. Do not stretch the PNG interface references into a fake clickable application. The prototype placeholders explicitly identify the required production asset slots.

Always escape learner-provided text in DOM templates; the starter's esc helper covers rendered names and notes. Do not execute arbitrary chat input or read the user's real filesystem. Use synthetic files only. The simulation is not a connection to the actual Windows OS or Google services.
