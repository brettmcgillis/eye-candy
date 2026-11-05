#!/usr/bin/env node

/* eslint-disable no-console */
import process from 'node:process';

import auditPresets from './lib/presetAudit.mjs';

function comparable(value) {
  if (Array.isArray(value)) return value.map(comparable);
  if (value && typeof value === 'object') {
    if ('x' in value)
      return ['x', 'y', 'z', 'w']
        .filter((key) => key in value)
        .map((key) => value[key]);
    return Object.fromEntries(
      Object.entries(value)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, entry]) => [key, comparable(entry)])
    );
  }
  return value;
}

const equal = (a, b) =>
  JSON.stringify(comparable(a)) === JSON.stringify(comparable(b));

async function main() {
  const report = await auditPresets();
  const failures = [];
  let count = 0;
  report.forEach(({ scene, data, defaultPreset, error, rows = [] }) => {
    if (error) failures.push(`${scene}: cannot inspect controls: ${error}`);
    if (!error && !rows.some(({ name }) => name === defaultPreset))
      failures.push(`${scene}: missing default preset ${defaultPreset}`);
    rows.forEach(({ name, saved, controls, specs, applied }) => {
      count += 1;
      const label = `${scene}/${name}`;
      if (data && !equal(saved, data.values[name]))
        failures.push(
          `${label}: runtime preset differs from its literal saved data`
        );
      const stale = Object.keys(saved).filter(
        (key) => !(key in controls) && !data?.metadata.includes(key)
      );
      if (stale.length)
        failures.push(
          `${label}: unregistered saved controls: ${stale.join(', ')}`
        );
      const missing = Object.keys(controls).filter((key) => !(key in saved));
      if (missing.length)
        failures.push(
          `${label}: missing saved controls: ${missing.join(', ')}`
        );
      Object.entries(controls).forEach(([key]) => {
        if (!(key in saved)) return;
        if (!equal(saved[key], applied?.[key]))
          failures.push(`${label}: applying changes or drops saved ${key}`);
        const value = saved[key];
        const spec = specs[key];
        if (spec.onChange && spec.transient !== false)
          failures.push(
            `${label}: ${key} must set transient: false so saving includes edits`
          );
        if (
          typeof value === 'number' &&
          (!Number.isFinite(value) || value < spec.min || value > spec.max)
        )
          failures.push(
            `${label}: ${key}=${value} is outside ${spec.min}..${spec.max}`
          );
        const choices =
          spec.options &&
          (Array.isArray(spec.options)
            ? spec.options
            : Object.values(spec.options));
        if (choices && !choices.includes(value))
          failures.push(
            `${label}: ${key}=${JSON.stringify(value)} is not an available choice`
          );
      });
      const unknown = Object.keys(applied ?? {}).filter(
        (key) => key !== 'preset' && !(key in controls)
      );
      if (unknown.length)
        failures.push(
          `${label}: applying unregistered controls: ${unknown.join(', ')}`
        );
    });
  });
  if (failures.length) {
    console.error(
      `presets:check failed (${report.length} scenes, ${count} presets):\n  ${failures.join('\n  ')}`
    );
    process.exitCode = 1;
  } else
    console.log(
      `presets:check passed (${report.length} scenes, ${count} presets)`
    );
}

main().catch((error) => {
  console.error(error.stack ?? error);
  process.exitCode = 1;
});
