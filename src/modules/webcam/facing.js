import isMobileDevice from '@utils/isMobileDevice';

export const WEBCAM_FACINGS = ['front', 'back'];

// Desktops have one camera, so a saved `back` falls back to the selfie view.
export const resolveFacing = (facing) =>
  facing === 'back' && isMobileDevice() ? 'back' : 'front';

export const isMirrored = (facing) => resolveFacing(facing) === 'front';
