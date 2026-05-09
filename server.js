const dns = require("dns");
const express = require("express");
const http = require("http");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const connectDB = require("./config/db");
const { initSockets } = require("./sockets/index");

dotenv.config();
dns.setDefaultResultOrder("ipv4first");

const app = express();

const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("CORS blocked for this origin"));
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json({ limit: "10mb" }));

app.get("/api/ping", (req, res) => res.json({ message: "pong" }));

app.use("/api/ai", require("./routes/ai.routes"));
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/user", require("./routes/user.routes"));
app.use("/api/chat", require("./routes/chat.routes"));
app.use("/api/message", require("./routes/message.routes"));
app.use("/api/status", require("./routes/status.routes"));
app.use("/api/channel", require("./routes/channel.routes"));
app.use("/api/group", require("./routes/group.routes"));
app.use("/api/call", require("./routes/call.routes"));
app.use("/api/notifications", require("./routes/notification.routes"));

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use((req, res, next) => {
  const err = new Error(`Route ${req.method} ${req.url} Not Found`);
  err.status = 404;
  next(err);
});

app.use((err, req, res, next) => {
  const statusCode = err.status || 500;
  if (statusCode >= 500) {
    console.error("Global Error:", err.stack || err.message);
  }
  res.status(statusCode).json({
    message: err.message || "Internal Server Error",
    error: process.env.NODE_ENV === "development" ? err : {},
  });
});

const server = http.createServer(app);
initSockets(server, app, corsOptions);

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await connectDB();
    server.listen(PORT, () => {
      console.log(`[${new Date().toISOString()}] Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Startup failed:", error.message);
    process.exit(1);
  }
};

startServer();
