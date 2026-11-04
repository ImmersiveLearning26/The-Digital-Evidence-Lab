# Per-page replication instructions

Each numbered item maps one source module to one PNG. These are states of the same desktop. Numbers are for Claude and must not appear as scene labels in the learner UI. Shared CSS is in src/styles.css; shared controls are in src/ui.js. App.js binds every data-action to domain events.

## 01 — Windows sign-in

- Code: `src/pages/01-login.js`
- Reference: `references/01-windows-sign-in.png`
- Layout: Full-screen blue abstract wallpaper. Centre avatar, role, name field and Sign in. Keep chrome absent.
- Learner action: Power is on. Learner enters name and clicks Sign in. Persist identity and show desktop; do not open Chat automatically.
- State events: `LOGIN`
- Correction behaviour: Empty name: inline validation. Restore name only for an existing session.
- Motion: 160 ms fade; focus name field; Enter submits in production.

## 02 — Windows desktop

- Code: `src/pages/02-desktop.js`
- Reference: `references/02-desktop-notification.png`
- Layout: Shortcuts down the left, centred taskbar at bottom, one quiet notification bottom-right. Plenty of untouched wallpaper.
- Learner action: Click shortcut/taskbar to launch. Click notification to open Chat. Apps remain installed; assignment files are released progressively.
- State events: `UI launch only`
- Correction behaviour: Dismissed notification remains unread in Chat. A locked working asset explains the prerequisite.
- Motion: Toast enters in 180 ms; window opens in about 180 ms.

## 03 — Amina conversation

- Code: `src/pages/03-chat.js`
- Reference: `references/03-chat.png`
- Layout: Left navigation, Amina conversation centre, sparse message bubbles, shared folder/Meet cards and bottom attachment composer.
- Learner action: Read guidance, click shared folder, join a call, attach saved file and send. Review appears in this thread.
- State events: `SUBMIT → REVIEW`
- Correction behaviour: Failure posts actual issues. Opening Chat never approves anything. Pending review pauses and resumes.
- Motion: Typing/review state 1–2 s; no focus stealing.

## 04 — Shared intake folder

- Code: `src/pages/04-drive.js`
- Reference: `references/04-shared-folder.png`
- Layout: Drive list view with three source records. Metadata/details pane may open at right.
- Learner action: Learner opens each record to inspect medium, requirement and fragility. Tape record has no audio player.
- State events: `INSPECT`
- Correction behaviour: Opening a record twice is harmless and does not double-count inspection.
- Motion: Simple row selection; preview panel 150 ms fade.

## 05 — Evidence intake record

- Code: `src/pages/05-intake.js`
- Reference: `references/05-intake.png`
- Layout: Custom browser form. Three ranks and one shared preservation objective; compact equipment-booking note.
- Learner action: Rank evidence and confirm objective after inspecting all labels and attending briefing.
- State events: `INTAKE`
- Correction behaviour: Wrong objective blocks; risk ranking logs reasoning but does not block progression.
- Motion: One confirmation state, no celebration or score popup.

## 06 — Briefing / closing call

- Code: `src/pages/06-meet.js`
- Reference: `references/06-meet.png`
- Layout: Dark Meet canvas, Amina large video tile, learner camera-off avatar, controls below, legible captions.
- Learner action: Click invitation → pre-join → Join now. Call supplies story and expectations; click leave/skip. Reuse shell for closure.
- State events: `BRIEF on briefing completion`
- Correction behaviour: If media fails, accessible transcript/continue remains. Never mark an unseen unavailable video as watched.
- Motion: Natural playback, timed captions, no soundtrack competition.

## 07 — FTK acquisition

- Code: `src/pages/07-ftk-create.js`
- Reference: `references/07-ftk-create.png`
- Layout: Classic native toolbar, evidence tree left and focused acquisition dialog.
- Learner action: Select protected drive, separate destination and verify checkbox, then Start.
- State events: `ACQUIRE`
- Correction behaviour: No blocker, missing intake, source destination or unchecked verification: explain and stay here.
- Motion: Short simulated progress; no genuine disk imaging or minute-long wait in starter.

## 08 — FTK verification and export

- Code: `src/pages/08-ftk-verify.js`
- Reference: `references/08-ftk-verified.png`
- Layout: Verification result over evidence tree. Clear match/fail and bad-sector status.
- Learner action: Inspect verification, add/open image and export text/photo working copies.
- State events: `COPIES`
- Correction behaviour: Failed verification cannot release working files. Never auto-open Notepad++.
- Motion: Dialog closes to same FTK window; one Chat notification after success.

## 09 — Text representation

- Code: `src/pages/09-notepad.js`
- Reference: `references/09-notepad.png`
- Layout: Notepad++ editor fills most of screen; separate narrow case-record comparison window.
- Learner action: Open working text, compare encoding, save, reopen with matching decoding, attach saved version.
- State events: `OPEN text / SET / SAVE / REOPEN`
- Correction behaviour: Lossy representation or wrong decoding names lost characters. Trials start from preserved baseline.
- Motion: No decorative animated text in editor; native menu/dialog motion only.

## 10 — RGB inspection

- Code: `src/pages/10-gimp-rgb.js`
- Reference: `references/10-gimp-pixels.png`
- Layout: Dark GIMP canvas dominated by synthetic photograph. Toolbox and docks around it; separate case-record RGB exercise.
- Learner action: Open image, inspect plate/character/sky pixels, match swatch channels within ±15.
- State events: `OPEN image / SET`
- Correction behaviour: Do not allow completion before three targets inspected and swatch matched. Read actual source pixels in final build.
- Motion: Zoom anchored to selected point; no AI detail generation.

## 11 — Image and print settings

- Code: `src/pages/11-gimp-settings.js`
- Reference: `references/11-gimp-settings.png`
- Layout: Same photograph and canvas identity. Native Scale Image/Print Size dialogs, separate fixed-print exercise.
- Learner action: Compare dimensions, choose 300 PPI while retaining 4000 × 3000, explain and export derivative.
- State events: `SET image / SAVE`
- Correction behaviour: Upscaling fails source-detail rule and exceeds budget at 8000 × 6000. PPI alone does not change pixels.
- Motion: Preview changes after apply; preserve viewport and focal plate region.

## 12 — Capture and ADC comparison

- Code: `src/pages/12-audacity-capture.js`
- Reference: `references/12-audacity-capture.png`
- Layout: Light native transport toolbar, mono waveform and timeline. Custom comparison controls clearly separate.
- Learner action: Prepare hardware, open app, select USB interface, preview capture settings, record once.
- State events: `OPEN audio / SET / CAPTURE`
- Correction behaviour: No hardware or unsuitable reference settings prevents source capture. Subsequent previews use reference/master.
- Motion: Waveform grows during compressed capture presentation; playback cursor matches actual audio in production.

## 13 — Lossless export

- Code: `src/pages/13-audacity-export.js`
- Reference: `references/13-audacity-export.png`
- Layout: Native export dialog over same mono project, file path/format/sample settings visible.
- Learner action: Choose FLAC or PCM WAV, save current output and attach it manually.
- State events: `SET audio / SAVE`
- Correction behaviour: MP3 is not accepted as master. Higher export settings cannot repair lower-quality capture.
- Motion: Export progress short and honest; no forced launch of Chat.

## 14 — File selection and submission

- Code: `src/pages/14-attach.js`
- Reference: `references/14-attach.png`
- Layout: Windows file picker over Chat, Working folder, name/version list, Open and Cancel; composer then Send.
- Learner action: Select file → Open → inspect attachment → Send. Reuse for all three assignments.
- State events: `SUBMIT`
- Correction behaviour: No file: Send explains. Stale version: cancel review and request resubmission.
- Motion: Native dialog transitions; send attaches one immutable version.

## 15 — Final verification

- Code: `src/pages/15-handover.js`
- Reference: `references/15-handover.png`
- Layout: Clean record table, learner check controls, storage bar and submit button. No oversized score card.
- Learner action: Judge readability, plate detail and audio; check originals and allocation; submit processing log.
- State events: `HANDOVER`
- Correction behaviour: Missing approval, mismatched version, failed requirement or >200 MB returns actionable issue without resetting work.
- Motion: Quiet accepted state; Amina sends closure invitation.

## 16 — Personalised review

- Code: `src/pages/16-debrief.js`
- Reference: `references/16-debrief.png`
- Layout: Completion heading, four feedback tabs with one expanded area, optional reflection, Finish.
- Learner action: Review own settings and consequences; reflect optionally; Finish persists completion.
- State events: `REFLECT / FINISH`
- Correction behaviour: No extra scored questions. Do not show a fabricated numeric score before rubric approval.
- Motion: Subtle fade; no confetti, leaderboard pressure or speed award.

## Shared implementation rules

Use editable DOM controls for every functional field. Do not place invisible hotspots over full-page screenshots. Product-specific training panels must look like separate custom lab windows, not undocumented native features. Keep exact values and field labels in the specification authoritative. App window switching should not reset a form, pause state, source baseline or saved output. Each instance uses the same learner identity, case ID, Amina identity and evidence assets. The reference gallery is review material, not the source of assessment logic.
