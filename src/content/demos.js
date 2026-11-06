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
  {launch: 'Browser', say: 'Open the chat on the right'},
  {press: 'Attach', at: 'bl', say: 'Click the paperclip'},
  {dialog: 'Open', rows: [file], pick: file, ok: 'Open', say: `Choose ${file}`},
  {press: 'Send', at: 'br', say: 'Press Send'},
];
// A message card in Chat, and the page its button opens.
const card = (title, button, say, opens) => [{launch: 'Browser', say: 'Open the chat on the right'}, {card: title, press: button, opens, say}];

export const DEMOS = {
  message: [
    {toast: 'Amina Njoroge', press: 'Open chat', say: 'Open the notification from Amina'},
    {app: 'Team Chat'}, {card: 'Case 0417 — Intake', press: 'Open', opens: 'Case Drive · Case 0417', say: 'Open the shared folder in her message'},
  ],
  brief: [...card('Case 0417 briefing', 'Join', 'Click Join on her invitation', 'Video Call'), {press: 'Join now', at: 'center', say: 'Then Join now'}],
  closing: [...card('Case 0417 handover review', 'Join', 'Click Join on her invitation', 'Video Call'), {press: 'Join now', at: 'center', say: 'Then Join now'}],
  intake: [
    ...card('Case record: Evidence intake', 'Open', 'Open the intake record from Amina’s message', 'Evidence intake'),
    {choose: ['Highest risk', 'Middle', 'Lowest risk'], say: 'Rank the three items, by your own judgement'},
    {press: 'Record ranking', at: 'br', say: 'Record the ranking'},
    {choose: ['Preservation objective'], say: 'Choose what we are protecting'},
    {press: 'Confirm intake', at: 'br', say: 'Confirm the intake'},
  ],
  bench: [{taskbar: 'View equipment', say: 'Go to your bench: View equipment, on the taskbar'}],
  acquire: [
    {launch: 'Evidence Imager', say: 'Open Evidence Imager'},
    {menu: 'File', items: MENU.ftk, say: 'Open the File menu'},
    {item: 'Create Disk Image...', items: ['Add Evidence Item...', 'Create Disk Image...', 'Export Disk Image...'], say: 'Choose Create Disk Image'},
    {dialog: 'Select Source', rows: ['Physical Drive', 'Logical Drive', 'Image File'], pick: 'Physical Drive', ok: 'Next >', say: 'Pick Physical Drive'},
    {dialog: 'Select Drive', rows: ['PHYSICALDRIVE1 — Evidence Drive 0417'], pick: 'PHYSICALDRIVE1 — Evidence Drive 0417', ok: 'Finish', say: 'Pick the evidence drive, read-only through the blocker'},
    {press: 'Add...', at: 'tr', say: 'Add an image destination'},
    {check: 'Verify images after they are created', say: 'Turn on verification'},
    {press: 'Start', at: 'br', say: 'Start the image'},
  ],
  export: [
    {app: 'Evidence Imager', say: 'In Evidence Imager'},
    {press: 'Export working copies', at: 'tr', say: 'Click Export working copies'},
    {dialog: 'Browse For Folder', rows: ['Working', 'Submitted', 'Reports'], pick: 'Working', ok: 'OK', say: 'Send them to the Working folder'},
  ],
  openText: [
    {launch: 'Text Editor', say: 'Open Text Editor'},
    {menu: 'File', items: MENU.npp, say: 'Open the File menu'},
    {item: 'Open...', items: ['New', 'Open...', 'Save', 'Save As...', 'Close'], say: 'Choose Open'},
    {dialog: 'Open', rows: ['witness_working.txt'], pick: 'witness_working.txt', ok: 'Open', say: 'Pick witness_working.txt'},
  ],
  fixText: [
    {app: 'Text Editor', say: 'The text looks wrong in Text Editor'},
    {menu: 'Encoding', items: ['File', 'Edit', 'Search', 'View', 'Encoding'], say: 'Open the Encoding menu'},
    {choose: ['How to read the bytes'], say: 'Choose the reading you judge right'},
    {press: 'Save', at: 'tr', say: 'Save. It reads the file back to check it'},
  ],
  sendText: send('witness_working.txt'),
  openImage: [
    {launch: 'Image Editor', say: 'Open Image Editor'},
    {menu: 'File', items: MENU.gimp, say: 'Open the File menu'},
    {item: 'Open...', items: ['Open...', 'Revert', 'Export As...', 'Close'], say: 'Choose Open'},
    {dialog: 'Open Image', rows: ['cctv_working.jpg'], pick: 'cctv_working.jpg', ok: 'Open', say: 'Pick cctv_working.jpg'},
  ],
  pixels: [
    {launch: 'Case Record', say: 'Open the Case Record'},
    {tabs: ['Case', 'Text', 'Image'], pick: 'Image', say: 'Go to the Image tab'},
    {rows: ['Number plate · Sample'], picks: [0], say: 'Sample the number plate and read its three values'},
  ],
  imageSet: [
    {app: 'Image Editor', say: 'In Image Editor'},
    {menu: 'File', items: ['File', 'Edit', 'Select', 'View', 'Image'], say: 'Open the File menu'},
    {item: 'Export As...', items: ['Open...', 'Revert', 'Export As...', 'Close'], say: 'Choose Export As'},
    {choose: ['Size', 'Print resolution', 'Why'], say: 'Choose size, print resolution and your reason, by your own judgement'},
    {press: 'Export', at: 'br', say: 'Export. It checks itself against the source'},
  ],
  sendImage: send('cctv_working.png'),
  capture: [
    {app: 'Audio Recorder', say: 'In Audio Recorder'},
    {choose: ['Sample rate', 'Bit depth'], say: 'Listen, then choose the settings you judge right'},
    {choose: ['Input device'], say: 'Select the audio interface as the input'},
    {press: '●  Record', at: 'tr', say: 'Press Record. The tape plays once'},
  ],
  exportAudio: [
    {app: 'Audio Recorder', say: 'In Audio Recorder'},
    {menu: 'File', items: ['File', 'Edit', 'Select', 'View', 'Transport'], say: 'Open the File menu'},
    {item: 'Export Audio...', items: ['Save Project', 'Export Audio...', 'Exit'], say: 'Choose Export Audio'},
    {choose: ['Format', 'Why'], say: 'Choose the format and your reason'},
    {press: 'Export', at: 'br', say: 'Export. It checks itself against the capture'},
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
