// The look half of RabbitCLI and the Stay Hunted scene: the subject both
// draw (rabbit, arrows, ribbon, graze grass), the bench's studio and root,
// and the readbacks a capture takes.
export {
  aimCamera,
  createAlbedoCapture,
  createDepthCapture,
  depthProbe,
  tightRows,
} from '@modules/renderStage';
export {
  readSubject,
  rabbitOnly,
  subjectPoints,
  subjectReady,
} from './capture';
export { default as createStageRoot } from './createStageRoot';
export { default as HuntedSubject, FLOOR_Y } from './HuntedSubject';
export { default as LIGHTING } from './lighting';
export { default as RabbitStudio } from './RabbitStudio';
export { default as useNeutralToneMapping } from './useNeutralToneMapping';
