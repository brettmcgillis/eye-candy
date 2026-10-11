import { useEffect } from 'react';

const APP_NAME = 'Party Line';
const META = {
  'apple-mobile-web-app-capable': 'yes',
  'apple-mobile-web-app-status-bar-style': 'black-translucent',
  'apple-mobile-web-app-title': APP_NAME,
  'mobile-web-app-capable': 'yes',
};

function buildManifest(startUrl, backgroundColor) {
  const base = new URL(import.meta.env.BASE_URL, window.location.origin);
  const icon = (file, sizes) => ({
    sizes,
    src: new URL(file, base).toString(),
    type: 'image/png',
  });
  return {
    background_color: backgroundColor,
    display: 'standalone',
    icons: [
      icon('android-chrome-192x192.png', '192x192'),
      icon('android-chrome-512x512.png', '512x512'),
    ],
    name: APP_NAME,
    scope: base.toString(),
    short_name: APP_NAME,
    start_url: startUrl,
    theme_color: backgroundColor,
  };
}

// While the scene is open, "Add to Home Screen" installs Party Line itself
// (back into this room, no browser bars) instead of the site's root app.
export default function useHomeScreenApp({ backgroundColor, roomKey }) {
  useEffect(() => {
    const start = new URL(window.location.href);
    start.search = '';
    start.searchParams.set('room', roomKey);

    const manifestUrl = URL.createObjectURL(
      new Blob(
        [JSON.stringify(buildManifest(start.toString(), backgroundColor))],
        {
          type: 'application/manifest+json',
        }
      )
    );
    const link = document.querySelector('link[rel="manifest"]');
    const previousManifest = link?.getAttribute('href');
    link?.setAttribute('href', manifestUrl);

    const added = Object.entries(META).map(([name, content]) => {
      const meta = document.createElement('meta');
      meta.name = name;
      meta.content = content;
      document.head.appendChild(meta);
      return meta;
    });

    return () => {
      added.forEach((meta) => meta.remove());
      if (link && previousManifest) link.setAttribute('href', previousManifest);
      URL.revokeObjectURL(manifestUrl);
    };
  }, [backgroundColor, roomKey]);
}
