const express = require('express');
const http = require('http');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { initSockets } = require('./sockets/index');

// Load env
dotenv.config();

// Connect MongoDB
connectDB();

// Express App
console.log("Creating Express App...");
const app = express();
app.use(cors());
app.use(express.json());
console.log("Middleware set up.");

const path = require('path'); // Ensure path is required if not already


// Routes
console.log("Registering routes...");
app.get("/api/ping", (req, res) => res.json({ message: "pong" }));
app.use("/api/ai", require("./routes/ai.routes"));
console.log("AI routes registered.");

app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/user', require('./routes/user.routes')); // New User Routes
app.use('/api/chat', require('./routes/chat.routes'));
app.use("/api/message", require("./routes/message.routes"));
app.use("/api/status", require("./routes/status.routes"));
app.use("/api/channel", require("./routes/channel.routes"));
app.use("/api/group", require("./routes/group.routes"));
app.use("/api/call", require("./routes/call.routes"));
app.use("/api/notifications", require("./routes/notification.routes"));
console.log("All routes registered.");


// Static Folder for Uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Catch 404
app.use((req, res, next) => {
  const err = new Error(`Route ${req.method} ${req.url} Not Found`);
  err.status = 404;
  next(err);
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Global Error:", err.stack);
  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
    error: process.env.NODE_ENV === "development" ? err : {}
  });
});

// HTTP + WebSocket server
const server = http.createServer(app);

// Initialize modular WebSocket
console.log("Initializing WebSockets...");
initSockets(server, app);
console.log("WebSockets done.");

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`[${new Date().toISOString()}] Server + WebSocket running on port ${PORT}`);
});
