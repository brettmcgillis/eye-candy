/* eslint-disable no-param-reassign */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  CAPACITY,
  DEFAULT_FOUNDER_PARAMS,
  DEFAULT_WORLD_PARAMS,
  SNAPSHOT_STRIDE,
} from '@modules/fauna';

import createCreatureStore from '../utils/creatureStore';
import { createFoodTexture, writeFood } from '../utils/groundMaterial';

const FOUNDER_KEYS = Object.keys(DEFAULT_FOUNDER_PARAMS);
const WORLD_KEYS = Object.keys(DEFAULT_WORLD_PARAMS);
const RELEASE_ONLY = new Set(['worldSize', 'founderCopies', 'foodStart']);
const LIVE_KEYS = WORLD_KEYS.filter((key) => !RELEASE_ONLY.has(key));

const pick = (config, keys) =>
  Object.fromEntries(keys.map((key) => [key, config[key]]));

function useWorker(onMessage) {
  const workerRef = useRef(null);
  const handlerRef = useRef(onMessage);

  handlerRef.current = onMessage;

  useEffect(() => {
    const worker = new Worker(
      new URL('../utils/engine.worker.js', import.meta.url),
      {
        type: 'module',
      }
    );

    worker.onmessage = ({ data }) => handlerRef.current(data);
    workerRef.current = worker;

    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  return useCallback((message) => workerRef.current?.postMessage(message), []);
}

export default function useEngine(config, apiRef) {
  const population = useMemo(() => createCreatureStore(CAPACITY), []);
  const food = useMemo(createFoodTexture, []);
  const frames = useRef({
    current: null,
    epoch: 0,
    previous: null,
    receivedAt: 0,
  });
  const bodyCache = useRef(new Map());
  const releasedRef = useRef(null);
  const configRef = useRef(config);
  const [founders, setFounders] = useState([]);
  const [heroBody, setHeroBody] = useState(null);
  const [hud, setHud] = useState(null);
  const [inspected, setInspected] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [worldSize, setWorldSize] = useState(config.worldSize);

  configRef.current = config;

  useEffect(() => () => population.dispose(), [population]);
  useEffect(() => () => food.dispose(), [food]);

  const send = useWorker((data) => {
    const f = frames.current;

    if (data.type === 'founders') {
      setFounders(data.founders);
    } else if (data.type === 'body') {
      bodyCache.current.set(data.key, data.body);
      setHeroBody({ body: data.body, key: data.key });
    } else if (data.type === 'frame' && data.epoch === f.epoch) {
      data.despawns.forEach(({ slot }) => population.remove(slot));
      data.spawns.forEach(({ body, slot }) => population.add(slot, body));
      f.previous = f.current;
      f.current = data.snapshot;
      f.receivedAt = performance.now();

      if (data.report) {
        writeFood(food, data.report.plant, data.report.meat);
        setHud(data.report.summary);
        setInspected(data.report.inspect);
      }
    }
  });

  const founderKey = JSON.stringify(pick(config, FOUNDER_KEYS));

  useEffect(() => {
    const timer = setTimeout(() => {
      send({ params: JSON.parse(founderKey), type: 'founders' });
    }, 150);

    return () => clearTimeout(timer);
  }, [founderKey, send]);

  const founderIndex = Math.min(
    config.founderIndex,
    Math.max(0, founders.length - 1)
  );
  const founder = founders[founderIndex] ?? null;
  const heroKey = founder ? `${founderKey}:${founderIndex}` : null;

  useEffect(() => {
    if (!heroKey) return;

    const cached = bodyCache.current.get(heroKey);

    if (cached) {
      setHeroBody({ body: cached, key: heroKey });
    } else {
      send({
        detail: 'hero',
        genome: founder.genome,
        key: heroKey,
        type: 'body',
      });
    }
  }, [founder, heroKey, send]);

  const liveKey = JSON.stringify([
    pick(config, LIVE_KEYS),
    config.paused,
    config.timeScale,
  ]);

  useEffect(() => {
    const [params, paused, timeScale] = JSON.parse(liveKey);

    send({ params, paused, timeScale, type: 'settings' });
  }, [liveKey, send]);

  const select = useCallback(
    (id) => {
      setSelectedId(id);
      setInspected(null);
      send({ id, type: 'select' });
    },
    [send]
  );

  const startWorld = useCallback(
    (genomes) => {
      const c = configRef.current;
      const f = frames.current;

      f.epoch += 1;
      f.previous = null;
      f.current = null;
      population.clear();
      releasedRef.current = genomes;
      select(null);
      setWorldSize(c.worldSize);
      send({
        epoch: f.epoch,
        genomes,
        params: pick(c, WORLD_KEYS),
        seed: `${c.founderSeed}:${f.epoch}`,
        type: 'release',
      });
    },
    [population, select, send]
  );

  useEffect(() => {
    apiRef.current = {
      release: () => startWorld(founders.map((f) => f.genome)),
      resetWorld: () => releasedRef.current && startWorld(releasedRef.current),
      select,
    };
  }, [apiRef, founders, select, startWorld]);

  return {
    food,
    founder,
    founderCount: founders.length,
    founderIndex,
    frames,
    heroBody: heroBody?.key === heroKey ? heroBody.body : null,
    hud,
    inspected,
    population,
    select,
    selectedId,
    snapshotStride: SNAPSHOT_STRIDE,
    worldSize,
  };
}
