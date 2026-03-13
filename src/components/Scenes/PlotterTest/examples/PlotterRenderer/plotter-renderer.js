/* eslint-disable */

/**
 * PlotterRenderer - GPU-based SVG renderer for Three.js
 * Based on SVGRenderer by @mrdoob / http://mrdoob.com/
 */
import { Camera, Color, Object3D, Vector3 } from 'three';

import {
  renderNormals as debugRenderNormals,
  extractNormalRegions,
} from './gpu-silhouette.js';
import { computeHiddenLinesMultiple } from './hidden-line.js';
import {
  clipLineOutsidePolygon,
  generatePerspectiveHatches,
} from './perspective-hatch.js';

export { debugRenderNormals };

const lop = (n) => {
  return Math.round(n * 100) / 100;
};

const SVGObject = function (node) {
  Object3D.call(this);
  this.node = node;
};

SVGObject.prototype = Object.create(Object3D.prototype);
SVGObject.prototype.constructor = SVGObject;

const PlotterRenderer = function () {
  const _this = this;
  const _svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  const _silhouettes = document.createElementNS(
    'http://www.w3.org/2000/svg',
    'g'
  );
  const _edges = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  const _shading = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  const _secondaryShading = document.createElementNS(
    'http://www.w3.org/2000/svg',
    'g'
  );
  let _svgWidth;
  let _svgHeight;
  let _svgWidthHalf;
  let _svgHeightHalf;
  const _clearColor = new Color();

  // Add proper SVG namespace attributes for macOS and native rendering
  _svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  _svg.setAttribute(
    'xmlns:inkscape',
    'http://www.inkscape.org/namespaces/inkscape'
  );
  _svg.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
  _svg.setAttribute('version', '1.1');

  // Setup SVG layers (order determines z-index: later = on top)
  _silhouettes.setAttribute('inkscape:label', 'Silhouettes');
  _silhouettes.setAttribute('inkscape:groupmode', 'layer');
  _silhouettes.id = 'silhouettes_layer';
  _svg.appendChild(_silhouettes);

  _shading.setAttribute('inkscape:label', 'Shading');
  _shading.setAttribute('inkscape:groupmode', 'layer');
  _shading.id = 'shading_layer';
  _svg.appendChild(_shading);

  _secondaryShading.setAttribute('inkscape:label', 'Secondary Shading');
  _secondaryShading.setAttribute('inkscape:groupmode', 'layer');
  _secondaryShading.id = 'secondary_shading_layer';
  _svg.appendChild(_secondaryShading);

  _edges.setAttribute('inkscape:label', 'Edges');
  _edges.setAttribute('inkscape:groupmode', 'layer');
  _edges.id = 'edges_layer';
  _svg.appendChild(_edges);

  this.domElement = _svg;

  // Layer toggles
  this.showSilhouettes = true;
  this.showEdges = true;
  this.showHatches = true;
  this.showCrossHatches = false;

  // Theme definitions
  this.themes = {
    light: {
      background: '#ffffff',
      edgeStroke: '#000000',
      hatchStroke: '#444444',
      silhouetteFill: (n) =>
        `rgba(${Math.floor((n.x * 0.5 + 0.5) * 40 + 200)},${Math.floor((n.y * 0.5 + 0.5) * 40 + 200)},${Math.floor((n.z * 0.5 + 0.5) * 40 + 200)},0.3)`,
    },
    dark: {
      background: '#222222',
      edgeStroke: '#ffffff',
      hatchStroke: '#aaaaaa',
      silhouetteFill: (n) =>
        `rgba(${Math.floor((n.x * 0.5 + 0.5) * 255)},${Math.floor((n.y * 0.5 + 0.5) * 255)},${Math.floor((n.z * 0.5 + 0.5) * 255)},0.3)`,
    },
  };

  // Current theme
  this.theme = 'dark';

  // Silhouette options (GPU normal regions)
  this.silhouetteOptions = {
    normalBuckets: 12,
    simplifyTolerance: 2.0,
    minArea: 100,
  };

  const createHatchLayerOptions = () => ({
    baseSpacing: 8,
    minSpacing: 3,
    maxSpacing: 40,
    depthFactor: 0.5,
    insetPixels: 2,
    stroke: null,
    strokeWidth: '1px',
    maxSegments: 0,
    connectHatches: false,
    axisSettings: {
      x: { rotation: 0, spacing: 8 },
      y: { rotation: 0, spacing: 8 },
      z: { rotation: 0, spacing: 8 },
    },
    brightnessShading: {
      enabled: false,
      invert: false,
      lightDirection: null,
    },
    frameBudgetMs: 16,
    progressCallback: null,
  });

  // Hatch options (perspective hatching)
  this.hatchOptions = createHatchLayerOptions();
  this.crossHatchOptions = createHatchLayerOptions();

  // Edge options (hidden line edges)
  this.edgeOptions = {
    stroke: null, // null = use theme
    strokeWidth: '1px',
  };

  // Hidden-line options
  this.hiddenLineOptions = {
    smoothThreshold: 0.99,
  };

  // WebGL renderer reference (needed for GPU operations)
  this._glRenderer = null;

  this.autoClear = true;

  this.setClearColor = function (color) {
    _clearColor.set(color);
  };

  this.setPixelRatio = function () {};

  this.setSize = function (width, height) {
    _svgWidth = width;
    _svgHeight = height;
    _svgWidthHalf = _svgWidth / 2;
    _svgHeightHalf = _svgHeight / 2;

    _svg.setAttribute(
      'viewBox',
      `${-_svgWidthHalf} ${-_svgHeightHalf} ${_svgWidth} ${_svgHeight}`
    );
    _svg.setAttribute('width', _svgWidth);
    _svg.setAttribute('height', _svgHeight);
  };

  this.getSize = function () {
    return {
      width: _svgWidth,
      height: _svgHeight,
    };
  };

  this.setGLRenderer = function (glRenderer) {
    _this._glRenderer = glRenderer;
  };

  function removeChildNodes() {
    while (_silhouettes.childNodes.length > 0) {
      _silhouettes.removeChild(_silhouettes.childNodes[0]);
    }
    while (_edges.childNodes.length > 0) {
      _edges.removeChild(_edges.childNodes[0]);
    }
    while (_shading.childNodes.length > 0) {
      _shading.removeChild(_shading.childNodes[0]);
    }
    while (_secondaryShading.childNodes.length > 0) {
      _secondaryShading.removeChild(_secondaryShading.childNodes[0]);
    }
  }

  function computeSpacingScale(scene, camera) {
    let spacingScale = 1.0;
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    let minZ = Infinity;
    let maxZ = -Infinity;

    scene.traverse((obj) => {
      if (!obj.isMesh || !obj.geometry) return;
      obj.geometry.computeBoundingBox();
      const bbox = obj.geometry.boundingBox;
      if (!bbox) return;

      const corners = [
        new Vector3(bbox.min.x, bbox.min.y, bbox.min.z),
        new Vector3(bbox.max.x, bbox.max.y, bbox.max.z),
        new Vector3(bbox.min.x, bbox.min.y, bbox.max.z),
        new Vector3(bbox.min.x, bbox.max.y, bbox.min.z),
        new Vector3(bbox.max.x, bbox.min.y, bbox.min.z),
        new Vector3(bbox.min.x, bbox.max.y, bbox.max.z),
        new Vector3(bbox.max.x, bbox.min.y, bbox.max.z),
        new Vector3(bbox.max.x, bbox.max.y, bbox.min.z),
      ];

      for (const corner of corners) {
        corner.applyMatrix4(obj.matrixWorld);
        minX = Math.min(minX, corner.x);
        maxX = Math.max(maxX, corner.x);
        minY = Math.min(minY, corner.y);
        maxY = Math.max(maxY, corner.y);
        minZ = Math.min(minZ, corner.z);
        maxZ = Math.max(maxZ, corner.z);
      }
    });

    if (!isFinite(minX)) {
      return spacingScale;
    }

    const worldCorners = [
      new Vector3(minX, minY, minZ),
      new Vector3(maxX, maxY, maxZ),
      new Vector3(minX, minY, maxZ),
      new Vector3(minX, maxY, minZ),
      new Vector3(maxX, minY, minZ),
      new Vector3(minX, maxY, maxZ),
      new Vector3(maxX, minY, maxZ),
      new Vector3(maxX, maxY, minZ),
    ];

    let screenMinX = Infinity;
    let screenMaxX = -Infinity;
    let screenMinY = Infinity;
    let screenMaxY = -Infinity;

    for (const corner of worldCorners) {
      const projected = corner.clone().project(camera);
      const screenX = ((projected.x + 1) * _svgWidth) / 2;
      const screenY = ((1 - projected.y) * _svgHeight) / 2;
      screenMinX = Math.min(screenMinX, screenX);
      screenMaxX = Math.max(screenMaxX, screenX);
      screenMinY = Math.min(screenMinY, screenY);
      screenMaxY = Math.max(screenMaxY, screenY);
    }

    const screenWidth = screenMaxX - screenMinX;
    const screenHeight = screenMaxY - screenMinY;
    const screenSize = Math.max(screenWidth, screenHeight);
    const canvasSize = Math.max(_svgWidth, _svgHeight);

    if (screenSize > 0 && canvasSize > 0) {
      spacingScale = screenSize / canvasSize;
    }

    return spacingScale;
  }

  function resolveLightDirection(scene, camera, layerOptions) {
    const shadingOpts = layerOptions.brightnessShading || {};
    if (!shadingOpts.enabled) {
      return null;
    }

    let lightDir = null;
    if (shadingOpts.lightDirection) {
      lightDir = shadingOpts.lightDirection.clone().normalize();
    } else {
      scene.traverse((obj) => {
        if (lightDir) return;
        if (obj.isDirectionalLight) {
          lightDir = new Vector3()
            .subVectors(obj.position, obj.target.position)
            .normalize();
        } else if (obj.isPointLight || obj.isSpotLight) {
          lightDir = obj.position.clone().normalize();
        }
      });
    }

    if (!lightDir) {
      lightDir = new Vector3(1, 1, 1).normalize();
    }

    return lightDir.clone().transformDirection(camera.matrixWorldInverse);
  }

  function appendHatchesToLayer(layerNode, hatches, layerOptions, spacingScale) {
    const hatchTheme = _this.themes[_this.theme] || _this.themes.dark;
    const hatchStroke = layerOptions.stroke || hatchTheme.hatchStroke;

    if (layerOptions.connectHatches && hatches.length > 0) {
      const maxConnectDist =
        (layerOptions.baseSpacing || 8) * spacingScale * 2;

      const paths = [];
      let currentPath = '';
      let prevEnd = null;

      hatches.forEach((hatch, hatchIdx) => {
        const start = hatchIdx % 2 === 0 ? hatch.start : hatch.end;
        const end = hatchIdx % 2 === 0 ? hatch.end : hatch.start;

        let shouldBreak = false;
        if (prevEnd) {
          const dist = Math.sqrt(
            (start.x - prevEnd.x) ** 2 + (start.y - prevEnd.y) ** 2
          );
          shouldBreak = dist > maxConnectDist;
        }

        if (hatchIdx === 0 || shouldBreak) {
          if (currentPath) {
            paths.push(currentPath);
          }
          currentPath = `M${lop(start.x)},${lop(-start.y)}`;
        } else {
          currentPath += `L${lop(start.x)},${lop(-start.y)}`;
        }

        currentPath += `L${lop(end.x)},${lop(-end.y)}`;
        prevEnd = end;
      });

      if (currentPath) {
        paths.push(currentPath);
      }

      paths.forEach((d) => {
        const path = document.createElementNS(
          'http://www.w3.org/2000/svg',
          'path'
        );
        path.setAttribute('d', d);
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', hatchStroke);
        path.setAttribute('stroke-width', layerOptions.strokeWidth);
        layerNode.appendChild(path);
      });

      return;
    }

    hatches.forEach((hatch, hatchIdx) => {
      const path = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'path'
      );
      const start = hatchIdx % 2 === 0 ? hatch.start : hatch.end;
      const end = hatchIdx % 2 === 0 ? hatch.end : hatch.start;
      const d = `M${lop(start.x)},${lop(-start.y)}L${lop(end.x)},${lop(-end.y)}`;
      path.setAttribute('d', d);
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', hatchStroke);
      path.setAttribute('stroke-width', layerOptions.strokeWidth);
      layerNode.appendChild(path);
    });
  }

  async function renderHatchLayer({ scene, camera, regions, layerNode, layerOptions }) {
    const orderedRegions = [...regions].sort((a, b) => a.depth - b.depth);
    const allRegionBounds = orderedRegions.map(
      (region) => region.hatchBoundary || region.boundary
    );
    const holeRegions = orderedRegions.filter((region) => region.isHole);
    const spacingScale = computeSpacingScale(scene, camera);
    const lightDir = resolveLightDirection(scene, camera, layerOptions);
    const shadingOpts = layerOptions.brightnessShading || {};
    const frameBudgetMs = layerOptions.frameBudgetMs || 16;
    const { progressCallback } = layerOptions;
    let frameStartTime = performance.now();

    for (let idx = 0; idx < orderedRegions.length; idx++) {
      const region = orderedRegions[idx];
      let brightness = null;
      if (lightDir && shadingOpts.enabled) {
        brightness = Math.max(0, region.normal.dot(lightDir));
      }

      const regionStartTime = performance.now();
      const regionTimeBudget = layerOptions.regionTimeBudget || 100;
      const scaledAxisSettings = {};
      const rawAxisSettings = layerOptions.axisSettings || {};

      for (const axis of ['x', 'y', 'z']) {
        const settings = rawAxisSettings[axis] || {};
        scaledAxisSettings[axis] = {
          rotation: settings.rotation || 0,
          spacing: (settings.spacing || layerOptions.baseSpacing) * spacingScale,
        };
      }

      let hatches = generatePerspectiveHatches(region, camera, {
        baseSpacing: layerOptions.baseSpacing * spacingScale,
        minSpacing: layerOptions.minSpacing * spacingScale,
        maxSpacing: layerOptions.maxSpacing * spacingScale,
        depthFactor: layerOptions.depthFactor,
        insetPixels: layerOptions.insetPixels,
        screenWidth: _svgWidth,
        screenHeight: _svgHeight,
        axisSettings: scaledAxisSettings,
        brightness,
        invertBrightness: shadingOpts.invert || false,
      });

      if (performance.now() - regionStartTime > regionTimeBudget) {
        console.warn(
          `Region ${idx} hatch generation exceeded time budget, skipping`
        );
        continue;
      }

      for (let frontIdx = 0; frontIdx < idx; frontIdx++) {
        const frontRegion = orderedRegions[frontIdx];
        if (region.isHole && region.parentRegionId === frontRegion.regionId) {
          continue;
        }

        hatches = hatches.flatMap((hatch) =>
          clipLineOutsidePolygon(hatch, allRegionBounds[frontIdx])
        );

        if (performance.now() - regionStartTime > regionTimeBudget) {
          console.warn(`Region ${idx} clipping exceeded time budget, aborting`);
          hatches = [];
          break;
        }
      }

      for (const holeRegion of holeRegions) {
        if (holeRegion.parentRegionId !== region.regionId) continue;
        if (hatches.length === 0) break;
        hatches = hatches.flatMap((hatch) =>
          clipLineOutsidePolygon(hatch, holeRegion.boundary)
        );
      }

      const maxSegments = Number(layerOptions.maxSegments) || 0;
      if (maxSegments > 0 && hatches.length > maxSegments) {
        hatches = hatches.slice(0, maxSegments);
      }

      appendHatchesToLayer(layerNode, hatches, layerOptions, spacingScale);

      const elapsed = performance.now() - frameStartTime;
      if (elapsed > frameBudgetMs && idx < orderedRegions.length - 1) {
        if (progressCallback) {
          progressCallback((idx + 1) / orderedRegions.length);
        }
        await new Promise((resolve) => requestAnimationFrame(resolve));
        frameStartTime = performance.now();
      }
    }

    if (progressCallback) {
      progressCallback(1);
    }
  }

  this.clear = function () {
    removeChildNodes();
    _svg.style.backgroundColor = _clearColor.getStyle();
  };

  /**
   * Render GPU-based layers (silhouettes and hatches)
   * Returns a Promise that resolves when rendering is complete.
   * Uses frame budgeting to avoid blocking the browser on complex models.
   * @param {Object} scene - Three.js scene
   * @param {Object} camera - Three.js camera
   * @returns {Promise<void>}
   */
  this.renderGPULayers = async function (scene, camera) {
    if (!_this._glRenderer) {
      console.warn(
        'PlotterRenderer: WebGL renderer not set. Call setGLRenderer() first.'
      );
      return;
    }

    const glRenderer = _this._glRenderer;

    // GPU Silhouettes and hatch layers share the same region extraction pipeline.
    if (_this.showSilhouettes || _this.showHatches || _this.showCrossHatches) {
      const regionCache = new Map();
      const getRegionsForInset = (insetPixels) => {
        const cacheKey = `${Math.round((Number(insetPixels) || 0) * 1000)}`;
        if (!regionCache.has(cacheKey)) {
          regionCache.set(
            cacheKey,
            extractNormalRegions(glRenderer, scene, camera, {
              normalBuckets: _this.silhouetteOptions.normalBuckets,
              simplifyTolerance: _this.silhouetteOptions.simplifyTolerance,
              minArea: _this.silhouetteOptions.minArea,
              insetPixels,
            })
          );
        }
        return regionCache.get(cacheKey) || [];
      };

      // Draw silhouette fills
      if (_this.showSilhouettes) {
        const silhouetteRegions = getRegionsForInset(0);
        silhouetteRegions.forEach((region) => {
          if (region.boundary.length < 3) return;

          const path = document.createElementNS(
            'http://www.w3.org/2000/svg',
            'path'
          );
          let d = '';
          region.boundary.forEach((pt, i) => {
            const { x } = pt;
            const y = -pt.y; // GPU regions use different Y convention
            d += `${(i === 0 ? 'M' : 'L') + lop(x)},${lop(y)}`;
          });
          d += 'Z';

          // Color based on normal direction (use theme if available)
          const n = region.normal;
          const currentTheme = _this.themes[_this.theme] || _this.themes.dark;
          const fillColor = currentTheme.silhouetteFill
            ? currentTheme.silhouetteFill(n)
            : `rgba(${Math.floor((n.x * 0.5 + 0.5) * 255)},${Math.floor((n.y * 0.5 + 0.5) * 255)},${Math.floor((n.z * 0.5 + 0.5) * 255)},0.3)`;

          path.setAttribute('d', d);
          path.setAttribute('fill', fillColor);
          path.setAttribute('stroke', 'none');
          _silhouettes.appendChild(path);
        });
      }

      // GPU Perspective Hatching (render before edges so edges appear on top)
      if (_this.showHatches) {
        const hatchRegions = getRegionsForInset(_this.hatchOptions.insetPixels);
        await renderHatchLayer({
          scene,
          camera,
          regions: hatchRegions,
          layerNode: _shading,
          layerOptions: _this.hatchOptions,
        });
      }

      if (_this.showCrossHatches) {
        const crossHatchRegions = getRegionsForInset(
          _this.crossHatchOptions.insetPixels
        );
        await renderHatchLayer({
          scene,
          camera,
          regions: crossHatchRegions,
          layerNode: _secondaryShading,
          layerOptions: _this.crossHatchOptions,
        });
      }
    }

    // Hidden Line Edges (render last so they appear on top)
    // This is OUTSIDE the silhouettes/hatches block so edges can render independently
    if (_this.showEdges) {
      // Collect all meshes from scene (excluding those marked for SVG exclusion)
      const meshes = [];
      scene.traverse((obj) => {
        if (!obj.isMesh || !obj.geometry) return;

        // Check parent hierarchy for exclusion flag
        let excluded = false;
        let parent = obj;
        while (parent) {
          if (parent.userData && parent.userData.excludeFromSVG) {
            excluded = true;
            break;
          }
          parent = parent.parent;
        }

        if (!excluded) {
          meshes.push(obj);
        }
      });

      if (meshes.length > 0) {
        const result = computeHiddenLinesMultiple(meshes, camera, scene, {
          smoothThreshold: _this.hiddenLineOptions.smoothThreshold,
          width: _svgWidth,
          height: _svgHeight,
        });
        const edges = result.edges || [];

        const edgeTheme = _this.themes[_this.theme] || _this.themes.dark;
        const edgeStroke = _this.edgeOptions.stroke || edgeTheme.edgeStroke;

        edges.forEach((edge) => {
          const line = document.createElementNS(
            'http://www.w3.org/2000/svg',
            'line'
          );
          line.setAttribute('x1', lop(edge.a.x));
          line.setAttribute('y1', lop(edge.a.y));
          line.setAttribute('x2', lop(edge.b.x));
          line.setAttribute('y2', lop(edge.b.y));
          line.setAttribute('stroke', edgeStroke);
          line.setAttribute('stroke-width', _this.edgeOptions.strokeWidth);
          _edges.appendChild(line);
        });
      }
    }
  };

  /**
   * Legacy render method - renders wireframe preview during camera movement
   * For final output, use clear() + renderGPULayers()
   * @param {Object} scene - Three.js scene
   * @param {Object} camera - Three.js camera
   */
  this.render = function (scene, camera) {
    if (camera instanceof Camera === false) {
      console.error(
        'PlotterRenderer.render: camera is not an instance of Camera.'
      );
    }

    // For now, render is a no-op. Use renderGPULayers() for output.
    // This maintains API compatibility with Three.js SVGRenderer
  };
};

export { SVGObject, PlotterRenderer };
