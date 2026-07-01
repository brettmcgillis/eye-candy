export default function isMobileDevice() {
  return /iP(hone|ad|od)|Android/.test(navigator.userAgent);
}
