// Every picture the simulation shows, in one place. To replace one, change its path here.
// `slot: true` marks a spot still waiting for a supplied image: it renders as a labelled placeholder.
export const IMAGES = {
  wallpaper: {src: 'assets/media/doc/wallpaper.jpg', origin: 'drawn for this project'},
  aminaAvatar: {src: 'assets/media/doc/amina_avatar.jpg', origin: 'assets/media/source/amina_generated.jpg', alt: 'Amina Njoroge, camera off'},
  aminaFace: {src: 'assets/media/doc/amina_face.jpg', origin: 'assets/media/source/amina_generated.jpg', alt: 'Amina Njoroge'},
  tape: {src: 'assets/media/doc/microcassette.jpg', origin: 'references/04-shared-folder.png', alt: 'Sealed analogue microcassette, side A'},
  cctvThumb: {src: 'assets/media/cctv_thumb.jpg', origin: 'scripts/build_evidence.py', alt: 'Synthetic CCTV still of a silver saloon, rear view'},
  labLogo: {src: 'assets/media/doc/lab_logo.png', origin: 'references/15-handover.png', alt: 'Digital Evidence Lab'},
  mivaLogo: {slot: true, alt: 'MIVA Open University logo'},
};
export function picture(id, cls = '') {
  const m = IMAGES[id];
  if (m.slot) return `<div class="image-slot ${cls}" role="img" aria-label="${m.alt}"><span>Image slot</span><small>${m.alt}</small></div>`;
  return `<img class="${cls}" src="${m.src}" alt="${m.alt ?? ''}" draggable="false">`;
}
