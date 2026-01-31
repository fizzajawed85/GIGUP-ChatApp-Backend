const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema(
  {
    // participants in chat (human-human OR human-AI)
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],

    // chat type: normal user chat OR AI chat
    chatType: {
      type: String,
      enum: ["user", "ai"],
      default: "user",
    },

    // last message for inbox preview
    latestMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },

    //  NEW: archived for specific users
    archivedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    nicknames: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        name: { type: String },
      },
    ],
    unreadCounts: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        count: { type: Number, default: 0 },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Chat", chatSchema);
