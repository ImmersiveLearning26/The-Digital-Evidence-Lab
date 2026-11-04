# 3D assets, physical actions and connection to the PC

## The intended experience

A real-looking workstation establishes physical presence. The student turns on the tower. The monitor lights up. A gentle camera move approaches the screen, followed by an unobtrusive crossfade to the full-screen desktop. All software interaction now occurs in a normal DOM interface. When the learner needs equipment, a deliberate View equipment action returns to the same bench and the same physical state. It is one place and one case, not a set of unrelated rooms.

Do not keep a monitor frame around the working software. Do not use an office photograph as the Windows background. A room visible within Amina's actual video call is different from wallpaper and may remain. The user supplies the workstation models; do not invent a replacement final office environment.

## Asset deliverables from the user / 3D artist

Prefer one GLB scene with separate named objects, or modular GLBs with consistent dimensions and pivots. Export glTF 2.0, metres, Y-up. Apply scale and rotation before export. Put the tabletop near y=0.75 m, with the learner facing the monitor. Choose the final orientation once, then preserve it.

| Asset | Required object/node names | Notes |
|---|---|---|
| Desk | Desk | Static mesh; simple collision proxy if needed |
| Monitor | Monitor_Body, Monitor_Screen | Screen separate, 16:9 UV area, no baked UI |
| Tower | PC_Tower, Power_Button, Power_LED, PC_USB_Port | Power button separate pivot; port anchor is an empty node |
| Keyboard/mouse | Keyboard, Mouse | Static props; no individual key modelling |
| Evidence drive | EvidenceDrive, Drive_USB_Port | Moveable object; readable evidence tag separate texture |
| Write-blocker | WriteBlocker, WriteBlocker_Switch, Blocker_In, Blocker_Out, Blocker_LED | Distinguish protected source input from PC output |
| Drive cable | Cable_Drive, Plug_Drive, Plug_BlockerIn | Endpoints separate; seated pose supplied |
| PC cable | Cable_BlockerPC, Plug_BlockerOut, Plug_PC | No physics required |
| Tape player | TapePlayer, Tape_Door, Tape_Play, Tape_Stop, Tape_Slot, Tape_Out | Microcassette-sized compartment; door hinge pivot |
| Microcassette | Microcassette, Tape_Label | Keep its scale compatible with the player |
| Audio interface | AudioInterface, Interface_In, Interface_USB | Separate input and PC connection points |
| Audio cable | Cable_Audio, Plug_TapeOut, Plug_InterfaceIn | Seat into named anchors |
| Interface USB cable | Cable_InterfacePC | Can be pre-routed; simple connection animation |
| Headphones | Headphones, Headphone_Plug, Headphone_Port | Monitor the audio; no head model needed |
| Evidence storage | EvidenceTray, Tape_Bag, Drive_Bag, Seal_Tape | Seal opening is presentation, not a chain-of-custody course |

Each interactive object needs a simple invisible hit mesh named `Hit_<object>` if the visible geometry is too small. Map that node to the same logical action in the manifest. Prefer generous hit targets and accessible text controls rather than requiring pixel-perfect port clicks.

## Camera anchors

Export cameras or empty nodes with world transforms:

- `Camera_Overview`: seated view with monitor and current equipment readable.
- `Camera_Monitor`: close enough for a smooth final crossfade to the DOM; lens and orientation aligned to screen.
- `Camera_Drive`: close view of the blocker and drive; optional in the starter, required for polished physical sequencing.
- `Camera_Tape`: close view of the player, cassette and interface.
- `Target_Monitor`, `Target_Drive`, `Target_Tape`: look-at helpers when anchors are empties.

The provided adapter directly copies world camera orientation. Export actual cameras for the simplest integration. If using empties, Claude must compute camera look-at using the target nodes.

## Animation clips

| Clip name | Suggested length | Visible motion | Completion event |
|---|---:|---|---|
| Power_Press | 0.25 s | Button depresses/releases; LED lights | POWER |
| Blocker_Enable | 0.35 s | Switch toggles; protection indicator lights | HARDWARE blocker |
| Drive_Connect | 0.75 s | Plugs align and seat into correct ports | HARDWARE drive |
| Tape_Door_Open | 0.45 s | Door rotates about hinge | presentation only |
| Tape_Unseal | 0.55 s | Bag seal opens | presentation only |
| Tape_Insert | 0.9 s | Cassette enters slot; door closes | HARDWARE tape |
| Interface_Connect | 0.7 s | Audio and USB plugs seat | HARDWARE interface |
| Headphones_Lift | 0.45 s | Headphones are lifted to monitoring position | HARDWARE headphones |
| Tape_Play | 0.25 s | Play button depresses; transport indicator changes | CAPTURE begins |
| Tape_Stop | 0.25 s | Transport stops | capture presentation ends |

Use smooth eased motion with no bouncing cables or exaggerated camera shakes. Keep cable paths predefined. No rope physics, free first-person locomotion, hand tracking or full hand avatar is needed. A single click followed by a short snap animation provides the intended physical action. Offer click-to-select then click-to-connect as an optional accessible alternative to drag-and-drop, not as an extra puzzle.

## The physical-software bridge

| Physical fact | Domain state | Software effect |
|---|---|---|
| Tower on | powered=true | Login can appear; it does not log the learner in |
| Write-blocker on | hardware.blocker=true | Source can be connected safely |
| Drive correctly seated | hardware.drive=true | FTK can acquire after intake |
| Source imaging verified | acquisition=true | Read-only image and working-copy export available |
| Cassette loaded | hardware.tape=true | Audio capture may become available |
| Interface attached | hardware.interface=true | USB input is selectable in Audacity |
| Headphones selected | hardware.headphones=true | Required monitoring preparation complete |
| Single capture finished | audio.captured=true | Export becomes meaningful; further A/B uses reference/master |

Physical objects never mutate score values. Software windows never write directly to Three.js objects. Both emit typed domain events, and the state service decides whether the action is allowed. Presentation then follows the committed state.

For production, use: `validate intent → lock hotspot → play clip → commit event at completion → sync all views → unlock hotspot`. If a clip is missing, a brief fallback transition commits exactly once. Cancelled transitions must not create half-connected states. A failed action explains the missing prerequisite without playing the success animation. Repeated clicks are idempotent.

The starter validates immediately and restores the completed pose on rerender. It includes `playClip()` and the camera tween as integration hooks. Claude must replace per-render scene remounting with one persistent scene controller before polishing equipment animations. Do not claim the starter already has the user's final animated workstation.

## Monitor-to-DOM handoff

1. The bench monitor has a separate screen material with a low-cost boot/wallpaper texture. This is a visual representation only.
2. `Use computer` starts the camera tween to Camera_Monitor, 900–1200 ms.
3. Disable equipment input during the move. Continue the shared pause clock.
4. During the final 150–200 ms, crossfade to the full viewport DOM desktop. Preserve screen aspect ratio and avoid a one-frame flash.
5. Focus the name field or last focused application control. Disable pointer events on the 3D canvas and pause unnecessary rendering.
6. `View equipment` saves the active app and caret/selection, fades back to the screen surface, moves the camera to the relevant anchor, and restores equipment input.
7. Do not unmount or reset the simulation domain during this handoff.

The starter demonstrates the forward camera movement when a model and vendor library are available. The reverse crossfade and retained scene/controller lifecycle are production tasks described here. No need to stream every HTML frame into a WebGL texture: showing a wallpaper or coarse status image during the brief physical view is enough. Maintain privacy and performance by keeping the desktop DOM separate.

## Asset budgets (design targets, not source requirements)

Aim for a desktop-workstation scene under roughly 150k visible triangles, 1k–2k textures for secondary props, one 2k atlas for the main workstation where practical, and a compressed initial model download under about 15 MB. Measure on the actual target laptops. Clamp device pixel ratio to 1.5. Avoid realtime shadows on every small object. Use baked ambient detail and a few simple lights. Keep screen emission subtle.

Supply an asset manifest with filenames, object names, clip names, texture paths, scale and ownership/licence information. Avoid embedded giant unused textures. Keep labels readable at the intended close view rather than adding overly fine geometry.

## Hooking up the user's files

1. Place the GLB at `assets/models/workstation.glb` or update modelUrl.
2. Run `npm install` then `npm run vendor:three` to copy the pinned optional Three.js dependency locally. The core desktop does not need this step.
3. Set enable3D=true in `assets/asset-manifest.json`.
4. Match actual mesh/clip/camera names to the manifest; do not rename the user's original file destructively.
5. Validate every node and animation. Report missing items in development; retain accessible fallback controls.
6. Test power-on, blocker, drive, cassette, interface, headphones and the camera handoff. Confirm UI and hardware cannot disagree.

No 3D assets have been supplied in this ZIP. The simple equipment view is an explicit placeholder so the functional desktop can be built while the models are prepared.

Technical references: [Three.js GLTFLoader](https://threejs.org/docs/pages/GLTFLoader), [AnimationMixer](https://threejs.org/docs/pages/AnimationMixer), [animation system](https://threejs.org/manual/pages/animation-system.html). The adapter loads scene/clip data, maps named mesh hits to domain actions, and updates the mixer while active. Its optional dependency path still requires validation against the supplied GLB.
