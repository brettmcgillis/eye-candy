import { createCumulusStage } from '@modules/cumulusRender';

let stage;
window.cumulus = {
  async init(options) {
    const canvas = document.createElement('canvas');
    document.body.appendChild(canvas);
    stage = await createCumulusStage({ canvas, options });
  },
  load: (drawn) => stage.load(drawn),
  capture: (view, seconds) => {
    const frame = stage.capture(view, seconds);
    let binary = '';
    for (let i = 0; i < frame.data.length; i += 0x8000)
      binary += String.fromCharCode(...frame.data.subarray(i, i + 0x8000));
    return { data: btoa(binary), height: frame.height, width: frame.width };
  },
  svg: (view, options) => stage.svg(view, options),
};
