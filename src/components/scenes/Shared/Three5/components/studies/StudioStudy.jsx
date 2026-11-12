import React, { memo } from 'react';

import AnimatedPaintStudy from './AnimatedPaintStudy';
import CutoutStudy from './CutoutStudy';
import MappingStudy from './MappingStudy';
import MaskStudy from './MaskStudy';
import PaperStudy from './PaperStudy';
import ParticleStudy from './ParticleStudy';
import PigmentFlowStudy from './PigmentFlowStudy';
import PrintStudy from './PrintStudy';
import SpaceStudy from './SpaceStudy';
import StabilityStudy from './StabilityStudy';
import SurfaceStudy from './SurfaceStudy';

const STUDIES = {
  washReveal: AnimatedPaintStudy,
  washMorph: AnimatedPaintStudy,
  pigmentFlow: PigmentFlowStudy,
  paintSequence: AnimatedPaintStudy,
  contours: SurfaceStudy,
  lightHatch: SurfaceStudy,
  lightWash: SurfaceStudy,
  stability: StabilityStudy,
  space: SpaceStudy,
  mapping: MappingStudy,
  paperStudy: PaperStudy,
  cutouts: CutoutStudy,
  masks: MaskStudy,
  printing: PrintStudy,
  particles: ParticleStudy,
};
function StudioStudy({ config, ...props }) {
  const Study = STUDIES[config.experiment];
  return Study ? <Study config={config} {...props} /> : null;
}
export default memo(StudioStudy);
