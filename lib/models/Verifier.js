/**
 * Verifier Model
 * Represents third-party verifier accounts (BGV agencies, future employers)
 */

import mongoose from 'mongoose';

const VerifierSchema = new mongoose.Schema({
    companyName: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        index: true,
    },
    password: {
        type: String,
        required: true,
    },
    isEmailVerified: {
        type: Boolean,
        default: false,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    verificationRequests: {
        type: [String],
        default: [],
    },
    notifications: {
        type: Array,
        default: [],
    },
    lastLoginAt: {
        type: Date,
    },
    testMode: {
        type: Boolean,
        default: false,
    },
    isBgvAgency: {
        type: Boolean,
        default: false,
    },
    bypassToken: {
        type: String,
    },
}, {
    timestamps: true,
    collection: 'verifiers',
});

// Prevent model recompilation in development
export default mongoose.models.Verifier || mongoose.model('Verifier', VerifierSchema);
