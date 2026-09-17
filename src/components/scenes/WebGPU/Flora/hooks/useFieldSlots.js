/* eslint-disable no-param-reassign */
import { useCallback, useEffect, useMemo } from 'react';

import { SOLID_SHAPES } from '@modules/flora';

import {
  CARD_FIELD,
  SOLID_FIELDS,
  TUBE_FIELD,
  allocateField,
  capacityFor,
  writeField,
} from '../utils/geometry';

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

export default function useFieldSlots() {
  const slots = useMemo(
    () => ({
      cards: createSlot('cards', CARD_FIELD, (s) => s.cards),
      solids: SOLID_SHAPES.map((shape) =>
        createSlot(shape, SOLID_FIELDS[shape], (s) => s.solids[shape])
      ),
      tube: createSlot('tube', TUBE_FIELD, (s) => s.segments),
    }),
    []
  );

  useEffect(
    () => () => {
      [slots.tube, slots.cards, ...slots.solids].forEach((slot) =>
        slot.geometry.dispose()
      );
    },
    [slots]
  );

  const loadSpecimen = useCallback(
    (specimen) => {
      [slots.tube, slots.cards, ...slots.solids].forEach((slot) =>
        load(slot, specimen)
      );
    },
    [slots]
  );

  return { loadSpecimen, slots };
}
