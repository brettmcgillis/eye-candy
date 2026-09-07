// The shaft light points almost straight down, so it only ever reaches
// horizontal surfaces. Vertical stone — the shaft wall, tunnel walls, room
// interiors — is lit by the hemisphere instead, or it renders black and the
// stair reads as floating in empty space.
const LIGHTING = {
  sky: {
    type: 'hemisphere',
    skyColor: '#7c8698',
    groundColor: '#050507',
    intensity: 0.9,
  },
  shaft: {
    type: 'directional',
    color: '#c9d4e6',
    intensity: 0.9,
    position: { azimuth: 0, elevation: 88, radius: 200 },
  },
};

export default LIGHTING;
