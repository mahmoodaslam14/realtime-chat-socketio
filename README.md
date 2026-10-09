# Realtime Chat (React + Socket.IO)

A small real-time chat app with rooms, live online users and typing indicators. Built with React on the front end and Node.js + Socket.IO on the back end.

## Features

- Join a room with a display name, switch rooms without reloading
- Messages appear instantly for everyone in the room
- "Someone is typing…" indicator
- Live list of who is online in each room
- Last 50 messages per room are kept, so new joiners see recent history
- Clean, responsive UI that works on mobile

## Tech stack

| Part | Tech |
| --- | --- |
| Client | React 18, Vite, socket.io-client |
| Server | Node.js, Express, Socket.IO |

## Getting started

You need Node.js 18 or newer.

```bash
# 1. start the server
cd server
npm install
npm run dev        # http://localhost:4000

# 2. in a second terminal, start the client
cd client
npm install
npm run dev        # http://localhost:5173
```

Open the client in two browser windows, join the same room with different names, and start chatting.

### Environment variables

| Variable | Where | Default |
| --- | --- | --- |
| `PORT` | server | `4000` |
| `CLIENT_ORIGIN` | server | `http://localhost:5173` |
| `VITE_SERVER_URL` | client | `http://localhost:4000` |

## How it works

- `join` puts the socket in a Socket.IO room and returns that room's recent history in the acknowledgement.
- `message` is broadcast to the room with `io.to(room).emit(...)`.
- `typing` is sent to everyone except the sender with `socket.to(room).emit(...)`.
- On `disconnect` the user is removed and the room's online list is refreshed.

State lives in memory to keep the project small. For production, move history to a database and use the Socket.IO Redis adapter to run more than one server.

## Project structure

```
server/
  index.js            Express + Socket.IO server
client/
  src/App.jsx         socket wiring and app state
  src/components/     JoinForm, ChatRoom
  src/socket.js       shared socket instance
```

## License

MIT
