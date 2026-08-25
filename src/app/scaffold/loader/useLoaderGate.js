import { useCallback, useState } from 'react';

export default function useLoaderGate() {
  const [loaderVisible, setLoaderVisible] = useState(true);
  const [suspended, setSuspended] = useState(false);

  const handleSuspend = useCallback((val) => {
    setSuspended(val);
    if (val) setLoaderVisible(true);
  }, []);

  return {
    loaderVisible,
    suspended,
    handleSuspend,
    onLoaderComplete: () => setLoaderVisible(false),
  };
}
