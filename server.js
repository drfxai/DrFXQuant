require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const { pool, initDB } = require("./database");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" }, maxHttpBufferSize: 10e6 });

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "change_me";
const UPLOAD_DIR = path.join(__dirname, "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

app.use(cors());
app.use(express.json({ limit: "12mb" }));
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(UPLOAD_DIR));

function authMiddleware(req, res, next) {
  const h = req.headers.authorization;
  if (!h || !h.startsWith("Bearer ")) return res.status(401).json({ error: "No token" });
  try { req.user = jwt.verify(h.split(" ")[1], JWT_SECRET); next(); }
  catch { return res.status(401).json({ error: "Invalid token" }); }
}
function adminMiddleware(req, res, next) {
  if (!req.user || req.user.role !== "admin") return res.status(403).json({ error: "Admin required" });
  next();
}

app.set("pool", pool);
app.set("io", io);
app.set("jwt_secret", JWT_SECRET);
app.set("authMiddleware", authMiddleware);
app.set("adminMiddleware", adminMiddleware);

app.use("/api/auth", require("./routes/auth"));
app.use("/api/chats", require("./routes/chats"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/payment", require("./routes/payment"));
app.use("/api/upload", require("./routes/upload"));

// ── Socket.io ──
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error("Auth required"));
  try { socket.user = jwt.verify(token, JWT_SECRET); next(); }
  catch { next(new Error("Invalid token")); }
});

const onlineUsers = new Map();
// Live Trading state
let liveStream = { active: false, adminId: null, adminName: "", startedAt: null, viewers: new Set() };

io.on("connection", (socket) => {
  const uid = socket.user.id;
  onlineUsers.set(uid, socket.id);
  io.emit("online_users", Array.from(onlineUsers.keys()));
  socket.join(`user_${uid}`);

  socket.on("typing", (data) => {
    if (data.chatId) {
      pool.query("SELECT user_id FROM chat_members WHERE chat_id=$1 AND user_id!=$2", [data.chatId, uid])
        .then(({ rows }) => rows.forEach(r => io.to(`user_${r.user_id}`).emit("typing", { chatId: data.chatId, userId: uid, name: socket.user.email })))
        .catch(() => {});
    }
  });

  // ── Live Trading Signaling ──
  socket.on("live_start", () => {
    if (socket.user.role !== "admin") return;
    liveStream = { active: true, adminId: uid, adminName: socket.user.name || socket.user.email, startedAt: Date.now(), viewers: new Set() };
    io.emit("live_status", { active: true, adminName: liveStream.adminName, startedAt: liveStream.startedAt, viewerCount: 0 });
  });

  socket.on("live_stop", () => {
    if (socket.user.role !== "admin" || liveStream.adminId !== uid) return;
    liveStream = { active: false, adminId: null, adminName: "", startedAt: null, viewers: new Set() };
    io.emit("live_status", { active: false });
    io.emit("live_ended");
  });

  socket.on("live_get_status", () => {
    socket.emit("live_status", { active: liveStream.active, adminName: liveStream.adminName, startedAt: liveStream.startedAt, viewerCount: liveStream.viewers.size });
  });

  socket.on("live_join", () => {
    if (!liveStream.active) return;
    liveStream.viewers.add(uid);
    socket.join("live_viewers");
    io.emit("live_status", { active: true, adminName: liveStream.adminName, startedAt: liveStream.startedAt, viewerCount: liveStream.viewers.size });
    // Ask admin to send offer to this viewer
    const adminSock = onlineUsers.get(liveStream.adminId);
    if (adminSock) io.to(adminSock).emit("live_viewer_joined", { viewerId: uid, socketId: socket.id });
  });

  socket.on("live_leave", () => {
    liveStream.viewers.delete(uid);
    socket.leave("live_viewers");
    io.emit("live_status", { active: liveStream.active, adminName: liveStream.adminName, startedAt: liveStream.startedAt, viewerCount: liveStream.viewers.size });
  });

  // WebRTC signaling relay
  socket.on("live_signal", (data) => {
    if (data.to) io.to(data.to).emit("live_signal", { from: socket.id, signal: data.signal, fromUserId: uid });
  });

  socket.on("disconnect", () => {
    onlineUsers.delete(uid);
    // If admin disconnects, end live
    if (liveStream.active && liveStream.adminId === uid) {
      liveStream = { active: false, adminId: null, adminName: "", startedAt: null, viewers: new Set() };
      io.emit("live_status", { active: false });
      io.emit("live_ended");
    }
    liveStream.viewers.delete(uid);
    if (liveStream.active) {
      io.emit("live_status", { active: true, adminName: liveStream.adminName, startedAt: liveStream.startedAt, viewerCount: liveStream.viewers.size });
    }
    io.emit("online_users", Array.from(onlineUsers.keys()));
  });
});

app.get("*", (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));

(async () => {
  try {
    await initDB();
    server.listen(PORT, () => {
      console.log(`\n  ╔════════════════════════════════════════╗`);
      console.log(`  ║  📈 DrFX Quantum v5.2 on port ${PORT}       ║`);
      console.log(`  ║  PostgreSQL ✅ · Telegram-style         ║`);
      console.log(`  ╚════════════════════════════════════════╝\n`);
    });
  } catch (err) { console.error("❌ Start failed:", err); process.exit(1); }
})();
