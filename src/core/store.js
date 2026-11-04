// Blob storage for real exported files. Small state lives in localStorage; pixels do not.
const DB = 'digital-evidence-lab', STORE = 'blobs';
let opening = null;
function db() {
  opening ??= new Promise((resolve, reject) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(STORE);
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
  return opening;
}
const tx = async (mode, fn) => {
  const d = await db();
  return new Promise((resolve, reject) => {
    const t = d.transaction(STORE, mode), q = fn(t.objectStore(STORE));
    t.oncomplete = () => resolve(q?.result);
    t.onerror = t.onabort = () => reject(t.error);
  });
};
export const putBlob = (key, blob) => tx('readwrite', s => s.put(blob, key));
export const getBlob = key => tx('readonly', s => s.get(key));
export const clearBlobs = () => tx('readwrite', s => s.clear());
