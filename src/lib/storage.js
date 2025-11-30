const DB_NAME = 'LegalStudyDB';
const DB_VERSION = 2; // Increment version for schema update
const STORE_NAME = 'files';

export const openDB = () => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = (event) => reject("IndexedDB error: " + event.target.error);

        request.onsuccess = (event) => resolve(event.target.result);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
                store.createIndex('subjectId', 'subjectId', { unique: false });
                store.createIndex('topicId', 'topicId', { unique: false });
            } else {
                // Upgrade existing store
                const store = request.transaction.objectStore(STORE_NAME);
                if (!store.indexNames.contains('topicId')) {
                    store.createIndex('topicId', 'topicId', { unique: false });
                }
            }
        };
    });
};

export const saveFile = async (file, subjectId, topicId = null) => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);

        const fileData = {
            subjectId,
            topicId, // Add topicId
            name: file.name,
            type: file.type,
            data: file,
            createdAt: new Date().toISOString()
        };

        const request = store.add(fileData);

        request.onsuccess = () => resolve(request.result);
        request.onerror = (event) => reject("Error saving file: " + event.target.error);
    });
};

export const getFiles = async (subjectId, topicId = null) => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const index = store.index('subjectId');
        const request = index.getAll(subjectId);

        request.onsuccess = () => {
            let files = request.result;
            if (topicId) {
                files = files.filter(f => f.topicId === topicId);
            } else {
                // If no topicId provided (General), filter for files with no topicId OR explicitly 'general'
                files = files.filter(f => !f.topicId || f.topicId === 'general');
            }
            resolve(files);
        };
        request.onerror = (event) => reject("Error fetching files: " + event.target.error);
    });
};

export const deleteFile = async (id) => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        // Ensure ID is a number as IndexedDB autoIncrement keys are numbers
        const request = store.delete(Number(id));

        request.onsuccess = () => resolve();
        request.onerror = (event) => reject("Error deleting file: " + event.target.error);
    });
};
