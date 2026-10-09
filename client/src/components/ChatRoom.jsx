import { useEffect, useRef, useState } from 'react';
import { socket } from '../socket.js';

const ROOMS = ['general', 'frontend', 'backend', 'random'];

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function ChatRoom({ session, messages, users, onSwitchRoom }) {
  const [text, setText] = useState('');
  const [typingUsers, setTypingUsers] = useState([]);
  const bottomRef = useRef(null);
  const typingTimer = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const onTyping = ({ name, isTyping }) => {
      setTypingUsers((prev) => (isTyping ? [...new Set([...prev, name])] : prev.filter((n) => n !== name)));
    };
    socket.on('typing', onTyping);
    return () => socket.off('typing', onTyping);
  }, []);

  useEffect(() => setTypingUsers([]), [session.room]);

  function handleChange(e) {
    setText(e.target.value);
    socket.emit('typing', true);
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => socket.emit('typing', false), 1200);
  }

  function send(e) {
    e.preventDefault();
    if (!text.trim()) return;
    socket.emit('message', text);
    socket.emit('typing', false);
    setText('');
  }

  return (
    <section className="chat">
      <aside className="sidebar card">
        <h3>Rooms</h3>
        <ul className="rooms">
          {ROOMS.map((r) => (
            <li key={r}>
              <button
                type="button"
                className={r === session.room ? 'room active' : 'room'}
                onClick={() => r !== session.room && onSwitchRoom(session.name, r)}
              >
                #{r}
              </button>
            </li>
          ))}
        </ul>
        <h3>Online ({users.length})</h3>
        <ul className="users">
          {users.map((u) => (
            <li key={u}>
              <span className="dot" aria-hidden="true" /> {u}
              {u === session.name && ' (you)'}
            </li>
          ))}
        </ul>
      </aside>

      <div className="card messages-panel">
        <div className="messages" aria-live="polite">
          {messages.map((m) =>
            m.system ? (
              <p key={m.id} className="system">{m.text}</p>
            ) : (
              <div key={m.id} className={m.name === session.name ? 'msg mine' : 'msg'}>
                <div className="meta">
                  <strong>{m.name}</strong> <time>{formatTime(m.at)}</time>
                </div>
                <p>{m.text}</p>
              </div>
            )
          )}
          <div ref={bottomRef} />
        </div>
        <p className="typing">
          {typingUsers.length > 0 && `${typingUsers.join(', ')} ${typingUsers.length > 1 ? 'are' : 'is'} typing…`}
        </p>
        <form className="composer" onSubmit={send}>
          <label htmlFor="msg" className="sr-only">Message</label>
          <input id="msg" value={text} onChange={handleChange} placeholder={`Message #${session.room}`} autoComplete="off" />
          <button type="submit">Send</button>
        </form>
      </div>
    </section>
  );
}
