# Inner voice: recording brief

This is the brief for generating the learner's inner voice (for example in Lovable). There are 26 short lines. 4 are recorded; the other 22 show as subtitles only until their audio files exist.

## What the voice is

The learner's own thoughts while they work: a junior digital forensics trainee on their first day, thinking out loud under their breath. It is not a narrator and not a teacher.

- **Who:** one young adult, warm and calm, natural East or West African English. The same voice for every line.
- **How:** quiet and close, as if muttered to oneself. Unhurried. Real hesitation: the "hmm"s, "ahh"s, "okay"s and "..." pauses are part of the line and should be heard. Small relief when something works; mild self-correction when it doesn't, never frustration.
- **Not:** announcer energy, cheerfulness, or reading aloud.
- **Existing recordings** use the ElevenLabs voice *Olamide* with the `eleven_v3` model. If that voice is not available, pick one voice that fits the description above and **re-record all 26 lines**, including the 4 already recorded, so the learner never hears two different people.

## How to deliver the files

1. One MP3 per line, named exactly as in each heading below, saved in `assets/media/voice/thoughts/`. Replace any file already there.
2. Speak **only the words of the line**. The square-bracket parts, such as `[sighs]` or `[short pause]`, are delivery directions. Use them as audio tags if the model supports them (ElevenLabs `eleven_v3` does); otherwise use the *plain words* version and let the punctuation carry the pauses. Never say a bracketed word aloud.
3. Keep each file tight: no more than about a quarter second of silence before or after. Mono, 44.1 kHz, 128 kbps or better. Similar loudness across all files (about -16 LUFS).
4. Do not change the wording. It is matched word for word by the subtitle on screen. To change a line, change it in `src/content/thoughts.js` too.

That is all that is needed: the game plays any file it finds at those names. Optionally, run `node scripts/build-thoughts.mjs` afterwards (needs Node and ffmpeg) to refresh `manifest.json` and list anything still missing.

## The lines

### 1. `message.mp3` (recorded, keep or re-record)

- **When it plays:** Signed in for the first time; a message from Amina has just arrived.
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > [softly] Okay... first day. [short pause] A message from Amina. Let me see what she sent.

- **Plain words** (any other model; also the on-screen subtitle):

  > Okay... first day. A message from Amina. Let me see what she sent.

### 2. `brief.mp3` (recorded, keep or re-record)

- **When it plays:** Amina has asked for a video call.
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > She wants a quick call. [exhales] Right... let’s join.

- **Plain words** (any other model; also the on-screen subtitle):

  > She wants a quick call. Right... let’s join.

### 3. `intake.mp3`

- **When it plays:** Starting the evidence intake: ranking which item is most at risk.
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > [thoughtful] Three items. A text, a photo... and a tape. Hmm. Which one could we lose for good? [short pause] The tape, I think. It wears every time it plays.

- **Plain words** (any other model; also the on-screen subtitle):

  > Three items. A text, a photo... and a tape. Hmm. Which one could we lose for good? The tape, I think. It wears every time it plays.

### 4. `bench.mp3`

- **When it plays:** The evidence drive needs connecting at the bench.
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > [hesitant] The drive isn’t connected yet. And... not straight into the computer, that could write to it. [short pause] Write-blocker first. Yeah.

- **Plain words** (any other model; also the on-screen subtitle):

  > The drive isn’t connected yet. And... not straight into the computer, that could write to it. Write-blocker first. Yeah.

### 5. `acquire.mp3`

- **When it plays:** About to image the whole drive in Evidence Imager.
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > Okay. Image the whole drive first... and verify it. We never touch the original.

- **Plain words** (any other model; also the on-screen subtitle):

  > Okay. Image the whole drive first... and verify it. We never touch the original.

### 6. `export.mp3`

- **When it plays:** The image is verified; next, export working copies.
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > Image verified. [short pause] Now working copies. Those are the only things I actually work on.

- **Plain words** (any other model; also the on-screen subtitle):

  > Image verified. Now working copies. Those are the only things I actually work on.

### 7. `openText.mp3`

- **When it plays:** About to open the witness message.
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > The witness message. Let me open it in the text editor.

- **Plain words** (any other model; also the on-screen subtitle):

  > The witness message. Let me open it in the text editor.

### 8. `fixText.mp3`

- **When it plays:** The message shows garbled characters such as "Ã©".
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > [confused] Wait... "Ã©"? That’s not an é. [short pause] Hmm. The bytes are probably fine... it’s just reading them with the wrong rulebook.

- **Plain words** (any other model; also the on-screen subtitle):

  > Wait... "Ã©"? That’s not an é. Hmm. The bytes are probably fine... it’s just reading them with the wrong rulebook.

### 9. `sendText.mp3`

- **When it plays:** The text reads correctly again; about to send it.
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > [relieved] There. Every character’s back. Saved, read back, fine. Let me send it to Amina.

- **Plain words** (any other model; also the on-screen subtitle):

  > There. Every character’s back. Saved, read back, fine. Let me send it to Amina.

### 10. `openImage.mp3`

- **When it plays:** The photograph has just been released.
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > Now the photo. [short pause] The plate is what matters here.

- **Plain words** (any other model; also the on-screen subtitle):

  > Now the photo. The plate is what matters here.

### 11. `pixels.mp3`

- **When it plays:** About to read one pixel of the number plate.
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > [curious] Let me look at just one pixel of the plate... Three numbers. Red, green, blue. That’s it?

- **Plain words** (any other model; also the on-screen subtitle):

  > Let me look at just one pixel of the plate... Three numbers. Red, green, blue. That’s it?

### 12. `imageSet.mp3`

- **When it plays:** Choosing the export size and print resolution.
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > [thoughtful] Export... how big, though? Smaller loses the plate. Bigger just... makes up pixels. [short pause] Keep what the camera actually caught.

- **Plain words** (any other model; also the on-screen subtitle):

  > Export... how big, though? Smaller loses the plate. Bigger just... makes up pixels. Keep what the camera actually caught.

### 13. `sendImage.mp3`

- **When it plays:** The plate is sharp and matches the source; about to send.
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > Plate’s sharp, and it matches the source. [exhales] Okay, sending.

- **Plain words** (any other model; also the on-screen subtitle):

  > Plate’s sharp, and it matches the source. Okay, sending.

### 14. `bench-tape.mp3`

- **When it plays:** At the bench, about to load the fragile tape.
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > [carefully] The tape. It’s fragile... Load it gently, connect the deck to the interface... then headphones on.

- **Plain words** (any other model; also the on-screen subtitle):

  > The tape. It’s fragile... Load it gently, connect the deck to the interface... then headphones on.

### 15. `capture.mp3`

- **When it plays:** In Audio Recorder, before pressing Record. The tape plays only once.
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > [hesitant] One pass. That’s all I get. [short pause] So the settings have to be right before I press record. Let me listen first.

- **Plain words** (any other model; also the on-screen subtitle):

  > One pass. That’s all I get. So the settings have to be right before I press record. Let me listen first.

### 16. `exportAudio.mp3`

- **When it plays:** The tape is captured; next, a master file.
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > Got it. [exhales] Now a master file. Something that doesn’t throw anything away.

- **Plain words** (any other model; also the on-screen subtitle):

  > Got it. Now a master file. Something that doesn’t throw anything away.

### 17. `sendAudio.mp3`

- **When it plays:** The audio master is checked; about to send.
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > Checked against the capture. Okay... send it over.

- **Plain words** (any other model; also the on-screen subtitle):

  > Checked against the capture. Okay... send it over.

### 18. `handover.mp3`

- **When it plays:** The final handover form.
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > Last part. The handover. [short pause] Check each item... then submit.

- **Plain words** (any other model; also the on-screen subtitle):

  > Last part. The handover. Check each item... then submit.

### 19. `closing.mp3`

- **When it plays:** Amina wants a closing call.
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > [exhales] Amina wants to talk it through. Okay.

- **Plain words** (any other model; also the on-screen subtitle):

  > Amina wants to talk it through. Okay.

### 20. `debrief.mp3` (recorded, keep or re-record)

- **When it plays:** About to read the feedback.
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > [curious] Right... let’s see how I did.

- **Plain words** (any other model; also the on-screen subtitle):

  > Right... let’s see how I did.

### 21. `oops-1.mp3` (recorded, keep or re-record)

- **When it plays:** Just after a refused attempt (one of three, chosen in turn).
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > [sighs] Hmm... no. That’s not it.

- **Plain words** (any other model; also the on-screen subtitle):

  > Hmm... no. That’s not it.

### 22. `oops-2.mp3`

- **When it plays:** Just after a refused attempt.
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > Wait. [short pause] Let me think about that again.

- **Plain words** (any other model; also the on-screen subtitle):

  > Wait. Let me think about that again.

### 23. `oops-3.mp3`

- **When it plays:** Just after a refused attempt.
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > [hesitant] Ahh... okay. Not like that.

- **Plain words** (any other model; also the on-screen subtitle):

  > Ahh... okay. Not like that.

### 24. `yes-1.mp3`

- **When it plays:** A milestone has just been reached (one of three, chosen in turn).
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > [exhales] Okay. Good.

- **Plain words** (any other model; also the on-screen subtitle):

  > Okay. Good.

### 25. `yes-2.mp3`

- **When it plays:** A milestone has just been reached.
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > [relieved] Yes... that worked.

- **Plain words** (any other model; also the on-screen subtitle):

  > Yes... that worked.

### 26. `yes-3.mp3`

- **When it plays:** A milestone has just been reached.
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > [softly] Nice. One more down.

- **Plain words** (any other model; also the on-screen subtitle):

  > Nice. One more down.
