import seededFolder from '../utils/seededFolder';

export default function getRoomControls(snapshot) {
  return seededFolder(
    {
      backgroundColor: { label: 'Background', value: '#f2f1ee' },
      fogNear: { label: 'Fog Near', value: 7, min: 0, max: 20, step: 0.1 },
      fogFar: { label: 'Fog Far', value: 24, min: 1, max: 40, step: 0.1 },
      floorColor: { label: 'Floor', value: '#e6e4df' },
      tvBodyColor: { label: 'TV Cabinet', value: '#2a1a12' },
      standColor: { label: 'Stands', value: '#2a2b2d' },
    },
    snapshot
  );
}
