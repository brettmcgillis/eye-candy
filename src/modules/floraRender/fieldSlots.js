/* eslint-disable no-param-reassign */
import { SOLID_SHAPES } from '@modules/flora';

import {
  CARD_FIELD,
  SOLID_FIELDS,
  TUBE_FIELD,
  allocateField,
  capacityFor,
  writeField,
} from './geometry';

function createSlot(key, field, pick) {
  const slot = {
    field,
    geometry: allocateField(field, capacityFor(0)),
    key,
    mesh: null,
    pick,
  };

  slot.attach = (mesh) => {
    slot.mesh = mesh;
  };

  return slot;
}

function load(slot, specimen) {
  const buffers = slot.pick(specimen);

  if (capacityFor(buffers.count) > slot.geometry.userData.capacity) {
    const previous = slot.geometry;

    slot.geometry = allocateField(slot.field, capacityFor(buffers.count));

    if (slot.mesh) {
      slot.mesh.geometry = slot.geometry;
    }

    previous.dispose();
  }

  writeField(slot.geometry, slot.field, buffers);
}

// Persistent, always-mounted instanced geometries a specimen is written into.
// Specimens never travel through React: see docs/flora-pipeline.md.
export default function createFieldSlots() {
  const slots = {
    cards: createSlot('cards', CARD_FIELD, (s) => s.cards),
    solids: SOLID_SHAPES.map((shape) =>
      createSlot(shape, SOLID_FIELDS[shape], (s) => s.solids[shape])
    ),
    tube: createSlot('tube', TUBE_FIELD, (s) => s.segments),
  };
  const all = [slots.tube, slots.cards, ...slots.solids];

  return {
    all,
    dispose() {
      all.forEach((slot) => slot.geometry.dispose());
    },
    loadSpecimen(specimen) {
      all.forEach((slot) => load(slot, specimen));
    },
    slots,
  };
}
