const mongoose = require("mongoose");

const groupSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        avatar: {
            type: String,
            default: "",
        },
        description: {
            type: String,
            default: "",
        },
        members: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
                required: true,
            },
        ],
        admins: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        latestMessage: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "GroupMessage",
        },
        unreadCounts: [
            {
                user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
                count: { type: Number, default: 0 },
            },
        ],
    },
    { timestamps: true }
);

module.exports = mongoose.model("Group", groupSchema);
