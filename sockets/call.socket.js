const Notification = require("../models/Notification");

module.exports = (io) => {
  io.on("connection", (socket) => {
    const senderId = socket.userId;
    if (!senderId) return;

    socket.on("callUser", async (data) => {
      const { userToCall, signalData, callerName, type } = data || {};
      const targetId = userToCall?.toString()?.toLowerCase();
      if (!targetId) return;

      const room = io.sockets.adapter.rooms.get(targetId);
      const userCount = room ? room.size : 0;

      if (userCount === 0) {
        socket.emit("callError", {
          message: "Recipient is not connected to signaling room.",
        });
      }

      try {
        await Notification.create({
          recipient: targetId,
          sender: senderId,
          type: "call",
          title: `Incoming ${type === "video" ? "Video" : "Audio"} Call`,
          content: `${callerName} is calling you...`,
          data: { from: senderId, type },
        });
      } catch (err) {
        if (process.env.NODE_ENV === "development") {
          console.error("Failed to save call notification:", err.message);
        }
      }

      io.to(targetId).emit("incomingCall", {
        signal: signalData,
        from: senderId,
        callerName,
        type,
      });
    });

    socket.on("answerCall", (data) => {
      const targetId = data?.to?.toString()?.toLowerCase();
      if (targetId) io.to(targetId).emit("callAccepted", data.signal);
    });

    socket.on("iceCandidate", (data) => {
      const targetId = data?.to?.toString()?.toLowerCase();
      if (targetId) io.to(targetId).emit("iceCandidate", data.candidate);
    });

    socket.on("endCall", (data) => {
      const targetId = data?.to?.toString()?.toLowerCase();
      if (targetId) io.to(targetId).emit("callEnded");
    });

    socket.on("declineCall", (data) => {
      const targetId = data?.to?.toString()?.toLowerCase();
      if (targetId) io.to(targetId).emit("callDeclined");
    });
  });
};
