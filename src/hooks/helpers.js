import { useRef } from 'react';

// --- HELPER: Debounce Save ---
export const useDebouncedSave = (saveFn, delay = 2000) => {
    const timeoutRef = useRef(null);

    const triggerSave = (data) => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
            saveFn(data);
        }, delay);
    };

    return triggerSave;
};

// --- HELPER: Safe Parse ---
export const safeParse = (jsonString, fallback) => {
    if (!jsonString || jsonString === 'undefined') return fallback;
    try {
        return JSON.parse(jsonString);
    } catch (e) {
        console.error("Failed to parse localStorage:", e);
        return fallback;
    }
};

// --- HELPER: Timestamp Comparison & Merge ---
// Returns true if remote is newer
export const isNewer = (remoteRow, localRow) => {
    if (!remoteRow) return false;
    if (!localRow) return true;
    if (!localRow.updated_at) return true;
    if (!remoteRow.updated_at) return false;
    return new Date(remoteRow.updated_at) > new Date(localRow.updated_at);
};
