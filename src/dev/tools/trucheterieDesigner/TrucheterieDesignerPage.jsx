import React, { useCallback, useMemo, useState } from 'react';
import {
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
  isSideOpen,
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
const SEED_GRID_MIN = 4;
const SEED_GRID_MAX = 50;
const NAME = /^[a-z0-9][a-z0-9-]{0,63}$/u;

const TOOL_OPTIONS = [
  { icon: <FiEdit3 />, label: 'Paint', value: 'paint' },
  { icon: <FiXCircle />, label: 'Erase', value: 'erase' },
  { icon: <FiLink />, label: 'Connect', value: 'connect' },
  { icon: <FiShuffle />, label: 'Diagonal', value: 'diagonal' },
  { icon: <FiLayers />, label: 'Order', value: 'order' },
  { icon: <FiMove />, label: 'Move', value: 'move' },
  { icon: <FiCopy />, label: 'Duplicate', value: 'duplicate' },
  { icon: <FiEye />, label: 'View', value: 'off' },
];

const slug = (text) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9-]+/gu, '-')
    .replace(/^-+|-+$/gu, '')
    .slice(0, 64);

function designStats(design) {
  const open = design.cells.reduce(
    (sum, _, index) =>
      sum +
      [0, 1, 2, 3].filter((side) => isSideOpen(design, index, side)).length,
    0
  );
  const bounds = designBounds(design);
  const extent = bounds ? `${bounds.width}×${bounds.height}` : 'empty';
  return { cells: design.cells.length, extent, open };
}

// Saved as the scenes' planeRotation (degrees, −180..180), which the CLIs pin unless a rotation is typed.
const toDegrees = (steps) => (steps > 4 ? steps - 8 : steps) * 45;
const toSteps = (degrees) => ((Math.round((degrees ?? 0) / 45) % 8) + 8) % 8;

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
  const [autoConnect, setAutoConnect] = useState(true);
  const [rotationSteps, setRotationSteps] = useState(0);
  const [savedRotation, setSavedRotation] = useState(0);
  const [pathsPerUnit, setPathsPerUnit] = useState(4);
  const [preview, setPreview] = useState(() => sceneDefaults());
  const [message, setMessage] = useState(null);

  const [anchor, setAnchor] = useState([0, 0]);

  const history = useDesignHistory(code, setCode, { keyboard: true });
  const design = useMemo(() => decodeDesign(code), [code]);
  const stats = useMemo(() => designStats(design), [design]);
  const dirty = code !== savedCode || rotationSteps !== savedRotation;
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
      if (recenter) setAnchor(frameCenter(next));
    },
    [history]
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
      const steps = toSteps(json.rotation);
      setRotationSteps(steps);
      setSavedRotation(steps);
      history.checkpoint();
      const next = encodeDesign(loaded);
      setCode(next);
      setAnchor(frameCenter(loaded));
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
      await saved.save(
        name,
        designToJson(design, { name, rotation: toDegrees(rotationSteps) })
      );
      setSavedCode(code);
      setSavedRotation(rotationSteps);
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
          <div className="tdz-tools">
            <Segmented
              label="Tool"
              onChange={setTool}
              options={TOOL_OPTIONS}
              value={tool}
            />
          </div>
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
                replace(emptyDesign({ irregular: design.irregular }))
              }
              type="button"
            >
              Clear
            </button>
          </div>
          <p className="rw-hint">
            The grid has no edge: it always reaches a full brush past the design
            and grows as you paint. Paint drags cells onto free grid, including
            the empty corner of a bigger cell where its arcs never reach; red
            means the cell would touch arcs. Edits that would grow a cell’s arcs
            into a cell sitting inside it are refused. Connect toggles the side
            nearest the pointer; a side opens only where it meets cells all
            along, and opening or closing it carries across every neighbour on
            that edge. Diagonal flips which corners a four-way cell’s arcs turn
            about; Order swaps which of a cell’s two families sits on top (over,
            in 3D). The marks show the pivots a click will give. Move drags a
            cell and everything connected to it, and Duplicate drags a copy of
            it; red means it cannot land there without touching arcs or changing
            a side. Irregular connections let a small cell connect to part of a
            bigger cell’s closed side: its lines finish in a pocket inside the
            bigger cell, or bend through to an open side at a corner. Turning it
            off closes those sides. ⌘Z / ⇧⌘Z undo and redo.
          </p>

          <section className="rw-control-section">
            <h2>Design</h2>
            <p className="rw-status">
              {stats.cells} cells · {stats.open} open sides · {stats.extent}
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
                  replace(emptyDesign({ irregular: design.irregular }), {
                    recenter: true,
                  });
                  setName('');
                  setSavedCode(null);
                }}
                type="button"
              >
                New blank
              </button>
            </div>
            <div className="tdz-row">
              <label className="rw-field" htmlFor="tdz-seed-grid">
                Seed grid
                <input
                  id="tdz-seed-grid"
                  max={SEED_GRID_MAX}
                  min={SEED_GRID_MIN}
                  onChange={(event) => setSeedGrid(Number(event.target.value))}
                  type="number"
                  value={seedGrid}
                />
              </label>
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
                    aria-label="Rotate grid 45 degrees counterclockwise"
                    className="dev-button"
                    onClick={() => setRotationSteps((steps) => (steps + 1) % 8)}
                    title="Rotate grid 45 degrees counterclockwise"
                    type="button"
                  >
                    <FiRotateCcw />
                  </button>
                  <button
                    aria-label="Rotate grid 45 degrees clockwise"
                    className="dev-button"
                    onClick={() => setRotationSteps((steps) => (steps + 7) % 8)}
                    title="Rotate grid 45 degrees clockwise"
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
        </div>

        <div className="dev-panel tdz-stage">
          <WebGPUCanvas>
            <color args={[preview.sceneBgColor]} attach="background" />
            <PerspectiveCamera
              fov={40}
              makeDefault
              position={[0, 0, CAMERA_DISTANCE]}
            />
            <OrbitControls enableRotate={false} makeDefault />
            <group position={offset}>
              <group rotation-z={(rotationSteps * Math.PI) / 4}>
                <BlobFieldMesh config={config} />
                <BlobDesignEditor
                  autoConnect={autoConnect}
                  brush={brush}
                  canvasSize={canvasSize}
                  design={design}
                  onChange={onChange}
                  onStrokeStart={history.checkpoint}
                  tool={tool}
                />
              </group>
            </group>
          </WebGPUCanvas>
        </div>
      </div>
    </main>
  );
}
