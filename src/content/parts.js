// What each piece of kit on the bench is called and what it is for, shown when the learner points at it.
// Node names live in assets/asset-manifest.json under "parts".
export const PARTS = {
  monitor: {name: 'Monitor', note: 'Your forensic workstation’s screen'},
  tower: {name: 'Workstation', note: 'Runs FTK Imager, Notepad++, GIMP and Audacity'},
  blocker: {name: 'Write-blocker', note: 'Lets the computer read the drive, never write to it'},
  drive: {name: 'Evidence drive', note: 'Case 0417 original. Only ever connected through the blocker'},
  recorder: {name: 'Cassette deck', note: 'Plays the witness tape for capture'},
  tape: {name: 'Witness tape', note: 'Sealed. Every play wears it a little'},
  interface: {name: 'Audio interface', note: 'Turns the tape’s signal into digital samples'},
  headphones: {name: 'Headphones', note: 'Listen while the capture records'},
  keyboard: {name: 'Keyboard and mouse', note: 'For the workstation'},
};
