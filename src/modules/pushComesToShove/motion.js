// A simulation never returns to where it started, so a loop is made at the
// seams instead: each panel runs `fade` seconds past its hold, and that tail
// is crossfaded over the head of the next panel, the last panel's over the
// first's. Every panel is simulated for `simFrames` and shows `holdFrames`.
export function planClip({ fade, fps, hold, mode }) {
  const holdFrames = Math.max(1, Math.round(hold * fps));
  const fadeFrames =
    mode === 'loop'
      ? Math.min(Math.max(1, Math.round(fade * fps)), holdFrames - 1)
      : 0;
  return { fadeFrames, holdFrames, simFrames: holdFrames + fadeFrames };
}

export const crossfadeWeight = (frame, fadeFrames) =>
  (frame + 0.5) / fadeFrames;

// One full sway per hold: the tail repeats the head's angles, so the camera
// is continuous across a crossfade.
export const swayAt = (frame, holdFrames, sway) =>
  sway * Math.sin((2 * Math.PI * frame) / holdFrames);
