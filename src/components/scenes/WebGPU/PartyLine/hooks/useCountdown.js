import { useEffect, useState } from 'react';

const TICK_MS = 100;

export default function useCountdown(room, endsAt, active) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (!active || !room) return undefined;
    const update = () => setRemaining(Math.max(0, endsAt - room.hostNow()));
    update();
    const timer = setInterval(update, TICK_MS);
    return () => clearInterval(timer);
  }, [active, endsAt, room]);

  return remaining;
}
