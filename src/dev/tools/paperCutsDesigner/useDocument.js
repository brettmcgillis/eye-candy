import { useEffect, useState } from 'react';

import useSavedDesigns from '@dev/paperCutsDesigns/useSavedDesigns';

import {
  AUTHORED_FRAMES,
  decodeDesign,
  designFromFrame,
  designToJson,
  emptyDesign,
  encodeDesign,
  generate,
  normalizeDesign,
} from '@modules/paperCuts';

export default function useDocument(history, preview, reframe) {
  const library = useSavedDesigns();
  const [name, setName] = useState('');
  const [savedCode, setSavedCode] = useState(null);
  const [message, setMessage] = useState(null);
  const [seed, setSeed] = useState('paper-designer');
  const code = encodeDesign(history.design);
  const replace = (design) => {
    history.replace(design);
    reframe();
    setMessage(null);
  };
  const open = async (value) => {
    try {
      const design = normalizeDesign(await library.load(value));
      replace(design);
      setName(value);
      setSavedCode(encodeDesign(design));
    } catch (error) {
      setMessage(error.message);
    }
  };
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    if (query.get('design')) open(query.get('design'));
    else if (query.get('code')) {
      try {
        replace(decodeDesign(query.get('code')));
      } catch (error) {
        setMessage(error.message);
      }
    }
  }, []);
  const save = async () => {
    if (!/^[a-z0-9][a-z0-9-]{0,63}$/u.test(name)) {
      setMessage('Use a name with lowercase letters, digits and dashes.');
      return;
    }
    try {
      await library.save(name, designToJson(history.design));
      setSavedCode(code);
      setMessage(`Saved ${name}.`);
    } catch (error) {
      setMessage(error.message);
    }
  };
  const start = (source) => {
    const frame =
      source === 'seed'
        ? generate({ ...preview, generationSeed: seed, paperDesign: '' })
        : AUTHORED_FRAMES.find((entry) => entry.name === source)?.frame;
    replace(
      frame
        ? designFromFrame(frame, { rotate: history.design.rotate })
        : emptyDesign()
    );
    setName('');
    setSavedCode(null);
  };
  const importCode = (value) => {
    if (!value) return;
    try {
      replace(
        value.startsWith('pc1.')
          ? decodeDesign(value)
          : normalizeDesign(JSON.parse(value))
      );
      setName('');
      setSavedCode(null);
    } catch (error) {
      setMessage(error.message);
    }
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setMessage('Design code copied.');
    } catch (error) {
      setMessage(error.message);
    }
  };
  const remove = async (value) => {
    try {
      await library.remove(value);
      if (value === name) setSavedCode(null);
    } catch (error) {
      setMessage(error.message);
    }
  };
  return {
    library,
    name,
    setName,
    code,
    dirty: code !== savedCode,
    message,
    seed,
    setSeed,
    open,
    save,
    start,
    importCode,
    copy,
    remove,
  };
}
