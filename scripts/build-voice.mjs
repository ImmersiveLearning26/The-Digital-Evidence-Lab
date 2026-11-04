// Measures Amina's recordings and writes the table the Meet window follows.
// Each node in src/content/calls.js has a recording at assets/media/voice/source/<call>-<node>.mp3.
// Captions are spread across a take by length, so run this after changing any recording.
import {execFileSync} from 'node:child_process';
import {existsSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {CALLS} from '../src/content/calls.js';

const SOURCE='assets/media/voice/source';
const duration=file=>{
 const out=execFileSync('sh',['-c',`ffmpeg -hide_banner -i "${file}" 2>&1 | grep Duration || true`],{encoding:'utf8'});
 const m=out.match(/Duration: (\d+):(\d+):([\d.]+)/);
 return (+m[1])*3600+(+m[2])*60+(+m[3]);
};
const manifest={voice:'Yna Agalo (ElevenLabs, eleven_v3)',final:true,calls:{}};
for(const [id,call] of Object.entries(CALLS)){
 manifest.calls[id]={};
 for(const [key,node] of Object.entries(call.nodes)){
  const file=join(SOURCE,`${id}-${key}.mp3`);
  if(!existsSync(file)){manifest.final=false;console.warn(`Missing recording: ${file}`);continue;}
  const d=duration(file),total=node.lines.reduce((n,l)=>n+l.length,0);
  let at=0;
  const cues=node.lines.map(text=>{const span=d*text.length/total,cue={start:+at.toFixed(3),end:+(at+span).toFixed(3),text};at+=span;return cue;});
  manifest.calls[id][key]={file,duration:+d.toFixed(3),cues};
 }
}
writeFileSync('assets/media/voice/manifest.json',JSON.stringify(manifest,null,1));
const secs=Object.entries(manifest.calls).map(([k,v])=>`${k}: ${Object.keys(v).length} takes, ${Object.values(v).reduce((n,x)=>n+x.duration,0).toFixed(1)} s`);
console.log(secs.join(' | '),'| final',manifest.final);
