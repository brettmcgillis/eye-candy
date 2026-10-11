import React, { useMemo, useState } from 'react';
import {
  FiBox,
  FiDownload,
  FiLayers,
  FiPlay,
  FiRefreshCw,
} from 'react-icons/fi';

import ResultsPanel, {
  activeJobCount,
} from '@dev/renderWorkbench/ResultsPanel';
import { SchemaProvider } from '@dev/renderWorkbench/SchemaFields';
import SchemaSections, {
  ListPicker,
} from '@dev/renderWorkbench/SchemaSections';
import WorkbenchLayout from '@dev/renderWorkbench/WorkbenchLayout';
import '@dev/renderWorkbench/renderWorkbench.css';
import useRenderJobs from '@dev/renderWorkbench/useRenderJobs';

import DevPageHeaderBar from '../../shell/DevPageHeaderBar';
import './PrintShopPage.css';
import PrintPreview from './components/PrintPreview';
import ReportPanel, { ReportSummary } from './components/ReportPanel';
import ViewToolbar, { DEFAULT_VIEW } from './components/ViewToolbar';
import usePrintBuild from './hooks/usePrintBuild';
import { PRINTABLES, schemaFor } from './printables';

const TOOL = 'print-shop';
const NO_PINS = { pins: new Set(), toggle: () => {} };

const slug = (text) =>
  String(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, '-')
    .replace(/^-|-$/gu, '');

const jobTitle = (job) => {
  const { options = {} } = job;
  const variants = options.variants || options.variant || '';
  const sizes = options.sizes || options.size || '';
  return `${options.printable ?? 'print'} · ${variants} · ${sizes} mm`;
};

// A gallery item is one print's folder: its preview, props.json and files.
function PrintDetails({ group, metadata }) {
  const folder = group.metadataAsset?.url.replace(/[^/]+$/u, '') ?? '';
  return (
    <>
      <ul className="ps-files">
        {(metadata.files ?? []).map((entry) => (
          <li key={entry.file}>
            <a
              download={entry.file}
              href={`${folder}${encodeURIComponent(entry.file)}`}
            >
              <FiDownload /> {entry.file}
            </a>
          </li>
        ))}
      </ul>
      {metadata.report ? <ReportSummary report={metadata.report} /> : null}
    </>
  );
}

export default function PrintShopPage() {
  const [printableId, setPrintableId] = useState(PRINTABLES[0].id);
  const printable = PRINTABLES.find((entry) => entry.id === printableId);
  const schema = useMemo(() => schemaFor(printableId), [printableId]);
  const [draft, setDraft] = useState(() =>
    schemaFor(printableId).defaultsFor('export', 'workbench')
  );
  const [batchVariants, setBatchVariants] = useState('');
  const [batchSizes, setBatchSizes] = useState('');
  const [frameNonce, setFrameNonce] = useState(0);
  const [view, setView] = useState(DEFAULT_VIEW);
  const [submitted, setSubmitted] = useState('');
  const jobs = useRenderJobs(TOOL);

  const { error: optionError, options } = useMemo(() => {
    try {
      return {
        error: null,
        options: schema.normalizeOptions('export', draft, {
          surface: 'workbench',
        }),
      };
    } catch (nextError) {
      return { error: nextError.message, options: null };
    }
  }, [draft, schema]);

  const build = usePrintBuild(printableId, options);
  const name = options
    ? [
        printableId,
        options.variant && slug(options.variant),
        `${options.size}mm`,
      ]
        .filter(Boolean)
        .join('-')
    : printableId;

  const choosePrintable = (id) => {
    setPrintableId(id);
    setDraft(schemaFor(id).defaultsFor('export', 'workbench'));
    setBatchVariants('');
  };

  const setOption = (key, value) =>
    setDraft((current) => ({ ...current, [key]: value }));

  const submit = async (variants, sizes, label) => {
    await jobs.submit({
      kind: 'export',
      options: { ...options, sizes, variants },
      printable: printableId,
    });
    setSubmitted(label);
  };

  const generate = () =>
    submit(options.variant, String(options.size), `${name} queued`);

  const runBatch = () =>
    submit(
      batchVariants || options.variant,
      batchSizes || String(options.size),
      'Batch queued'
    );

  const context = useMemo(
    () => ({ ...NO_PINS, specs: schema.RENDER_OPTIONS }),
    [schema]
  );

  const previewTab = {
    icon: <FiBox />,
    id: 'preview',
    label: 'Preview',
    render: () => (
      <>
        <div className="ps-results__head">
          <h2 className="rw-section-heading">{name}</h2>
          <span className="rw-hint">{build.building ? 'Building…' : ''}</span>
        </div>
        <ViewToolbar
          hasStand={(build.bodies?.length ?? 0) > 1}
          onFrame={() => setFrameNonce((value) => value + 1)}
          setView={setView}
          view={view}
        />
        <PrintPreview
          bodies={build.bodies}
          frameKey={`${printableId}-${options?.size}-${options?.mount}-${frameNonce}-${Boolean(build.bodies)}`}
          report={build.report}
          view={view}
        />
        <ReportPanel
          building={build.building}
          error={build.error}
          report={build.report}
        />
      </>
    ),
  };

  return (
    <SchemaProvider value={context}>
      <main className="dev-page rw-page ps-page">
        <DevPageHeaderBar eyebrow="" title="PrintShop" />
        <div className="rw-toolbar">
          <p>{printable.description}</p>
          <div className="rw-toolbar__status">
            <span>{activeJobCount(jobs.jobs)} active</span>
            <button className="dev-button" onClick={jobs.refresh} type="button">
              <FiRefreshCw /> Refresh
            </button>
          </div>
        </div>

        <WorkbenchLayout
          controls={
            <form
              className="dev-panel rw-controls"
              noValidate
              onSubmit={(event) => {
                event.preventDefault();
                generate();
              }}
            >
              <label className="rw-field rw-field--wide" htmlFor="ps-printable">
                Printable
                <select
                  id="ps-printable"
                  onChange={(event) => choosePrintable(event.target.value)}
                  value={printableId}
                >
                  {PRINTABLES.map((entry) => (
                    <option key={entry.id} value={entry.id}>
                      {entry.label} ({entry.source})
                    </option>
                  ))}
                </select>
              </label>
              <SchemaSections
                followWhen
                kind="export"
                open={['piece', 'print', 'mount', 'signature', 'output']}
                options={draft}
                schema={schema}
                setOption={setOption}
              />
              {optionError ? <p className="rw-error">{optionError}</p> : null}
              <button
                className="dev-button rw-submit"
                disabled={!options}
                type="submit"
              >
                <FiPlay /> Generate print
              </button>
              {submitted ? <p className="rw-submitted">{submitted}</p> : null}

              <details className="rw-control-section rw-advanced">
                <summary>Batch</summary>
                {printable.variants ? (
                  <ListPicker
                    id="ps-variants"
                    label="Variants (none ticked = the one above)"
                    onChange={setBatchVariants}
                    options={printable.variants}
                    value={batchVariants}
                  />
                ) : null}
                <label className="rw-field rw-field--wide" htmlFor="ps-sizes">
                  Sizes in mm (comma list; empty = the size above)
                  <input
                    id="ps-sizes"
                    onChange={(event) => setBatchSizes(event.target.value)}
                    placeholder="60, 120"
                    type="text"
                    value={batchSizes}
                  />
                </label>
                <button
                  className="dev-button"
                  disabled={!options}
                  onClick={runBatch}
                  type="button"
                >
                  <FiLayers /> Generate batch
                </button>
              </details>
            </form>
          }
          results={
            <div className="dev-panel ps-results">
              {jobs.error ? <p className="rw-error">{jobs.error}</p> : null}
              <ResultsPanel
                collectionTitle={jobTitle}
                defaultTab="preview"
                jobTitle={jobTitle}
                jobsApi={jobs}
                leadingTabs={[previewTab]}
                renderDetails={(props) => <PrintDetails {...props} />}
              />
            </div>
          }
        />
      </main>
    </SchemaProvider>
  );
}
