// Immutable source objects. Nothing writes to these; working copies are derived from them.
import {TEXT} from './domain.js';
import {md5, sha, utf8Encode} from './bytes.js';

let loading = null;
export function loadEvidence() {
  loading ??= (async () => {
    const [jpeg, meta] = await Promise.all([
      fetch('assets/media/cctv_source.jpg').then(r => { if (!r.ok) throw Error('Evidence photograph is missing.'); return r.arrayBuffer(); }),
      fetch('assets/media/cctv_source.json').then(r => r.json()),
    ]);
    const witness = utf8Encode(TEXT), cctv = new Uint8Array(jpeg);
    const drive = new Uint8Array(witness.length + cctv.length);
    drive.set(witness);
    drive.set(cctv, witness.length);
    return {
      meta,
      witness: {bytes: witness, sha256: await sha('SHA-256', witness)},
      cctv: {bytes: cctv, sha256: await sha('SHA-256', cctv)},
      drive: {bytes: drive, md5: md5(drive), sha1: await sha('SHA-1', drive)},
    };
  })();
  return loading;
}
export async function originalsIntact(s) {
  const e = await loadEvidence();
  return {
    witness: await sha('SHA-256', e.witness.bytes) === s.acquisition?.witnessSha,
    cctv: await sha('SHA-256', e.cctv.bytes) === s.acquisition?.cctvSha,
  };
}
