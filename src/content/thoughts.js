// The player's inner voice: a junior engineer thinking the job through out loud, the way a person does on
// their first day with new software. It re-reads what Amina asked, looks for things on screen by their
// names, weighs the choices, and works out what went wrong when something is refused. It never sounds like
// the software answering back.
//
//   task:<id>    when a task begins: what Amina asked, and the plan
//   step:<id>    when the next control is on screen and the learner pauses: finding it, and why
//   bench:<part> at the bench, the same for each piece of hardware
//   fix:<id>     after a refusal: reading what it says, and working out the fix
//
// `say` carries the voice directions for the recording (eleven_v3 tags); the subtitle shows the words alone.
// Recordings: assets/media/voice/thoughts/<key with ":" as "-">.mp3. Brief: docs/INNER_VOICE_RECORDING.md.
export const THOUGHTS = {
  // ---- Tasks
  'task:message': '[softly] Okay... first day. Amina’s sent me something. There’s a notification, bottom right. Let me open the chat.',
  'task:brief': 'She wants a short briefing first. [short pause] There’s a video call card in the chat... Case zero four one seven briefing. I’ll join that.',
  'task:intake': 'Right. She said inspect all three items, rank their risk of loss, then confirm what we’re protecting. So... the intake record first. It’s the card in the chat.',
  'task:bench': 'Now the evidence drive. Through the write-blocker, she said. [short pause] That’s not on the computer, that’s at my bench. View equipment... bottom right.',
  'task:acquire': 'Drive’s connected. Next, Evidence Imager. She said create a verified image in the evidence store. So I never work on the drive itself... only on the image.',
  'task:export': 'Image done, and verified. [short pause] Now working copies out of it. I saw an Export working copies button in the toolbar.',
  'task:openText': 'The witness message first. She said open witness working dot T X T in Text Editor. So... Text Editor, then Open, then find that file.',
  'task:fixText': '[confused] Hmm... Ch, A tilde, copyright... bet? That should be an é. [short pause] She did say, if it doesn’t read right, the bytes are fine... it’s how they’re read. That sounds like the Encoding menu.',
  'task:sendText': '[relieved] There. Every character’s back, and it read back the same after saving. Now it goes to Amina... in the chat, with the paperclip.',
  'task:openImage': 'Text approved. Now the photograph. She said open cctv working dot J P G in Image Editor. File, then Open, I guess.',
  'task:pixels': 'Next she wants one pixel of the plate. [short pause] That’s in the Case Record... there should be an Image tab.',
  'task:imageSet': 'So one pixel is just three numbers. Okay. Now the export... a size and print resolution we can actually use, she said. Back to Image Editor. File, Export As.',
  'task:sendImage': 'Exported, and checked against the source. Now the P N G goes to Amina. Paperclip again.',
  'task:benchTape': 'Photo’s approved. Now the tape deck’s free. [short pause] Prepare the microcassette and the audio interface at the bench, she said. View equipment again.',
  'task:capture': 'Tape’s ready. Now Audio Recorder. [short pause] She said listen to the settings before I record. The tape only plays once... so I can’t just guess.',
  'task:exportAudio': '[exhales] Captured. Now a master file. File, Export Audio. I want something that doesn’t throw any of it away.',
  'task:sendAudio': 'Master’s exported and checked. Send it to Amina... statement master, the FLAC one.',
  'task:handover': 'All three approved. Now the final handover. Check each item against what it needed, and confirm the originals are unchanged. The card’s in the chat.',
  'task:closing': 'Handover’s in. [short pause] Amina wants to talk it through. Another call card... let me join.',
  'task:debrief': 'She’s sent my feedback. Let me open the record and see how I did.',

  // ---- Finding my way around
  'step:dock': 'The chat’s folded away on the right. I’ll open it.',
  'step:viewer': 'Okay, I’ve read that one. Close it.',
  'step:start:ftk': 'Where’s Evidence Imager... probably in the Start menu. Bottom of the screen.',
  'step:start:notepad': 'Text Editor. Start menu again.',
  'step:start:gimp': 'Image Editor... Start menu.',
  'step:start:case': 'The Case Record’s an app too, I think. Start menu.',
  'step:start:audacity': 'Audio Recorder. Start.',
  'step:pick:ftk': 'There. Evidence Imager.',
  'step:pick:notepad': 'Text Editor, there.',
  'step:pick:gimp': 'Image Editor.',
  'step:pick:case': 'Case Record.',
  'step:pick:audacity': 'Audio Recorder... the red one.',
  'step:switch:gimp': 'Image Editor’s still open. Down on the taskbar.',
  'step:switch:notepad': 'Text Editor’s still open, on the taskbar.',
  'step:switch:ftk': 'Evidence Imager, on the taskbar.',
  'step:switch:case': 'The Case Record’s open already. Taskbar.',
  'step:switch:audacity': 'Audio Recorder, on the taskbar.',

  // ---- Message, briefing, intake
  'step:toast': 'There’s the notification... Open chat.',
  'step:folder': 'She’s shared a folder. Case zero four one seven, Intake. Let me look at what’s in it.',
  'step:briefCard': 'The briefing card... Join.',
  'step:joinNow': 'Camera preview... okay. Join now.',
  'step:intakeCard': 'There. Case record, Evidence intake.',
  'step:rank': '[thoughtful] Highest risk, middle, lowest. Hmm. Which one could we lose for good? The tape wears every time it plays... the phone’s storage is failing... the photo’s stable.',
  'step:recordRank': 'Okay, I think that’s right. Record ranking.',
  'step:objective': 'What are we protecting across all three? Not the smallest files... not making it look better. Keeping the original intact, and verifiable.',
  'step:confirmIntake': 'Confirm intake.',
  'step:benchButton': 'View equipment. Bottom right, next to the clock.',

  // ---- Imaging
  'step:create': 'Create Disk Image, top left. That should be it.',
  'step:source': 'What kind of source... it’s the whole drive, not a folder or one file. Physical Drive. Next.',
  'step:drive': '[carefully] Which drive... not the system drive, that’s the computer itself. The one behind the write-blocker. Physical drive one. Next.',
  'step:add': 'The destination’s empty. I need to add where the image goes. Add.',
  'step:destination': 'Image type E zero one. And the folder is the evidence store... not the drive I’m copying from. Okay. Finish.',
  'step:verify': 'Verify images after they are created... yes. Amina said a verified image. Tick that.',
  'step:start': 'Source, destination, verify. [short pause] I think that’s everything. Start.',
  'step:exportCopies': 'Export working copies... there, in the toolbar.',
  'step:folderOk': 'Where do they go... the Working folder. The evidence store is read-only, and it should be. OK.',

  // ---- Text
  'step:npOpen': 'Open, in the toolbar.',
  'step:pickText': 'witness working dot T X T... in the Working folder.',
  'step:confirmOpen': 'That’s the one. Open.',
  'step:encoding': 'The text’s garbled, but the file’s fine. So it’s being read wrong. There’s an Encoding menu up top... let me look.',
  'step:encodings': '[thoughtful] ANSI... U T F eight... Hmm. Those symbols and the emoji need more than one byte each. ANSI only has one. U T F eight, then.',
  'step:save': 'That reads properly now. Save... and it reads it back after saving. Good.',
  'step:clip': 'The paperclip, bottom of the chat, to attach it.',
  'step:pickTextSend': 'witness working dot T X T.',
  'step:send': 'It’s attached. Send.',

  // ---- Image
  'step:fileMenu': 'File, top left.',
  'step:giOpen': 'Open...',
  'step:pickJpg': 'cctv working... the J P G.',
  'step:imageTab': 'There’s an Image tab at the top.',
  'step:sample': 'Number plate... Sample. That reads one pixel straight from the plate.',
  'step:exportMenu': 'File... I’m looking for Export As.',
  'step:exportAs': 'Export As.',
  'step:exportGrid': '[thoughtful] Size... six forty is tiny, the plate would be a smudge. Eight thousand just invents pixels. Four thousand is what the camera actually took. [short pause] And print, three hundred P P I... thirteen by ten inches. That covers the print. Then a reason, under Why these settings.',
  'step:exportOk': 'Size, resolution, reason. Export.',
  'step:pickPng': 'cctv working... the P N G this time, not the J P G.',

  // ---- Audio
  'step:auSetup': '[hesitant] Sample rate and bit depth. Eight kilohertz, eight-bit right now... that sounds low. There’s a little play button next to each one. Let me listen before I decide.',
  'step:auDevice': 'Recording device says choose input. Not the built-in microphone, it can’t hear the tape. The U S B Audio Interface.',
  'step:record': '[carefully] Settings set, interface selected. One pass. [short pause] Okay. Record.',
  'step:auExportMenu': 'File... Export Audio.',
  'step:auExport': 'Export Audio.',
  'step:auWhy': '[thoughtful] Format... MP3’s smaller, but it throws sound away. FLAC is lossless, and still compressed. And the reason... lossless, so nothing heard is thrown away.',
  'step:auOk': 'Export.',
  'step:pickFlac': 'statement master... the FLAC.',

  // ---- Handover, closing, feedback
  'step:handoverCard': 'Case record, Final handover.',
  'step:judgements': '[thoughtful] Five judgements. Is the text readable... is the image detail enough... is the audio suitable... are the originals unchanged... and is it all within the allocation. Let me be honest about each one.',
  'step:submit': 'All five marked. Submit handover.',
  'step:closingCard': 'The review call card. Join.',
  'step:debriefCard': 'There’s my feedback.',
  'step:finish': '[exhales] Okay. Finish.',

  // ---- At the bench
  'bench:power': 'The computer’s off. Power button on the tower, first.',
  'bench:blocker': '[thoughtful] The write-blocker. It sits between the drive and the computer, so nothing can write back to the drive. That goes in first.',
  'bench:drive': 'Now the evidence drive... into the write-blocker. Not straight into the computer.',
  'bench:tape': '[carefully] The tape. It’s fragile... load it gently.',
  'bench:interface': 'The audio interface. The deck plugs into that, and that goes to the computer.',
  'bench:headphones': 'Headphones on, so I can hear what’s being captured.',
  'bench:use': 'That’s everything here. Back to the computer.',

  // ---- Working out what went wrong
  'fix:riskTextFirst': '[thoughtful] Hmm. She says the phone’s at risk too, but the tape wears every time it’s played. Which loss can’t be undone... the tape. Move that up.',
  'fix:riskImageMiddle': 'Tape first was right. But the phone’s failing and the photo’s stable... so the text goes in the middle. Photo last.',
  'fix:riskAudioLast': 'Tape last... no. If the tape fails, we might not get another chance. That’s the highest risk.',
  'fix:riskImageFirst': 'The photo’s the stable one. It shouldn’t be first... the tape and the phone need more care.',
  'fix:objectiveSmall': 'Shrinking everything... right, that means lossy shortcuts, and that loss is permanent. Keep the original intact and verifiable.',
  'fix:objectiveEnhance': 'We reveal what’s there. We never add to it. So not clearer... intact and verifiable.',
  'fix:objectiveCommon': 'One format for all three won’t work. Each one needs its own. [short pause] So... keeping the originals intact.',
  'fix:objectiveWrong': 'Not that one. What matters is the original, intact and verifiable, inside the quota.',
  'fix:noBlocker': 'Through the write-blocker first. Right... so the drive can’t be changed. Back to the bench.',
  'fix:sourceAsDestination': 'Not back onto the source drive. The image goes to the evidence store.',
  'fix:wrongSourceDrive': 'That’s the computer’s own system drive. I need the evidence drive, the one behind the write-blocker.',
  'fix:notVerified': 'It hasn’t passed verification. I need Verify images ticked... and the image made again.',
  'fix:storeReadOnly': 'The evidence store is read-only. Of course. Working files go in the Working folder.',
  'fix:wrongDecoding': '[thoughtful] She says the bytes are fine, but it’s reading them wrong. So I saved it while it still looked garbled. Encoding menu... U T F eight. Then save again.',
  'fix:asciiLoss': 'Question marks... ASCII can’t hold those characters. I need an encoding that keeps every one of them. U T F eight.',
  'fix:latin1Loss': 'The accent’s okay, but the emoji and the symbols are gone. Latin one isn’t enough. U T F eight should keep everything.',
  'fix:staleFile': 'Not the verified version... I must have attached an older save. Save first, then attach it again.',
  'fix:imageTooLow': 'The plate’s lost detail. Six forty is too small. I need the full four thousand pixels... File, Export As again.',
  'fix:imageUpscaled': 'Extra pixels don’t add evidence. They’re just made up. Back to four thousand, the original size.',
  'fix:ppiConfused': 'P P I only changes how densely it prints. It doesn’t add any detail. The pixel size is what matters.',
  'fix:imageOverBudget': 'Too big for the hundred megabytes. I went bigger than the source... back to the original size.',
  'fix:imageRationale': 'She wants a reason for the settings. That’s the Why these settings part, in the export window. Export again, pick one... then send.',
  'fix:samplePlate': 'Wrong copy. It has to be the original-resolution one. File, Revert... then sample again.',
  'fix:audio8k': '[thoughtful] The buzzer’s high sounds are missing. Eight kilohertz only captures up to four. The buzzer goes up to about ten... so forty-four point one.',
  'fix:audio16k': 'Sixteen kilohertz... the speech is fine, but the buzzer still gets cut off above eight. Forty-four point one, then.',
  'fix:audio8bit': 'Eight-bit... the quiet speech gets rough. Only two hundred and fifty-six levels. Sixteen-bit.',
  'fix:audioExcess': 'Ninety-six, or twenty-four bit... it’s bigger, but it adds nothing this tape actually has. Forty-four point one and sixteen-bit is enough.',
  'fix:audioMp3': 'MP3 throws information away. She wants a lossless master. FLAC... File, Export Audio again.',
  'fix:audioRationale': 'A short reason for the audio settings. That’s Why these settings, in the Export Audio window. Export again, pick the reason, send.',
  'fix:audioOverBudget': 'Too big for the audio allocation. Lossless at forty-four point one, sixteen-bit, should fit.',
  'fix:selectInterface': 'It’s not listening to the right thing. Recording Device... the U S B Audio Interface.',
  'fix:tapeNotReady': 'The tape’s not set up yet. Load it, connect the interface, headphones... at the bench.',
  'fix:alreadyCaptured': 'The tape’s already captured. I don’t play it again. I work from what I recorded.',
  'fix:fiveJudgements': 'I’ve missed one. All five need a judgement before I can submit.',
  'fix:handoverFail': 'One check doesn’t match the file I sent. [short pause] Let me read what she says... and open that file again.',
  'fix:attachFirst': 'Nothing’s attached. Paperclip first, then the file.',
  'fix:other': '[hesitant] Hmm. It won’t let me. Let me read what it says... okay.',
};

// Where each step thought belongs: [tasks, or '*' for any, the control the learner needs next, thought].
// The first match wins; "$app" becomes the app being reached.
export const STEPS = [
  ['*', '.modal.viewer [data-m="close"]', 'step:viewer'],
  ['*', '.dock-tab', 'step:dock'],
  ['*', '.tb-start', 'step:start:$app'],
  ['*', '.start-grid [data-id]', 'step:pick:$app'],
  ['*', '[data-action="shell:task"]', 'step:switch:$app'],
  [['message'], '[data-action="toast:open"]', 'step:toast'],
  [['message'], '.c-card[data-action="chat:drive"]', 'step:folder'],
  [['brief'], '.c-card[data-action="chat:meet"]', 'step:briefCard'],
  [['closing'], '.c-card[data-action="chat:meet"]', 'step:closingCard'],
  [['brief', 'closing'], '[data-action="meet:join"]', 'step:joinNow'],
  [['intake'], '.c-card', 'step:intakeCard'],
  [['intake'], '.rank-row', 'step:rank'],
  [['intake'], '[data-action="intake:rank"]', 'step:recordRank'],
  [['intake'], '.radios', 'step:objective'],
  [['intake'], '[data-action="intake:confirm"]', 'step:confirmIntake'],
  [['bench'], '.tray-btn.equip', 'step:benchButton'],
  [['acquire'], '[data-action="ftk:create"]', 'step:create'],
  [['acquire'], '.modal[aria-label="Select Source"] *', 'step:source'],
  [['acquire'], '.modal[aria-label="Select Drive"] *', 'step:drive'],
  [['acquire'], '.modal[aria-label="Create Image"] [data-m="add"]', 'step:add'],
  [['acquire'], '.modal[aria-label="Image Destination"] *', 'step:destination'],
  [['acquire'], '.modal[aria-label="Create Image"] .check', 'step:verify'],
  [['acquire'], '.modal[aria-label="Create Image"] [data-m="start"]', 'step:start'],
  [['export'], '[data-action="ftk:export"]', 'step:exportCopies'],
  [['export'], '.modal[aria-label="Browse For Folder"] *', 'step:folderOk'],
  [['openText', 'fixText'], '[data-action="np:open"]', 'step:npOpen'],
  [['openText', 'fixText'], '.file-dialog tr', 'step:pickText'],
  [['openText', 'fixText', 'openImage'], '.file-dialog [data-m="confirm"]', 'step:confirmOpen'],
  [['fixText'], '[data-name="Encoding"]', 'step:encoding'],
  [['fixText'], '.dropdown', 'step:encodings'],
  [['fixText'], '[data-action="np:save"]', 'step:save'],
  [['sendText', 'sendImage', 'sendAudio'], '.gc-clip', 'step:clip'],
  [['sendText'], '.file-dialog tr', 'step:pickTextSend'],
  [['sendImage'], '.file-dialog tr', 'step:pickPng'],
  [['sendAudio'], '.file-dialog tr', 'step:pickFlac'],
  [['sendText', 'sendImage', 'sendAudio'], '.gc-send', 'step:send'],
  [['openImage'], '[data-name="File"]', 'step:fileMenu'],
  [['openImage'], '[data-action="gi:open"]', 'step:giOpen'],
  [['openImage'], '.file-dialog tr', 'step:pickJpg'],
  [['pixels'], '.cr-tabs [data-tab]', 'step:imageTab'],
  [['pixels'], '[data-action="ic:goto"]', 'step:sample'],
  [['imageSet'], '[data-name="File"]', 'step:exportMenu'],
  [['imageSet'], '[data-action="gi:export"]', 'step:exportAs'],
  [['imageSet'], '.ex-grid', 'step:exportGrid'],
  [['imageSet'], '[data-m="ok"]', 'step:exportOk'],
  [['capture'], '.au-setup', 'step:auSetup'],
  [['capture'], 'select[data-input="au:device"]', 'step:auDevice'],
  [['capture'], '[data-action="au:record"]', 'step:record'],
  [['exportAudio'], '[data-name="File"]', 'step:auExportMenu'],
  [['exportAudio'], '[data-action="au:export"]', 'step:auExport'],
  [['exportAudio'], '.ex-why', 'step:auWhy'],
  [['exportAudio'], '[data-m="ok"]', 'step:auOk'],
  [['handover'], '.c-card', 'step:handoverCard'],
  [['handover'], '.lab-table', 'step:judgements'],
  [['handover'], '[data-action="handover:submit"]', 'step:submit'],
  [['debrief'], '.c-card', 'step:debriefCard'],
  [['debrief'], '[data-action="debrief:finish"]', 'step:finish'],
];

// Refusals that are not one of Amina's authored lines, matched on their wording.
export const FIXES = [
  [/evidence store is read-only/i, 'fix:storeReadOnly'],
  [/USB Audio Interface as the recording device/i, 'fix:selectInterface'],
  [/Prepare the tape, interface and headphones/i, 'fix:tapeNotReady'],
  [/already captured/i, 'fix:alreadyCaptured'],
  [/all five judgements/i, 'fix:fiveJudgements'],
  [/Attach a saved file first/i, 'fix:attachFirst'],
  [/^Sample from the original-resolution/i, 'fix:samplePlate'],
];

// Spoken lines spell some names out so the voice says them clearly; the subtitle shows them as on screen.
const SHOWN = [
  [/witness working dot T X T/g, 'witness_working.txt'], [/cctv working dot J P G/g, 'cctv_working.jpg'],
  [/Ch, A tilde, copyright\.\.\. bet\?/g, '“ChÃ©bet”?'], [/zero four one seven/g, '0417'], [/E zero one/g, 'E01'],
  [/U T F eight/g, 'UTF-8'], [/P N G/g, 'PNG'], [/J P G/g, 'JPG'], [/T X T/g, 'TXT'], [/P P I/g, 'PPI'], [/U S B/g, 'USB'],
  [/forty-four point one/g, '44.1'], [/six forty/g, '640'], [/Physical drive one/g, 'PHYSICALDRIVE1'],
];
// The subtitle: the words without the voice directions, with names as they appear on screen.
export const subtitle = say => SHOWN.reduce((t, [re, to]) => t.replace(re, to), say.replace(/\[[^\]]*\]\s*/g, '').replace(/\s+/g, ' ').trim());
// Recording file name for a thought.
export const fileFor = key => `${key.replaceAll(':', '-')}.mp3`;
