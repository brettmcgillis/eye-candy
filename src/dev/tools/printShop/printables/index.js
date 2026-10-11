import { createPrintSchema } from '../kernel';

// One folder per printable, discovered by glob: add `<id>/printable.js` and
// the page, the CLI and the worker all pick it up.
const modules = import.meta.glob('./*/printable.js', { eager: true });

export const PRINTABLES = Object.values(modules)
  .map((module) => module.default)
  .sort((left, right) => left.label.localeCompare(right.label));

const SCHEMAS = new Map(
  PRINTABLES.map((printable) => [printable.id, createPrintSchema(printable)])
);

export function getPrintable(id) {
  const printable = PRINTABLES.find((entry) => entry.id === id);
  if (!printable) {
    throw new Error(
      `Unknown printable "${id}". Known: ${PRINTABLES.map((entry) => entry.id).join(', ')}.`
    );
  }
  return printable;
}

export const schemaFor = (id) => SCHEMAS.get(getPrintable(id).id);
