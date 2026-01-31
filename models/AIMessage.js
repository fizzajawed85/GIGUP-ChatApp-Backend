const mongoose = require('mongoose');

const aiMessageSchema = new mongoose.Schema(
    {
        conversation: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'AIConversation',
            required: true,
        },
        role: {
            type: String,
            enum: ['user', 'model'], // 'model' is the term used by Gemini
            required: true,
        },
        text: {
            type: String,
            required: true,
        },
        fileUrl: {
            type: String,
        },
        fileType: {
            type: String,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('AIMessage', aiMessageSchema);
