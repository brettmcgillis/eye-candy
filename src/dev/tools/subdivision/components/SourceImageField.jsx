import React, { useCallback, useEffect, useState } from 'react';
import { FiUpload } from 'react-icons/fi';

import { postJson, request } from '@dev/renderWorkbench/useRenderJobs';

const API = '/dev-api/subdivision/sources';

const readDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

// An uploaded picture is stored under public/ and referenced by path, which
// is what the CLI and a saved scene preset both read.
export default function SourceImageField({ onChange, value }) {
  const [sources, setSources] = useState([]);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);

  const refresh = useCallback(async () => {
    const payload = await request(API);
    setSources(payload.sources);
  }, []);

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
      const saved = await postJson(API, { dataUrl: await readDataUrl(file) });
      await refresh();
      onChange(saved.path);
    } catch (failure) {
      setError(failure.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="rw-field sd-source">
      Source image
      <div className="sd-source__row">
        {value ? (
          <img alt="" className="sd-source__thumb" src={`/${value}`} />
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
        <label className="dev-button sd-source__upload" htmlFor="sd-upload">
          <FiUpload /> {uploading ? 'Uploading...' : 'Upload'}
          <input
            accept="image/png,image/jpeg,image/webp"
            hidden
            id="sd-upload"
            onChange={upload}
            type="file"
          />
        </label>
      </div>
      {error ? <p className="rw-error">{error}</p> : null}
    </div>
  );
}
