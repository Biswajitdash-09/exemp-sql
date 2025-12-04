/**
 * File-based Storage Service for Server-side Persistence
 * This replaces the in-memory ServerStorage with actual file persistence
 */

import fs from 'fs';
import path from 'path';

const STORAGE_DIR = path.join(process.cwd(), '.storage');
const STORAGE_FILE = path.join(STORAGE_DIR, 'database.json');

// Ensure storage directory exists
function ensureStorageDir() {
    if (!fs.existsSync(STORAGE_DIR)) {
        fs.mkdirSync(STORAGE_DIR, { recursive: true });
    }
}

// Initialize storage file if it doesn't exist
function initializeStorage() {
    ensureStorageDir();

    if (!fs.existsSync(STORAGE_FILE)) {
        const initialData = {
            employees: [],
            verifiers: [],
            admins: [],
            verification_records: [],
            appeals: [],
            dashboard_stats: null
        };
        fs.writeFileSync(STORAGE_FILE, JSON.stringify(initialData, null, 2));
    }
}

// Read data from file
export function readStorage() {
    try {
        ensureStorageDir();

        if (!fs.existsSync(STORAGE_FILE)) {
            initializeStorage();
        }

        const data = fs.readFileSync(STORAGE_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading storage file:', error);
        initializeStorage();
        return readStorage();
    }
}

// Write data to file
export function writeStorage(data) {
    try {
        ensureStorageDir();
        fs.writeFileSync(STORAGE_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Error writing storage file:', error);
        return false;
    }
}

// Get specific collection
export function getCollection(collectionName) {
    const storage = readStorage();
    return storage[collectionName] || [];
}

// Update specific collection
export function updateCollection(collectionName, data) {
    const storage = readStorage();
    storage[collectionName] = data;
    return writeStorage(storage);
}

// Initialize on module load
initializeStorage();
