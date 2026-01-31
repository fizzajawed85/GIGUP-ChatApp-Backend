const mongoose = require('mongoose');

const callSchema = new mongoose.Schema(
    {
        caller: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        receiver: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        type: {
            type: String,
            enum: ['audio', 'video'],
            required: true,
        },
        status: {
            type: String,
            enum: ['missed', 'answered', 'declined'],
            default: 'missed',
        },
        duration: {
            type: Number, // in seconds
            default: 0,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Call', callSchema);
