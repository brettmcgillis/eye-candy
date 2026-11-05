import { useEffect, useState } from 'react';

import useSavedDesigns from '@dev/controlPanelDesigns/useSavedDesigns';

import {
  decodeDesign,
  emptyDesign,
  encodeDesign,
  normalizeDesign,
} from '@modules/controlPanel';

export default function useDocument(editor) {
  const library = useSavedDesigns();
  const [name, setName] = useState('');
  const [saved, setSaved] = useState(null);
  const [busy, setBusy] = useState(false);
  const code = encodeDesign(editor.design);
  const open = async (value) => {
    try {
      const design = normalizeDesign(await library.load(value));
      editor.open(design);
      setName(value);
      setSaved(encodeDesign(design));
    } catch (error) {
      editor.setMessage(error.message);
    }
  };
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    if (query.get('design')) open(query.get('design'));
    else if (query.get('code')) {
      try {
        editor.open(decodeDesign(query.get('code')));
      } catch (error) {
        editor.setMessage(error.message);
      }
    }
  }, []);
  const save = async () => {
    if (!/^[a-z0-9][a-z0-9-]{0,63}$/u.test(name)) {
      editor.setMessage('Use 1–64 lowercase letters, digits and dashes.');
      return;
    }
    setBusy(true);
    try {
      await library.save(name, editor.design);
      setSaved(code);
      editor.setMessage(`Saved ${name}.`);
    } catch (error) {
      editor.setMessage(error.message);
    } finally {
      setBusy(false);
    }
  };
  const importValue = (value) => {
    try {
      const next = value.trim();
      editor.open(
        next.startsWith('cp1.')
          ? decodeDesign(next)
          : normalizeDesign(JSON.parse(next))
      );
      setSaved(null);
      setName('');
    } catch (error) {
      editor.setMessage(error.message);
    }
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      editor.setMessage('Design code copied.');
    } catch (error) {
      editor.setMessage(error.message);
    }
  };
  const download = () => {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(editor.design, null, 2)], {
        type: 'application/json',
      })
    );
    const link = document.createElement('a');
    link.href = url;
    link.download = `${name || 'control-panel'}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };
  const start = () => {
    editor.open(emptyDesign(editor.design.cols, editor.design.rows));
    setName('');
    setSaved(null);
  };
  return {
    start,
    library,
    name,
    setName,
    code,
    dirty: code !== saved,
    busy,
    open,
    save,
    importValue,
    copy,
    download,
  };
}
