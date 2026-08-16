// Single source of truth for this scene's Leva folder paths and the
// cross-cutting gridMode predicates more than one getXControls.js file
// needs — replaces every file's previous copy-pasted local
// `TRUCHET_FOLDER_PATH` constant (each had its own "must stay in sync"
// comment; this removes that drift risk).
export const SCENE_LABEL = 'Trucheterie';

export const GRID_PATH = `${SCENE_LABEL}.Grid`;
export const MOTIF_PATH = `${SCENE_LABEL}.Motif`;
export const MULTISCALE_PATH = `${SCENE_LABEL}.Multiscale`;
export const STROKE_PATH = `${SCENE_LABEL}.Stroke`;
export const COLORS_PATH = `${SCENE_LABEL}.Colors`;
export const COMPOSITION_PATH = `${SCENE_LABEL}.Composition`;
export const RETILE_PATH = `${SCENE_LABEL}.Retile`;

export const isSquareMode = (get) => get(`${GRID_PATH}.gridMode`) === 'square';
export const isTriangularMode = (get) =>
  get(`${GRID_PATH}.gridMode`) === 'triangular';
export const isFieldMode = (get) => get(`${GRID_PATH}.gridMode`) === 'field';
