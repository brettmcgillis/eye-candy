import isMobileDevice from '@utils/isMobileDevice';

export const WEBCAM_FACING_OPTIONS = { Front: 'front', Back: 'back' };

// Only phones and tablets have a second camera to pick.
export default function webcamFacingControl(
  value = 'front',
  { label = 'Camera', render } = {}
) {
  return {
    label,
    options: WEBCAM_FACING_OPTIONS,
    render: (get) => isMobileDevice() && (render ? render(get) : true),
    value,
  };
}
