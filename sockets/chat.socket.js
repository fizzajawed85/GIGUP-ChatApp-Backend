const Message = require("../models/Message");
const Chat = require("../models/Chat");
const User = require("../models/User");
const Notification = require("../models/Notification");

// userId -> socket.id map (simplified for demo, usually store multiple sockets per user if needed)
let onlineUsers = new Set();

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log("New client connected: " + socket.id);

    socket.on("addUser", async (userId) => {
      if (!userId) return;
      socket.join(userId);
      onlineUsers.add(userId);

      try {
        await User.findByIdAndUpdate(userId, { isOnline: true });
        // Notify all users about status change
        io.emit("statusChange", { userId, isOnline: true });
      } catch (err) {
        console.error("Error updating user status:", err);
      }
    });

    socket.on("joinChat", async (chatId) => {
      socket.join(chatId);
    });

    socket.on("sendMessage", async (data) => {
      try {
        const { chatId, senderId, text } = data;
        const chatBeforeUpdate = await Chat.findById(chatId);
        if (!chatBeforeUpdate || !chatBeforeUpdate.participants.some(p => p.toString() === senderId))
          return;

        const message = await Message.create({
          chat: chatId,
          sender: senderId,
          text,
          aiResponse: false,
        });

        // Initialize unreadCounts if missing
        if (!chatBeforeUpdate.unreadCounts) chatBeforeUpdate.unreadCounts = [];

        chatBeforeUpdate.participants.forEach(pId => {
          const pIdStr = pId._id ? pId._id.toString() : pId.toString(); // Handle populated vs unpopulated
          if (!chatBeforeUpdate.unreadCounts.some(uc => uc.user.toString() === pIdStr)) {
            chatBeforeUpdate.unreadCounts.push({ user: pIdStr, count: 0 });
          }
        });

        // Increment for others
        chatBeforeUpdate.unreadCounts.forEach(uc => {
          if (uc.user.toString() !== senderId.toString()) {
            uc.count += 1;
          }
        });

        chatBeforeUpdate.latestMessage = message._id;
        chatBeforeUpdate.archivedBy = [];
        await chatBeforeUpdate.save();

        // Create notification for recipients
        try {
          const sender = await User.findById(senderId);
          const recipients = chatBeforeUpdate.participants.filter(p => p.toString() !== senderId.toString());

          for (const recipientId of recipients) {
            await Notification.create({
              recipient: recipientId,
              sender: senderId,
              type: 'message',
              title: `New Message from ${sender?.username || 'User'}`,
              content: text || 'Sent an attachment',
              data: { chatId, messageId: message._id }
            });
          }
        } catch (notifErr) {
          console.error(">>> Socket Notification Error:", notifErr);
        }

        // Get the fully populated chat
        const chat = await Chat.findById(chatId)
          .populate("participants", "-password")
          .populate({
            path: "latestMessage",
            populate: { path: "sender", select: "username email avatar" },
          });

        const populatedMessage = await Message.findById(message._id)
          .populate("sender", "username email avatar");

        // Emit to the chat room for people with it open
        io.to(chatId).emit("receiveMessage", populatedMessage);

        // Emit to each participant's personal room for sidebar updates
        if (chat && chat.participants) {
          chat.participants.forEach(p => {
            const pId = p._id ? p._id.toString() : p.toString();
            io.to(pId).emit("chatUpdated", chat);
            io.to(pId).emit("receiveMessage", populatedMessage);
          });
        }
      } catch (error) {
        console.error("Socket sendMessage error:", error);
      }
    });

    socket.on("disconnect", async () => {
      console.log("Client disconnected: " + socket.id);

      // Find userId for this socket.id
      // Note: In a production app, you might want to map socketId to userId
      // For now, we expect the frontend to call a "logout" or we infer from rooms
      // Simplified approach: loop through rooms the socket was in if needed, 
      // but usually we rely on the `userId` passed in `addUser`
    });

    // Custom leave/offline handler
    socket.on("goOffline", async (userId) => {
      if (!userId) return;
      onlineUsers.delete(userId);
      try {
        await User.findByIdAndUpdate(userId, { isOnline: false, lastSeen: new Date() });
        io.emit("statusChange", { userId, isOnline: false, lastSeen: new Date() });
      } catch (err) {
        console.error("Error going offline:", err);
      }
    });

    socket.on("editMessage", (updatedMsg) => {
      if (!updatedMsg.chat) return;
      io.to(updatedMsg.chat).emit("messageUpdated", updatedMsg);
    });

    socket.on("deleteMessage", (updatedMsg) => {
      if (!updatedMsg.chat) return;
      io.to(updatedMsg.chat).emit("messageUpdated", updatedMsg);
    });

    socket.on("messageSeen", async ({ chatId, userId }) => {
      try {
        // Mark all messages in this chat as 'seen' if they were sent by the other person
        await Message.updateMany(
          { chat: chatId, sender: { $ne: userId }, status: { $ne: "seen" } },
          { status: "seen" }
        );

        // Reset unread count for THIS user
        let chat = await Chat.findById(chatId);
        if (chat && chat.unreadCounts) {
          const uc = chat.unreadCounts.find(u => u.user.toString() === userId.toString());
          if (uc) {
            uc.count = 0;
            await chat.save();
          }
        }

        const updatedChat = await Chat.findById(chatId)
          .populate("participants", "-password")
          .populate({
            path: "latestMessage",
            populate: { path: "sender", select: "username email avatar" },
          });

        // Notify the sender that messages were seen
        io.to(chatId).emit("messagesSeen", { chatId, userId });
        if (updatedChat) {
          io.to(chatId).emit("chatUpdated", updatedChat);
        }
      } catch (err) {
        console.error("Error marking messages as seen:", err);
      }
    });

    socket.on("messageDelivered", async (messageId) => {
      try {
        // Only mark as delivered if it was currently just 'sent'
        const msg = await Message.findOneAndUpdate(
          { _id: messageId, status: "sent" },
          { status: "delivered" },
          { new: true }
        );
        if (msg) {
          io.to(msg.chat.toString()).emit("messageUpdated", msg);
        }
      } catch (err) {
        console.error("Error marking message as delivered:", err);
      }
    });

    socket.on("typing", ({ chatId, userId }) => {
      socket.to(chatId).emit("userTyping", { chatId, userId });
    });

    socket.on("stopTyping", ({ chatId, userId }) => {
      socket.to(chatId).emit("userStopTyping", { chatId, userId });
    });
  });
};
