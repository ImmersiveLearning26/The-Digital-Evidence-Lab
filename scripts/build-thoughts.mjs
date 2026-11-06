// Lists which inner-voice lines are recorded and writes the table the player reads.
// Each line in src/content/thoughts.js has a recording at assets/media/voice/thoughts/<key>.mp3 (":" becomes "-").
// Lines without one still show as subtitles; docs/INNER_VOICE_RECORDING.md is the brief for recording them.
// The game also plays a file at that path without the manifest; this just records durations and lists gaps.
import {execFileSync} from 'node:child_process';
import {existsSync, writeFileSync} from 'node:fs';
import {THOUGHTS} from '../src/content/thoughts.js';

const DIR = 'assets/media/voice/thoughts';
const duration = file => {
  const m = execFileSync('sh', ['-c', `ffmpeg -hide_banner -i "${file}" 2>&1 | grep Duration || true`], {encoding: 'utf8'}).match(/Duration: (\d+):(\d+):([\d.]+)/);
  return +m[1] * 3600 + +m[2] * 60 + +m[3];
};
const manifest = {voice: 'Olamide (ElevenLabs, eleven_v3)', lines: {}};
const missing = [];
for (const [key, say] of Object.entries(THOUGHTS)) {
  const file = `${DIR}/${key.replace(':', '-')}.mp3`;
  if (existsSync(file)) manifest.lines[key] = {file, duration: +duration(file).toFixed(2)};
  else missing.push([key, say.length]);
}
writeFileSync(`${DIR}/manifest.json`, JSON.stringify(manifest, null, 1));
console.log(`${Object.keys(manifest.lines).length} recorded, ${missing.length} missing (${missing.reduce((n, [, c]) => n + c, 0)} characters to record).`);
