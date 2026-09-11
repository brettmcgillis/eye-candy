const DATABASE_NAME = 'eyeCandyProjectionMapping';
const DATABASE_VERSION = 1;
const STORE_NAME = 'media';

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function requestResult(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveMedia(file) {
  const database = await openDatabase();
  const id = `asset-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const record = {
    blob: file,
    id,
    name: file.name,
    size: file.size,
    type: file.type,
  };
  const transaction = database.transaction(STORE_NAME, 'readwrite');
  await requestResult(transaction.objectStore(STORE_NAME).put(record));
  database.close();
  return record;
}

export async function loadMedia(id) {
  if (!id) return null;
  const database = await openDatabase();
  const transaction = database.transaction(STORE_NAME, 'readonly');
  const record = await requestResult(
    transaction.objectStore(STORE_NAME).get(id)
  );
  database.close();
  return record ?? null;
}
