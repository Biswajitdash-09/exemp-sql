/**
 * Email Log Model
 * Tracks email delivery for comparison between providers
 */

import mongoose from 'mongoose';

const emailLogSchema = new mongoose.Schema({
    provider: {
        type: String,
        enum: ['sendgrid', 'resend'],
        required: true
    },
    emailType: {
        type: String,
        enum: ['otp', 'welcome', 'verification_report', 'appeal_notification', 'appeal_response', 'other'],
        required: true
    },
    recipient: {
        type: String,
        required: true
    },
    subject: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['sent', 'failed'],
        required: true
    },
    responseTime: {
        type: Number,  // milliseconds
        default: 0
    },
    messageId: {
        type: String,
        default: null
    },
    error: {
        type: String,
        default: null
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    }
}, {
    timestamps: true
});

// Indexes for efficient querying
emailLogSchema.index({ provider: 1, status: 1 });
emailLogSchema.index({ createdAt: -1 });
emailLogSchema.index({ emailType: 1 });

// Static method to get provider statistics
emailLogSchema.statics.getProviderStats = async function (startDate, endDate) {
    const match = {};
    if (startDate && endDate) {
        match.createdAt = { $gte: startDate, $lte: endDate };
    }

    const stats = await this.aggregate([
        { $match: match },
        {
            $group: {
                _id: '$provider',
                totalEmails: { $sum: 1 },
                successCount: {
                    $sum: { $cond: [{ $eq: ['$status', 'sent'] }, 1, 0] }
                },
                failureCount: {
                    $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
                },
                avgResponseTime: { $avg: '$responseTime' },
                minResponseTime: { $min: '$responseTime' },
                maxResponseTime: { $max: '$responseTime' }
            }
        },
        {
            $project: {
                provider: '$_id',
                totalEmails: 1,
                successCount: 1,
                failureCount: 1,
                successRate: {
                    $multiply: [
                        { $divide: ['$successCount', { $max: ['$totalEmails', 1] }] },
                        100
                    ]
                },
                avgResponseTime: { $round: ['$avgResponseTime', 2] },
                minResponseTime: 1,
                maxResponseTime: 1
            }
        }
    ]);

    return stats;
};

// Prevent model recompilation in development
const EmailLog = mongoose.models.EmailLog || mongoose.model('EmailLog', emailLogSchema);

export default EmailLog;
