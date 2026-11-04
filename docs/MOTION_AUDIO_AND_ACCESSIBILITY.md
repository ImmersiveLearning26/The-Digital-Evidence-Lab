# Function, motion and audio behaviour

## Timing vocabulary

| Interaction | Motion / duration | Input rule |
|---|---|---|
| MIVA shell | Brief fade, about 1 second of branding | Click starts; no long forced dwell |
| Tower button | 150–250 ms depression and release | One valid power event |
| Boot presentation | 1–2 s maximum | Skippable; no assessed waiting |
| Monitor camera | 900–1200 ms eased move | Equipment input locked while moving |
| 3D-to-desktop crossfade | 150–200 ms | Focus transfers to DOM at completion |
| Window opening | 160–220 ms opacity and 6–10 px lift | No full-screen sweep or bounce |
| Window minimise/restore | 120–180 ms | Preserve editor and file state |
| Toast | 180 ms entrance; about 5 s visible | Click opens Chat; unread survives dismissal |
| Amina typing/review | 1–2 s | Validate submitted version; pause aware |
| Call pre-join | Static until Join | No autoplay meeting |
| Captions | Sentence-timed, 100–150 ms fade | Default on, transcript accessible |
| Cable seating | 600–900 ms | Ends at connection anchor; no physics |
| Tape loading | 800–1200 ms | Preserve one cassette identity and door pivot |
| Input feedback | 100–150 ms colour/opacity | Text labels accompany colour |
| Waveform capture | Short representative progress | Source duration says 10 min; no real 10 min wait |

No repeated attention pulses across the entire desktop. If idle help is necessary, pulse only the immediately relevant unread item once. Don't flash labels or add arrows to the final submission button. Use motion for state changes and spatial continuity.

## Shared pause contract

Pause stops media, animation-mixer time, notification lifetime, review delay, capture presentation, typewriter effects and camera interpolation. Unpause resumes remaining time, not a fresh timeout. Visibility changes stop animation work; a hidden tab must not advance a capture or cause a burst of queued notifications.

The starter clock covers review delays; AudioBus pauses registered media and the Web Audio context. Claude must register final call videos and audio demos in the bus and use a shared elapsed-time source for production tweens. Do not sprinkle independent setTimeout chains that ignore pause.

## Sound design

- No background music by default.
- Physical scene: optional quiet equipment hum only while at the bench; remove it if distracting.
- UI SFX: one soft click/confirmation sound and one notification sound, restrained volume.
- Voice: Amina, Kenyan English, composed and clear. Same voice across prompts/calls. Do not substitute a generic browser voice as the final output.
- During Meet or evidence playback, duck incidental SFX and stop competing dialogue. Only one evidence comparison plays at a time.
- Controls: dialogue, evidence playback and SFX volumes separate. Global pause and mute accessible. Browser autoplay is unlocked by the learner's initial click.
- If using genuine product notification sounds, obtain the actual permitted assets; the starter uses original synthesis and does not claim to reproduce vendor audio exactly.

## Audio comparison production

Build level-matched reference and degraded samples using a documented deterministic pipeline. Include quiet speech and a buzzer with harmonics approaching 10 kHz. Correct downsampling needs anti-alias filtering before resampling; simply changing a playback-rate slider changes speed/pitch and is not the intended lesson. Quantisation demonstration needs controlled bit-depth reduction with clear labels; avoid clipping or painful noise. Replay uses the reference/master, never another physical tape pass.

Prepare reference_44100_16.wav, sample_8000_16.wav, sample_16000_16.wav, quantised_44100_8.wav, and optional 24-bit/high-rate comparisons. All must share content and duration. Provide text descriptions of speech clarity, buzzer presence and noise. The current code includes text comparisons and a decorative waveform; Claude must replace these with actual audio/waveform data.

## Accessibility and responsive behaviour

Default captions at least 18px in the final build; high-contrast controls and visible focus. Every 3D hotspot has an equivalent labelled HTML button and keyboard operation. Every drag action has select-then-connect. Use native modal focus trapping and return focus to the triggering control when dialogs close.

Reduced motion: skip camera travel, use short fades, disable typing-dot animation and equipment flourish. Keep the same state results. Colour checks show numeric RGB values; audio checks show descriptive findings. Avoid colour-only status.

Target 1366 × 768 and 1920 × 1080 first. At lower sizes, give the active tool a focused view and tuck the case record behind a clearly labelled tab. The whole browser page should not scroll during desktop use; essential content can scroll within a window. Test 200% zoom and keyboard-only completion. Faithful software styling must not make controls too small to use.
