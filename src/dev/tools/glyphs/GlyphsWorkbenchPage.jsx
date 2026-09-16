import React, { useCallback, useEffect, useState } from 'react';

import {
  CHARSET,
  TECHNIQUES,
  createFont,
  normalizeFont,
  regenerateFont,
  rerollGlyph,
  setGlyph,
} from '@modules/glyphs';

import DevPageHeaderBar from '../../shell/DevPageHeaderBar';
import './GlyphsWorkbenchPage.css';
import GlyphEditor from './components/GlyphEditor';
import GlyphPreviewCanvas from './components/GlyphPreviewCanvas';
import GlyphSheet from './components/GlyphSheet';
import ParamsPanel from './components/ParamsPanel';
import useFontLibrary from './hooks/useFontLibrary';

const NAME_PATTERN = /^[a-z0-9][a-z0-9-]{0,47}$/u;

const CHARSET_TEXT = CHARSET.match(/.{1,18}/gu).join('\n');

const SAMPLES = [
  ['Hello world', 'HELLO WORLD'],
  ['Charset', CHARSET_TEXT],
  ['Two lines', 'THE TRUTH IS\nOUT THERE'],
];

const randomReroll = () => 1 + Math.floor(Math.random() * 1e6);

export default function GlyphsWorkbenchPage() {
  const library = useFontLibrary();
  const [font, setFont] = useState(null);
  const [savedJson, setSavedJson] = useState('');
  const [session, setSession] = useState(0);
  const [selectedKey, setSelectedKey] = useState('A');
  const [edited, setEdited] = useState(() => new Set());
  const [text, setText] = useState('HELLO WORLD');
  const [status, setStatus] = useState({ kind: '', message: '' });
  const [newName, setNewName] = useState('');
  const [newTechnique, setNewTechnique] = useState('runes');

  const dirty = Boolean(font) && JSON.stringify(font) !== savedJson;
  const savedNames = new Set(library.entries.map((entry) => entry.font.name));

  const load = useCallback((next, saved) => {
    setFont(next);
    setSavedJson(saved ? JSON.stringify(next) : '');
    setEdited(new Set());
    setSession((value) => value + 1);
    setStatus({ kind: '', message: '' });
  }, []);

  const confirmDiscard = () =>
    !dirty ||
    // eslint-disable-next-line no-alert
    window.confirm('Discard unsaved changes to this font?');

  useEffect(() => {
    if (font || !library.entries.length) return;
    load(normalizeFont(library.entries[0].font), true);
  }, [font, library.entries, load]);

  useEffect(() => {
    if (!dirty) return undefined;
    const warn = (event) => event.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const openEntry = (entry) => {
    if (!confirmDiscard()) return;
    load(normalizeFont(entry.font), true);
  };

  const checkName = (name) => {
    if (!NAME_PATTERN.test(name)) {
      setStatus({
        kind: 'error',
        message: 'Names are lowercase letters, numbers and dashes.',
      });
      return false;
    }
    if (savedNames.has(name)) {
      setStatus({ kind: 'error', message: `A font named "${name}" exists.` });
      return false;
    }
    return true;
  };

  const createNew = () => {
    const name = newName.trim();
    if (!checkName(name) || !confirmDiscard()) return;
    load(createFont(newTechnique, { name }), false);
    setNewName('');
  };

  const save = async (target = font) => {
    setStatus({ kind: 'pending', message: 'Saving…' });
    try {
      const { file } = await library.save(target);
      setFont(target);
      setSavedJson(JSON.stringify(target));
      setStatus({ kind: 'ok', message: `Saved ${file}` });
    } catch (error) {
      setStatus({ kind: 'error', message: error.message });
    }
  };

  const saveAs = () => {
    const name = newName.trim();
    if (!checkName(name)) return;
    setNewName('');
    save({ ...font, name });
  };

  const revert = () => {
    const entry = library.entries.find((item) => item.font.name === font.name);
    if (entry && confirmDiscard()) load(normalizeFont(entry.font), true);
  };

  const markEdited = (key) => setEdited((current) => new Set(current).add(key));

  const setParam = (key, value) =>
    setFont((current) => ({
      ...current,
      params: { ...current.params, [key]: value },
    }));

  const regenerate = (draft) => {
    if (
      edited.size &&
      // eslint-disable-next-line no-alert
      !window.confirm(
        `Regenerate every glyph? ${edited.size} hand-edited glyph(s) will be replaced.`
      )
    ) {
      return;
    }
    setFont((current) =>
      regenerateFont({ ...current, params: { ...current.params, ...draft } })
    );
    setEdited(new Set());
  };

  const changeGlyph = (glyph) => {
    setFont((current) => setGlyph(current, selectedKey, glyph));
    markEdited(selectedKey);
  };

  const reroll = () => {
    setFont((current) => rerollGlyph(current, selectedKey, randomReroll()));
    markEdited(selectedKey);
  };

  return (
    <div className="dev-page glyphs-page">
      <DevPageHeaderBar title="Glyphic" />
      <p className="dev-page__description" />

      <div className="glyphs-page__layout">
        <aside className="dev-panel glyphs-page__fonts">
          <h2 className="dev-section-title dev-section-title--first">Fonts</h2>
          {library.error ? (
            <p className="glyphs-page__status--error">{library.error}</p>
          ) : null}
          {library.loading ? <p className="dev-muted">Loading…</p> : null}
          <ul className="glyphs-fonts">
            {library.entries.map((entry) => (
              <li key={entry.file}>
                <button
                  aria-pressed={entry.font.name === font?.name}
                  className="glyphs-fonts__item"
                  onClick={() => openEntry(entry)}
                  type="button"
                >
                  <span>{entry.font.name}</span>
                  <span className="glyphs-fonts__technique">
                    {entry.font.technique}
                  </span>
                </button>
              </li>
            ))}
          </ul>

          {font ? (
            <>
              <h2 className="dev-section-title">
                {font.name}
                {dirty ? ' •' : ''}
              </h2>
              <div className="glyphs-page__buttons">
                <button
                  className="dev-button dev-button--primary"
                  disabled={!dirty}
                  onClick={() => save()}
                  type="button"
                >
                  Save
                </button>
                <button
                  className="dev-button"
                  disabled={!dirty || !savedNames.has(font.name)}
                  onClick={revert}
                  type="button"
                >
                  Revert
                </button>
              </div>
              <p className="dev-muted">
                src/modules/glyphs/fonts/{font.name}.json
              </p>
            </>
          ) : null}
          {status.message ? (
            <p className={`glyphs-page__status--${status.kind || 'info'}`}>
              {status.message}
            </p>
          ) : null}

          <h2 className="dev-section-title">New / save as</h2>
          <label className="glyphs-field" htmlFor="glyphs-new-name">
            <span>Name</span>
            <input
              id="glyphs-new-name"
              onChange={(event) => setNewName(event.target.value)}
              placeholder="my-font"
              type="text"
              value={newName}
            />
          </label>
          <label className="glyphs-field" htmlFor="glyphs-new-technique">
            <span>Technique</span>
            <select
              id="glyphs-new-technique"
              onChange={(event) => setNewTechnique(event.target.value)}
              value={newTechnique}
            >
              {Object.values(TECHNIQUES).map((technique) => (
                <option key={technique.id} value={technique.id}>
                  {technique.label}
                </option>
              ))}
            </select>
          </label>
          <div className="glyphs-page__buttons">
            <button className="dev-button" onClick={createNew} type="button">
              New font
            </button>
            <button
              className="dev-button"
              disabled={!font}
              onClick={saveAs}
              type="button"
            >
              Save current as
            </button>
          </div>

          {font ? (
            <>
              <h2 className="dev-section-title">Use in a scene</h2>
              <pre className="glyphs-page__usage">
                {`import font from '@modules/glyphs/fonts/${font.name}.json';
import { createGlyphMaterial } from '@modules/glyphs';

const sign = createGlyphMaterial(font, { text: 'HELLO' });
// mesh.material = sign.material
// plane size: sign.size.width x sign.size.height
// retext: sign.update({ text: 'BYE' })`}
              </pre>
            </>
          ) : null}
        </aside>

        {font ? (
          <main className="glyphs-page__workspace">
            <section className="dev-panel glyphs-page__message">
              <label className="glyphs-field" htmlFor="glyphs-text">
                <span>Message</span>
                <textarea
                  id="glyphs-text"
                  onChange={(event) => setText(event.target.value)}
                  rows={3}
                  value={text}
                />
              </label>
              <div className="glyphs-page__buttons">
                {SAMPLES.map(([label, sample]) => (
                  <button
                    className="dev-button"
                    key={label}
                    onClick={() => setText(sample)}
                    type="button"
                  >
                    {label}
                  </button>
                ))}
              </div>
              <GlyphPreviewCanvas font={font} text={text} />
            </section>

            <section className="glyphs-page__glyphs">
              <div className="dev-panel glyphs-page__sheet">
                <h2 className="dev-section-title dev-section-title--first">
                  Glyphs
                </h2>
                <GlyphSheet
                  edited={edited}
                  font={font}
                  onSelect={setSelectedKey}
                  selectedKey={selectedKey}
                />
              </div>
              <div className="dev-panel">
                <GlyphEditor
                  font={font}
                  glyphKey={selectedKey}
                  onChange={changeGlyph}
                  onReroll={reroll}
                />
              </div>
            </section>
          </main>
        ) : (
          <main className="glyphs-page__workspace">
            <p className="dev-muted">Pick or create a font.</p>
          </main>
        )}

        {font ? (
          <aside className="dev-panel glyphs-page__params">
            <ParamsPanel
              font={font}
              key={session}
              onParam={setParam}
              onRegenerate={regenerate}
            />
          </aside>
        ) : null}
      </div>
    </div>
  );
}
