// Writes docs/INNER_VOICE_RECORDING.md from src/content/thoughts.js: the brief for recording the inner voice.
// Run after changing any line: node scripts/build-voice-brief.mjs
import {existsSync, writeFileSync} from 'node:fs';
import {THOUGHTS, STEPS, FIXES, subtitle, fileFor} from '../src/content/thoughts.js';
import {COPY} from '../src/content/copy.js';

const DIR = 'assets/media/voice/thoughts';
const TASKS = {
  message: 'Read Amina’s message', brief: 'Join Amina’s briefing', intake: 'Complete the evidence intake', bench: 'Connect the evidence drive',
  acquire: 'Create a disk image', export: 'Export the working files', openText: 'Open the witness message', fixText: 'Make the text read correctly',
  sendText: 'Send the text file to Amina', openImage: 'Open the photograph', pixels: 'Read a pixel', imageSet: 'Export the photograph',
  sendImage: 'Send the image to Amina', benchTape: 'Prepare the tape', capture: 'Set up and record', exportAudio: 'Export the audio master',
  sendAudio: 'Send the audio to Amina', handover: 'Complete the final handover', closing: 'Join Amina’s handover review', debrief: 'Read your feedback',
};
const PARTS = {power: 'switching the computer on', blocker: 'connecting the write-blocker', drive: 'connecting the evidence drive', tape: 'loading the tape',
  interface: 'connecting the audio interface', headphones: 'putting the headphones on', use: 'going back to the computer'};
function when(key) {
  const [kind, id] = key.split(':');
  if (kind === 'task') return `As the task “${TASKS[id]}” begins.`;
  if (kind === 'bench') return `At the bench, before ${PARTS[id]}.`;
  if (kind === 'step') {
    const uses = STEPS.filter(([, , k]) => k === key || k.replace('$app', key.split(':').at(-1)) === key);
    const tasks = [...new Set(uses.flatMap(([t]) => (t === '*' ? ['any task'] : t.map(x => `“${TASKS[x]}”`))))];
    return `When this is the next thing to click and the learner pauses (${tasks.join(', ')}).`;
  }
  if (id === 'other') return 'After any other refusal.';
  if (COPY[id]) return `After Amina or the software says: “${COPY[id].replace(/\{\w+\}/g, '…')}”`;
  const re = FIXES.find(([, k]) => k === key)?.[0];
  return `After a refusal that says something like “${re?.source.replace(/^\^|\\/g, '')}”.`;
}
const keys = Object.keys(THOUGHTS);
const done = keys.filter(k => existsSync(`${DIR}/${fileFor(k)}`)).length;
const GROUPS = [['task', 'As each task begins'], ['step', 'Finding the way, step by step'], ['bench', 'At the bench'], ['fix', 'Working out what went wrong']];
const section = ([prefix, title]) => `## ${title}\n\n${keys.filter(k => k.startsWith(`${prefix}:`)).map(k => `### \`${fileFor(k)}\`

- **When it plays:** ${when(k)}
- **With directions** (models that read audio tags, such as ElevenLabs \`eleven_v3\`):

  > ${THOUGHTS[k]}

- **On screen** (the subtitle):

  > ${subtitle(THOUGHTS[k])}
`).join('\n')}`;

writeFileSync('docs/INNER_VOICE_RECORDING.md', `# Inner voice: recording brief

The learner's inner voice: ${keys.length} short lines, ${done} recorded. Generated from \`src/content/thoughts.js\` by \`node scripts/build-voice-brief.mjs\`; change the lines there, not here.

## What the voice is for

The learner thinking the job through out loud, the way a junior engineer does on their first day with new software. It helps a player who is in the same position: it re-reads what Amina asked, looks for things on screen by the names they have, weighs the choices, and works out what went wrong when something is refused. It is never the software answering back.

- **As a task begins:** what Amina asked, and the plan.
- **Step by step:** when the next control is on screen and the learner pauses, finding it by name and saying why. Each is said once, so the voice gets quieter as the software becomes familiar.
- **After a refusal or a correction:** reading it, and working out the fix. This cuts in over anything else.

## The voice

- **Who:** one young adult, warm and calm, natural African English. The same voice for every line. Recorded so far with the ElevenLabs voice *Olamide*, model \`eleven_v3\`, stability 0.4.
- **How:** quiet and close, as if muttered to oneself. Unhurried. Real hesitation: the "hmm"s, "okay"s and "..." pauses are part of the line. Mild self-correction when something is refused, never frustration.
- **Not:** announcer energy, cheerfulness, or reading aloud.

## Delivering the files

1. One MP3 per line, named as each heading below, in \`${DIR}/\`. Replace any file already there.
2. Speak only the words. Square-bracket parts such as \`[thoughtful]\` are directions: audio tags for \`eleven_v3\`, otherwise follow them and let the punctuation carry the pauses. Never say a bracketed word.
3. Names are spelled out for the voice ("U T F eight", "P N G", "zero four one seven"); say them that way. The subtitle shows them as on screen.
4. Tight edges (no more than a quarter second of silence), mono, 44.1 kHz, 128 kbps or better, about -20 LUFS, a little quieter than Amina.
5. The game plays any file it finds at these names. Optionally run \`node scripts/build-thoughts.mjs\` (Node and ffmpeg) to refresh the manifest and list what is missing.

${GROUPS.map(section).join('\n')}`);
console.log(`docs/INNER_VOICE_RECORDING.md: ${keys.length} lines, ${done} recorded.`);
