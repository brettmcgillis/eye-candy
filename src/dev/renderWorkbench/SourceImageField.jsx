import React, { useCallback, useEffect, useState } from 'react';
import { FiUpload } from 'react-icons/fi';

import './SourceImageField.css';
import { postJson, request } from './useRenderJobs';

const readDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

// An uploaded picture is stored under public/ and referenced by path, which
// is what the CLI and a saved scene preset both read. `api` is the tool's
// sourceImageRoutes endpoint.
export default function SourceImageField({ api, onChange, value }) {
  const [sources, setSources] = useState([]);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);

  const refresh = useCallback(async () => {
    const payload = await request(api);
    setSources(payload.sources);
  }, [api]);

  useEffect(() => {
    refresh().catch((failure) => setError(failure.message));
  }, [refresh]);

  const upload = async (event) => {
    const input = event.target;
    const [file] = input.files ?? [];
    input.value = '';
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const saved = await postJson(api, { dataUrl: await readDataUrl(file) });
      await refresh();
      onChange(saved.path);
    } catch (failure) {
      setError(failure.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="rw-field rw-source">
      Source image
      <div className="rw-source__row">
        {value ? (
          <img alt="" className="rw-source__thumb" src={`/${value}`} />
        ) : null}
        <select
          aria-label="Source image"
          onChange={(event) => onChange(event.target.value)}
          value={value ?? ''}
        >
          <option value="">None</option>
          {sources.map((source) => (
            <option key={source} value={source}>
              {source.split('/').pop()}
            </option>
          ))}
        </select>
        <label
          className="dev-button rw-source__upload"
          htmlFor="rw-source-upload"
        >
          <FiUpload /> {uploading ? 'Uploading...' : 'Upload'}
          <input
            accept="image/png,image/jpeg,image/webp"
            hidden
            id="rw-source-upload"
            onChange={upload}
            type="file"
          />
        </label>
      </div>
      {error ? <p className="rw-error">{error}</p> : null}
    </div>
  );
}
