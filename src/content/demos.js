// "Watch how it's done": a short vector animation for each task, offered only when a learner is truly stuck.
// Each demo is a list of beats; src/desktop/demo.js lays them out and animates the cursor. Labels match the
// real controls. Where the step is a judgement (ranking, an encoding, a setting), the demo shows only where
// to choose, never which choice: `choose` draws blank options.
// Keys are nextTask() ids, and 'bench:<step>' for the physical steps at the bench.

const MENU = {
  gimp: ['File', 'Edit', 'Select', 'View', 'Image', 'Layer', 'Colors'],
  npp: ['File', 'Edit', 'Search', 'View', 'Encoding', 'Language'],
  ftk: ['File', 'View', 'Mode', 'Help'],
  audacity: ['File', 'Edit', 'Select', 'View', 'Transport', 'Tracks'],
};
const send = file => [
  {launch: 'Google Chrome', say: 'Open Chrome and go to Chat'},
  {press: 'Attach', at: 'bl', say: 'Click the paperclip'},
  {dialog: 'Open', rows: [file], pick: file, ok: 'Open', say: `Choose ${file}`},
  {press: 'Send', at: 'br', say: 'Press Send'},
];
// A message card in Chat, and the page its button opens.
const card = (title, button, say, opens) => [{launch: 'Google Chrome', say: 'Open Chrome and go to Chat'}, {card: title, press: button, opens, say}];

export const DEMOS = {
  message: [
    {toast: 'Amina Njoroge', press: 'Open chat', say: 'Open the notification from Amina'},
    {app: 'Google Chat'}, {card: 'Case 0417 — Intake', press: 'Open', opens: 'Google Drive · Case 0417', say: 'Open the shared folder in her message'},
  ],
  brief: [...card('Case 0417 briefing', 'Join', 'Click Join on her invitation', 'Google Meet'), {press: 'Join now', at: 'center', say: 'Then Join now'}],
  closing: [...card('Case 0417 handover review', 'Join', 'Click Join on her invitation', 'Google Meet'), {press: 'Join now', at: 'center', say: 'Then Join now'}],
  records: [
    {launch: 'Google Chrome', say: 'In Chrome, open the Drive tab'},
    {rows: ['Witness message — source record', 'CCTV still — source record', 'Microcassette — intake record'], picks: [0, 1, 2], say: 'Open each of the three records'},
  ],
  intake: [
    ...card('Case record: Evidence intake', 'Open', 'Open the intake record from Amina’s message', 'Evidence intake'),
    {choose: ['Highest risk', 'Middle', 'Lowest risk'], say: 'Rank the three items, by your own judgement'},
    {press: 'Record ranking', at: 'br', say: 'Record the ranking'},
    {choose: ['Preservation objective'], say: 'Choose what we are protecting'},
    {press: 'Confirm intake', at: 'br', say: 'Confirm the intake'},
  ],
  bench: [{taskbar: 'View equipment', say: 'Go to your bench: View equipment, on the taskbar'}],
  acquire: [
    {launch: 'FTK Imager', say: 'Open FTK Imager'},
    {menu: 'File', items: MENU.ftk, say: 'Open the File menu'},
    {item: 'Create Disk Image...', items: ['Add Evidence Item...', 'Create Disk Image...', 'Export Disk Image...'], say: 'Choose Create Disk Image'},
    {dialog: 'Select Source', rows: ['Physical Drive', 'Logical Drive', 'Image File'], pick: 'Physical Drive', ok: 'Next >', say: 'Pick Physical Drive'},
    {dialog: 'Select Drive', rows: ['PHYSICALDRIVE1 — Evidence Drive 0417'], pick: 'PHYSICALDRIVE1 — Evidence Drive 0417', ok: 'Finish', say: 'Pick the evidence drive, read-only through the blocker'},
    {press: 'Add...', at: 'tr', say: 'Add an image destination'},
    {check: 'Verify images after they are created', say: 'Turn on verification'},
    {press: 'Start', at: 'br', say: 'Start the image'},
  ],
  addImage: [
    {launch: 'FTK Imager', say: 'Open FTK Imager'},
    {menu: 'File', items: MENU.ftk, say: 'Open the File menu'},
    {item: 'Add Evidence Item...', items: ['Add Evidence Item...', 'Create Disk Image...', 'Export Disk Image...'], say: 'Choose Add Evidence Item'},
    {dialog: 'Select Source', rows: ['Physical Drive', 'Logical Drive', 'Image File'], pick: 'Image File', ok: 'Next >', say: 'Pick Image File'},
    {dialog: 'Open', rows: ['drive.E01'], pick: 'drive.E01', ok: 'Open', say: 'Choose drive.E01'},
  ],
  export: [
    {app: 'FTK Imager', say: 'In FTK Imager'},
    {rows: ['[root]', '[root]/Evidence'], picks: [1], say: 'Click [root]/Evidence in the tree'},
    {press: 'Export Files', at: 'tr', say: 'Click Export Files'},
    {dialog: 'Browse For Folder', rows: ['Working', 'Submitted', 'Reports'], pick: 'Working', ok: 'OK', say: 'Send them to the Working folder'},
  ],
  openText: [
    {launch: 'Notepad++', say: 'Open Notepad++'},
    {menu: 'File', items: MENU.npp, say: 'Open the File menu'},
    {item: 'Open...', items: ['New', 'Open...', 'Save', 'Save As...', 'Close'], say: 'Choose Open'},
    {dialog: 'Open', rows: ['witness_working.txt'], pick: 'witness_working.txt', ok: 'Open', say: 'Pick witness_working.txt'},
  ],
  fixText: [
    {launch: 'Case Record', say: 'Open the Case Record'},
    {tabs: ['Case', 'Text', 'Image'], pick: 'Text', say: 'Go to the Text tab'},
    {choose: ['Encoding'], say: 'Choose an encoding to compare, by your own judgement'},
    {press: 'Use this in Notepad++', at: 'br', say: 'Use it in Notepad++'},
    {app: 'Notepad++'}, {menu: 'File', items: MENU.npp, say: 'In Notepad++, open File'},
    {item: 'Save', items: ['Open...', 'Save', 'Save As...', 'Close'], say: 'Save, then Close and Open the file again'},
    {app: 'Case Record'}, {press: 'Verify saved file', at: 'center', say: 'Back in the Case Record, verify the saved file'},
  ],
  sendText: send('witness_working.txt'),
  openImage: [
    {launch: 'GIMP', say: 'Open GIMP'},
    {menu: 'File', items: MENU.gimp, say: 'Open the File menu'},
    {item: 'Open...', items: ['Open...', 'Revert', 'Export As...', 'Close'], say: 'Choose Open'},
    {dialog: 'Open Image', rows: ['cctv_working.jpg'], pick: 'cctv_working.jpg', ok: 'Open', say: 'Pick cctv_working.jpg'},
  ],
  pixels: [
    {launch: 'Case Record', say: 'Open the Case Record'},
    {tabs: ['Case', 'Text', 'Image'], pick: 'Image', say: 'Go to the Image tab'},
    {rows: ['Plate background · Sample', 'Character · Sample', 'Sky · Sample'], picks: [0, 1, 2], say: 'Sample the plate, a character and the sky'},
    {type: 'R  G  B', label: 'Match the plate colour', say: 'Type the plate’s values you read'},
    {press: 'Match swatch', at: 'br', say: 'Match the swatch'},
  ],
  imageSet: [
    {launch: 'Case Record', say: 'In the Case Record, Image tab'},
    {press: 'Continue', at: 'br', say: 'Work through size and print, then Continue'},
    {app: 'GIMP'}, {menu: 'Image', items: MENU.gimp, say: 'In GIMP, open the Image menu'},
    {item: 'Print Size...', items: ['Scale Image...', 'Print Size...'], say: 'Choose Print Size'},
    {type: '300', label: 'Resolution (PPI)', say: 'Set the resolution the case asks for'},
    {menu: 'File', items: MENU.gimp, say: 'Then File'},
    {item: 'Export As...', items: ['Open...', 'Revert', 'Export As...', 'Close'], say: 'Export As, then reopen the PNG and compare'},
  ],
  sendImage: send('cctv_working.png'),
  capture: [
    {launch: 'Case Record', say: 'In the Case Record, Audio tab'},
    {rows: ['▶  A · Reference', '▶  B · Comparison'], picks: [0, 1], say: 'Play the clips and listen'},
    {choose: ['Setting'], say: 'Choose the setting you judge right'},
    {press: 'Confirm', at: 'br', say: 'Confirm each setting'},
    {app: 'Audacity'}, {choose: ['Input device'], say: 'In Audacity, pick the audio interface'},
    {press: '●  Record', at: 'tr', say: 'Press Record. The tape plays once'},
  ],
  exportAudio: [
    {launch: 'Audacity', say: 'In Audacity'},
    {menu: 'File', items: MENU.audacity, say: 'Open the File menu'},
    {item: 'Export Audio...', items: ['Save Project', 'Export Audio...', 'Exit'], say: 'Choose Export Audio'},
    {press: 'Export', at: 'br', say: 'Export it'},
    {app: 'Case Record'}, {press: 'Check', at: 'center', say: 'Check the file in the Case Record'},
  ],
  sendAudio: send('statement_master.flac'),
  handover: [
    ...card('Case record: Final handover', 'Open', 'Open the handover record from Amina’s last message', 'Final handover'),
    {choose: ['Text', 'Image', 'Audio'], say: 'Check each item and set its status'},
    {press: 'Submit handover', at: 'br', say: 'Submit the handover'},
  ],
  debrief: [...card('Case record: Handover and feedback', 'Open', 'Open your record', 'Your record'), {press: 'Finish', at: 'br', say: 'Read it, then Finish'}],

  'bench:power': [{devices: ['Monitor', 'Workstation']}, {power: 'Workstation', say: 'Press the power button on the workstation'}],
  'bench:blocker': [{devices: ['Evidence drive', 'Write-blocker', 'Workstation']}, {power: 'Write-blocker', say: 'Switch the write-blocker on first'}],
  'bench:drive': [{devices: ['Evidence drive', 'Write-blocker', 'Workstation']}, {plug: ['Evidence drive', 'Write-blocker'], say: 'Connect the drive to the blocker, never straight to the computer'}],
  'bench:tape': [{devices: ['Witness tape', 'Cassette deck']}, {insert: ['Witness tape', 'Cassette deck'], say: 'Unseal the tape and load it into the deck'}],
  'bench:interface': [{devices: ['Cassette deck', 'Audio interface', 'Workstation']}, {plug: ['Cassette deck', 'Audio interface'], say: 'Connect the deck to the audio interface'}],
  'bench:headphones': [{devices: ['Headphones', 'Audio interface']}, {plug: ['Headphones', 'Audio interface'], say: 'Plug in the headphones'}, {lift: 'Headphones', say: 'Then put them on'}],
  'bench:use': [{devices: ['Monitor', 'Workstation']}, {power: 'Monitor', say: 'Click the monitor to use the computer'}],
};
