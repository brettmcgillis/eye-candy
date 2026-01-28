export default function isLocalHost() {
  const host = window.location.hostname;
  const isGhPages = host.endsWith('github.io');
  const onLocalHost = ['localhost', '127.0.0.1', '[::1]'].includes(host);
  const onLocalNetwork = ['192.168'].includes(host);
  return (onLocalHost || onLocalNetwork) && !isGhPages;
}
