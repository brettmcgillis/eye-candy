import React, { memo, useMemo } from 'react';

import useFlora from '../hooks/useFlora';
import BrushRibbons from './BrushRibbons';
import Ornaments from './Ornaments';

function FloraStudy({ assets, config }) {
  const { paths, ornaments } = useFlora(config);
  const groups = useMemo(
    () =>
      [...new Set(ornaments.map((item) => item.shape))].map((shape) => ({
        shape,
        items: ornaments.filter((item) => item.shape === shape),
      })),
    [ornaments]
  );
  return (
    <>
      <BrushRibbons paths={paths} assets={assets} config={config} />
      {groups.map(({ shape, items }) => (
        <Ornaments
          key={shape}
          shape={shape}
          ornaments={items}
          assets={assets}
          config={config}
        />
      ))}
    </>
  );
}

export default memo(FloraStudy);
