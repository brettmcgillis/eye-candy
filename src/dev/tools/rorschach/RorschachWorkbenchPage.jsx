import React, { useCallback, useMemo, useState } from 'react';
import {
  FiFilm,
  FiGrid,
  FiImage,
  FiList,
  FiRefreshCw,
  FiSquare,
  FiX,
} from 'react-icons/fi';

import ResultsPanel, {
  activeJobCount,
} from '@dev/renderWorkbench/ResultsPanel';
import {
  NumberField,
  SchemaProvider,
  Segmented,
  ToggleField,
} from '@dev/renderWorkbench/SchemaFields';
import WorkbenchLayout from '@dev/renderWorkbench/WorkbenchLayout';
import '@dev/renderWorkbench/renderWorkbench.css';
import usePins from '@dev/renderWorkbench/usePins';
import useRenderJobs from '@dev/renderWorkbench/useRenderJobs';

import {
  RENDER_OPTIONS,
  defaultsFor,
  facets,
  keysInFacet,
  optionsFromPreset,
} from '@modules/rorschach';

import DevPageHeaderBar from '../../shell/DevPageHeaderBar';
import './RorschachWorkbenchPage.css';
import ClassicPatternBackground from './components/ClassicPatternBackground';
import ClassicPatternSettings, {
  DEFAULT_CLASSIC_PATTERN_SETTINGS,
} from './components/ClassicPatternSettings';
import CompositionSection from './components/CompositionSection';
import MembraneSection from './components/MembraneSection';
import OverlaySection from './components/OverlaySection';
import PreviewDetails from './components/PreviewDetails';
import RollingSection from './components/RollingSection';
import TestSection from './components/TestSection';
import WatercolourSection from './components/WatercolourSection';

// The overlay is laid out in CSS pixels; every profile here is a phone-viewed
// format, so all of them emulate a phone viewport rather than only the ones
// that carry an IG safe area.
const PHONE_VIEWPORT = 390;

const PROFILES = {
  post: { height: 1350, label: 'Post', width: 1080 },
  reel: { height: 1920, label: 'Reel', width: 1080 },
  square: { height: 1080, label: 'Square', width: 1080 },
  story: { height: 1920, label: 'Story', width: 1080 },
};
const PROFILE_OPTIONS = Object.entries(PROFILES).map(([value, item]) => ({
  icon: <FiSquare />,
  label: item.label,
  value,
}));
const OUTPUT_OPTIONS = [
  { icon: <FiImage />, label: 'Stills', value: 'still' },
  { icon: <FiFilm />, label: 'Video', value: 'video' },
];
const GROWTH_PRESENTATION_OPTIONS = [
  { icon: <FiGrid />, label: 'Four-up', value: 'grid' },
  { icon: <FiList />, label: 'Sequential', value: 'sequential' },
];

// The facets the dice roll, read off the schema so a new one appears here on
// its own.
const FACETS = facets();
const FACET_LABELS = {
  ink: 'ink',
  palette: 'palette & bundles',
  structure: 'structure',
};

// What the next render will actually do, in a sentence. The pins are the whole
// model here and they were invisible: forty checkboxes scattered down a form
// answer "is this field held" but never "am I about to roll anything", which is
// the only question worth asking before pressing the button.
function rollSummary({ base, count, held }) {
  const rolled = FACETS.filter((facet) => !held.includes(facet));
  // A number field hands its value over as the string the input holds, so this
  // has to coerce before comparing — `'1' === 1` is false, and the line read
  // "1 tests".
  const total = Number(count);
  const tests = `${total} ${total === 1 ? 'test' : 'tests'}`;

  if (held.length === 0) {
    return `Rolling everything — ${tests}, each a fresh structure, palette and blot.`;
  }
  if (rolled.length === 0) {
    return `Holding every facet${base ? ` of ${base}` : ''} — ${tests} of the same look at different seeds.`;
  }
  return `Holding ${held.map((facet) => FACET_LABELS[facet]).join(' and ')}${
    base ? ` from ${base}` : ''
  } — ${tests}, rolling ${rolled.map((facet) => FACET_LABELS[facet]).join(' and ')}.`;
}

// Both kinds' defaults merged, so toggling Stills/Video keeps whatever the
// other kind's fields were set to. Every value and every range below comes
// from the kernel's option schema — the workbench cannot offer a knob the CLI
// doesn't have, or a range the dev server would reject.
const INITIAL_OPTIONS = {
  ...defaultsFor('still', 'workbench'),
  ...defaultsFor('video', 'workbench'),
};

export default function RorschachWorkbenchPage() {
  const jobsApi = useRenderJobs('rorschach');
  const { error, jobs, refresh, submit } = jobsApi;
  const [kind, setKind] = useState('still');
  const [options, setOptions] = useState(INITIAL_OPTIONS);
  const [patternSettings, setPatternSettings] = useState(
    DEFAULT_CLASSIC_PATTERN_SETTINGS
  );
  const [patternSettingsOpen, setPatternSettingsOpen] = useState(false);
  const [profile, setProfile] = useState('post');
  const [submitting, setSubmitting] = useState(false);
  // What the last press of Render did, kept next to the button. A job's first
  // image can be half a minute away at full size, so without this the only
  // evidence that anything happened is a small counter at the far end of the
  // page.
  const [submitted, setSubmitted] = useState(null);
  const [submitError, setSubmitError] = useState(null);
  const [base, setBase] = useState(null);
  const {
    chosen,
    clear: clearPins,
    context: pinContext,
    heldFacets,
    pins,
    toggleFacet: togglePinGroup,
  } = usePins({ facets: FACETS, keysInFacet, specs: RENDER_OPTIONS });

  const activeCount = activeJobCount(jobs);

  const setOption = useCallback(
    (key, value) => setOptions((current) => ({ ...current, [key]: value })),
    []
  );

  // Takes a generated still as the base for the next batch. Its `props.json` is
  // the exact config that drew it — the rolled preset plus the render settings
  // — so this fills the form with what made that picture, including the Bundle
  // Editor's overrides as one object, the only shape three hundred flat keys
  // can travel in. Nothing is pinned by it: what to hold is the next decision,
  // and the summary line above the toggles is where it gets made.
  const useAsBase = useCallback((metadata, label) => {
    const flat = { ...metadata.render, ...metadata.preset };
    setOptions((current) => ({
      ...current,
      ...optionsFromPreset(flat, 'still'),
      ...optionsFromPreset(flat, 'video'),
    }));
    setBase(label);
  }, []);

  const clearBase = useCallback(() => setBase(null), []);

  const summary = useMemo(
    () => rollSummary({ base, count: options.count, held: heldFacets }),
    [base, heldFacets, options.count]
  );

  const selectProfile = useCallback((nextProfile) => {
    const dimensions = PROFILES[nextProfile];
    setProfile(nextProfile);
    setOptions((current) => ({
      ...current,
      height: dimensions.height,
      // Square carries no story/reel safe area, so it takes no IG preset — but
      // the overlay's viewport fallback keys off exactly that, and with no
      // preset it emulated a 1440px desktop window and picked the desktop CSS
      // branch. The chips came out about a third of the size they are in every
      // other profile, correct for a desktop but not for something viewed on a
      // phone. The two concerns are already separate downstream — the IG
      // offsets are applied only when a preset is set — so a square export can
      // ask for the phone viewport without asking for anyone's safe area.
      ig: nextProfile === 'square' ? 'none' : nextProfile,
      viewport: PHONE_VIEWPORT,
      width: dimensions.width,
    }));
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setSubmitted(null);
    setSubmitError(null);
    try {
      const job = await submit({ kind, options: chosen(options) });
      setSubmitted(job);
    } catch (failure) {
      // Without this the rejection escaped as an unhandled promise, the button
      // un-greyed itself, and nothing was rendered anywhere — so a refused job
      // and a job that never started looked exactly the same. The hook's own
      // `error` is no use here either: the jobs poll clears it a second later.
      setSubmitError(failure.message);
    } finally {
      setSubmitting(false);
    }
  }

  const openPatternSettings = useCallback(() => {
    setPatternSettingsOpen(true);
  }, []);

  const closePatternSettings = useCallback(() => {
    setPatternSettingsOpen(false);
  }, []);

  const resetPatternSettings = useCallback(() => {
    setPatternSettings({ ...DEFAULT_CLASSIC_PATTERN_SETTINGS });
  }, []);

  const changePatternSetting = useCallback((key, value) => {
    setPatternSettings((current) => ({ ...current, [key]: value }));
  }, []);

  return (
    <SchemaProvider value={pinContext}>
      <main className="dev-page rw-page">
        <ClassicPatternBackground settings={patternSettings} />
        <DevPageHeaderBar
          eyebrow=""
          icon="rorschach.webp"
          iconButtonLabel="Open Rorschach background settings"
          onIconClick={openPatternSettings}
          title="RorschachCLI"
        />

        {patternSettingsOpen ? (
          <ClassicPatternSettings
            onChange={changePatternSetting}
            onClose={closePatternSettings}
            onReset={resetPatternSettings}
            settings={patternSettings}
          />
        ) : null}

        <div className="rw-toolbar">
          <p />
          <div className="rw-toolbar__status">
            <span>{activeCount} active</span>
            <button className="dev-button" onClick={refresh} type="button">
              <FiRefreshCw /> Refresh
            </button>
          </div>
        </div>

        <WorkbenchLayout
          controls={
            /*
              `noValidate` because the browser was stricter than the renderer
              and silently won.

              A spec's `step` is a spinner increment, not a constraint —
              `coerce` range-checks min/max and never looks at it. But as an
              `<input step>` it also gates submission, so any value off the
              grid made the form refuse: preset 012's own `bloomStrength: 1.72`
              against a 0.05 step, a distance of 22.4 against 0.5. Rolled
              values snap to the *roll* step, hand-authored ones are arbitrary
              floats, and a still's sidecar is full of both — so loading one
              as a base could wedge Render for good.

              Worse, the offending fields live inside collapsed `<details>`,
              so the browser could not even show its own bubble ("An invalid
              form control is not focusable") and the press did nothing at
              all, with nothing on screen to say why. The dev server validates
              every option against the same schema the CLI uses and now
              reports a refusal where it can be read, which is where that
              check belongs.
            */
            <form
              className="dev-panel rw-controls"
              noValidate
              onSubmit={handleSubmit}
            >
              <Segmented
                label="Output"
                onChange={setKind}
                options={OUTPUT_OPTIONS}
                value={kind}
              />

              <Segmented
                label="Format"
                onChange={selectProfile}
                options={PROFILE_OPTIONS}
                value={profile}
              />

              <section className="rw-control-section">
                <h2>Roll</h2>
                <p className="rw-status">{summary}</p>
                {base ? (
                  <p className="rw-base">
                    Based on <strong>{base}</strong>
                    <button
                      className="rw-base__clear"
                      onClick={clearBase}
                      type="button"
                    >
                      <FiX /> clear
                    </button>
                  </p>
                ) : (
                  <p className="rw-hint">
                    Nothing is held, so every test is random. To make variations
                    of a piece you like, open it below and press{' '}
                    <strong>Roll variations</strong> — that fills this form with
                    what drew it, and these buttons choose how much of it to
                    keep.
                  </p>
                )}
                <div className="rw-pin-groups">
                  {FACETS.map((facet) => (
                    <button
                      aria-pressed={heldFacets.includes(facet)}
                      className="rw-pin-group"
                      key={facet}
                      onClick={() => togglePinGroup(facet)}
                      type="button"
                    >
                      Hold {FACET_LABELS[facet] ?? facet}
                    </button>
                  ))}
                  {pins.size > 0 ? (
                    <button
                      className="rw-pin-group"
                      onClick={clearPins}
                      type="button"
                    >
                      Roll everything
                    </button>
                  ) : null}
                </div>
              </section>

              <section className="rw-control-section">
                <h2>Frame</h2>
                <div className="rw-field-grid">
                  <NumberField
                    id="rw-width"
                    option="width"
                    label="Width"
                    onChange={(value) => setOption('width', value)}
                    value={options.width}
                  />
                  <NumberField
                    id="rw-height"
                    option="height"
                    label="Height"
                    onChange={(value) => setOption('height', value)}
                    value={options.height}
                  />
                  <NumberField
                    id="rw-pixel-ratio"
                    option="pixelRatio"
                    label="Pixel ratio"
                    onChange={(value) => setOption('pixelRatio', value)}
                    value={options.pixelRatio}
                  />
                  <NumberField
                    id="rw-seed"
                    option="seed"
                    label="Seed"
                    onChange={(value) => setOption('seed', value)}
                    value={options.seed}
                  />
                  <label className="rw-field" htmlFor="rw-renderer">
                    Renderer
                    <select
                      id="rw-renderer"
                      onChange={(event) =>
                        setOption('renderer', event.target.value)
                      }
                      value={options.renderer}
                    >
                      <option value="gpu">WebGPU</option>
                      <option value="svg">SVG fallback</option>
                    </select>
                  </label>
                </div>
              </section>

              <section className="rw-control-section">
                <h2>{kind === 'still' ? 'Batch' : 'Motion'}</h2>
                <div className="rw-field-grid">
                  {kind === 'still' ? (
                    <>
                      <NumberField
                        id="rw-count"
                        option="count"
                        label="Count"
                        onChange={(value) => setOption('count', value)}
                        value={options.count}
                      />
                      <label
                        className="rw-field rw-field--wide"
                        htmlFor="rw-views"
                      >
                        Views
                        <select
                          id="rw-views"
                          onChange={(event) =>
                            setOption('views', event.target.value)
                          }
                          value={options.views}
                        >
                          <option value="front,back,top,bottom">
                            All views
                          </option>
                          <option value="front">Front</option>
                          <option value="back">Back</option>
                          <option value="top">Top</option>
                          <option value="bottom">Bottom</option>
                        </select>
                      </label>
                    </>
                  ) : (
                    <>
                      <label
                        className="rw-field rw-field--wide"
                        htmlFor="rw-mode"
                      >
                        Mode
                        <select
                          id="rw-mode"
                          onChange={(event) =>
                            setOption('mode', event.target.value)
                          }
                          value={options.mode}
                        >
                          <option value="stills">Stills montage</option>
                          <option value="growth">Growth</option>
                          <option value="breathe">Breathe</option>
                          <option value="turntable">Turntable</option>
                          <option value="cinematic">Cinematic</option>
                        </select>
                      </label>
                      <NumberField
                        id="rw-fps"
                        option="fps"
                        label="FPS"
                        onChange={(value) => setOption('fps', value)}
                        value={options.fps}
                      />
                      <NumberField
                        id="rw-hold"
                        option="hold"
                        label="Seconds"
                        onChange={(value) => setOption('hold', value)}
                        value={options.hold}
                      />
                      {options.mode === 'stills' ? (
                        <>
                          <NumberField
                            id="rw-shots"
                            option="count"
                            label="Shots"
                            onChange={(value) => setOption('count', value)}
                            value={options.count}
                          />
                          <NumberField
                            id="rw-crossfade"
                            option="crossfade"
                            label="Crossfade"
                            onChange={(value) => setOption('crossfade', value)}
                            value={options.crossfade}
                          />
                          <label
                            className="rw-field rw-field--wide"
                            htmlFor="rw-view"
                          >
                            View
                            <select
                              id="rw-view"
                              onChange={(event) =>
                                setOption('view', event.target.value)
                              }
                              value={options.view}
                            >
                              <option value="front">Front</option>
                              <option value="back">Back</option>
                              <option value="top">Top</option>
                              <option value="bottom">Bottom</option>
                            </select>
                          </label>
                          <label className="rw-field" htmlFor="rw-image-format">
                            Source format
                            <select
                              id="rw-image-format"
                              onChange={(event) =>
                                setOption('imageFormat', event.target.value)
                              }
                              value={options.imageFormat}
                            >
                              <option value="png">PNG</option>
                              <option value="webp">WebP</option>
                            </select>
                          </label>
                          <label
                            className="rw-field rw-field--checkbox"
                            htmlFor="rw-keep-images"
                          >
                            <input
                              checked={options.keepImages}
                              id="rw-keep-images"
                              onChange={(event) =>
                                setOption('keepImages', event.target.checked)
                              }
                              type="checkbox"
                            />
                            Keep source images
                          </label>
                        </>
                      ) : null}
                      {options.mode === 'breathe' ? (
                        <label className="rw-field" htmlFor="rw-breathe-view">
                          View
                          <select
                            id="rw-breathe-view"
                            onChange={(event) =>
                              setOption('view', event.target.value)
                            }
                            value={options.view}
                          >
                            <option value="front">Front</option>
                            <option value="back">Back</option>
                            <option value="top">Top</option>
                            <option value="bottom">Bottom</option>
                          </select>
                        </label>
                      ) : null}
                      {options.mode === 'growth' ? (
                        <>
                          <NumberField
                            id="rw-growth-count"
                            option="count"
                            label="Tests"
                            onChange={(value) => setOption('count', value)}
                            value={options.count}
                          />
                          <label
                            className="rw-field rw-field--wide"
                            htmlFor="rw-growth-view"
                          >
                            View
                            <select
                              id="rw-growth-view"
                              onChange={(event) =>
                                setOption('growthView', event.target.value)
                              }
                              value={options.growthView}
                            >
                              <option value="front">Front</option>
                              <option value="back">Back</option>
                              <option value="top">Top</option>
                              <option value="bottom">Bottom</option>
                              <option value="all">All</option>
                            </select>
                          </label>
                          {options.growthView === 'all' ? (
                            <Segmented
                              label="Presentation"
                              onChange={(value) =>
                                setOption('growthPresentation', value)
                              }
                              options={GROWTH_PRESENTATION_OPTIONS}
                              value={options.growthPresentation}
                            />
                          ) : null}
                          <label
                            className="rw-field"
                            htmlFor="rw-growth-format"
                          >
                            Source format
                            <select
                              id="rw-growth-format"
                              onChange={(event) =>
                                setOption('imageFormat', event.target.value)
                              }
                              value={options.imageFormat}
                            >
                              <option value="png">PNG</option>
                              <option value="webp">WebP</option>
                            </select>
                          </label>
                          <label
                            className="rw-field rw-field--checkbox"
                            htmlFor="rw-growth-keep-images"
                          >
                            <input
                              checked={options.keepImages}
                              id="rw-growth-keep-images"
                              onChange={(event) =>
                                setOption('keepImages', event.target.checked)
                              }
                              type="checkbox"
                            />
                            Keep final images
                          </label>
                        </>
                      ) : null}
                      {options.mode === 'turntable' ? (
                        <NumberField
                          id="rw-turns"
                          option="turns"
                          label="Turns"
                          onChange={(value) => setOption('turns', value)}
                          value={options.turns}
                        />
                      ) : null}
                      {options.mode === 'cinematic' ? (
                        <NumberField
                          id="rw-systems"
                          option="systems"
                          label="Systems"
                          onChange={(value) => setOption('systems', value)}
                          value={options.systems}
                        />
                      ) : null}
                    </>
                  )}
                </div>
              </section>

              <CompositionSection
                kind={kind}
                options={options}
                setOption={setOption}
              />

              <section className="rw-toggles">
                <ToggleField
                  id="rw-lines"
                  option="lines"
                  label="Lines"
                  onChange={(value) => setOption('lines', value)}
                  value={options.lines}
                />
                <ToggleField
                  id="rw-ink"
                  option="ink"
                  label="Ink"
                  onChange={(value) => setOption('ink', value)}
                  value={options.ink}
                />
                <ToggleField
                  id="rw-membrane"
                  option="membrane"
                  label="Membrane"
                  onChange={(value) => setOption('membrane', value)}
                  value={options.membrane}
                />
              </section>

              {options.membrane ? (
                <MembraneSection options={options} setOption={setOption} />
              ) : null}

              {options.ink ? (
                <WatercolourSection
                  kind={kind}
                  options={options}
                  setOption={setOption}
                />
              ) : null}

              <TestSection
                bundlesPinned={pins.has('bundles')}
                options={options}
                setOption={setOption}
              />

              <RollingSection options={options} setOption={setOption} />

              <OverlaySection options={options} setOption={setOption} />

              {kind === 'still' ? (
                <fieldset className="rw-fieldset rw-formats">
                  <legend>Image files</legend>
                  <label htmlFor="rw-png">
                    <input
                      checked={options.png}
                      disabled={options.png && !options.svg && !options.webp}
                      id="rw-png"
                      onChange={(event) =>
                        setOption('png', event.target.checked)
                      }
                      type="checkbox"
                    />
                    PNG
                  </label>
                  <label htmlFor="rw-svg">
                    <input
                      checked={options.svg}
                      disabled={options.svg && !options.png && !options.webp}
                      id="rw-svg"
                      onChange={(event) =>
                        setOption('svg', event.target.checked)
                      }
                      type="checkbox"
                    />
                    SVG
                  </label>
                  <label htmlFor="rw-webp">
                    <input
                      checked={options.webp}
                      disabled={options.webp && !options.png && !options.svg}
                      id="rw-webp"
                      onChange={(event) =>
                        setOption('webp', event.target.checked)
                      }
                      type="checkbox"
                    />
                    WebP
                  </label>
                </fieldset>
              ) : null}

              <button
                className="dev-button dev-button--primary rw-submit"
                disabled={submitting}
                type="submit"
              >
                {kind === 'still' ? <FiImage /> : <FiFilm />}
                {submitting
                  ? 'Submitting...'
                  : `Render ${kind === 'still' ? 'stills' : 'video'}`}
              </button>
              {submitError ? (
                <p className="rw-error">Could not start: {submitError}</p>
              ) : null}
              {submitted ? (
                <p className="rw-submitted">
                  Started {kind === 'still' ? 'stills' : 'video'} job — watch it
                  in Jobs, or wait for it to appear in Transient. The first
                  image can take a while at full size.
                </p>
              ) : null}
              {error ? <p className="rw-error">{error}</p> : null}
            </form>
          }
          results={
            <ResultsPanel
              jobsApi={jobsApi}
              renderDetails={(detail) => (
                <PreviewDetails onUseAsBase={useAsBase} {...detail} />
              )}
            />
          }
        />
      </main>
    </SchemaProvider>
  );
}
