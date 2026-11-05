export const controlSize = ({ w, h, rotation = 0 }) =>
  rotation % 180 ? { w: h, h: w } : { w, h };

export function rotateDesignItem(item, direction = 1) {
  const clockwise = direction > 0;
  if (item.controls) {
    return {
      ...item,
      w: item.h,
      h: item.w,
      controls: item.controls.map((control) => ({
        ...rotateDesignItem(control, direction),
        x: clockwise ? item.h - control.y - control.h : control.y,
        y: clockwise ? control.x : item.w - control.x - control.w,
      })),
    };
  }
  return {
    ...item,
    w: item.h,
    h: item.w,
    rotation: ((item.rotation ?? 0) + (clockwise ? 90 : 270)) % 360,
  };
}
