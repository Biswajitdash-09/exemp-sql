/**
 * Core Database Functions
 * Handles low-level data persistence (file storage or localStorage)
 */

// Determine if running on server or browser
const isServer = typeof window === 'undefined';

/**
 * Get data from storage
 */
export function getData(key) {
    try {
        let data;
        if (isServer) {
            // Server-side - use file storage
            const { getCollection } = require('../fileStorage.service.js');
            data = JSON.stringify(getCollection(key));
        } else {
            // Browser-side - use localStorage
            data = localStorage.getItem(key);
        }
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error(`Error reading ${key}:`, error);
        return [];
    }
}

/**
 * Set data in storage
 */
export function setData(key, data) {
    try {
        if (isServer) {
            // Server-side - use file storage
            const { updateCollection } = require('../fileStorage.service.js');
            updateCollection(key, data);
        } else {
            // Browser-side - use localStorage
            localStorage.setItem(key, JSON.stringify(data));
        }
    } catch (error) {
        console.error(`Error writing ${key}:`, error);
    }
}

/**
 * Remove data from storage
 */
export function removeData(key) {
    try {
        if (isServer) {
            const { updateCollection } = require('../fileStorage.service.js');
            updateCollection(key, []);
        } else {
            localStorage.removeItem(key);
        }
    } catch (error) {
        console.error(`Error removing ${key}:`, error);
    }
}
