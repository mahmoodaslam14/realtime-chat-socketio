import { useEffect, useState } from 'react';
import { socket } from './socket.js';
import JoinForm from './components/JoinForm.jsx';
import ChatRoom from './components/ChatRoom.jsx';

export default function App() {
  const [session, setSession] = useState(null); // { name, room }
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    const onMessage = (m) => setMessages((prev) => [...prev, m]);
    const onUsers = (list) => setUsers(list);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('message', onMessage);
    socket.on('users', onUsers);
    socket.connect();

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('message', onMessage);
      socket.off('users', onUsers);
      socket.disconnect();
    };
  }, []);

  function join(name, room) {
    return new Promise((resolve) => {
      socket.emit('join', { name, room }, (res) => {
        if (res?.error) return resolve(res.error);
        setMessages(res.history); // the join notice follows as a live message
        setSession({ name, room });
        resolve(null);
      });
    });
  }

  return (
    <main className="app">
      <header className="topbar">
        <h1>Realtime Chat</h1>
        <span className={connected ? 'status online' : 'status'}>{connected ? 'Connected' : 'Offline'}</span>
      </header>
      {session ? (
        <ChatRoom session={session} messages={messages} users={users} onSwitchRoom={join} />
      ) : (
        <JoinForm onJoin={join} />
      )}
    </main>
  );
}
