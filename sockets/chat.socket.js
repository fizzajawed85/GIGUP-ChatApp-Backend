const mongoose = require("mongoose");
const Message = require("../models/Message");
const Chat = require("../models/Chat");
const User = require("../models/User");
const Notification = require("../models/Notification");

module.exports = (io) => {
  io.on("connection", (socket) => {
    const currentUserId = socket.userId;
    if (!currentUserId) return;

    User.findByIdAndUpdate(currentUserId, { isOnline: true }).catch(() => {});
    io.emit("statusChange", { userId: currentUserId, isOnline: true });

    socket.on("addUser", async () => {
      socket.join(currentUserId);
    });

    socket.on("joinChat", (chatId) => {
      if (chatId) socket.join(chatId);
    });

    socket.on("sendMessage", async (data) => {
      try {
        const { chatId, text } = data || {};
        if (!chatId) return;

        const chatBeforeUpdate = await Chat.findById(chatId);
        if (
          !chatBeforeUpdate ||
          !chatBeforeUpdate.participants.some(
            (p) => p.toString().toLowerCase() === currentUserId
          )
        ) {
          return;
        }

        const message = await Message.create({
          chat: chatId,
          sender: currentUserId,
          text: text || "",
          aiResponse: false,
        });

        if (!chatBeforeUpdate.unreadCounts) chatBeforeUpdate.unreadCounts = [];

        chatBeforeUpdate.participants.forEach((pId) => {
          const pIdStr = (pId._id || pId).toString().toLowerCase();
          if (!chatBeforeUpdate.unreadCounts.some((uc) => uc.user.toString().toLowerCase() === pIdStr)) {
            chatBeforeUpdate.unreadCounts.push({ user: pIdStr, count: 0 });
          }
        });

        chatBeforeUpdate.unreadCounts.forEach((uc) => {
          if (uc.user.toString().toLowerCase() === currentUserId) {
            uc.count = 0;
          } else {
            uc.count += 1;
          }
        });

        chatBeforeUpdate.latestMessage = message._id;
        chatBeforeUpdate.archivedBy = [];
        chatBeforeUpdate.markModified("unreadCounts");
        await chatBeforeUpdate.save();

        try {
          const sender = await User.findById(currentUserId);
          const recipients = chatBeforeUpdate.participants.filter(
            (p) => p.toString().toLowerCase() !== currentUserId
          );

          for (const recipientId of recipients) {
            await Notification.create({
              recipient: recipientId,
              sender: currentUserId,
              type: "message",
              title: `New Message from ${sender?.username || "User"}`,
              content: text || "Sent an attachment",
              data: { chatId, messageId: message._id },
            });
          }
        } catch (notifErr) {
          if (process.env.NODE_ENV === "development") {
            console.error("Socket notification error:", notifErr.message);
          }
        }

        const chat = await Chat.findById(chatId)
          .populate("participants", "-password")
          .populate({
            path: "latestMessage",
            populate: { path: "sender", select: "username email avatar" },
          });

        const populatedMessage = await Message.findById(message._id).populate("sender", "username email avatar");

        if (chat?.participants) {
          chat.participants.forEach((p) => {
            const pId = p._id ? p._id.toString() : p.toString();
            io.to(pId).emit("chatUpdated", chat);
            io.to(pId).emit("receiveMessage", populatedMessage);
          });
        }
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          console.error("Socket sendMessage error:", error.message);
        }
      }
    });

    socket.on("goOffline", async () => {
      try {
        await User.findByIdAndUpdate(currentUserId, {
          isOnline: false,
          lastSeen: new Date(),
        });
        io.emit("statusChange", {
          userId: currentUserId,
          isOnline: false,
          lastSeen: new Date(),
        });
      } catch (err) {
        if (process.env.NODE_ENV === "development") {
          console.error("Error going offline:", err.message);
        }
      }
    });

    socket.on("editMessage", async (updatedMsg) => {
      if (!updatedMsg?.chat) return;
      const message = await Message.findById(updatedMsg._id);
      if (!message || message.sender.toString().toLowerCase() !== currentUserId) return;
      io.to(updatedMsg.chat).emit("messageUpdated", updatedMsg);
    });

    socket.on("deleteMessage", async (updatedMsg) => {
      if (!updatedMsg?.chat) return;
      const message = await Message.findById(updatedMsg._id);
      if (!message || message.sender.toString().toLowerCase() !== currentUserId) return;
      io.to(updatedMsg.chat).emit("messageUpdated", updatedMsg);
    });

    socket.on("messageSeen", async ({ chatId }) => {
      try {
        if (!chatId) return;

        const chat = await Chat.findById(chatId);
        if (!chat || !chat.participants.some((p) => p.toString().toLowerCase() === currentUserId)) {
          return;
        }

        const cId = new mongoose.Types.ObjectId(chatId);
        const uId = new mongoose.Types.ObjectId(currentUserId);

        await Message.updateMany(
          { chat: cId, sender: { $ne: uId }, status: { $ne: "seen" } },
          { $set: { status: "seen" } }
        );

        if (chat.unreadCounts) {
          const uc = chat.unreadCounts.find(
            (u) => u.user.toString().toLowerCase() === currentUserId
          );
          if (uc) {
            uc.count = 0;
            chat.markModified("unreadCounts");
            await chat.save();
          }
        }

        const updatedChat = await Chat.findById(chatId)
          .populate("participants", "-password")
          .populate({
            path: "latestMessage",
            populate: { path: "sender", select: "username email avatar" },
          });

        io.to(chatId).emit("messagesSeen", { chatId, userId: currentUserId });
        if (updatedChat?.participants) {
          updatedChat.participants.forEach((p) => {
            const pId = p._id ? p._id.toString() : p.toString();
            io.to(pId).emit("chatUpdated", updatedChat);
          });
        }
      } catch (err) {
        if (process.env.NODE_ENV === "development") {
          console.error("Error marking messages as seen:", err.message);
        }
      }
    });

    socket.on("messageDelivered", async (messageId) => {
      try {
        const msg = await Message.findOneAndUpdate(
          { _id: messageId, status: "sent" },
          { status: "delivered" },
          { new: true }
        );
        if (msg) {
          io.to(msg.chat.toString()).emit("messageUpdated", msg);
        }
      } catch (err) {
        if (process.env.NODE_ENV === "development") {
          console.error("Error marking message as delivered:", err.message);
        }
      }
    });

    socket.on("typing", async ({ chatId }) => {
      if (!chatId) return;
      const chat = await Chat.findById(chatId);
      if (!chat || !chat.participants.some((p) => p.toString().toLowerCase() === currentUserId)) return;
      socket.to(chatId).emit("userTyping", { chatId, userId: currentUserId });
    });

    socket.on("stopTyping", async ({ chatId }) => {
      if (!chatId) return;
      const chat = await Chat.findById(chatId);
      if (!chat || !chat.participants.some((p) => p.toString().toLowerCase() === currentUserId)) return;
      socket.to(chatId).emit("userStopTyping", { chatId, userId: currentUserId });
    });

    socket.on("disconnect", async () => {
      await User.findByIdAndUpdate(currentUserId, {
        isOnline: false,
        lastSeen: new Date(),
      }).catch(() => {});
      io.emit("statusChange", {
        userId: currentUserId,
        isOnline: false,
        lastSeen: new Date(),
      });
    });
  });
};
