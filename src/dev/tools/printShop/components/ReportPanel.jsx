import React from 'react';
import { FiAlertTriangle, FiCheckCircle } from 'react-icons/fi';

const mm = (value) => `${value.toFixed(1)} mm`;

function Row({ label, value }) {
  return (
    <div className="ps-report__row">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

const sizeOf = ({ bounds }) => {
  const [width, height, depth] = bounds.size;
  return `${mm(width)} × ${mm(depth)} × ${mm(height)}`;
};

function BodyRows({ body }) {
  const a = body.analysis;
  return (
    <>
      <Row label={`${body.label} (W × D × H)`} value={sizeOf(a)} />
      <Row
        label={`${body.label} volume`}
        value={`${a.volumeCm3.toFixed(1)} cm³ · ${a.triangles.toLocaleString()} tris`}
      />
      <Row
        label={`${body.label} solid`}
        value={
          a.watertight
            ? `watertight, ${a.shells} shell${a.shells === 1 ? '' : 's'}`
            : `not watertight — ${a.openEdges} open, ${a.nonManifoldEdges} non-manifold`
        }
      />
    </>
  );
}

// The checks behind a print, used on the preview tab and in a gallery
// item's details.
export function ReportSummary({ report }) {
  const { folds, profile, stance, stability, warnings } = report;
  const bodies = report.bodies ?? [
    { analysis: report.analysis, id: 'piece', label: 'Piece' },
  ];
  return (
    <section className="ps-report">
      {report.unmerged ? (
        <p className="rw-hint">
          The wires are drawn overlapping here. Generate print merges them into
          one solid, which takes about 20 s, so its checks are the ones to
          trust.
        </p>
      ) : null}
      <dl>
        {bodies.map((body) => (
          <BodyRows body={body} key={body.id} />
        ))}
        <Row
          label="Material"
          value={`${profile.label} · wall ≥ ${profile.minWall} mm, best ${profile.recommendedWall} mm`}
        />
        <Row
          label="Folds"
          value={
            folds.spots.length
              ? `${folds.spots.length} (red), closest ${folds.closest.toFixed(2)} mm`
              : 'none'
          }
        />
        {report.islandsRemoved ? (
          <Row label="Specks dropped" value={report.islandsRemoved} />
        ) : null}
        {stance ? (
          <Row
            label="Stance"
            value={`tilt ${stance.tiltX}° / ${stance.tiltZ}°, trimmed ${stance.trim.toFixed(1)} mm`}
          />
        ) : null}
        {stability ? (
          <Row
            label="Stands"
            value={
              stability.stable
                ? `yes, ${stability.margin.toFixed(1)} mm inside its footprint`
                : `no, ${(-stability.margin).toFixed(1)} mm outside`
            }
          />
        ) : null}
        <Row label="Built in" value={`${report.buildMs} ms`} />
      </dl>
      {warnings.length ? (
        <ul className="ps-report__warnings">
          {warnings.map((warning) => (
            <li key={warning}>
              <FiAlertTriangle /> {warning}
            </li>
          ))}
        </ul>
      ) : (
        <p className="ps-report__ok">
          <FiCheckCircle /> Ready to print.
        </p>
      )}
    </section>
  );
}

export default function ReportPanel({ building, error, report }) {
  if (error) return <p className="rw-error">{error}</p>;
  if (!report) {
    return (
      <p className="rw-hint">{building ? 'Building…' : 'No print yet.'}</p>
    );
  }
  return <ReportSummary report={report} />;
}
