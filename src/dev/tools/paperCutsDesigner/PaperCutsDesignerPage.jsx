import React, { memo, useCallback, useMemo, useState } from 'react';

import '@dev/renderWorkbench/renderWorkbench.css';
import DevPageHeaderBar from '@dev/shell/DevPageHeaderBar';

import { sceneDefaults } from '@modules/paperCuts';
import { Editor, useHistory } from '@modules/paperCutsDesigner';

import Colors from './components/Colors';
import Layers from './components/Layers';
import Library from './components/Library';
import Preview from './components/Preview';
import Selection from './components/Selection';
import Sources from './components/Sources';
import Tools from './components/Tools';
import './designer.css';
import useDocument from './useDocument';

function PaperCutsDesignerPage() {
  const history = useHistory();
  const [preview, setPreview] = useState(() => ({
    ...sceneDefaults(),
    paletteName: 'Rainbow',
    frameVisible: false,
  }));
  const [activeLayer, setActiveLayer] = useState(0);
  const [brush, setBrush] = useState(1);
  const [tool, setTool] = useState('paint');
  const [selected, setSelected] = useState([]);
  const [isolate, setIsolate] = useState(false);
  const [tab, setTab] = useState('edit');
  const [frameRevision, setFrameRevision] = useState(0);
  const reframe = useCallback(() => {
    setFrameRevision((n) => n + 1);
    setSelected([]);
    setActiveLayer(0);
  }, []);
  const document = useDocument(history, preview, reframe);
  const { design } = history;
  const layer = Math.min(activeLayer, design.layerCount - 1);
  const config = useMemo(
    () => ({ ...preview, rotate: design.rotate }),
    [preview, design.rotate]
  );
  const edit = (next) => {
    history.replace(next);
  };
  return (
    <main className="dev-page rw-page pcd-page">
      <DevPageHeaderBar eyebrow="" title="PaperCutsDesigner" />
      <div className="rw-layout">
        <aside className="dev-panel rw-controls">
          <Tools
            design={design}
            tool={tool}
            setTool={setTool}
            brush={brush}
            setBrush={setBrush}
            isolate={isolate}
            setIsolate={setIsolate}
            history={history}
            edit={edit}
            setFrameRevision={setFrameRevision}
          />
          <Layers
            design={design}
            activeLayer={layer}
            onLayer={(value) => {
              setActiveLayer(value);
              setSelected([]);
            }}
            onChange={edit}
          />
          <Selection
            design={design}
            selected={selected}
            onSelect={setSelected}
            onChange={edit}
          />
          <Sources document={document} />
          <Colors config={preview} onChange={setPreview} />
          <Library document={document} />
        </aside>
        <section className="dev-panel pcd-workspace">
          <div className="pcd-row" role="tablist" aria-label="Designer views">
            <button
              className="dev-button"
              role="tab"
              aria-selected={tab === 'edit'}
              onClick={() => setTab('edit')}
              type="button"
            >
              Edit layout
            </button>
            <button
              className="dev-button"
              role="tab"
              aria-selected={tab === 'preview'}
              onClick={() => setTab('preview')}
              type="button"
            >
              3D preview
            </button>
            <span>
              {design.pieces.length} pieces · {design.layerCount} layers ·
              editing layer {layer + 1}
            </span>
          </div>
          <div className="pcd-canvas">
            {tab === 'edit' ? (
              <Editor
                design={design}
                config={config}
                activeLayer={layer}
                brush={brush}
                tool={tool}
                selected={selected}
                onSelect={setSelected}
                onChange={history.change}
                onCheckpoint={history.checkpoint}
                frameRevision={frameRevision}
                isolate={isolate}
              />
            ) : (
              <Preview
                design={design}
                config={config}
                frameRevision={frameRevision}
              />
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
export default memo(PaperCutsDesignerPage);
