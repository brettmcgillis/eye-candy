/* eslint-disable no-param-reassign, no-await-in-loop, no-loop-func */
let p5Modules;

async function loadP5() {
  if (!p5Modules) {
    p5Modules = import('p5').then(async ({ default: P5 }) => {
      // The brush ESM build registers its lifecycle addon through this constructor.
      window.p5 = P5;
      const brush = await import('p5.brush');
      return { P5, brush };
    });
  }
  return p5Modules;
}

export default async function createBrushRuntime(backend) {
  let canvas;
  let sketch;
  let brush;
  let drawPass = () => {};
  const host = document.createElement('div');
  host.style.display = 'none';
  document.body.appendChild(host);

  try {
    if (backend === 'p5') {
      const modules = await loadP5();
      brush = modules.brush;
      await new Promise((resolve, reject) => {
        sketch = new modules.P5((p) => {
          brush.instance(p);
          p.setup = () => {
            try {
              p.createCanvas(768, 768, p.WEBGL);
              p.setAttributes({
                preserveDrawingBuffer: true,
                alpha: true,
                antialias: false,
              });
              p.pixelDensity(1);
              p.angleMode(p.DEGREES);
              brush.load(p);
              p.noLoop();
            } catch (error) {
              reject(error);
            }
          };
          p.draw = () => {
            drawPass();
            resolve();
          };
        }, host);
      });
      canvas = sketch.canvas;
    } else {
      brush = await import('p5.brush/standalone');
      canvas = document.createElement('canvas');
      canvas.width = 768;
      canvas.height = 768;
      host.appendChild(canvas);
      brush.load(canvas);
      brush.angleMode(brush.DEGREES);
    }
  } catch (error) {
    sketch?.remove();
    host.remove();
    throw error;
  }

  let disposed = false;
  let queue = Promise.resolve();

  async function paint(passes, config, transparent) {
    if (disposed) return null;
    const size = config.resolution;
    if (sketch) brush.instance(sketch);
    else brush.load(canvas);
    if (canvas.width !== size) {
      if (sketch) sketch.resizeCanvas(size, size, true);
      else {
        canvas.width = size;
        canvas.height = size;
      }
      brush.load(sketch || canvas);
    }
    for (let index = 0; index < passes.length; index += 1) {
      const draw = () => {
        if (index === 0) {
          if (sketch) {
            sketch.clear();
            if (!transparent) sketch.background(config.paper);
          } else brush.clear(...(transparent ? [] : [config.paper]));
          brush.seed(config.seed);
          brush.noiseSeed(config.seed);
        }
        brush.noField();
        brush.noFill();
        brush.noWash();
        brush.noHatch();
        brush.noStroke();
        brush.noClip();
        if (sketch) {
          sketch.resetMatrix();
          sketch.translate(-size / 2, -size / 2);
          sketch.scale(size / 768);
        } else {
          brush.push();
          brush.translate(-size / 2, -size / 2);
          brush.scale(size / 768);
        }
        passes[index](brush);
        if (!sketch) {
          brush.pop();
          brush.render();
        }
      };
      if (sketch) {
        drawPass = draw;
        await sketch.redraw();
      } else draw();
    }
    const snapshot = document.createElement('canvas');
    snapshot.width = size;
    snapshot.height = size;
    snapshot.getContext('2d').drawImage(canvas, 0, 0);
    return snapshot;
  }

  return {
    paint(passes, config, transparent = false) {
      const pending = queue.then(() => paint(passes, config, transparent));
      queue = pending.catch(() => {});
      return pending;
    },
    dispose() {
      disposed = true;
      queue.finally(() => {
        if (sketch) sketch.remove();
        else
          canvas
            .getContext('webgl2')
            ?.getExtension('WEBGL_lose_context')
            ?.loseContext();
        host.remove();
      });
    },
  };
}
