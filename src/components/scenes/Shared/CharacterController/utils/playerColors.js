export function generateRandomColor() {
  const hue = Math.random() * 360;
  const saturation = 60 + Math.random() * 30;
  const lightness = 40 + Math.random() * 30;
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

export function generatePlayerColor(playerId) {
  // Deterministic color based on player ID for consistency across clients
  const hash = playerId
    .split('')
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const hue = (hash * 137.5) % 360;
  const saturation = 60 + (hash % 30);
  const lightness = 40 + ((hash * 3) % 30);
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}
