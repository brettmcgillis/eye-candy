import { folder } from 'leva';

// WS0 — the self-sustaining as-is performance: slow LFO breathing + autonomous
// ghost apparitions so the piece never goes static with nobody present.
export default function getAmbientControls(snapshot) {
  return folder(
    {
      autonomousMotion: {
        label: 'Breathing',
        value: snapshot.autonomousMotion,
      },
      autonomousRate: {
        label: 'Breathing Rate',
        value: snapshot.autonomousRate,
        min: 0.1,
        max: 3,
        step: 0.05,
      },
      autonomousDepth: {
        label: 'Breathing Depth',
        value: snapshot.autonomousDepth,
        min: 0,
        max: 2,
        step: 0.05,
      },
      ghostApparitions: { label: 'Ghosts', value: snapshot.ghostApparitions },
      ghostCount: {
        label: 'Ghost Count',
        value: snapshot.ghostCount,
        min: 0,
        max: 8,
        step: 1,
      },
      ghostStrength: {
        label: 'Ghost Strength',
        value: snapshot.ghostStrength,
        min: 0,
        max: 4,
        step: 0.05,
      },
      ghostRadius: {
        label: 'Ghost Radius',
        value: snapshot.ghostRadius,
        min: 2,
        max: 16,
        step: 0.5,
      },
    },
    { collapsed: true }
  );
}
