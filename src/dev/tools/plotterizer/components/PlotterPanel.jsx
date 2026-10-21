import React, { useCallback, useEffect, useState } from 'react';
import { FiPlay, FiRefreshCw, FiSquare } from 'react-icons/fi';

import { PEN_DEFAULTS } from '../kernel/gpgl.mjs';

const API = '/dev-api/plotterizer/plotter';
const BUSY = ['plotting', 'waiting'];

async function call(path, body) {
  const response = await fetch(`${API}${path ?? ''}`, {
    body: body ? JSON.stringify(body) : undefined,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    method: body || path ? 'POST' : 'GET',
  });
  const payload = await response.json();
  if (!response.ok || !payload.ok) throw new Error(payload.message);
  return payload;
}

function NumberCell({ label, max, min, onChange, value }) {
  return (
    <input
      aria-label={label}
      max={max}
      min={min}
      onChange={(event) => onChange(Number(event.target.value))}
      type="number"
      value={value}
    />
  );
}

// Drives the cutter from saved jobs: pass by pass, pausing for each pen.
export default function PlotterPanel({ jobs, paper }) {
  const [cutter, setCutter] = useState(null);
  const [plotter, setPlotter] = useState({ status: 'idle' });
  const [dryRun, setDryRun] = useState(false);
  const [slug, setSlug] = useState('');
  const [passes, setPasses] = useState([]);
  const [test, setTest] = useState({ holder: 1, ...PEN_DEFAULTS });
  const [error, setError] = useState('');

  const job = jobs.find((entry) => entry.slug === slug) ?? null;
  const busy = BUSY.includes(plotter.status);

  const detect = useCallback(async () => {
    try {
      const payload = await fetch(`${API}?detect`).then((r) => r.json());
      setCutter(payload.cutter);
      setPlotter(payload.plotter);
      if (!payload.cutter?.transport) setDryRun(true);
    } catch (nextError) {
      setError(nextError.message);
    }
  }, []);

  useEffect(() => {
    detect();
  }, [detect]);

  useEffect(() => {
    if (!slug && jobs.length) setSlug(jobs[0].slug);
  }, [jobs, slug]);

  useEffect(() => {
    setPasses(
      (job?.passes ?? []).map((pass, i) => ({
        force: pass.pen.force ?? PEN_DEFAULTS.force,
        holder: (i % 2) + 1,
        speed: pass.pen.speed ?? PEN_DEFAULTS.speed,
      }))
    );
  }, [job]);

  useEffect(() => {
    if (!busy) return undefined;
    const timer = setInterval(async () => {
      try {
        setPlotter((await call(null)).plotter);
      } catch (nextError) {
        setError(nextError.message);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [busy]);

  const run = async (path, body) => {
    setError('');
    try {
      setPlotter((await call(path, body)).plotter);
    } catch (nextError) {
      setError(nextError.message);
    }
  };

  const setPass = (index, patch) =>
    setPasses((current) =>
      current.map((pass, i) => (i === index ? { ...pass, ...patch } : pass))
    );

  const current = plotter.passes?.[plotter.passIndex];

  return (
    <div className="pz-plotter">
      <section>
        <div className="pz-plotter__row">
          <strong>
            {cutter?.transport
              ? `${cutter.device} on ${cutter.transport}`
              : 'No Curio found'}
          </strong>
          <button className="dev-button" onClick={detect} type="button">
            <FiRefreshCw /> Look again
          </button>
          <label htmlFor="pz-dry-run">
            <input
              checked={dryRun}
              disabled={busy}
              id="pz-dry-run"
              onChange={(event) => setDryRun(event.target.checked)}
              type="checkbox"
            />
            Dry run (write the commands to a file instead)
          </label>
        </div>
        {!cutter?.transport ? (
          <p className="dev-muted">
            On the Pi the cutter is /dev/usb/lp0 (its user needs the lp group).
            On a Mac it needs the usb package installed.
          </p>
        ) : null}
      </section>

      <section>
        <h3 className="dev-section-title">Hardware checks</h3>
        <p className="dev-muted">
          Run these first, with the mat loaded. Travel moves the pen up round
          the paper&apos;s corners and draws nothing; orientation draws an L at
          the top-left with an arrow pointing right, and a square at the
          bottom-right.
        </p>
        <div className="pz-plotter__row">
          <label htmlFor="pz-test-holder">
            Carriage
            <select
              id="pz-test-holder"
              onChange={(event) =>
                setTest({ ...test, holder: Number(event.target.value) })
              }
              value={test.holder}
            >
              <option value={1}>1</option>
              <option value={2}>2</option>
            </select>
          </label>
          <label htmlFor="pz-test-speed">
            Speed
            <input
              id="pz-test-speed"
              max={10}
              min={1}
              onChange={(event) =>
                setTest({ ...test, speed: Number(event.target.value) })
              }
              type="number"
              value={test.speed}
            />
          </label>
          <label htmlFor="pz-test-force">
            Force
            <input
              id="pz-test-force"
              max={33}
              min={1}
              onChange={(event) =>
                setTest({ ...test, force: Number(event.target.value) })
              }
              type="number"
              value={test.force}
            />
          </label>
          {['travel', 'orientation'].map((kind) => (
            <button
              className="dev-button"
              disabled={busy}
              key={kind}
              onClick={() => run('/test', { ...test, dryRun, kind, paper })}
              type="button"
            >
              <FiPlay />{' '}
              {kind === 'travel' ? 'Travel test' : 'Orientation test'}
            </button>
          ))}
        </div>
      </section>

      <section>
        <h3 className="dev-section-title">Plot a saved job</h3>
        <select
          aria-label="Saved job"
          disabled={busy}
          onChange={(event) => setSlug(event.target.value)}
          value={slug}
        >
          {jobs.map((entry) => (
            <option key={entry.slug} value={entry.slug}>
              {entry.name}
            </option>
          ))}
        </select>
        {job ? (
          <table className="pz-passes">
            <thead>
              <tr>
                <th>Pass</th>
                <th>Pen</th>
                <th>Lifts</th>
                <th>Carriage</th>
                <th>Speed (1–10)</th>
                <th>Force (1–33)</th>
              </tr>
            </thead>
            <tbody>
              {job.passes.map((pass, i) => (
                <tr
                  className={
                    busy && plotter.passIndex === i ? 'pz-plotter__now' : ''
                  }
                  // eslint-disable-next-line react/no-array-index-key
                  key={i}
                >
                  <td>{i + 1}</td>
                  <td>
                    <i
                      className="pz-dot"
                      style={{ background: pass.pen.color }}
                    />
                    {pass.pen.name}
                  </td>
                  <td>{pass.stats.lifts.toLocaleString()}</td>
                  <td>
                    <select
                      aria-label={`Carriage for pass ${i + 1}`}
                      disabled={busy}
                      onChange={(event) =>
                        setPass(i, { holder: Number(event.target.value) })
                      }
                      value={passes[i]?.holder ?? 1}
                    >
                      <option value={1}>1</option>
                      <option value={2}>2</option>
                    </select>
                  </td>
                  <td>
                    <NumberCell
                      label={`Speed for pass ${i + 1}`}
                      max={10}
                      min={1}
                      onChange={(speed) => setPass(i, { speed })}
                      value={passes[i]?.speed ?? PEN_DEFAULTS.speed}
                    />
                  </td>
                  <td>
                    <NumberCell
                      label={`Force for pass ${i + 1}`}
                      max={33}
                      min={1}
                      onChange={(force) => setPass(i, { force })}
                      value={passes[i]?.force ?? PEN_DEFAULTS.force}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="dev-muted">Save a job first.</p>
        )}
        <div className="pz-plotter__row">
          <button
            className="dev-button dev-button--primary"
            disabled={busy || !job}
            onClick={() => run('/start', { dryRun, passes, slug })}
            type="button"
          >
            <FiPlay /> Start
          </button>
          {plotter.status === 'waiting' ? (
            <button
              className="dev-button dev-button--primary"
              onClick={() => run('/continue', {})}
              type="button"
            >
              <FiPlay /> Pen loaded — plot pass {plotter.passIndex + 1}
            </button>
          ) : null}
          {busy ? (
            <button
              className="dev-button"
              onClick={() => run('/cancel', {})}
              type="button"
            >
              <FiSquare /> Stop
            </button>
          ) : null}
        </div>
      </section>

      <section className="pz-plotter__status">
        <strong>{plotter.status}</strong>
        {plotter.status === 'waiting' && current ? (
          <p>
            Load{' '}
            <i className="pz-dot" style={{ background: current.pen.color }} />
            <strong>{current.pen.name}</strong> in carriage {current.holder},
            leave the mat where it is, then press the button above.
          </p>
        ) : null}
        {plotter.status === 'plotting' ? (
          <progress max={1} value={plotter.progress ?? 0} />
        ) : null}
        {plotter.message ? <p>{plotter.message}</p> : null}
        {plotter.dryRunFile ? (
          <p className="dev-muted">Commands written to {plotter.dryRunFile}</p>
        ) : null}
        {error ? <p className="pz-warning">{error}</p> : null}
      </section>
    </div>
  );
}
