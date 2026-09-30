export default function isMobileDevice() {
  if (typeof navigator === 'undefined') return false;
  // iPadOS reports a desktop Mac user agent; touch points give it away.
  return (
    /iP(hone|ad|od)|Android/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
}
