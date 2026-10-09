import express from 'express';
import cors from 'cors';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { randomUUID } from 'node:crypto';

const PORT = process.env.PORT || 4000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
const HISTORY_LIMIT = 50;
const ROOMS = ['general', 'frontend', 'backend', 'random'];

const app = express();
app.use(cors({ origin: CLIENT_ORIGIN }));
app.get('/health', (_req, res) => res.json({ ok: true }));
app.get('/rooms', (_req, res) => res.json(ROOMS));

const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: CLIENT_ORIGIN } });

// In-memory state. Swap for Redis or a database when you need persistence.
const history = new Map(ROOMS.map((room) => [room, []]));
const users = new Map(); // socket.id -> { name, room }

function usersInRoom(room) {
  return [...users.values()].filter((u) => u.room === room).map((u) => u.name);
}

function pushMessage(room, message) {
  const list = history.get(room);
  list.push(message);
  if (list.length > HISTORY_LIMIT) list.shift();
}

function systemMessage(room, text) {
  const message = { id: randomUUID(), system: true, text, at: Date.now() };
  pushMessage(room, message);
  io.to(room).emit('message', message);
}

io.on('connection', (socket) => {
  socket.on('join', ({ name, room }, ack) => {
    const cleanName = String(name || '').trim().slice(0, 24);
    if (!cleanName) return ack?.({ error: 'Please enter a name.' });
    if (!ROOMS.includes(room)) return ack?.({ error: 'Unknown room.' });

    const previous = users.get(socket.id);
    if (previous) {
      socket.leave(previous.room);
      systemMessage(previous.room, `${previous.name} left the room`);
      io.to(previous.room).emit('users', usersInRoom(previous.room));
    }

    users.set(socket.id, { name: cleanName, room });
    socket.join(room);
    ack?.({ ok: true, history: history.get(room) });
    systemMessage(room, `${cleanName} joined the room`);
    io.to(room).emit('users', usersInRoom(room));
  });

  socket.on('message', (text) => {
    const user = users.get(socket.id);
    const body = String(text || '').trim().slice(0, 1000);
    if (!user || !body) return;
    const message = { id: randomUUID(), name: user.name, text: body, at: Date.now() };
    pushMessage(user.room, message);
    io.to(user.room).emit('message', message);
  });

  socket.on('typing', (isTyping) => {
    const user = users.get(socket.id);
    if (!user) return;
    socket.to(user.room).emit('typing', { name: user.name, isTyping: Boolean(isTyping) });
  });

  socket.on('disconnect', () => {
    const user = users.get(socket.id);
    if (!user) return;
    users.delete(socket.id);
    systemMessage(user.room, `${user.name} left the room`);
    io.to(user.room).emit('users', usersInRoom(user.room));
  });
});

httpServer.listen(PORT, () => {
  console.log(`Chat server running on http://localhost:${PORT}`);
});
