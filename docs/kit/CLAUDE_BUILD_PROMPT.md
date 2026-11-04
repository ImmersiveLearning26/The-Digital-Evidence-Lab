# Build instruction for Claude

You are building “The Digital Evidence Lab”, an immersive desktop-and-equipment learning simulation. Read this kit fully before modifying it. Work through implementation and browser verification; do not stop at a plan. The supplied starter is the executable baseline for logic and screen composition. You may port it to React/TypeScript if appropriate to the destination project, but retain its domain checks and the workflow below.

## User's intent

The learner should feel like a junior engineer sitting at a real Windows PC. They switch the computer on in a 3D workspace, enter their name at Windows-style sign-in, receive Amina's Google Chat notification, open a shared Drive folder, join Meet calls, and perform tasks in recognisable FTK Imager, Notepad++, GIMP and Audacity interfaces. They open applications themselves, choose files themselves, save outputs themselves, and attach/send outputs themselves. Keep it intuitive and short; realism is not permission to add unrelated configuration chores.

The user's 3D assets are integral, not decoration. They provide the physical actions that desktop software cannot represent by itself: power-on, a protected evidence-drive connection, and the analogue-tape/audio-interface setup. Use 3D only for these moments. After zooming into the monitor, the PC display fills the viewport and uses ordinary interactive HTML/CSS. Do not show a rendered office inside Windows. Do not make tiny software controls operate through a distant 3D screen.

## Source priority

1. The current user instructions and explicit corrections.
2. The original simulation's academic content, transcribed and mapped in EXPERIENCE_AND_DIALOGUE.md.
3. This kit's technical and interaction specification.
4. PNG mockups for visual composition only.

Some generated PNGs contain inconsistent clocks, irrelevant contact names, guessed file sizes or vendor-menu approximations. Follow REFERENCE_CORRECTIONS.md. Do not copy those errors into code. The case is suspected mobile-money fraud in a fictional Nairobi lab, not vehicle theft. Amina is a Kenyan senior analyst. No extra characters or story beats are necessary.

## Required implementation

- One persistent simulation, not separate unrelated page prototypes. All screens share the same state and virtual filesystem.
- Reproduce the 16 screen states through reusable desktop windows, menus and dialogs. Use the included per-screen modules as behavioural examples.
- Default to a laptop-friendly viewport. Keep primary actions visible. Windows may scroll inside content when essential; avoid a scrolling outer document.
- Use genuine recognisable logos/layouts from appropriate supplied or verified assets. Research the chosen versions using official product documentation. Do not invent native commands for custom training exercises. Put those exercises in a separate Case record window.
- Preserve actual text encoding consequences, pixel/RGB/print distinctions, sample-rate/quantisation/encoding comparisons, 100 MB image/audio limits and 200 MB processing allocation.
- Preserve all required inspections, rank/objective activity, RGB match, short justifications, original verification, handover judgments and optional reflection. Do not convert the entire experience into multiple-choice quizzes.
- Keep original evidence immutable. Work on versioned derivatives. Approvals refer to the submitted version, not current editor controls.
- Drive initial records do not include a playable cassette recording. Its digitisation produces the first working digital master.
- The write-blocker is hardware. FTK acquisition is software. Both must be represented accurately and connected by state.
- Amina's short authored messages explain real validation findings. A 1–2-second review delay and typing indicator add realism. Sending does not guarantee approval.
- Meetings use a pre-join screen and learner-clicked Join. No microphone/camera permission or real account required. Kenyan English female voice, same face and outfit throughout. Captions default on; skip/replay available.
- Default no background music. Quiet UI SFX only; physical computer hum is optional. Pause suspends all media, notifications and transitions.
- Add persistent developer gear for preview navigation, freeze/pause, restart, skip media, state inspection and editing draft text. Developer jumps must not silently award assessment credit.
- Preserve accessibility: 18px captions, keyboard/tap equivalents, high contrast, reduced motion, text alternatives to all audio/colour observations, appropriate touch targets.

## Build sequence

1. Run tests and launch the supplied scaffold. Inspect each page against references.
2. Complete desktop window management and native-like File/Open/Save/Export/Attach dialogs. Retain state when windows close or minimise.
3. Implement the text pipeline using the canonical UTF-8 fixture and verify it after reopening.
4. Add a synthetic 4000 × 3000 evidence photograph with the required plate and sampleable colour regions; implement actual pixel scaling and RGB sampling. Do not use a screenshot of GIMP as the photograph.
5. Prepare a reference audio signal containing quiet speech and the buzzer's upper harmonics, then generate reproducible comparison versions. Keep the actual tape capture concept separate from replayable comparisons.
6. Implement Amina's messages and the two short calls using the original academic meaning. Use real prepared audio/video assets, not browser speech as the final Kenyan voice.
7. Connect the user's GLBs using the named nodes and animation contract. Add camera transitions and the DOM handoff. Keep fallback controls while assets are unavailable.
8. Connect validation to submission, release and final handover. Have the scoring rubric approved before displaying numerical grades. Never score speed or penalise revision count.
9. Test the full learner path, two wrong-path corrections, reload/resume, pause, accessibility and target laptop sizes. Review console/network errors.

## Definition of done

No required interaction is a dead button. No unavailable media is silently treated as complete. No application opens because a timer expired or because another task was approved. No original can be overwritten. All submitted settings correspond to saved file versions. The three final items satisfy their requirements inside the allocation. Physical objects and software show the same connection/capture state. A complete normal run reaches a personalised debrief and saves completion. Report honestly any assets or external services still missing.

Use the current source repository if a project already exists. Do not deploy publicly without the user's deployment instruction. Implement and preview locally first.
