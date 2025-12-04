/**
 * Verifier Data Service
 * Handles all verifier-related database operations
 */

import { getData, setData } from './db.core.js';

const VERIFIERS_KEY = 'verifiers';

// Create new verifier
export function createVerifier(verifierData) {
    const verifiers = getData(VERIFIERS_KEY);

    const newVerifier = {
        id: '_' + Math.random().toString(36).substr(2, 9),
        ...verifierData,
        createdAt: new Date().toISOString(),
        isActive: true,
        isEmailVerified: false,
        verificationRequests: [],
        lastLoginAt: null
    };

    verifiers.push(newVerifier);
    setData(VERIFIERS_KEY, verifiers);

    return newVerifier;
}

// Find verifier by email
export function findVerifierByEmail(email) {
    const verifiers = getData(VERIFIERS_KEY);
    return verifiers.find(v => v.email.toLowerCase() === email.toLowerCase());
}

// Find verifier by ID
export function findVerifierById(id) {
    const verifiers = getData(VERIFIERS_KEY);
    return verifiers.find(v => v.id === id);
}

// Update verifier
export function updateVerifier(id, updates) {
    const verifiers = getData(VERIFIERS_KEY);
    const index = verifiers.findIndex(v => v.id === id);

    if (index !== -1) {
        verifiers[index] = { ...verifiers[index], ...updates };
        setData(VERIFIERS_KEY, verifiers);
        return verifiers[index];
    }

    return null;
}

// Get all verifiers
export function getAllVerifiers() {
    return getData(VERIFIERS_KEY);
}
