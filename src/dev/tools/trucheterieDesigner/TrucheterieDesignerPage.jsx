import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  FiColumns,
  FiCopy,
  FiCornerUpLeft,
  FiCornerUpRight,
  FiEdit3,
  FiEye,
  FiLayers,
  FiLink,
  FiMove,
  FiRotateCcw,
  FiRotateCw,
  FiSave,
  FiShuffle,
  FiTrash2,
  FiXCircle,
} from 'react-icons/fi';
import { Link } from 'react-router-dom';

import { Segmented } from '@dev/renderWorkbench/SchemaFields';
import '@dev/renderWorkbench/renderWorkbench.css';
import useSavedDesigns from '@dev/trucheterieDesigns/useSavedDesigns';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';

import WebGPUCanvas from '@app/scaffold/canvas/WebGPUCanvas';
import BlobFieldMesh from '@components/scenes/WebGPU/Trucheterie/components/BlobFieldMesh';
import {
  decodeDesign,
  designBounds,
  designFrame,
  designFromJson,
  designFromSeed,
  designToJson,
  emptyDesign,
  encodeDesign,
  isCornerOpen,
  isSideOpen,
  isTriangleDesign,
  randomSeed,
  sceneDefaults,
  setIrregular,
} from '@modules/trucheterieBlob';
import {
  BlobDesignEditor,
  MAX_BRUSH,
  useDesignHistory,
} from '@modules/trucheterieDesigner';

import DevPageHeaderBar from '../../shell/DevPageHeaderBar';
import './TrucheterieDesignerPage.css';
import PreviewColors from './components/PreviewColors';

// World units per micro-cell: the frame grows with the design, so the canvas is sized from it and cells never rescale.
const CELL_UNIT = 0.4;
const CAMERA_DISTANCE = 12;
const CAMERA_FOV = 40;
const SEED_GRID_MIN = 4;
const SEED_GRID_MAX = 50;
const NAME = /^[a-z0-9][a-z0-9-]{0,63}$/u;

const TOOL_OPTIONS = [
  { icon: <FiEdit3 />, label: 'Paint', value: 'paint' },
  { icon: <FiXCircle />, label: 'Erase', value: 'erase' },
  { icon: <FiLink />, label: 'Connect', value: 'connect' },
  { icon: <FiShuffle />, label: 'Diagonal', value: 'diagonal' },
  { icon: <FiLayers />, label: 'Order', value: 'order' },
  { icon: <FiColumns />, label: 'Straight', value: 'straight' },
  { icon: <FiMove />, label: 'Move', value: 'move' },
  { icon: <FiCopy />, label: 'Duplicate', value: 'duplicate' },
  { icon: <FiEye />, label: 'View', value: 'off' },
];

// Triangles have no diagonal pairing or straights.
const SQUARE_ONLY_TOOLS = new Set(['diagonal', 'straight']);
const SHAPE_OPTIONS = [
  { label: 'Square', value: 'square' },
  { label: 'Triangle', value: 'triangle' },
];

const slug = (text) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9-]+/gu, '-')
    .replace(/^-+|-+$/gu, '')
    .slice(0, 64);

function designStats(design) {
  const triangle = isTriangleDesign(design);
  const open = design.cells.reduce(
    (sum, _, index) =>
      sum +
      (triangle
        ? [0, 1, 2].filter((corner) => isCornerOpen(design, index, corner))
        : [0, 1, 2, 3].filter((side) => isSideOpen(design, index, side))
      ).length,
    0
  );
  const bounds = designBounds(design);
  const size = (value) => Number(value.toFixed(1));
  const extent = bounds
    ? `${size(bounds.width)}×${size(bounds.height)}`
    : 'empty';
  return {
    cells: design.cells.length,
    extent,
    open,
    openLabel:
      triangle && design.layout !== 'subdivide' ? 'open corners' : 'open sides',
  };
}

// Saved as the scenes' planeRotation (degrees, −180..180), which the CLIs pin
// unless a rotation is typed. A square grid turns by 45°, a triangle one by 30°.
const rotationStep = (design) => (isTriangleDesign(design) ? 30 : 45);
const wrapDegrees = (degrees) => {
  const wrapped = ((((degrees ?? 0) + 180) % 360) + 360) % 360;
  return wrapped - 180 === -180 ? 180 : wrapped - 180;
};

function frameDistance(design) {
  return Math.max(
    CAMERA_DISTANCE,
    (designFrame(design).size * CELL_UNIT * 0.55) /
      Math.tan((CAMERA_FOV * Math.PI) / 360)
  );
}

function frameCenter(design) {
  const { column, row, size } = designFrame(design);
  return [column + size / 2, row + size / 2];
}

export default function TrucheterieDesignerPage() {
  const saved = useSavedDesigns();
  const [code, setCode] = useState(() => encodeDesign(emptyDesign()));
  const [name, setName] = useState('');
  const [savedCode, setSavedCode] = useState(null);
  const [seedGrid, setSeedGrid] = useState(20);
  const [seed, setSeed] = useState('');
  const [tool, setTool] = useState('paint');
  const [brush, setBrush] = useState(2);
  const [orientation, setOrientation] = useState('auto');
  const [autoConnect, setAutoConnect] = useState(true);
  const drafts = useRef({});
  const [rotation, setRotation] = useState(0);
  const [savedRotation, setSavedRotation] = useState(0);
  const [pathsPerUnit, setPathsPerUnit] = useState(4);
  const [preview, setPreview] = useState(() => sceneDefaults());
  const [message, setMessage] = useState(null);

  const [anchor, setAnchor] = useState([0, 0]);
  const [cameraDistance, setCameraDistance] = useState(CAMERA_DISTANCE);

  const history = useDesignHistory(code, setCode, { keyboard: true });
  const design = useMemo(() => decodeDesign(code), [code]);
  const stats = useMemo(() => designStats(design), [design]);
  const dirty = code !== savedCode || rotation !== savedRotation;
  const triangle = isTriangleDesign(design);
  const shape = triangle ? 'triangle' : 'square';
  const step = rotationStep(design);
  const tools = TOOL_OPTIONS.filter(
    (option) => !triangle || !SQUARE_ONLY_TOOLS.has(option.value)
  );
  const activeTool = tools.some((option) => option.value === tool)
    ? tool
    : 'paint';
  const frame = designFrame(design);
  const canvasSize = frame.size * CELL_UNIT;
  const [centerX, centerY] = frameCenter(design);
  const offset = [
    (centerX - anchor[0]) * CELL_UNIT,
    (anchor[1] - centerY) * CELL_UNIT,
    0,
  ];

  const replace = useCallback(
    (next, { recenter = false } = {}) => {
      history.checkpoint();
      setCode(encodeDesign(next));
      if (recenter) {
        setAnchor(frameCenter(next));
        setCameraDistance(frameDistance(next));
      }
    },
    [history]
  );

  const switchShape = useCallback(
    (nextShape) => {
      if (nextShape === shape) return;
      drafts.current[shape] = {
        anchor,
        cameraDistance,
        code,
        name,
        rotation,
        savedCode,
        savedRotation,
      };
      const draft = drafts.current[nextShape];
      replace(
        draft
          ? decodeDesign(draft.code)
          : emptyDesign({ layout: 'subdivide', shape: nextShape })
      );
      setAnchor(draft?.anchor ?? [0, 0]);
      setCameraDistance(draft?.cameraDistance ?? CAMERA_DISTANCE);
      setName(draft?.name ?? '');
      setRotation(draft?.rotation ?? 0);
      setSavedCode(draft?.savedCode ?? null);
      setSavedRotation(draft?.savedRotation ?? 0);
      setMessage(null);
    },
    [
      anchor,
      cameraDistance,
      code,
      name,
      replace,
      rotation,
      savedCode,
      savedRotation,
      shape,
    ]
  );

  const config = useMemo(
    () => ({
      ...preview,
      blobCanvasSize: canvasSize,
      blobDesign: code,
      blobPathsPerUnit: pathsPerUnit,
      blobSeed: name || 'designer',
    }),
    [canvasSize, code, name, pathsPerUnit, preview]
  );

  const onChange = useCallback((next) => setCode(encodeDesign(next)), []);

  async function open(designName) {
    try {
      const json = await saved.load(designName);
      const loaded = designFromJson(json);
      if (!loaded) throw new Error(`"${designName}" is not a valid design.`);
      const turned = wrapDegrees(Number(json.rotation) || 0);
      setRotation(turned);
      setSavedRotation(turned);
      history.checkpoint();
      const next = encodeDesign(loaded);
      setCode(next);
      setAnchor(frameCenter(loaded));
      setCameraDistance(frameDistance(loaded));
      setSavedCode(next);
      setName(designName);
      setMessage(null);
    } catch (failure) {
      setMessage({ ok: false, text: failure.message });
    }
  }

  async function save() {
    if (!NAME.test(name)) {
      setMessage({
        ok: false,
        text: 'Name the design with lowercase letters, digits and dashes.',
      });
      return;
    }
    try {
      await saved.save(name, designToJson(design, { name, rotation }));
      setSavedCode(code);
      setSavedRotation(rotation);
      setMessage({ ok: true, text: `Saved ${name}.` });
    } catch (failure) {
      setMessage({ ok: false, text: failure.message });
    }
  }

  async function remove(designName) {
    try {
      await saved.remove(designName);
      if (designName === name) setSavedCode(null);
    } catch (failure) {
      setMessage({ ok: false, text: failure.message });
    }
  }

  const query = name && !dirty ? `?design=${encodeURIComponent(name)}` : '';

  return (
    <main className="dev-page rw-page tdz-page">
      <DevPageHeaderBar eyebrow="" title="TrucheterieDesigner" />

      <div className="rw-layout">
        <div className="dev-panel rw-controls">
          <Segmented
            label="Grid shape"
            onChange={switchShape}
            options={SHAPE_OPTIONS}
            value={shape}
          />
          <div className="tdz-tools">
            <Segmented
              label="Tool"
              onChange={setTool}
              options={tools}
              value={activeTool}
            />
          </div>
          {triangle && activeTool === 'paint' ? (
            <Segmented
              label="Paint orientation"
              onChange={setOrientation}
              options={[
                { label: 'Auto', value: 'auto' },
                { label: '▲ Up', value: 'up' },
                { label: '▼ Down', value: 'down' },
              ]}
              value={orientation}
            />
          ) : null}
          <div className="rw-field-grid">
            <label className="rw-field" htmlFor="tdz-brush">
              Cell size
              <input
                id="tdz-brush"
                max={MAX_BRUSH}
                min={1}
                onChange={(event) => setBrush(Number(event.target.value))}
                type="number"
                value={brush}
              />
            </label>
            <label
              className="rw-field rw-field--checkbox"
              htmlFor="tdz-autoconnect"
            >
              <input
                id="tdz-autoconnect"
                checked={autoConnect}
                onChange={(event) => setAutoConnect(event.target.checked)}
                type="checkbox"
              />
              Auto connect
            </label>
            {design.layout !== 'subdivide' ? (
              <label
                className="rw-field rw-field--checkbox"
                htmlFor="tdz-irregular"
              >
                <input
                  id="tdz-irregular"
                  checked={Boolean(design.irregular)}
                  onChange={(event) =>
                    replace(setIrregular(design, event.target.checked))
                  }
                  type="checkbox"
                />
                Irregular connections
              </label>
            ) : null}
          </div>
          <div className="tdz-row">
            <button
              className="dev-button"
              disabled={!history.canUndo}
              onClick={history.undo}
              type="button"
            >
              <FiCornerUpLeft /> Undo
            </button>
            <button
              className="dev-button"
              disabled={!history.canRedo}
              onClick={history.redo}
              type="button"
            >
              <FiCornerUpRight /> Redo
            </button>
            <button
              className="dev-button"
              onClick={() =>
                replace(
                  emptyDesign({
                    irregular: design.irregular,
                    shape: design.shape,
                    layout: design.layout,
                  })
                )
              }
              type="button"
            >
              Clear
            </button>
          </div>
          <section className="rw-control-section">
            <h2>Design</h2>
            <p className="rw-status">
              {stats.cells} cells · {stats.open} {stats.openLabel} ·{' '}
              {stats.extent}
              {dirty ? ' · unsaved' : ''}
            </p>
            <div className="tdz-row">
              <input
                aria-label="Design name"
                className="tdz-name"
                onChange={(event) => setName(slug(event.target.value))}
                placeholder="design-name"
                value={name}
              />
              <button className="dev-button" onClick={save} type="button">
                <FiSave /> Save
              </button>
            </div>
            <div className="tdz-row">
              <button
                className="dev-button"
                onClick={() => {
                  replace(
                    emptyDesign({
                      irregular: design.irregular,
                      layout: 'subdivide',
                      shape,
                    }),
                    {
                      recenter: true,
                    }
                  );
                  setRotation(0);
                  setName('');
                  setSavedCode(null);
                }}
                type="button"
              >
                New blank
              </button>
            </div>
            <div className="tdz-row">
              {!triangle ? (
                <label className="rw-field" htmlFor="tdz-seed-grid">
                  Seed grid
                  <input
                    id="tdz-seed-grid"
                    max={SEED_GRID_MAX}
                    min={SEED_GRID_MIN}
                    onChange={(event) =>
                      setSeedGrid(Number(event.target.value))
                    }
                    type="number"
                    value={seedGrid}
                  />
                </label>
              ) : null}
              <label className="rw-field" htmlFor="tdz-seed">
                Seed
                <input
                  id="tdz-seed"
                  onChange={(event) => setSeed(event.target.value)}
                  placeholder="any word"
                  type="text"
                  value={seed}
                />
              </label>
              <button
                className="dev-button"
                onClick={() => {
                  replace(
                    designFromSeed({
                      ...sceneDefaults(),
                      blobGridShape: shape,
                      blobGridSize: seedGrid,
                      blobSeed: seed || randomSeed(),
                    }),
                    { recenter: true }
                  );
                  setName('');
                  setSavedCode(null);
                }}
                type="button"
              >
                Start from seed
              </button>
            </div>
            {message ? (
              <p className={message.ok ? 'rw-status' : 'rw-error'}>
                {message.text}
              </p>
            ) : null}
          </section>

          <section className="rw-control-section">
            <h2>Saved designs</h2>
            {saved.error ? <p className="rw-error">{saved.error}</p> : null}
            <ul className="tdz-list">
              {saved.designs.map((item) => (
                <li key={item.name}>
                  <button
                    aria-pressed={item.name === name}
                    className="tdz-list__open"
                    onClick={() => open(item.name)}
                    type="button"
                  >
                    <strong>{item.name}</strong>
                    <span>
                      {item.cells} cells
                      {item.extent ? ` · ${item.extent}` : ''}
                      {item.shape === 'triangle' ? ' · triangles' : ''}
                    </span>
                  </button>
                  <button
                    aria-label={`Delete ${item.name}`}
                    className="dev-button"
                    onClick={() => remove(item.name)}
                    type="button"
                  >
                    <FiTrash2 />
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section className="rw-control-section">
            <h2>Render variations</h2>
            {query ? (
              <>
                <div className="tdz-row">
                  <Link
                    className="dev-button"
                    rel="noreferrer"
                    target="_blank"
                    to={`/dev/trucheterie${query}`}
                  >
                    TrucheterieCLI
                  </Link>
                  <Link
                    className="dev-button"
                    rel="noreferrer"
                    target="_blank"
                    to={`/dev/trucheterie3d${query}`}
                  >
                    Trucheterie3DCLI
                  </Link>
                </div>
                <code className="tdz-command">
                  npm run trucheterie:generate -- --blobDesign {name} --count 6
                </code>
              </>
            ) : (
              <p className="rw-hint">
                Save the design to render it with the CLIs: the field stays
                exactly as drawn at its saved grid rotation, and each seed rolls
                its palette and look.
              </p>
            )}
          </section>

          <section className="rw-control-section">
            <h2>Preview</h2>
            <div className="rw-field-grid">
              <div
                aria-labelledby="tdz-rotation-label"
                className="rw-field rw-field--wide"
                role="group"
              >
                <span id="tdz-rotation-label">Grid rotation</span>
                <div className="tdz-row">
                  <button
                    aria-label={`Rotate grid ${step} degrees counterclockwise`}
                    className="dev-button"
                    onClick={() =>
                      setRotation((turn) => wrapDegrees(turn + step))
                    }
                    title={`Rotate grid ${step} degrees counterclockwise`}
                    type="button"
                  >
                    <FiRotateCcw />
                  </button>
                  <button
                    aria-label={`Rotate grid ${step} degrees clockwise`}
                    className="dev-button"
                    onClick={() =>
                      setRotation((turn) => wrapDegrees(turn - step))
                    }
                    title={`Rotate grid ${step} degrees clockwise`}
                    type="button"
                  >
                    <FiRotateCw />
                  </button>
                </div>
              </div>
              <label className="rw-field" htmlFor="tdz-paths">
                Paths per unit
                <input
                  id="tdz-paths"
                  max={12}
                  min={1}
                  onChange={(event) =>
                    setPathsPerUnit(Number(event.target.value))
                  }
                  type="number"
                  value={pathsPerUnit}
                />
              </label>
              <PreviewColors onChange={setPreview} value={preview} />
            </div>
          </section>
          <details className="tdz-help">
            <summary>Editing help</summary>
            <p className="rw-hint">
              Paint and Erase drag; Move and Duplicate drag a connected group.
              Green fits, red is blocked. ⌘Z / ⇧⌘Z undo and redo.
            </p>
            <p className="rw-hint">
              {triangle
                ? 'Auto paints the triangle under the pointer on a brush-sized grid. Up and Down select an orientation and snap its centre to the micro-grid. Isolated triangles draw rings. Connect toggles an edge on subdivision designs, a corner on packed designs. Order puts the clicked corner fan on top; click it again to swap the other two. Subdivision designs retain the reference fans inside connected groups and use circular returns at exposed edges. Open edges require matching neighbours.'
                : 'Connect toggles the nearest side. Diagonal changes a four-way pairing; Order swaps the two families. Straight applies to opposite sides. Irregular allows partial connections against larger cells.'}
            </p>
          </details>
        </div>

        <div className="dev-panel tdz-stage">
          <WebGPUCanvas>
            <color args={[preview.sceneBgColor]} attach="background" />
            <PerspectiveCamera
              fov={CAMERA_FOV}
              makeDefault
              position={[0, 0, cameraDistance]}
            />
            <OrbitControls enableRotate={false} makeDefault />
            <group position={offset}>
              <group rotation-z={(rotation * Math.PI) / 180}>
                <BlobFieldMesh config={config} />
                <BlobDesignEditor
                  autoConnect={autoConnect}
                  brush={brush}
                  canvasSize={canvasSize}
                  design={design}
                  onChange={onChange}
                  onStrokeStart={history.checkpoint}
                  orientation={orientation}
                  tool={activeTool}
                />
              </group>
            </group>
          </WebGPUCanvas>
        </div>
      </div>
    </main>
  );
}
