const mongoose = require("mongoose");

const statusSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        content: {
            type: String, // Text content or Image URL
            required: true,
        },
        type: {
            type: String,
            enum: ["text", "image", "video"],
            default: "text",
        },
        backgroundColor: {
            type: String,
            default: "#000000",
        },
        viewers: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        expiresAt: {
            type: Date,
            default: () => new Date(+new Date() + 24 * 60 * 60 * 1000), // 24 hours from now
            index: { expires: 0 }, // Automatically delete when expired
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Status", statusSchema);
