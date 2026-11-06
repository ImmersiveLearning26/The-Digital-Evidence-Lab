// The player's inner voice: a junior engineer thinking out loud. One thought as each task begins, a quick
// self-correction after a refusal, a little relief at each milestone. `say` carries the voice directions for
// the recording (eleven_v3 tags); the subtitle shows the words alone. Recordings: assets/media/voice/thoughts.
export const THOUGHTS = {
  message: '[softly] Okay... first day. [short pause] A message from Amina. Let me see what she sent.',
  brief: 'She wants a quick call. [exhales] Right... let’s join.',
  intake: '[thoughtful] Three items. A text, a photo... and a tape. Hmm. Which one could we lose for good? [short pause] The tape, I think. It wears every time it plays.',
  bench: '[hesitant] The drive isn’t connected yet. And... not straight into the computer, that could write to it. [short pause] Write-blocker first. Yeah.',
  acquire: 'Okay. Image the whole drive first... and verify it. We never touch the original.',
  export: 'Image verified. [short pause] Now working copies. Those are the only things I actually work on.',
  openText: 'The witness message. Let me open it in the text editor.',
  fixText: '[confused] Wait... "Ã©"? That’s not an é. [short pause] Hmm. The bytes are probably fine... it’s just reading them with the wrong rulebook.',
  sendText: '[relieved] There. Every character’s back. Saved, read back, fine. Let me send it to Amina.',
  openImage: 'Now the photo. [short pause] The plate is what matters here.',
  pixels: '[curious] Let me look at just one pixel of the plate... Three numbers. Red, green, blue. That’s it?',
  imageSet: '[thoughtful] Export... how big, though? Smaller loses the plate. Bigger just... makes up pixels. [short pause] Keep what the camera actually caught.',
  sendImage: 'Plate’s sharp, and it matches the source. [exhales] Okay, sending.',
  'bench:tape': '[carefully] The tape. It’s fragile... Load it gently, connect the deck to the interface... then headphones on.',
  capture: '[hesitant] One pass. That’s all I get. [short pause] So the settings have to be right before I press record. Let me listen first.',
  exportAudio: 'Got it. [exhales] Now a master file. Something that doesn’t throw anything away.',
  sendAudio: 'Checked against the capture. Okay... send it over.',
  handover: 'Last part. The handover. [short pause] Check each item... then submit.',
  closing: '[exhales] Amina wants to talk it through. Okay.',
  debrief: '[curious] Right... let’s see how I did.',
  // After a refusal, at most one every so often.
  'oops:1': '[sighs] Hmm... no. That’s not it.',
  'oops:2': 'Wait. [short pause] Let me think about that again.',
  'oops:3': '[hesitant] Ahh... okay. Not like that.',
  // At a milestone.
  'yes:1': '[exhales] Okay. Good.',
  'yes:2': '[relieved] Yes... that worked.',
  'yes:3': '[softly] Nice. One more down.',
};

// The subtitle: the words without the voice directions.
export const subtitle = say => say.replace(/\[[^\]]*\]\s*/g, '').replace(/\s+/g, ' ').trim();
