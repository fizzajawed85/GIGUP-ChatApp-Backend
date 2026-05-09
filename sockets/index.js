const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const initChatSocket = require("./chat.socket");
const initGroupSocket = require("./group.socket");
const initCallSocket = require("./call.socket");

const initSockets = (server, app, corsOptions = {}) => {
  const io = new Server(server, {
    cors: {
      origin: corsOptions.origin || "*",
      credentials: true,
      methods: ["GET", "POST"],
    },
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) {
        return next(new Error("Unauthorized socket connection"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id?.toString()?.toLowerCase();
      if (!socket.userId) {
        return next(new Error("Invalid socket token payload"));
      }
      return next();
    } catch (error) {
      return next(new Error("Invalid socket token"));
    }
  });

  io.on("connection", (socket) => {
    socket.join(socket.userId);

    socket.on("disconnect", (reason) => {
      if (process.env.NODE_ENV === "development") {
        console.log(`[Socket] Disconnected ${socket.id}: ${reason}`);
      }
    });
  });

  app.set("socketio", io);
  initChatSocket(io);
  initGroupSocket(io);
  initCallSocket(io);
  require("./groupCall.socket")(io);
  console.log("WebSocket initialized");
};

module.exports = { initSockets };
