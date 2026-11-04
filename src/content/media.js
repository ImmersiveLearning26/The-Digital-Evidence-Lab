// Every picture the simulation shows, in one place. To replace one, change its path here.
// `slot: true` marks a spot still waiting for a supplied image: it renders as a labelled placeholder.
export const IMAGES = {
  wallpaper: {src: 'assets/media/doc/wallpaper.jpg', origin: 'references/02-desktop-notification.png'},
  aminaAvatar: {src: 'assets/media/doc/amina_avatar.jpg', origin: 'assets/media/source/amina_generated.jpg', alt: 'Amina Njoroge, camera off'},
  aminaFace: {src: 'assets/media/doc/amina_face.jpg', origin: 'assets/media/source/amina_generated.jpg', alt: 'Amina Njoroge'},
  tape: {src: 'assets/media/doc/microcassette.jpg', origin: 'references/04-shared-folder.png', alt: 'Sealed analogue microcassette, side A'},
  cctvThumb: {src: 'assets/media/cctv_thumb.jpg', origin: 'scripts/build_evidence.py', alt: 'Synthetic CCTV still of a silver saloon, rear view'},
  labLogo: {src: 'assets/media/doc/lab_logo.png', origin: 'references/15-handover.png', alt: 'Digital Evidence Lab'},
  chatLogo: {src: 'assets/media/doc/chat_logo.png', origin: 'references/03-chat.png', alt: 'Chat'},
  driveLogo: {src: 'assets/media/doc/drive_logo.png', origin: 'references/04-shared-folder.png', alt: 'Drive'},
  iconFolder: {src: 'assets/media/doc/icon_folder.png', origin: 'references/02-desktop-notification.png'},
  iconFtk: {src: 'assets/media/doc/icon_ftk.png', origin: 'references/02-desktop-notification.png'},
  iconNpp: {src: 'assets/media/doc/icon_npp.png', origin: 'references/02-desktop-notification.png'},
  iconGimp: {src: 'assets/media/doc/icon_gimp.png', origin: 'references/02-desktop-notification.png'},
  iconAudacity: {src: 'assets/media/doc/icon_audacity.png', origin: 'references/02-desktop-notification.png'},
  mivaLogo: {slot: true, alt: 'MIVA Open University logo'},
};
export function picture(id, cls = '') {
  const m = IMAGES[id];
  if (m.slot) return `<div class="image-slot ${cls}" role="img" aria-label="${m.alt}"><span>Image slot</span><small>${m.alt}</small></div>`;
  return `<img class="${cls}" src="${m.src}" alt="${m.alt ?? ''}" draggable="false">`;
}
