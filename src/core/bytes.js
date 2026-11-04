// Real byte operations. Nothing here looks at dropdown labels: every result comes from actual bytes.
const CP1252_HIGH = '€\u0081‚ƒ„…†‡ˆ‰Š‹Œ\u008DŽ\u008F\u0090‘’“”•–—˜™š›œ\u009Džÿ'.split('');
CP1252_HIGH[31] = 'Ÿ';

export const codePoints = text => [...text];
export const utf8Encode = text => new TextEncoder().encode(text);

export function decode(bytes, encoding) {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  switch (encoding) {
    case 'UTF-8': return new TextDecoder('utf-8', {ignoreBOM: true}).decode(view).replace(/^﻿/, '');
    case 'ANSI': return Array.from(view, b => (b >= 0x80 && b <= 0x9f ? CP1252_HIGH[b - 0x80] : String.fromCharCode(b))).join('');
    case 'ISO 8859-1': return Array.from(view, b => String.fromCharCode(b)).join('');
    case 'US-ASCII': return Array.from(view, b => (b < 0x80 ? String.fromCharCode(b) : '�')).join('');
    default: throw Error('Unknown encoding ' + encoding);
  }
}

function singleByte(text, mapper) {
  const out = [];
  for (const c of text) {
    const b = mapper(c);
    out.push(b === null ? 0x3f : b);
  }
  return Uint8Array.from(out);
}

export function encode(text, encoding) {
  switch (encoding) {
    case 'UTF-8': return utf8Encode(text);
    case 'UTF-8-BOM': return Uint8Array.from([0xef, 0xbb, 0xbf, ...utf8Encode(text)]);
    case 'US-ASCII': return singleByte(text, c => (c.codePointAt(0) < 0x80 ? c.codePointAt(0) : null));
    case 'ISO 8859-1': return singleByte(text, c => (c.codePointAt(0) < 0x100 ? c.codePointAt(0) : null));
    case 'ANSI': return singleByte(text, c => {
      const n = c.codePointAt(0);
      if (n < 0x80 || (n >= 0xa0 && n < 0x100)) return n;
      const i = CP1252_HIGH.indexOf(c);
      return i >= 0 ? 0x80 + i : null;
    });
    default: throw Error('Unknown encoding ' + encoding);
  }
}

export function toBase64(bytes) {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}
export const fromBase64 = b64 => Uint8Array.from(atob(b64), c => c.charCodeAt(0));

// Characters from `original` that survive at the same position in `candidate`.
export function preservedCount(original, candidate) {
  const a = codePoints(original), b = codePoints(candidate);
  return a.reduce((n, c, i) => n + (c === b[i] ? 1 : 0), 0);
}
export function firstDifference(original, candidate) {
  const a = codePoints(original), b = codePoints(candidate);
  for (let i = 0; i < Math.max(a.length, b.length); i++) if (a[i] !== b[i]) return {index: i, expected: a[i] ?? '', actual: b[i] ?? ''};
  return null;
}

export const hex = bytes => Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
export async function sha(algorithm, bytes) {
  return hex(new Uint8Array(await crypto.subtle.digest(algorithm, bytes)));
}

// MD5 is not in Web Crypto; FTK Imager reports it, so it is computed here over the same bytes.
export function md5(input) {
  const K = Array.from({length: 64}, (_, i) => Math.floor(Math.abs(Math.sin(i + 1)) * 2 ** 32) >>> 0);
  const S = [7, 12, 17, 22, 5, 9, 14, 20, 4, 11, 16, 23, 6, 10, 15, 21];
  const len = input.length, padded = new Uint8Array(((len + 8) >>> 6) * 64 + 64);
  padded.set(input);
  padded[len] = 0x80;
  const dv = new DataView(padded.buffer);
  dv.setUint32(padded.length - 8, (len * 8) >>> 0, true);
  dv.setUint32(padded.length - 4, Math.floor(len / 2 ** 29), true);
  let a0 = 0x67452301, b0 = 0xefcdab89, c0 = 0x98badcfe, d0 = 0x10325476;
  for (let off = 0; off < padded.length; off += 64) {
    let a = a0, b = b0, c = c0, d = d0;
    for (let i = 0; i < 64; i++) {
      const round = i >>> 4;
      let f, g;
      if (round === 0) { f = (b & c) | (~b & d); g = i; }
      else if (round === 1) { f = (d & b) | (~d & c); g = (5 * i + 1) % 16; }
      else if (round === 2) { f = b ^ c ^ d; g = (3 * i + 5) % 16; }
      else { f = c ^ (b | ~d); g = (7 * i) % 16; }
      f = (f + a + K[i] + dv.getUint32(off + g * 4, true)) | 0;
      a = d; d = c; c = b;
      const s = S[round * 4 + (i & 3)];
      b = (b + ((f << s) | (f >>> (32 - s)))) | 0;
    }
    a0 = (a0 + a) | 0; b0 = (b0 + b) | 0; c0 = (c0 + c) | 0; d0 = (d0 + d) | 0;
  }
  const out = new Uint8Array(16), dvOut = new DataView(out.buffer);
  [a0, b0, c0, d0].forEach((v, i) => dvOut.setUint32(i * 4, v, true));
  return hex(out);
}

const CRC_TABLE = Array.from({length: 256}, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
export function crc32(bytes) {
  let c = 0xffffffff;
  for (const b of bytes) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

// Write the print density into the PNG itself: a pHYs chunk straight after IHDR. Pixels are untouched.
export function pngWithPpi(png, ppi) {
  const pixelsPerMetre = Math.round(ppi / 0.0254);
  const chunk = new Uint8Array(21), dv = new DataView(chunk.buffer);
  dv.setUint32(0, 9);
  chunk.set([0x70, 0x48, 0x59, 0x73], 4);
  dv.setUint32(8, pixelsPerMetre);
  dv.setUint32(12, pixelsPerMetre);
  chunk[16] = 1;
  dv.setUint32(17, crc32(chunk.subarray(4, 17)));
  const ihdrEnd = 8 + 4 + 4 + 13 + 4;
  const out = new Uint8Array(png.length + chunk.length);
  out.set(png.subarray(0, ihdrEnd));
  out.set(chunk, ihdrEnd);
  out.set(png.subarray(ihdrEnd), ihdrEnd + chunk.length);
  return out;
}
export function pngPpi(png) {
  const dv = new DataView(png.buffer, png.byteOffset, png.byteLength);
  for (let off = 8; off + 8 <= png.length;) {
    const len = dv.getUint32(off), type = String.fromCharCode(...png.subarray(off + 4, off + 8));
    if (type === 'pHYs') return Math.round(dv.getUint32(off + 8) * 0.0254);
    if (type === 'IDAT') return null;
    off += 12 + len;
  }
  return null;
}
