import React, { Suspense, lazy, memo, useMemo, useState } from 'react';

import '@dev/renderWorkbench/renderWorkbench.css';
import DevPageHeaderBar from '@dev/shell/DevPageHeaderBar';

import {
  DESIGN_CATALOGUE,
  DESIGN_LOOK_KEYS,
  controlSize,
  encodeDesign,
  sceneDefaults,
} from '@modules/controlPanel';

import Appearance from './components/Appearance';
import Editor from './components/Editor';
import Inspector from './components/Inspector';
import Library from './components/Library';
import Tools from './components/Tools';
import './designer.css';
import useDocument from './useDocument';
import useEditor from './useEditor';
import useHotkeys from './useHotkeys';

const Preview = lazy(() => import('./components/Preview'));

function ControlPanelDesignerPage() {
  const editor = useEditor();
  const document = useDocument(editor);
  const [mode, setMode] = useState('modules');
  const [tool, setTool] = useState('select');
  const [brush, setBrush] = useState({ w: 4, h: 3 });
  const [catalogueIndex, setCatalogueIndex] = useState(0);
  const [placementRotation, setPlacementRotation] = useState(0);
  const [controlBrush, setControlBrush] = useState(() =>
    controlSize(DESIGN_CATALOGUE[0])
  );
  const rotatePlacement = (angle) => {
    if ((angle - placementRotation) % 180)
      setControlBrush(({ w, h }) => ({ w: h, h: w }));
    setPlacementRotation(angle);
  };
  const chooseControl = (index) => {
    setCatalogueIndex(index);
    setControlBrush(
      controlSize({ ...DESIGN_CATALOGUE[index], rotation: placementRotation })
    );
  };
  const [tab, setTab] = useState('edit');
  const [config, setConfig] = useState(() => ({
    ...sceneDefaults(),
    relief: 0,
    buildIn: false,
    sequence: 'none',
    fitView: false,
    patchCableChance: 0,
  }));
  const code = encodeDesign(editor.design);
  const previewConfig = useMemo(
    () => ({ ...config, ...editor.design.look, panelDesign: code }),
    [config, code, editor.design.look]
  );
  const inside = mode === 'controls' && Boolean(editor.module);
  const activeMode = inside ? 'controls' : 'modules';
  useHotkeys({ editor, tab, tool, inside, placementRotation, rotatePlacement });

  return (
    <main className="dev-page rw-page cpd-page">
      <DevPageHeaderBar eyebrow="" title="ControlPanelDesigner" />
      <div className="cpd-layout">
        <aside className="dev-panel cpd-sidebar">
          <Tools
            editor={editor}
            inside={inside}
            brush={brush}
            setBrush={setBrush}
            tool={tool}
            setTool={setTool}
            controlBrush={controlBrush}
            setControlBrush={setControlBrush}
            placementRotation={placementRotation}
            setPlacementRotation={rotatePlacement}
            catalogueIndex={catalogueIndex}
            setCatalogueIndex={chooseControl}
            onNew={() => {
              document.start();
              setMode('modules');
            }}
            setTab={setTab}
          />
          <Inspector
            editor={editor}
            mode={activeMode}
            setMode={(value) => {
              setMode(value);
              setTool('select');
            }}
          />
          <Appearance
            config={previewConfig}
            reset={() => editor.change({ ...editor.design, look: {} })}
            setConfig={(update) => {
              const next =
                typeof update === 'function' ? update(previewConfig) : update;
              editor.change({
                ...editor.design,
                look: Object.fromEntries(
                  DESIGN_LOOK_KEYS.map((key) => [key, next[key]])
                ),
              });
            }}
          />
          <Library document={document} />
        </aside>
        <section className="dev-panel cpd-workspace">
          <div
            className="cpd-row cpd-toolbar"
            role="tablist"
            aria-label="Designer views"
          >
            <button
              className="dev-button"
              type="button"
              role="tab"
              aria-selected={tab === 'edit'}
              onClick={() => setTab('edit')}
            >
              Edit layout
            </button>
            <button
              className="dev-button"
              type="button"
              role="tab"
              aria-selected={tab === 'preview'}
              onClick={() => setTab('preview')}
            >
              Live 3D preview
            </button>
            {inside ? (
              <button
                className="dev-button"
                type="button"
                onClick={() => {
                  setMode('modules');
                  editor.select({ module: editor.module.id, control: null });
                }}
              >
                ← Panel layout
              </button>
            ) : null}
            <span>
              {editor.design.modules.length} modules ·{' '}
              {editor.design.modules.reduce(
                (total, item) => total + item.controls.length,
                0
              )}{' '}
              controls
            </span>
          </div>
          {editor.message ? (
            <p className="cpd-status" role="status">
              {editor.message}
            </p>
          ) : null}
          {tab === 'edit' ? (
            <Editor
              editor={editor}
              mode={activeMode}
              tool={tool}
              brush={brush}
              controlBrush={controlBrush}
              placementRotation={placementRotation}
              catalogueIndex={catalogueIndex}
            />
          ) : (
            <Suspense fallback={<p>Loading the panel stage…</p>}>
              <Preview config={previewConfig} setConfig={setConfig} />
            </Suspense>
          )}
        </section>
      </div>
    </main>
  );
}
export default memo(ControlPanelDesignerPage);
