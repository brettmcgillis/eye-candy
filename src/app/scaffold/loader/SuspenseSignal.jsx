import { useEffect } from 'react';

// Renders as a Suspense fallback. Signals to the parent that the subtree is
// suspended so the Loader overlay stays visible.
export default function SuspenseSignal({ onSuspend }) {
  useEffect(() => {
    onSuspend(true);
    return () => onSuspend(false);
  }, [onSuspend]);
  return null;
}
