import { useEffect, useState } from 'react';

const QUERY = '(max-width: 900px)';

export default function useNarrowScreen() {
  const [narrow, setNarrow] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(QUERY).matches
  );

  useEffect(() => {
    const media = window.matchMedia(QUERY);
    const onChange = (event) => setNarrow(event.matches);

    media.addEventListener('change', onChange);
    setNarrow(media.matches);

    return () => media.removeEventListener('change', onChange);
  }, []);

  return narrow;
}
