import React, { memo, useMemo } from 'react';

import { curvePaths } from '../utils/subjects';
import BrushRibbons from './BrushRibbons';

function CurveStudy({ assets, config }) {
  const paths = useMemo(() => curvePaths(config.curveForm), [config.curveForm]);
  return <BrushRibbons paths={paths} assets={assets} config={config} />;
}

export default memo(CurveStudy);
