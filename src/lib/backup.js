/**
 * Backup Library for Legal Study App
 * Handles export and import of localStorage data (Notes, Progress, Stats).
 */

const STORAGE_KEYS = [
    'notebook_notes_v2',
    'studyProgress',
    'userStats',
    'studyTime',
    'theme',
    'studyNotes', // Daily schedule notes
    'dailyHistory', // Weekly chart data
    'syllabusProgress' // Subject tree progress
];

export const exportData = () => {
    const backup = {
        version: 1,
        timestamp: new Date().toISOString(),
        data: {}
    };

    STORAGE_KEYS.forEach(key => {
        const value = localStorage.getItem(key);
        if (value) {
            try {
                // Try to parse JSON to ensure validity, but store as string or object?
                // Storing as parsed object is cleaner for the JSON file
                backup.data[key] = JSON.parse(value);
            } catch (e) {
                // If not JSON (like simple strings), store as is
                backup.data[key] = value;
            }
        }
    });

    return backup;
};

export const downloadBackup = (backupData) => {
    const fileName = `legal-study-backup-${new Date().toISOString().slice(0, 10)}.json`;
    const jsonStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

export const importData = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (event) => {
            try {
                const backup = JSON.parse(event.target.result);

                // Basic Validation
                if (!backup.data || typeof backup.data !== 'object') {
                    throw new Error('Formato de arquivo inválido.');
                }

                // Restore Data
                Object.entries(backup.data).forEach(([key, value]) => {
                    if (STORAGE_KEYS.includes(key)) {
                        const valueToStore = typeof value === 'object' ? JSON.stringify(value) : value;
                        localStorage.setItem(key, valueToStore);
                    }
                });

                resolve({ success: true, timestamp: backup.timestamp });
            } catch (error) {
                reject(error);
            }
        };

        reader.onerror = () => reject(new Error('Erro ao ler o arquivo.'));
        reader.readAsText(file);
    });
};
