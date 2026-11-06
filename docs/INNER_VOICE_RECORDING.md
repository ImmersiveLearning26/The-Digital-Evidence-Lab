# Inner voice: recording brief

The learner's inner voice: 133 short lines, 133 recorded. Generated from `src/content/thoughts.js` by `node scripts/build-voice-brief.mjs`; change the lines there, not here.

## What the voice is for

The learner thinking the job through out loud, the way a junior engineer does on their first day with new software. It helps a player who is in the same position: it re-reads what Amina asked, looks for things on screen by the names they have, weighs the choices, and works out what went wrong when something is refused. It is never the software answering back.

- **As a task begins:** what Amina asked, and the plan.
- **Step by step:** when the next control is on screen and the learner pauses, finding it by name and saying why. Each is said once, so the voice gets quieter as the software becomes familiar.
- **After a refusal or a correction:** reading it, and working out the fix. This cuts in over anything else.

## The voice

- **Who:** one young adult, warm and calm, natural African English. The same voice for every line. Recorded so far with the ElevenLabs voice *Olamide*, model `eleven_v3`, stability 0.4.
- **How:** quiet and close, as if muttered to oneself. Unhurried. Real hesitation: the "hmm"s, "okay"s and "..." pauses are part of the line. Mild self-correction when something is refused, never frustration.
- **Not:** announcer energy, cheerfulness, or reading aloud.

## Delivering the files

1. One MP3 per line, named as each heading below, in `assets/media/voice/thoughts/`. Replace any file already there.
2. Speak only the words. Square-bracket parts such as `[thoughtful]` are directions: audio tags for `eleven_v3`, otherwise follow them and let the punctuation carry the pauses. Never say a bracketed word.
3. Names are spelled out for the voice ("U T F eight", "P N G", "zero four one seven"); say them that way. The subtitle shows them as on screen.
4. Tight edges (no more than a quarter second of silence), mono, 44.1 kHz, 128 kbps or better, about -20 LUFS, a little quieter than Amina.
5. The game plays any file it finds at these names. Optionally run `node scripts/build-thoughts.mjs` (Node and ffmpeg) to refresh the manifest and list what is missing.

## As each task begins

### `task-message.mp3`

- **When it plays:** As the task “Read Amina’s message” begins.
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > [softly] Okay... first day. Amina’s sent me something. There’s a notification, bottom right. Let me open the chat.

- **On screen** (the subtitle):

  > Okay... first day. Amina’s sent me something. There’s a notification, bottom right. Let me open the chat.

### `task-brief.mp3`

- **When it plays:** As the task “Join Amina’s briefing” begins.
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > She wants a short briefing first. [short pause] There’s a video call card in the chat... Case zero four one seven briefing. I’ll join that.

- **On screen** (the subtitle):

  > She wants a short briefing first. There’s a video call card in the chat... Case 0417 briefing. I’ll join that.

### `task-intake.mp3`

- **When it plays:** As the task “Complete the evidence intake” begins.
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > Right. She said inspect all three items, rank their risk of loss, then confirm what we’re protecting. So... the intake record first. It’s the card in the chat.

- **On screen** (the subtitle):

  > Right. She said inspect all three items, rank their risk of loss, then confirm what we’re protecting. So... the intake record first. It’s the card in the chat.

### `task-bench.mp3`

- **When it plays:** As the task “Connect the evidence drive” begins.
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > Now the evidence drive. Through the write-blocker, she said. [short pause] That’s not on the computer, that’s at my bench. View equipment... bottom right.

- **On screen** (the subtitle):

  > Now the evidence drive. Through the write-blocker, she said. That’s not on the computer, that’s at my bench. View equipment... bottom right.

### `task-acquire.mp3`

- **When it plays:** As the task “Create a disk image” begins.
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > Drive’s connected. Next, Evidence Imager. She said create a verified image in the evidence store. So I never work on the drive itself... only on the image.

- **On screen** (the subtitle):

  > Drive’s connected. Next, Evidence Imager. She said create a verified image in the evidence store. So I never work on the drive itself... only on the image.

### `task-export.mp3`

- **When it plays:** As the task “Export the working files” begins.
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > Image done, and verified. [short pause] Now working copies out of it. I saw an Export working copies button in the toolbar.

- **On screen** (the subtitle):

  > Image done, and verified. Now working copies out of it. I saw an Export working copies button in the toolbar.

### `task-openText.mp3`

- **When it plays:** As the task “Open the witness message” begins.
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > The witness message first. She said open witness working dot T X T in Text Editor. So... Text Editor, then Open, then find that file.

- **On screen** (the subtitle):

  > The witness message first. She said open witness_working.txt in Text Editor. So... Text Editor, then Open, then find that file.

### `task-fixText.mp3`

- **When it plays:** As the task “Make the text read correctly” begins.
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > [confused] Hmm... Ch, A tilde, copyright... bet? That should be an é. [short pause] She did say, if it doesn’t read right, the bytes are fine... it’s how they’re read. That sounds like the Encoding menu.

- **On screen** (the subtitle):

  > Hmm... “ChÃ©bet”? That should be an é. She did say, if it doesn’t read right, the bytes are fine... it’s how they’re read. That sounds like the Encoding menu.

### `task-sendText.mp3`

- **When it plays:** As the task “Send the text file to Amina” begins.
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > [relieved] There. Every character’s back, and it read back the same after saving. Now it goes to Amina... in the chat, with the paperclip.

- **On screen** (the subtitle):

  > There. Every character’s back, and it read back the same after saving. Now it goes to Amina... in the chat, with the paperclip.

### `task-openImage.mp3`

- **When it plays:** As the task “Open the photograph” begins.
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > Text approved. Now the photograph. She said open cctv working dot J P G in Image Editor. File, then Open, I guess.

- **On screen** (the subtitle):

  > Text approved. Now the photograph. She said open cctv_working.jpg in Image Editor. File, then Open, I guess.

### `task-pixels.mp3`

- **When it plays:** As the task “Read a pixel” begins.
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > Next she wants one pixel of the plate. [short pause] That’s in the Case Record... there should be an Image tab.

- **On screen** (the subtitle):

  > Next she wants one pixel of the plate. That’s in the Case Record... there should be an Image tab.

### `task-imageSet.mp3`

- **When it plays:** As the task “Export the photograph” begins.
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > So one pixel is just three numbers. Okay. Now the export... a size and print resolution we can actually use, she said. Back to Image Editor. File, Export As.

- **On screen** (the subtitle):

  > So one pixel is just three numbers. Okay. Now the export... a size and print resolution we can actually use, she said. Back to Image Editor. File, Export As.

### `task-sendImage.mp3`

- **When it plays:** As the task “Send the image to Amina” begins.
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > Exported, and checked against the source. Now the P N G goes to Amina. Paperclip again.

- **On screen** (the subtitle):

  > Exported, and checked against the source. Now the PNG goes to Amina. Paperclip again.

### `task-benchTape.mp3`

- **When it plays:** As the task “Prepare the tape” begins.
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > Photo’s approved. Now the tape deck’s free. [short pause] Prepare the microcassette and the audio interface at the bench, she said. View equipment again.

- **On screen** (the subtitle):

  > Photo’s approved. Now the tape deck’s free. Prepare the microcassette and the audio interface at the bench, she said. View equipment again.

### `task-capture.mp3`

- **When it plays:** As the task “Set up and record” begins.
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > Tape’s ready. Now Audio Recorder. [short pause] She said listen to the settings before I record. The tape only plays once... so I can’t just guess.

- **On screen** (the subtitle):

  > Tape’s ready. Now Audio Recorder. She said listen to the settings before I record. The tape only plays once... so I can’t just guess.

### `task-exportAudio.mp3`

- **When it plays:** As the task “Export the audio master” begins.
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > [exhales] Captured. Now a master file. File, Export Audio. I want something that doesn’t throw any of it away.

- **On screen** (the subtitle):

  > Captured. Now a master file. File, Export Audio. I want something that doesn’t throw any of it away.

### `task-sendAudio.mp3`

- **When it plays:** As the task “Send the audio to Amina” begins.
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > Master’s exported and checked. Send it to Amina... statement master, the FLAC one.

- **On screen** (the subtitle):

  > Master’s exported and checked. Send it to Amina... statement master, the FLAC one.

### `task-handover.mp3`

- **When it plays:** As the task “Complete the final handover” begins.
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > All three approved. Now the final handover. Check each item against what it needed, and confirm the originals are unchanged. The card’s in the chat.

- **On screen** (the subtitle):

  > All three approved. Now the final handover. Check each item against what it needed, and confirm the originals are unchanged. The card’s in the chat.

### `task-closing.mp3`

- **When it plays:** As the task “Join Amina’s handover review” begins.
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > Handover’s in. [short pause] Amina wants to talk it through. Another call card... let me join.

- **On screen** (the subtitle):

  > Handover’s in. Amina wants to talk it through. Another call card... let me join.

### `task-debrief.mp3`

- **When it plays:** As the task “Read your feedback” begins.
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > She’s sent my feedback. Let me open the record and see how I did.

- **On screen** (the subtitle):

  > She’s sent my feedback. Let me open the record and see how I did.

## Finding the way, step by step

### `step-dock.mp3`

- **When it plays:** When this is the next thing to click and the learner pauses (any task).
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > The chat’s folded away on the right. I’ll open it.

- **On screen** (the subtitle):

  > The chat’s folded away on the right. I’ll open it.

### `step-viewer.mp3`

- **When it plays:** When this is the next thing to click and the learner pauses (any task).
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > Okay, I’ve read that one. Close it.

- **On screen** (the subtitle):

  > Okay, I’ve read that one. Close it.

### `step-start-ftk.mp3`

- **When it plays:** When this is the next thing to click and the learner pauses (any task).
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > Where’s Evidence Imager... probably in the Start menu. Bottom of the screen.

- **On screen** (the subtitle):

  > Where’s Evidence Imager... probably in the Start menu. Bottom of the screen.

### `step-start-notepad.mp3`

- **When it plays:** When this is the next thing to click and the learner pauses (any task).
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > Text Editor. Start menu again.

- **On screen** (the subtitle):

  > Text Editor. Start menu again.

### `step-start-gimp.mp3`

- **When it plays:** When this is the next thing to click and the learner pauses (any task).
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > Image Editor... Start menu.

- **On screen** (the subtitle):

  > Image Editor... Start menu.

### `step-start-case.mp3`

- **When it plays:** When this is the next thing to click and the learner pauses (any task).
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > The Case Record’s an app too, I think. Start menu.

- **On screen** (the subtitle):

  > The Case Record’s an app too, I think. Start menu.

### `step-start-audacity.mp3`

- **When it plays:** When this is the next thing to click and the learner pauses (any task).
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > Audio Recorder. Start.

- **On screen** (the subtitle):

  > Audio Recorder. Start.

### `step-pick-ftk.mp3`

- **When it plays:** When this is the next thing to click and the learner pauses (any task).
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > There. Evidence Imager.

- **On screen** (the subtitle):

  > There. Evidence Imager.

### `step-pick-notepad.mp3`

- **When it plays:** When this is the next thing to click and the learner pauses (any task).
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > Text Editor, there.

- **On screen** (the subtitle):

  > Text Editor, there.

### `step-pick-gimp.mp3`

- **When it plays:** When this is the next thing to click and the learner pauses (any task).
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > Image Editor.

- **On screen** (the subtitle):

  > Image Editor.

### `step-pick-case.mp3`

- **When it plays:** When this is the next thing to click and the learner pauses (any task).
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > Case Record.

- **On screen** (the subtitle):

  > Case Record.

### `step-pick-audacity.mp3`

- **When it plays:** When this is the next thing to click and the learner pauses (any task).
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > Audio Recorder... the red one.

- **On screen** (the subtitle):

  > Audio Recorder... the red one.

### `step-switch-gimp.mp3`

- **When it plays:** When this is the next thing to click and the learner pauses (any task).
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > Image Editor’s still open. Down on the taskbar.

- **On screen** (the subtitle):

  > Image Editor’s still open. Down on the taskbar.

### `step-switch-notepad.mp3`

- **When it plays:** When this is the next thing to click and the learner pauses (any task).
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > Text Editor’s still open, on the taskbar.

- **On screen** (the subtitle):

  > Text Editor’s still open, on the taskbar.

### `step-switch-ftk.mp3`

- **When it plays:** When this is the next thing to click and the learner pauses (any task).
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > Evidence Imager, on the taskbar.

- **On screen** (the subtitle):

  > Evidence Imager, on the taskbar.

### `step-switch-case.mp3`

- **When it plays:** When this is the next thing to click and the learner pauses (any task).
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > The Case Record’s open already. Taskbar.

- **On screen** (the subtitle):

  > The Case Record’s open already. Taskbar.

### `step-switch-audacity.mp3`

- **When it plays:** When this is the next thing to click and the learner pauses (any task).
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > Audio Recorder, on the taskbar.

- **On screen** (the subtitle):

  > Audio Recorder, on the taskbar.

### `step-toast.mp3`

- **When it plays:** When this is the next thing to click and the learner pauses (“Read Amina’s message”).
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > There’s the notification... Open chat.

- **On screen** (the subtitle):

  > There’s the notification... Open chat.

### `step-folder.mp3`

- **When it plays:** When this is the next thing to click and the learner pauses (“Read Amina’s message”).
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > She’s shared a folder. Case zero four one seven, Intake. Let me look at what’s in it.

- **On screen** (the subtitle):

  > She’s shared a folder. Case 0417, Intake. Let me look at what’s in it.

### `step-briefCard.mp3`

- **When it plays:** When this is the next thing to click and the learner pauses (“Join Amina’s briefing”).
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > The briefing card... Join.

- **On screen** (the subtitle):

  > The briefing card... Join.

### `step-joinNow.mp3`

- **When it plays:** When this is the next thing to click and the learner pauses (“Join Amina’s briefing”, “Join Amina’s handover review”).
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > Camera preview... okay. Join now.

- **On screen** (the subtitle):

  > Camera preview... okay. Join now.

### `step-intakeCard.mp3`

- **When it plays:** When this is the next thing to click and the learner pauses (“Complete the evidence intake”).
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > There. Case record, Evidence intake.

- **On screen** (the subtitle):

  > There. Case record, Evidence intake.

### `step-rank.mp3`

- **When it plays:** When this is the next thing to click and the learner pauses (“Complete the evidence intake”).
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > [thoughtful] Highest risk, middle, lowest. Hmm. Which one could we lose for good? The tape wears every time it plays... the phone’s storage is failing... the photo’s stable.

- **On screen** (the subtitle):

  > Highest risk, middle, lowest. Hmm. Which one could we lose for good? The tape wears every time it plays... the phone’s storage is failing... the photo’s stable.

### `step-recordRank.mp3`

- **When it plays:** When this is the next thing to click and the learner pauses (“Complete the evidence intake”).
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > Okay, I think that’s right. Record ranking.

- **On screen** (the subtitle):

  > Okay, I think that’s right. Record ranking.

### `step-objective.mp3`

- **When it plays:** When this is the next thing to click and the learner pauses (“Complete the evidence intake”).
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > What are we protecting across all three? Not the smallest files... not making it look better. Keeping the original intact, and verifiable.

- **On screen** (the subtitle):

  > What are we protecting across all three? Not the smallest files... not making it look better. Keeping the original intact, and verifiable.

### `step-confirmIntake.mp3`

- **When it plays:** When this is the next thing to click and the learner pauses (“Complete the evidence intake”).
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > Confirm intake.

- **On screen** (the subtitle):

  > Confirm intake.

### `step-benchButton.mp3`

- **When it plays:** When this is the next thing to click and the learner pauses (“Connect the evidence drive”).
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > View equipment. Bottom right, next to the clock.

- **On screen** (the subtitle):

  > View equipment. Bottom right, next to the clock.

### `step-create.mp3`

- **When it plays:** When this is the next thing to click and the learner pauses (“Create a disk image”).
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > Create Disk Image, top left. That should be it.

- **On screen** (the subtitle):

  > Create Disk Image, top left. That should be it.

### `step-source.mp3`

- **When it plays:** When this is the next thing to click and the learner pauses (“Create a disk image”).
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > What kind of source... it’s the whole drive, not a folder or one file. Physical Drive. Next.

- **On screen** (the subtitle):

  > What kind of source... it’s the whole drive, not a folder or one file. Physical Drive. Next.

### `step-drive.mp3`

- **When it plays:** When this is the next thing to click and the learner pauses (“Create a disk image”).
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > [carefully] Which drive... not the system drive, that’s the computer itself. The one behind the write-blocker. Physical drive one. Next.

- **On screen** (the subtitle):

  > Which drive... not the system drive, that’s the computer itself. The one behind the write-blocker. PHYSICALDRIVE1. Next.

### `step-add.mp3`

- **When it plays:** When this is the next thing to click and the learner pauses (“Create a disk image”).
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > The destination’s empty. I need to add where the image goes. Add.

- **On screen** (the subtitle):

  > The destination’s empty. I need to add where the image goes. Add.

### `step-destination.mp3`

- **When it plays:** When this is the next thing to click and the learner pauses (“Create a disk image”).
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > Image type E zero one. And the folder is the evidence store... not the drive I’m copying from. Okay. Finish.

- **On screen** (the subtitle):

  > Image type E01. And the folder is the evidence store... not the drive I’m copying from. Okay. Finish.

### `step-verify.mp3`

- **When it plays:** When this is the next thing to click and the learner pauses (“Create a disk image”).
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > Verify images after they are created... yes. Amina said a verified image. Tick that.

- **On screen** (the subtitle):

  > Verify images after they are created... yes. Amina said a verified image. Tick that.

### `step-start.mp3`

- **When it plays:** When this is the next thing to click and the learner pauses (“Create a disk image”).
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > Source, destination, verify. [short pause] I think that’s everything. Start.

- **On screen** (the subtitle):

  > Source, destination, verify. I think that’s everything. Start.

### `step-exportCopies.mp3`

- **When it plays:** When this is the next thing to click and the learner pauses (“Export the working files”).
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > Export working copies... there, in the toolbar.

- **On screen** (the subtitle):

  > Export working copies... there, in the toolbar.

### `step-folderOk.mp3`

- **When it plays:** When this is the next thing to click and the learner pauses (“Export the working files”).
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > Where do they go... the Working folder. The evidence store is read-only, and it should be. OK.

- **On screen** (the subtitle):

  > Where do they go... the Working folder. The evidence store is read-only, and it should be. OK.

### `step-npOpen.mp3`

- **When it plays:** When this is the next thing to click and the learner pauses (“Open the witness message”, “Make the text read correctly”).
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > Open, in the toolbar.

- **On screen** (the subtitle):

  > Open, in the toolbar.

### `step-pickText.mp3`

- **When it plays:** When this is the next thing to click and the learner pauses (“Open the witness message”, “Make the text read correctly”).
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > witness working dot T X T... in the Working folder.

- **On screen** (the subtitle):

  > witness_working.txt... in the Working folder.

### `step-confirmOpen.mp3`

- **When it plays:** When this is the next thing to click and the learner pauses (“Open the witness message”, “Make the text read correctly”, “Open the photograph”).
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > That’s the one. Open.

- **On screen** (the subtitle):

  > That’s the one. Open.

### `step-encoding.mp3`

- **When it plays:** When this is the next thing to click and the learner pauses (“Make the text read correctly”).
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > The text’s garbled, but the file’s fine. So it’s being read wrong. There’s an Encoding menu up top... let me look.

- **On screen** (the subtitle):

  > The text’s garbled, but the file’s fine. So it’s being read wrong. There’s an Encoding menu up top... let me look.

### `step-encodings.mp3`

- **When it plays:** When this is the next thing to click and the learner pauses (“Make the text read correctly”).
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > [thoughtful] ANSI... U T F eight... Hmm. Those symbols and the emoji need more than one byte each. ANSI only has one. U T F eight, then.

- **On screen** (the subtitle):

  > ANSI... UTF-8... Hmm. Those symbols and the emoji need more than one byte each. ANSI only has one. UTF-8, then.

### `step-save.mp3`

- **When it plays:** When this is the next thing to click and the learner pauses (“Make the text read correctly”).
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > That reads properly now. Save... and it reads it back after saving. Good.

- **On screen** (the subtitle):

  > That reads properly now. Save... and it reads it back after saving. Good.

### `step-clip.mp3`

- **When it plays:** When this is the next thing to click and the learner pauses (“Send the text file to Amina”, “Send the image to Amina”, “Send the audio to Amina”).
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > The paperclip, bottom of the chat, to attach it.

- **On screen** (the subtitle):

  > The paperclip, bottom of the chat, to attach it.

### `step-pickTextSend.mp3`

- **When it plays:** When this is the next thing to click and the learner pauses (“Send the text file to Amina”).
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > witness working dot T X T.

- **On screen** (the subtitle):

  > witness_working.txt.

### `step-send.mp3`

- **When it plays:** When this is the next thing to click and the learner pauses (“Send the text file to Amina”, “Send the image to Amina”, “Send the audio to Amina”).
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > It’s attached. Send.

- **On screen** (the subtitle):

  > It’s attached. Send.

### `step-fileMenu.mp3`

- **When it plays:** When this is the next thing to click and the learner pauses (“Open the photograph”).
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > File, top left.

- **On screen** (the subtitle):

  > File, top left.

### `step-giOpen.mp3`

- **When it plays:** When this is the next thing to click and the learner pauses (“Open the photograph”).
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > Open...

- **On screen** (the subtitle):

  > Open...

### `step-pickJpg.mp3`

- **When it plays:** When this is the next thing to click and the learner pauses (“Open the photograph”).
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > cctv working... the J P G.

- **On screen** (the subtitle):

  > cctv working... the JPG.

### `step-imageTab.mp3`

- **When it plays:** When this is the next thing to click and the learner pauses (“Read a pixel”).
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > There’s an Image tab at the top.

- **On screen** (the subtitle):

  > There’s an Image tab at the top.

### `step-sample.mp3`

- **When it plays:** When this is the next thing to click and the learner pauses (“Read a pixel”).
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > Number plate... Sample. That reads one pixel straight from the plate.

- **On screen** (the subtitle):

  > Number plate... Sample. That reads one pixel straight from the plate.

### `step-exportMenu.mp3`

- **When it plays:** When this is the next thing to click and the learner pauses (“Export the photograph”).
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > File... I’m looking for Export As.

- **On screen** (the subtitle):

  > File... I’m looking for Export As.

### `step-exportAs.mp3`

- **When it plays:** When this is the next thing to click and the learner pauses (“Export the photograph”).
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > Export As.

- **On screen** (the subtitle):

  > Export As.

### `step-exportGrid.mp3`

- **When it plays:** When this is the next thing to click and the learner pauses (“Export the photograph”).
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > [thoughtful] Size... six forty is tiny, the plate would be a smudge. Eight thousand just invents pixels. Four thousand is what the camera actually took. [short pause] And print, three hundred P P I... thirteen by ten inches. That covers the print. Then a reason, under Why these settings.

- **On screen** (the subtitle):

  > Size... 640 is tiny, the plate would be a smudge. Eight thousand just invents pixels. Four thousand is what the camera actually took. And print, three hundred PPI... thirteen by ten inches. That covers the print. Then a reason, under Why these settings.

### `step-exportOk.mp3`

- **When it plays:** When this is the next thing to click and the learner pauses (“Export the photograph”).
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > Size, resolution, reason. Export.

- **On screen** (the subtitle):

  > Size, resolution, reason. Export.

### `step-pickPng.mp3`

- **When it plays:** When this is the next thing to click and the learner pauses (“Send the image to Amina”).
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > cctv working... the P N G this time, not the J P G.

- **On screen** (the subtitle):

  > cctv working... the PNG this time, not the JPG.

### `step-auSetup.mp3`

- **When it plays:** When this is the next thing to click and the learner pauses (“Set up and record”).
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > [hesitant] Sample rate and bit depth. Eight kilohertz, eight-bit right now... that sounds low. There’s a little play button next to each one. Let me listen before I decide.

- **On screen** (the subtitle):

  > Sample rate and bit depth. Eight kilohertz, eight-bit right now... that sounds low. There’s a little play button next to each one. Let me listen before I decide.

### `step-auDevice.mp3`

- **When it plays:** When this is the next thing to click and the learner pauses (“Set up and record”).
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > Recording device says choose input. Not the built-in microphone, it can’t hear the tape. The U S B Audio Interface.

- **On screen** (the subtitle):

  > Recording device says choose input. Not the built-in microphone, it can’t hear the tape. The USB Audio Interface.

### `step-record.mp3`

- **When it plays:** When this is the next thing to click and the learner pauses (“Set up and record”).
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > [carefully] Settings set, interface selected. One pass. [short pause] Okay. Record.

- **On screen** (the subtitle):

  > Settings set, interface selected. One pass. Okay. Record.

### `step-auExportMenu.mp3`

- **When it plays:** When this is the next thing to click and the learner pauses (“Export the audio master”).
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > File... Export Audio.

- **On screen** (the subtitle):

  > File... Export Audio.

### `step-auExport.mp3`

- **When it plays:** When this is the next thing to click and the learner pauses (“Export the audio master”).
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > Export Audio.

- **On screen** (the subtitle):

  > Export Audio.

### `step-auWhy.mp3`

- **When it plays:** When this is the next thing to click and the learner pauses (“Export the audio master”).
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > [thoughtful] Format... MP3’s smaller, but it throws sound away. FLAC is lossless, and still compressed. And the reason... lossless, so nothing heard is thrown away.

- **On screen** (the subtitle):

  > Format... MP3’s smaller, but it throws sound away. FLAC is lossless, and still compressed. And the reason... lossless, so nothing heard is thrown away.

### `step-auOk.mp3`

- **When it plays:** When this is the next thing to click and the learner pauses (“Export the audio master”).
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > Export.

- **On screen** (the subtitle):

  > Export.

### `step-pickFlac.mp3`

- **When it plays:** When this is the next thing to click and the learner pauses (“Send the audio to Amina”).
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > statement master... the FLAC.

- **On screen** (the subtitle):

  > statement master... the FLAC.

### `step-handoverCard.mp3`

- **When it plays:** When this is the next thing to click and the learner pauses (“Complete the final handover”).
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > Case record, Final handover.

- **On screen** (the subtitle):

  > Case record, Final handover.

### `step-judgements.mp3`

- **When it plays:** When this is the next thing to click and the learner pauses (“Complete the final handover”).
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > [thoughtful] Five judgements. Is the text readable... is the image detail enough... is the audio suitable... are the originals unchanged... and is it all within the allocation. Let me be honest about each one.

- **On screen** (the subtitle):

  > Five judgements. Is the text readable... is the image detail enough... is the audio suitable... are the originals unchanged... and is it all within the allocation. Let me be honest about each one.

### `step-submit.mp3`

- **When it plays:** When this is the next thing to click and the learner pauses (“Complete the final handover”).
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > All five marked. Submit handover.

- **On screen** (the subtitle):

  > All five marked. Submit handover.

### `step-closingCard.mp3`

- **When it plays:** When this is the next thing to click and the learner pauses (“Join Amina’s handover review”).
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > The review call card. Join.

- **On screen** (the subtitle):

  > The review call card. Join.

### `step-debriefCard.mp3`

- **When it plays:** When this is the next thing to click and the learner pauses (“Read your feedback”).
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > There’s my feedback.

- **On screen** (the subtitle):

  > There’s my feedback.

### `step-finish.mp3`

- **When it plays:** When this is the next thing to click and the learner pauses (“Read your feedback”).
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > [exhales] Okay. Finish.

- **On screen** (the subtitle):

  > Okay. Finish.

## At the bench

### `bench-power.mp3`

- **When it plays:** At the bench, before switching the computer on.
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > The computer’s off. Power button on the tower, first.

- **On screen** (the subtitle):

  > The computer’s off. Power button on the tower, first.

### `bench-blocker.mp3`

- **When it plays:** At the bench, before connecting the write-blocker.
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > [thoughtful] The write-blocker. It sits between the drive and the computer, so nothing can write back to the drive. That goes in first.

- **On screen** (the subtitle):

  > The write-blocker. It sits between the drive and the computer, so nothing can write back to the drive. That goes in first.

### `bench-drive.mp3`

- **When it plays:** At the bench, before connecting the evidence drive.
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > Now the evidence drive... into the write-blocker. Not straight into the computer.

- **On screen** (the subtitle):

  > Now the evidence drive... into the write-blocker. Not straight into the computer.

### `bench-tape.mp3`

- **When it plays:** At the bench, before loading the tape.
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > [carefully] The tape. It’s fragile... load it gently.

- **On screen** (the subtitle):

  > The tape. It’s fragile... load it gently.

### `bench-interface.mp3`

- **When it plays:** At the bench, before connecting the audio interface.
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > The audio interface. The deck plugs into that, and that goes to the computer.

- **On screen** (the subtitle):

  > The audio interface. The deck plugs into that, and that goes to the computer.

### `bench-headphones.mp3`

- **When it plays:** At the bench, before putting the headphones on.
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > Headphones on, so I can hear what’s being captured.

- **On screen** (the subtitle):

  > Headphones on, so I can hear what’s being captured.

### `bench-use.mp3`

- **When it plays:** At the bench, before going back to the computer.
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > That’s everything here. Back to the computer.

- **On screen** (the subtitle):

  > That’s everything here. Back to the computer.

## Working out what went wrong

### `fix-riskTextFirst.mp3`

- **When it plays:** After Amina or the software says: “The phone is at risk too, but the tape wears with every playback. Think about which loss cannot be undone.”
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > [thoughtful] Hmm. She says the phone’s at risk too, but the tape wears every time it’s played. Which loss can’t be undone... the tape. Move that up.

- **On screen** (the subtitle):

  > Hmm. She says the phone’s at risk too, but the tape wears every time it’s played. Which loss can’t be undone... the tape. Move that up.

### `fix-riskImageMiddle.mp3`

- **When it plays:** After Amina or the software says: “Tape first makes sense. The degrading phone is more vulnerable than the stable photograph.”
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > Tape first was right. But the phone’s failing and the photo’s stable... so the text goes in the middle. Photo last.

- **On screen** (the subtitle):

  > Tape first was right. But the phone’s failing and the photo’s stable... so the text goes in the middle. Photo last.

### `fix-riskAudioLast.mp3`

- **When it plays:** After Amina or the software says: “If the tape fails, we may not get another chance. You can revise your ranking.”
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > Tape last... no. If the tape fails, we might not get another chance. That’s the highest risk.

- **On screen** (the subtitle):

  > Tape last... no. If the tape fails, we might not get another chance. That’s the highest risk.

### `fix-riskImageFirst.mp3`

- **When it plays:** After Amina or the software says: “The photograph is the stable item here. The tape and the failing phone both need more care than it does.”
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > The photo’s the stable one. It shouldn’t be first... the tape and the phone need more care.

- **On screen** (the subtitle):

  > The photo’s the stable one. It shouldn’t be first... the tape and the phone need more care.

### `fix-objectiveSmall.mp3`

- **When it plays:** After Amina or the software says: “Careful. Shrinking everything leads to lossy shortcuts, and that loss is permanent.”
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > Shrinking everything... right, that means lossy shortcuts, and that loss is permanent. Keep the original intact and verifiable.

- **On screen** (the subtitle):

  > Shrinking everything... right, that means lossy shortcuts, and that loss is permanent. Keep the original intact and verifiable.

### `fix-objectiveEnhance.mp3`

- **When it plays:** After Amina or the software says: “We reveal what's there. We never add to it.”
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > We reveal what’s there. We never add to it. So not clearer... intact and verifiable.

- **On screen** (the subtitle):

  > We reveal what’s there. We never add to it. So not clearer... intact and verifiable.

### `fix-objectiveCommon.mp3`

- **When it plays:** After Amina or the software says: “Each media type needs its own representation. One common format would not serve all three.”
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > One format for all three won’t work. Each one needs its own. [short pause] So... keeping the originals intact.

- **On screen** (the subtitle):

  > One format for all three won’t work. Each one needs its own. So... keeping the originals intact.

### `fix-objectiveWrong.mp3`

- **When it plays:** After Amina or the software says: “Keep the original information intact and verifiable. Small files and stronger-looking results are not enough.”
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > Not that one. What matters is the original, intact and verifiable, inside the quota.

- **On screen** (the subtitle):

  > Not that one. What matters is the original, intact and verifiable, inside the quota.

### `fix-noBlocker.mp3`

- **When it plays:** After Amina or the software says: “Connect through the write-blocker first. We need to protect the source from changes.”
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > Through the write-blocker first. Right... so the drive can’t be changed. Back to the bench.

- **On screen** (the subtitle):

  > Through the write-blocker first. Right... so the drive can’t be changed. Back to the bench.

### `fix-sourceAsDestination.mp3`

- **When it plays:** After Amina or the software says: “Choose the evidence store as the destination. Do not write back to the source drive.”
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > Not back onto the source drive. The image goes to the evidence store.

- **On screen** (the subtitle):

  > Not back onto the source drive. The image goes to the evidence store.

### `fix-wrongSourceDrive.mp3`

- **When it plays:** After Amina or the software says: “That is the workstation system drive. Choose the protected evidence drive for this case.”
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > That’s the computer’s own system drive. I need the evidence drive, the one behind the write-blocker.

- **On screen** (the subtitle):

  > That’s the computer’s own system drive. I need the evidence drive, the one behind the write-blocker.

### `fix-notVerified.mp3`

- **When it plays:** After Amina or the software says: “The copy has not passed verification. Check the source connection and complete the verification before exporting working files.”
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > It hasn’t passed verification. I need Verify images ticked... and the image made again.

- **On screen** (the subtitle):

  > It hasn’t passed verification. I need Verify images ticked... and the image made again.

### `fix-storeReadOnly.mp3`

- **When it plays:** After a refusal that says something like “evidence store is read-only”.
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > The evidence store is read-only. Of course. Working files go in the Working folder.

- **On screen** (the subtitle):

  > The evidence store is read-only. Of course. Working files go in the Working folder.

### `fix-wrongDecoding.mp3`

- **When it plays:** After Amina or the software says: “The bytes may be intact, but the viewer is using the wrong decoding. Check how it reads the saved file.”
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > [thoughtful] She says the bytes are fine, but it’s reading them wrong. So I saved it while it still looked garbled. Encoding menu... U T F eight. Then save again.

- **On screen** (the subtitle):

  > She says the bytes are fine, but it’s reading them wrong. So I saved it while it still looked garbled. Encoding menu... UTF-8. Then save again.

### `fix-asciiLoss.mp3`

- **When it plays:** After Amina or the software says: “Some characters have become question marks. Return to the preserved text and choose an encoding that can keep every character.”
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > Question marks... ASCII can’t hold those characters. I need an encoding that keeps every one of them. U T F eight.

- **On screen** (the subtitle):

  > Question marks... ASCII can’t hold those characters. I need an encoding that keeps every one of them. UTF-8.

### `fix-latin1Loss.mp3`

- **When it plays:** After Amina or the software says: “The accent survives, but the symbols and emoji do not. Check the preview against the source.”
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > The accent’s okay, but the emoji and the symbols are gone. Latin one isn’t enough. U T F eight should keep everything.

- **On screen** (the subtitle):

  > The accent’s okay, but the emoji and the symbols are gone. Latin one isn’t enough. UTF-8 should keep everything.

### `fix-staleFile.mp3`

- **When it plays:** After Amina or the software says: “This isn't the verified version. Save your current work and attach that file.”
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > Not the verified version... I must have attached an older save. Save first, then attach it again.

- **On screen** (the subtitle):

  > Not the verified version... I must have attached an older save. Save first, then attach it again.

### `fix-imageTooLow.mp3`

- **When it plays:** After Amina or the software says: “The plate has lost useful detail. Compare this output with the original-resolution working copy.”
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > The plate’s lost detail. Six forty is too small. I need the full four thousand pixels... File, Export As again.

- **On screen** (the subtitle):

  > The plate’s lost detail. Six forty is too small. I need the full four thousand pixels... File, Export As again.

### `fix-imageUpscaled.mp3`

- **When it plays:** After Amina or the software says: “Extra pixels have not recovered extra evidence. Return to the original dimensions.”
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > Extra pixels don’t add evidence. They’re just made up. Back to four thousand, the original size.

- **On screen** (the subtitle):

  > Extra pixels don’t add evidence. They’re just made up. Back to four thousand, the original size.

### `fix-ppiConfused.mp3`

- **When it plays:** After Amina or the software says: “PPI controls print density. Changing it alone cannot add image detail.”
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > P P I only changes how densely it prints. It doesn’t add any detail. The pixel size is what matters.

- **On screen** (the subtitle):

  > PPI only changes how densely it prints. It doesn’t add any detail. The pixel size is what matters.

### `fix-imageOverBudget.mp3`

- **When it plays:** After Amina or the software says: “This image exceeds its 100 MB allocation. Keep the detail the task needs without enlarging beyond the source.”
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > Too big for the hundred megabytes. I went bigger than the source... back to the original size.

- **On screen** (the subtitle):

  > Too big for the hundred megabytes. I went bigger than the source... back to the original size.

### `fix-imageRationale.mp3`

- **When it plays:** After Amina or the software says: “Tell me why you chose those settings. Export again, pick a reason under Why these settings?, then send it.”
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > She wants a reason for the settings. That’s the Why these settings part, in the export window. Export again, pick one... then send.

- **On screen** (the subtitle):

  > She wants a reason for the settings. That’s the Why these settings part, in the export window. Export again, pick one... then send.

### `fix-samplePlate.mp3`

- **When it plays:** After a refusal that says something like “Sample from the original-resolution”.
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > Wrong copy. It has to be the original-resolution one. File, Revert... then sample again.

- **On screen** (the subtitle):

  > Wrong copy. It has to be the original-resolution one. File, Revert... then sample again.

### `fix-audio8k.mp3`

- **When it plays:** After Amina or the software says: “The buzzer's important high-frequency content is missing. The sampling rate is too low for this task.”
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > [thoughtful] The buzzer’s high sounds are missing. Eight kilohertz only captures up to four. The buzzer goes up to about ten... so forty-four point one.

- **On screen** (the subtitle):

  > The buzzer’s high sounds are missing. Eight kilohertz only captures up to four. The buzzer goes up to about ten... so 44.1.

### `fix-audio16k.mp3`

- **When it plays:** After Amina or the software says: “Speech is clearer, but the buzzer is not fully represented. Compare with 44.1 kHz.”
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > Sixteen kilohertz... the speech is fine, but the buzzer still gets cut off above eight. Forty-four point one, then.

- **On screen** (the subtitle):

  > Sixteen kilohertz... the speech is fine, but the buzzer still gets cut off above eight. Forty-four point one, then.

### `fix-audio8bit.mp3`

- **When it plays:** After Amina or the software says: “The low-level speech is harder to distinguish. Compare the quantisation depth.”
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > Eight-bit... the quiet speech gets rough. Only two hundred and fifty-six levels. Sixteen-bit.

- **On screen** (the subtitle):

  > Eight-bit... the quiet speech gets rough. Only two hundred and fifty-six levels. Sixteen-bit.

### `fix-audioExcess.mp3`

- **When it plays:** After Amina or the software says: “That uses more storage without a useful improvement in this example. Compare it with 44.1 kHz and 16-bit.”
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > Ninety-six, or twenty-four bit... it’s bigger, but it adds nothing this tape actually has. Forty-four point one and sixteen-bit is enough.

- **On screen** (the subtitle):

  > Ninety-six, or twenty-four bit... it’s bigger, but it adds nothing this tape actually has. Forty-four point one and sixteen-bit is enough.

### `fix-audioMp3.mp3`

- **When it plays:** After Amina or the software says: “Keep a lossless master. MP3 discards information and can only serve as a separate listening copy here.”
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > MP3 throws information away. She wants a lossless master. FLAC... File, Export Audio again.

- **On screen** (the subtitle):

  > MP3 throws information away. She wants a lossless master. FLAC... File, Export Audio again.

### `fix-audioRationale.mp3`

- **When it plays:** After Amina or the software says: “Tell me why you chose that format. Export again, pick a reason under Why these settings?, then send it.”
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > A short reason for the audio settings. That’s Why these settings, in the Export Audio window. Export again, pick the reason, send.

- **On screen** (the subtitle):

  > A short reason for the audio settings. That’s Why these settings, in the Export Audio window. Export again, pick the reason, send.

### `fix-audioOverBudget.mp3`

- **When it plays:** After Amina or the software says: “This exceeds the audio allocation. Review the settings while keeping the speech and buzzer.”
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > Too big for the audio allocation. Lossless at forty-four point one, sixteen-bit, should fit.

- **On screen** (the subtitle):

  > Too big for the audio allocation. Lossless at 44.1, sixteen-bit, should fit.

### `fix-selectInterface.mp3`

- **When it plays:** After a refusal that says something like “USB Audio Interface as the recording device”.
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > It’s not listening to the right thing. Recording Device... the U S B Audio Interface.

- **On screen** (the subtitle):

  > It’s not listening to the right thing. Recording Device... the USB Audio Interface.

### `fix-tapeNotReady.mp3`

- **When it plays:** After a refusal that says something like “Prepare the tape, interface and headphones”.
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > The tape’s not set up yet. Load it, connect the interface, headphones... at the bench.

- **On screen** (the subtitle):

  > The tape’s not set up yet. Load it, connect the interface, headphones... at the bench.

### `fix-alreadyCaptured.mp3`

- **When it plays:** After a refusal that says something like “already captured”.
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > The tape’s already captured. I don’t play it again. I work from what I recorded.

- **On screen** (the subtitle):

  > The tape’s already captured. I don’t play it again. I work from what I recorded.

### `fix-fiveJudgements.mp3`

- **When it plays:** After a refusal that says something like “all five judgements”.
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > I’ve missed one. All five need a judgement before I can submit.

- **On screen** (the subtitle):

  > I’ve missed one. All five need a judgement before I can submit.

### `fix-handoverFail.mp3`

- **When it plays:** After Amina or the software says: “The … check does not match the submitted file. … Use Open file to return to it; your other work is saved.”
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > One check doesn’t match the file I sent. [short pause] Let me read what she says... and open that file again.

- **On screen** (the subtitle):

  > One check doesn’t match the file I sent. Let me read what she says... and open that file again.

### `fix-attachFirst.mp3`

- **When it plays:** After a refusal that says something like “Attach a saved file first”.
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > Nothing’s attached. Paperclip first, then the file.

- **On screen** (the subtitle):

  > Nothing’s attached. Paperclip first, then the file.

### `fix-other.mp3`

- **When it plays:** After any other refusal.
- **With directions** (models that read audio tags, such as ElevenLabs `eleven_v3`):

  > [hesitant] Hmm. It won’t let me. Let me read what it says... okay.

- **On screen** (the subtitle):

  > Hmm. It won’t let me. Let me read what it says... okay.
