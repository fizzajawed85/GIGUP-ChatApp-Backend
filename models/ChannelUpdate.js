const mongoose = require("mongoose");

const channelUpdateSchema = new mongoose.Schema(
    {
        channel: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Channel",
            required: true,
        },
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        text: {
            type: String,
            required: false,
        },
        mediaUrl: {
            type: String,
            default: "",
        },
        mediaType: {
            type: String,
            enum: ["text", "image", "video"],
            default: "text",
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("ChannelUpdate", channelUpdateSchema);
