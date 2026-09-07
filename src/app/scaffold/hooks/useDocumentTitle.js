import { useEffect } from 'react';

const BASE_TITLE = 'Eye Candy';

export default function useDocumentTitle(sceneName) {
  useEffect(() => {
    document.title = sceneName ? `${sceneName} — ${BASE_TITLE}` : BASE_TITLE;

    return () => {
      document.title = BASE_TITLE;
    };
  }, [sceneName]);
}
