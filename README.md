# The Digital Evidence Lab

CSC 1105 simulation: a junior engineer powers on a workstation, signs in, takes a case from Amina, and prepares verified text, image and audio evidence on a simulated Windows desktop.

## Run it

Needs Node 22 or newer. Nothing else to install.

```bash
npm start
```

Then open http://127.0.0.1:4173. Use the local server, not `file://`.

Learners see no developer controls. Open http://127.0.0.1:4173/?dev to show the gear at the bottom left: preview screens, seed a stage (marks the run as developer-assisted), freeze, edit Amina's draft lines, inspect state.

## Tests

```bash
npm test
```

Runs the domain tests, no browser needed.

```bash
npm install && npm start
npm run test:browser
```

Plays the whole learner path in Chromium with the 3D bench on, including wrong paths and reloads, then checks screen sizes, keyboard use, pause and reload recovery. Last, a robot first-time learner plays with no knowledge of the apps, clicking only what the guidance marks, from login to the debrief, and fails naming the step if the guidance stalls or loops. Set `SIZE=1024x640` to run it at another screen size. If Playwright's own browser is not installed, point it at one with the `CHROME` environment variable.

## Adding your assets

**3D workstation.** Your models are combined in `assets/models/workstation.blend`, and the simulation loads the exported `assets/models/workstation.glb`. To change anything, edit `scripts/blender/build_workstation.py`, then run `build()` and `export()` in Blender. The source models stay in `3d models /` next to this project. Each animation is one NLA track, named after its clip. In Blender they all sit on the same timeline, so solo a track to view one alone. Node, clip and camera names are in `assets/asset-manifest.json`, and any missing name is listed in the browser console. If the model or WebGL is unavailable, the bench falls back to its labelled controls, which also remain as the keyboard route.

**Images.** Every picture is listed in `src/content/media.js`. Change a path there to replace it. An entry with `slot: true` shows as a labelled placeholder. The CCTV still is the exception, because the image tasks measure it: replace `assets/media/source/cctv_generated.jpg` and run `python3 scripts/build_evidence.py image`, which fits the photo to the plate box, draws the plate, and re-measures the sample pixels.

**Amina's calls.** Each turn of a call is one recording in `assets/media/voice/source/`, named `<call>-<node>.mp3` after the nodes in `src/content/calls.js`. They use the ElevenLabs library voice Yna Agalo with the `eleven_v3` model, and each script line carries its delivery directions in `say`. To change a turn, replace its file and run `node scripts/build-voice.mjs`. Reply buttons are the `ask` entries. Answers are never scored.

**Amina's chat lines.** All chat copy is in `src/content/copy.js`.

**The inner voice.** The learner's own thoughts are in `src/content/thoughts.js`: one per task, a few self-corrections after a refused attempt, and a few for each milestone. Each `say` carries `eleven_v3` voice directions; the subtitle shows the words alone. Recordings go in `assets/media/voice/thoughts/<key>.mp3` (a `:` in the key becomes `-`), in the ElevenLabs voice Olamide. The voice brief, with every line, its file name and when it plays, is [docs/INNER_VOICE_RECORDING.md](docs/INNER_VOICE_RECORDING.md). The game plays any file it finds at those names; `node scripts/build-thoughts.mjs` refreshes the manifest and lists what is still missing. A line with no recording shows as a subtitle only.

**No brands.** No real company's name or logo appears. The apps have plain names (Browser, Team Chat, Case Drive, Video Call, Evidence Imager, Text Editor, Image Editor, Audio Recorder) and original icons in `src/desktop/icons.js`, and the wallpaper is drawn for this project. Logos on the supplied models are painted out by `scripts/clean_brand_textures.py`, whose results in `assets/models/tex/clean/` the Blender build swaps in; it also removes the headphones' raised model-name letters.

## What the learner sees

Only what the current step needs. Team Chat is docked on the right: a tab when folded, the full height of the screen when open, and windows move over to make room. Files open large in the middle of the screen (`src/desktop/viewer.js`). Each evidence task is one clear decision inside its tool: the text is fixed from the Encoding menu and checked as it saves; the photograph has one pixel read, then one export dialog for size, print resolution, format and reason, which checks itself against the source; the tape's sample rate and bit depth are chosen in the recorder with listen buttons, and the export checks itself. The calls run about a minute and half a minute. Progress fills a glowing ring, and each milestone gets a short celebration (`src/desktop/motion.js`).

Apps reach the desktop when their stage arrives (`appAvailable()` in `src/core/state.js`), the bench offers one action at a time, and Case Record shows released work one step at a time. Amina's tips (`nextTask()`) stay by the side like a Windows notification, with a number while unopened. "Show me how" holds back the detail until the learner asks. The bulb in the tray brings a hidden tip back.

A notification stays readable for 16 seconds, then shrinks to a small pill until it is opened, so it neither vanishes nor covers the work underneath. Past messages are behind the clock.

Guidance lives in `src/desktop/guide.js`. When a learner hesitates, a soft glow appears on the next control, reached by the route a person would take: open the app, switch to the tab, then the control itself. The wait starts at 8 seconds and grows to 40 as they repeat a kind of action, so help fades as they improve. Each app also opens the same calm way, with one empty state naming one next action, and the software reports what is missing in its own voice. Amina's tips hold three levels: the task, "Show me how", then "Show me", which raises the glow at once. If the next control is scrolled out of its pane, the pane brings it into view, and if notifications are sitting on it, they cross to the other side of the screen until it is clear.

A learner who is really stuck gets one more level: "Watch how it's done", a short looping vector animation of the step (`src/content/demos.js`, played by `src/desktop/demo.js`). It draws only outlines, the real control names, a cursor and an amber ring where it clicks. At the bench it is a schematic of the kit and its cables. It is offered, never forced, and only after one of three signs: over 75 seconds on one task after the glow has already appeared (45 seconds at the bench), two refused attempts, or 20 seconds still stuck after "Show me". It appears in Amina's tips on the desktop, or as "Watch how" in the bench's action bar. Every task must have a demo; `npm test` checks this.

**One rule: the glow marks where to act, never which answer.** On a decision it lights the whole group of options, so judging the evidence stays the learner's work. The demos follow the same rule: on a judgement they draw blank options and show only where the choice is made. `path()` holds the route for each `nextTask()` id. A new task needs an entry there, and `npm run test:browser` proves it.

## How the monitor works

The desktop is never turned into a texture. It stays live HTML the whole time, pinned to the four `Screen_*` corners of the 3D monitor with a CSS perspective matrix, so it is sharp and shows the learner's actual windows even on the bench. Use computer moves the camera in, then expands the desktop to full screen as the room fades out. View equipment runs the same journey backwards. At the bench the desktop is inert, so software can only be used full screen.

At the bench, the object to act on next carries an amber box with moving dashed edges, and an amber label saying what to do. `nextStep()` in `src/desktop/equipment.js` chooses it. Pressing an object traces its box and opens it outward. Pointing at any other piece of kit draws white corner brackets round it and a label, with a dotted leader to whichever side has room. The text is in `src/content/parts.js`. The cable for the next step pulses along the route it will take. Permanent cables are wired at both ends; only the ones the learner connects start loose, resting in front of their ports. An invisible button follows the target, so the step can still be reached by keyboard.

## The 3D studio and welcome page

The set stands in a navy studio: a warm key light with soft shadows, a cool rim light, and ambient occlusion (`src/three/equipment.js`). If frames run long on a slower machine, occlusion turns off and resolution drops. The welcome page shows the set isometrically, drifting slowly, with every outline drawing itself onto the desk and the evidence cables pulsing. Moving the mouse settles it. Any press on the set flies the camera into the bench; Start, on the tower's power button, also switches the computer on. The title block follows one rule: a single light hero line, with everything else in small tracked capitals over hairline rows. The line work is in `src/three/lines.js`. It reads part boxes from `parts` in `assets/asset-manifest.json` and cable paths from the model's `line_rest` and `line_seated` extras, which `scripts/blender/build_workstation.py` writes.

To rebuild the model without the Blender connector:

```bash
/Applications/Blender.app/Contents/MacOS/Blender -b --factory-startup --python-expr "p='scripts/blender/build_workstation.py'; exec(compile(open(p).read(), p, 'exec')); build(); export('assets/models')"
```

## What is real and what is simulated

| Real | Simulated or estimated |
|---|---|
| Text bytes: encoding, decoding, mojibake, byte counts, saved files | The operating system and apps are generic recreations, with no real accounts or brands |
| Image pixels: colour reading, resampling, PNG export with PPI stored in the file | Acquisition speed: imaging takes seconds |
| MD5, SHA-1 and SHA-256 over the simulated drive's actual bytes | The E01 is a record, not a real disk image |
| Audio comparisons: resampled with anti-aliasing, quantised to 8-bit, played through Web Audio | The 10-minute tape is represented by a 10-second clip |
| Allocation arithmetic, computed live from each run | FLAC is 55% of PCM and MP3 is 9.6 MB, per the storyboard. Audio exports are metadata, not encoded files |

Image storage counts width × height × 3, as the storyboard does. The actual PNG size is shown separately.

## Open items

- **Voice:** Amina cannot say the learner's own name aloud, because the calls are prerecorded and names are typed in. Chat uses the name. Check the voice's licence terms before public release.
- **Tape format:** the story calls the tape a microcassette, but the supplied recorder and cassette are full-size compact-cassette models, and a microcassette cannot play in that deck. Either the wording or the models should change.
- **Scoring:** numeric scores stay hidden. The storyboard sets weights and grade bands but no point-level rubric, so it needs SME approval. `weightedScore()` is ready.
- **MIVA logo:** the welcome page names MIVA Open University in text; the logo slot is still empty.
- **Room:** the floor and wall are plain planes in `src/three/equipment.js`, because no room model was supplied.
- **Credits:** see `CREDITS.md`, including the hard drive's licence.

## Layout

```
src/core       case state, validators, byte operations, clock, audio, storage
src/content    Amina's lines, call scripts, image list
src/desktop    window manager, dialogs, taskbar, equipment bench, developer panel
src/apps       Team Chat, Case Drive, Video Call, lab records, Explorer, Case Record, Evidence Imager, Text Editor, Image Editor, Audio Recorder
src/three      3D bench: loads the GLB, plays clips, pins the desktop to the monitor
scripts        server, evidence generator, image extraction, voice builder, Blender build
docs           original kit specification
references     the kit's screen references
```

The original storyboard and kit brief take priority over the reference images: see `docs/REFERENCE_CORRECTIONS.md`.
