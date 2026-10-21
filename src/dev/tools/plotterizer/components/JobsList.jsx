import React from 'react';
import { FiDownload, FiFolder, FiTrash2 } from 'react-icons/fi';

import { duration } from '../format';

export default function JobsList({ jobs, onDelete, onOpen }) {
  if (!jobs.length) {
    return <p className="dev-muted">No saved plot jobs yet.</p>;
  }
  return (
    <ul className="pz-jobs">
      {jobs.map((job) => {
        const lifts = job.passes.reduce((sum, p) => sum + p.stats.lifts, 0);
        const seconds = job.passes.reduce((sum, p) => sum + p.stats.seconds, 0);
        return (
          <li className="pz-job" key={job.slug}>
            <div className="pz-job__head">
              <strong>{job.name}</strong>
              <span className="pz-swatches">
                {job.passes.map((pass, i) => (
                  <i
                    // eslint-disable-next-line react/no-array-index-key
                    key={i}
                    style={{ background: pass.pen.color }}
                    title={pass.pen.name}
                  />
                ))}
              </span>
            </div>
            <p className="dev-muted">
              {new Date(job.createdAt).toLocaleString()} · {job.passes.length}{' '}
              passes · {lifts.toLocaleString()} lifts · ~{duration(seconds)}
            </p>
            <div className="pz-job__actions">
              <button
                className="dev-button"
                onClick={() => onOpen(job)}
                type="button"
              >
                <FiFolder /> Open
              </button>
              {job.files
                .filter(({ file }) => file.endsWith('.dxf'))
                .map(({ file, url }) => (
                  <a
                    className="dev-button"
                    download={file}
                    href={url}
                    key={file}
                  >
                    <FiDownload />{' '}
                    {file === `${job.slug}.dxf`
                      ? 'All passes'
                      : file.slice(job.slug.length + 1, -4)}
                  </a>
                ))}
              <button
                aria-label={`Delete ${job.name}`}
                className="dev-button"
                onClick={() => onDelete(job)}
                type="button"
              >
                <FiTrash2 />
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
