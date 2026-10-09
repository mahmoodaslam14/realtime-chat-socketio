import { useState } from 'react';

const ROOMS = ['general', 'frontend', 'backend', 'random'];

export default function JoinForm({ onJoin }) {
  const [name, setName] = useState('');
  const [room, setRoom] = useState(ROOMS[0]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    const err = await onJoin(name, room);
    setBusy(false);
    if (err) setError(err);
  }

  return (
    <form className="card join" onSubmit={handleSubmit}>
      <h2>Join a room</h2>
      <label htmlFor="name">Your name</label>
      <input id="name" value={name} onChange={(e) => setName(e.target.value)} maxLength={24} placeholder="e.g. Mahmood" required />
      <label htmlFor="room">Room</label>
      <select id="room" value={room} onChange={(e) => setRoom(e.target.value)}>
        {ROOMS.map((r) => (
          <option key={r} value={r}>#{r}</option>
        ))}
      </select>
      {error && <p className="error">{error}</p>}
      <button type="submit" disabled={busy}>{busy ? 'Joining…' : 'Join chat'}</button>
    </form>
  );
}
