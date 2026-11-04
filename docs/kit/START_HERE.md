# Digital Evidence Lab — Claude replication kit

This ZIP contains **actual runnable HTML/CSS/JavaScript starter code for all 16 desktop screen states**, the core simulation logic, 16 selected PNG references, and the full production handover for Claude. It also includes an optional Three.js GLB adapter and the specifications for the user's 3D assets.

## Give Claude this instruction

“Read CLAUDE_BUILD_PROMPT.md first. Inspect the code and the reference gallery, then build the complete simulation according to the documents. Preserve the original learning content and the manual desktop workflow. Use my supplied 3D assets according to the asset contract. Complete the missing production media and interface fidelity work; do not mistake placeholders for final content.”

## Run the starter

1. Extract the entire folder.
2. Open a terminal inside it, with Node.js 22 or newer installed.
3. Run `npm start` (no package installation is needed for the desktop starter).
4. Open `http://127.0.0.1:4173`.
5. Run `npm test` to check the domain logic.

Use a local web server rather than opening index.html with file://, because ES modules and asset loading need an HTTP origin. The developer gear can preview every screen; it does not unlock valid progression.

## What is included and what remains

| Included and implemented | Claude must finish for production |
|---|---|
| Individual modules for all 16 screens | Close visual replication of the chosen app versions |
| Functional manual launch/open/save/attach/review flow | Full native-like window management, drag/resize and menu coverage |
| Preserved-source rules, file-version checks and validation | Real file-byte operations and hashes if required by the chosen build |
| Text conversion previews and verified canonical fixture | Rich editor behaviour, image pixel rendering and real audio A/B comparisons |
| Case state, local session persistence, pause clock and completion | IndexedDB assets, robust migrations and any learning-platform integration |
| 3D hotspot/GLB loader and camera handoff adapter | User-supplied models, materials, clip integration and scene polish |
| Illustrative waveform, labelled media/evidence slots | Amina's Kenyan-voice call videos and synthetic evidence assets |
| Weighted-score function and source weights | SME-approved point-level rubric before showing numeric scores |

The starter is a working interaction scaffold, not a finished pixel-perfect reproduction of Windows or the named applications. No real Google account is used. No GLB assets, commercial logos, authentic vendor sound files, finished call video or real evidentiary material are bundled. PNGs are visual references, never clickable-background replacements for the actual interface.

## Read in this order

1. `CLAUDE_BUILD_PROMPT.md`
2. `docs/EXPERIENCE_AND_DIALOGUE.md` — full story, chats, tasks and validation
3. `docs/SCREEN_REPLICATION.md` — all 16 pages and their code files
4. `docs/ARCHITECTURE.md` — state, files, review and persistence
5. `docs/3D_ASSETS_AND_CONNECTIONS.md` — model and interaction contract
6. `docs/MOTION_AUDIO_AND_ACCESSIBILITY.md`
7. `docs/QA_AND_ACCEPTANCE.md`
8. `references/index.html` — gallery of the selected screen references

**The PC background must be Windows-style abstract wallpaper, not an office photograph.** The 3D workstation exists outside the PC. The desktop becomes a full-screen, interactive DOM surface when the learner uses the monitor.
