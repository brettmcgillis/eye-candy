export const distance = (a, b) =>
  Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
export const socketTop = (socket) => [
  socket.p[0],
  socket.p[1],
  socket.p[2] + 0.32 * socket.scale,
];
