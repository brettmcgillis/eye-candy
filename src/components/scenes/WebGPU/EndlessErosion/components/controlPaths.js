export const SCENE_LABEL = 'Endless Erosion';

export const CAMERA_PATH = `${SCENE_LABEL}.Camera`;
export const PAINT_PATH = `${SCENE_LABEL}.Paint`;
export const RENDER_PATH = `${SCENE_LABEL}.Render`;

export const VIEW_MODES = ['Raymarch', 'Mesh'];

export const isRaymarch = (get) =>
  get(`${RENDER_PATH}.viewMode`) === 'Raymarch';
export const isMesh = (get) => !isRaymarch(get);
export const isPainting = (get) => get(`${PAINT_PATH}.paintEnabled`) === true;
