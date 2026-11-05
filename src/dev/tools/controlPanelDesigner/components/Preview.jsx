import React, { memo, useMemo } from 'react';

import LiveStage from '@dev/renderWorkbench/LiveStage';
import useRenderJobs from '@dev/renderWorkbench/useRenderJobs';

import {
  buildPanel,
  configFrom,
  defaultsFor,
  frameView,
} from '@modules/controlPanel';
import { createPanelStage } from '@modules/controlPanelRender';

const bench = {
  canRoll: false,
  configOf: (drawn) => drawn.config,
  createStage: ({ options, readFrame, renderer }) =>
    createPanelStage({
      width: options.width,
      height: options.height,
      samples: options.samples,
      shadows: options.shadows,
      transparent: false,
      readFrame,
      renderer,
    }),
  generate: ({ options }) => {
    const config = configFrom(options);
    return { config, panel: buildPanel(config), name: 'designed-panel' };
  },
  frame: ({ drawn, layout, options }) =>
    frameView({
      bounds: layout,
      detail: drawn.panel.detail,
      options,
      view: 'front',
    }),
  name: (drawn) => drawn.name,
  hint: 'Operate controls and patch sockets here; Capture sends the panel to ControlPanelCLI',
};
function Preview({ config, setConfig }) {
  const jobsApi = useRenderJobs('controlPanel');
  const options = useMemo(
    () => ({
      ...defaultsFor('workbench'),
      ...config,
      count: 1,
      width: 1080,
      height: 810,
      pixelRatio: 1,
      svg: false,
    }),
    [config]
  );
  const context = useMemo(
    () => ({
      jobsApi,
      options,
      setOptions: (update) =>
        setConfig((current) =>
          typeof update === 'function' ? update(current) : update
        ),
    }),
    [jobsApi, options, setConfig]
  );
  return (
    <div className="cpd-preview">
      <LiveStage bench={bench} context={context} tool="controlPanel" />
    </div>
  );
}
export default memo(Preview);
