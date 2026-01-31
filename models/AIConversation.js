const mongoose = require('mongoose');

const aiConversationSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            default: 'New Chat',
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        lastMessage: {
            type: String,
            default: '',
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('AIConversation', aiConversationSchema);
