import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import 'dotenv/config';

import { authMiddleware, socketAuthMiddleware } from './middleware/auth';
import { registerSocketHandlers } from './socket/handlers';

// ---- Config ----
const PORT = process.env.PORT || 3001;
const CLIENT_URL = process.env.CLIENT_URL
const JWT_SECRET = process.env.JWT_SECRET

// ---- Setup ----
const app = express();
const server = http.createServer(app);
const prisma = new PrismaClient();

// ---- Middleware ----
app.use(cors({ origin: CLIENT_URL }));
app.use(express.json());

// ---- Socket.IO ----
const io = new Server(server, {
  cors: {
    origin: CLIENT_URL,
    methods: ['GET', 'POST'],
  },
});

// ✅ ตรวจ JWT ก่อนทุก connection
io.use(socketAuthMiddleware);

// เมื่อ connect ผ่านแล้ว → ลงทะเบียน handlers
io.on('connection', (socket) => {
  registerSocketHandlers(io, socket);
});

// ================================================================
// REST API Routes
// ================================================================

// ---- Auth ----

// POST /auth/register
app.post('/auth/register', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ error: 'Username and password are required' });
    return;
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (existingUser) {
      res.status(409).json({ error: 'Username already taken' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { username, password: hashedPassword },
    });

    res.status(201).json({
      message: 'Registered successfully',
      user: { id: user.id, username: user.username },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /auth/login
app.post('/auth/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ error: 'Username and password are required' });
    return;
  }

  try {
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: { id: user.id, username: user.username },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ---- Rooms ----

// GET /rooms — ดึงรายการห้องทั้งหมด
app.get('/rooms', authMiddleware, async (_req, res) => {
  try {
    const rooms = await prisma.room.findMany({
      orderBy: { id: 'asc' },
    });
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ---- Messages ----

// GET /messages/:roomId — ดึง History ข้อความของห้อง
app.get('/messages/:roomId', authMiddleware, async (req, res) => {
  const roomId = Number(req.params.roomId);

  if (isNaN(roomId)) {
    res.status(400).json({ error: 'Invalid roomId' });
    return;
  }

  try {
    const messages = await prisma.message.findMany({
      where: { roomId },
      include: {
        sender: {
          select: { id: true, username: true },
        },
      },
      orderBy: { createdAt: 'asc' },
      take: 50,
    });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ---- Health Check ----
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ---- Start Server ----
server.listen(PORT, () => {
  console.log(`
🚀 Server running on http://localhost:${PORT}
📡 Socket.IO ready
🗄️  Database connected via Prisma
  `);
});
