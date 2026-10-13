import React, { useCallback, useMemo, useState } from 'react';
import {
  FiCornerUpLeft,
  FiCornerUpRight,
  FiEdit3,
  FiEye,
  FiLayers,
  FiLink,
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
  DESIGN_MAX_GRID,
  DESIGN_MIN_GRID,
  decodeDesign,
  designFromJson,
  designFromSeed,
  designToJson,
  emptyDesign,
  encodeDesign,
  isSideOpen,
  randomSeed,
  resizeDesign,
  sceneDefaults,
} from '@modules/trucheterieBlob';
import { LANE_MODES, PALETTE_NAMES } from '@modules/trucheterieBlobRender';
import {
  BlobDesignEditor,
  MAX_BRUSH,
  useDesignHistory,
} from '@modules/trucheterieDesigner';

import DevPageHeaderBar from '../../shell/DevPageHeaderBar';
import './TrucheterieDesignerPage.css';

const CANVAS_SIZE = 8;
const CAMERA_DISTANCE = 12;
const BACKGROUND = '#f5f2ea';
const NAME = /^[a-z0-9][a-z0-9-]{0,63}$/u;

const TOOL_OPTIONS = [
  { icon: <FiEdit3 />, label: 'Paint', value: 'paint' },
  { icon: <FiXCircle />, label: 'Erase', value: 'erase' },
  { icon: <FiLink />, label: 'Connect', value: 'connect' },
  { icon: <FiShuffle />, label: 'Diagonal', value: 'diagonal' },
  { icon: <FiLayers />, label: 'Order', value: 'order' },
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
  return { cells: design.cells.length, open };
}

export default function TrucheterieDesignerPage() {
  const saved = useSavedDesigns();
  const [code, setCode] = useState(() => encodeDesign(emptyDesign(20)));
  const [name, setName] = useState('');
  const [savedCode, setSavedCode] = useState(null);
  const [newGrid, setNewGrid] = useState(20);
  const [seed, setSeed] = useState('');
  const [tool, setTool] = useState('paint');
  const [brush, setBrush] = useState(2);
  const [autoConnect, setAutoConnect] = useState(true);
  const [pathsPerUnit, setPathsPerUnit] = useState(4);
  const [palette, setPalette] = useState('None');
  const [laneMode, setLaneMode] = useState('Cycle');
  const [showStrokes, setShowStrokes] = useState(true);
  const [message, setMessage] = useState(null);

  const history = useDesignHistory(code, setCode, { keyboard: true });
  const design = useMemo(() => decodeDesign(code), [code]);
  const stats = useMemo(() => designStats(design), [design]);
  const dirty = code !== savedCode;

  const replace = useCallback(
    (next) => {
      history.checkpoint();
      setCode(encodeDesign(next));
    },
    [history]
  );

  const config = useMemo(
    () => ({
      ...sceneDefaults(),
      blobCanvasSize: CANVAS_SIZE,
      blobDesign: code,
      blobLaneMode: laneMode,
      blobPalette: palette,
      blobPathsPerUnit: pathsPerUnit,
      blobSeed: name || 'designer',
      blobShowStrokes: showStrokes,
    }),
    [code, laneMode, name, palette, pathsPerUnit, showStrokes]
  );

  const onChange = useCallback((next) => setCode(encodeDesign(next)), []);

  async function open(designName) {
    try {
      const loaded = designFromJson(await saved.load(designName));
      if (!loaded) throw new Error(`"${designName}" is not a valid design.`);
      history.checkpoint();
      const next = encodeDesign(loaded);
      setCode(next);
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
      await saved.save(name, designToJson(design, { name }));
      setSavedCode(code);
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
              onClick={() => replace(emptyDesign(design.gridSize))}
              type="button"
            >
              Clear
            </button>
          </div>
          <p className="rw-hint">
            Grid size sets a new blank design, resizes the current one (centred;
            cells that no longer fit are dropped) and sizes a seeded start.
            Paint drags cells onto free grid. Connect toggles the side nearest
            the pointer; a side opens only where it meets cells all along, and
            opening or closing it carries across every neighbour on that edge.
            Diagonal flips which corners a four-way cell’s arcs turn about;
            Order swaps which of a cell’s two families sits on top (over, in
            3D). The marks show the pivots a click will give. ⌘Z / ⇧⌘Z undo and
            redo.
          </p>

          <section className="rw-control-section">
            <h2>Design</h2>
            <p className="rw-status">
              {stats.cells} cells · {stats.open} open sides · grid{' '}
              {design.gridSize}
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
              <label className="rw-field" htmlFor="tdz-new-grid">
                Grid size
                <input
                  id="tdz-new-grid"
                  max={DESIGN_MAX_GRID}
                  min={DESIGN_MIN_GRID}
                  onChange={(event) => setNewGrid(Number(event.target.value))}
                  type="number"
                  value={newGrid}
                />
              </label>
              <button
                className="dev-button"
                onClick={() => {
                  replace(emptyDesign(newGrid));
                  setName('');
                  setSavedCode(null);
                }}
                type="button"
              >
                New blank
              </button>
              <button
                className="dev-button"
                onClick={() => replace(resizeDesign(design, newGrid))}
                type="button"
              >
                Resize
              </button>
            </div>
            <div className="tdz-row">
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
                      blobGridSize: newGrid,
                      blobSeed: seed || randomSeed(),
                    })
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
                      {item.cells} cells · grid {item.gridSize}
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
                  <Link className="dev-button" to={`/dev/trucheterie${query}`}>
                    TrucheterieCLI
                  </Link>
                  <Link
                    className="dev-button"
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
                exactly as drawn, and each seed rolls its palette and look.
              </p>
            )}
          </section>

          <section className="rw-control-section">
            <h2>Preview</h2>
            <div className="rw-field-grid">
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
              <label className="rw-field" htmlFor="tdz-lane-mode">
                Lane colors
                <select
                  id="tdz-lane-mode"
                  onChange={(event) => setLaneMode(event.target.value)}
                  value={laneMode}
                >
                  {LANE_MODES.map((mode) => (
                    <option key={mode}>{mode}</option>
                  ))}
                </select>
              </label>
              <label className="rw-field rw-field--wide" htmlFor="tdz-palette">
                Palette
                <select
                  id="tdz-palette"
                  onChange={(event) => setPalette(event.target.value)}
                  value={palette}
                >
                  {PALETTE_NAMES.map((paletteName) => (
                    <option key={paletteName}>{paletteName}</option>
                  ))}
                </select>
              </label>
              <label
                className="rw-field rw-field--checkbox"
                htmlFor="tdz-strokes"
              >
                <input
                  id="tdz-strokes"
                  checked={showStrokes}
                  onChange={(event) => setShowStrokes(event.target.checked)}
                  type="checkbox"
                />
                Strokes
              </label>
            </div>
          </section>
        </div>

        <div className="dev-panel tdz-stage">
          <WebGPUCanvas>
            <color args={[BACKGROUND]} attach="background" />
            <PerspectiveCamera
              fov={40}
              makeDefault
              position={[0, 0, CAMERA_DISTANCE]}
            />
            <OrbitControls enableRotate={false} makeDefault />
            <BlobFieldMesh config={config} />
            <BlobDesignEditor
              autoConnect={autoConnect}
              brush={brush}
              canvasSize={CANVAS_SIZE}
              design={design}
              onChange={onChange}
              onStrokeStart={history.checkpoint}
              tool={tool}
            />
          </WebGPUCanvas>
        </div>
      </div>
    </main>
  );
}
