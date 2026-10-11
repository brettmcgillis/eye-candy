import createOptionSchema, {
  choice,
  flag,
  num,
} from '@modules/optionSchema/index.mjs';

import { MARK_IDS } from './marks';
import { PROFILES, PROFILE_IDS } from './profiles';

export const FORMATS = ['stl', '3mf', 'glb'];

const MOUNTS = ['none', 'base', 'hem', 'loop'];
const MOUNT_LABELS = {
  base: 'Printed base + stem',
  hem: 'Stands on its hem',
  loop: 'Hanging loop',
  none: 'None',
};
const onMount = (mount) => ({ when: { mount: [mount] } });

const text = (section, label, extra = {}) => ({
  default: null,
  help: label,
  label,
  nullable: true,
  placeholder: 'LIST',
  scope: 'shared',
  section,
  type: 'string',
  ...extra,
});

// Every printable gets these; its own options sit beside them. Lengths are
// millimetres in the finished print.
export const PRINT_OPTIONS = {
  size: num('print', null, 'Size (mm)', 80, 10, 400, 1),
  sizeAxis: choice(
    'print',
    null,
    'Measured along',
    ['height', 'width', 'depth', 'longest'],
    'height'
  ),
  profile: choice('print', null, 'Material', PROFILE_IDS, 'resin', {
    choiceLabels: Object.fromEntries(
      PROFILE_IDS.map((id) => [id, PROFILES[id].label])
    ),
  }),
  wall: num('print', null, 'Wall (mm)', 1.5, 0.3, 8, 0.1),
  loose: choice('print', null, 'Loose pieces', ['drop', 'keep'], 'drop', {
    choiceLabels: {
      drop: 'Drop (keep the main body)',
      keep: 'Keep (they print separately)',
    },
  }),
  minIsland: num('print', null, 'Drop specks under (mm²)', 2, 0, 200, 0.5),

  mount: choice('mount', null, 'Mount', MOUNTS, 'none', {
    choiceLabels: MOUNT_LABELS,
  }),
  baseRadius: num(
    'mount',
    null,
    'Base radius (mm, 0 = auto)',
    0,
    0,
    200,
    0.5,
    onMount('base')
  ),
  baseHeight: num(
    'mount',
    null,
    'Base height (mm)',
    4,
    1,
    40,
    0.5,
    onMount('base')
  ),
  baseGap: num(
    'mount',
    null,
    'Gap under piece (mm)',
    8,
    0,
    150,
    0.5,
    onMount('base')
  ),
  stemRadius: num(
    'mount',
    null,
    'Stem radius (mm)',
    2.5,
    0.8,
    15,
    0.1,
    onMount('base')
  ),
  standJoin: choice('mount', null, 'Stand', ['fused', 'removable'], 'fused', {
    choiceLabels: { fused: 'One piece', removable: 'Lifts off (socket)' },
    when: { mount: ['base'] },
  }),
  socketFit: num('mount', null, 'Socket clearance (mm)', 0.3, 0.05, 1.5, 0.05, {
    when: { mount: ['base'], standJoin: ['removable'] },
  }),
  socketDepth: num('mount', null, 'Socket depth (mm)', 8, 3, 30, 0.5, {
    when: { mount: ['base'], standJoin: ['removable'] },
  }),
  hemLevel: flag('mount', null, 'Level it to stand', true, onMount('hem')),
  hemTrim: num(
    'mount',
    null,
    'Trim at least (mm)',
    1.5,
    0.2,
    40,
    0.1,
    onMount('hem')
  ),
  loopRadius: num(
    'mount',
    null,
    'Loop radius (mm)',
    4,
    1.5,
    30,
    0.5,
    onMount('loop')
  ),
  loopWire: num(
    'mount',
    null,
    'Loop wire (mm)',
    1.6,
    0.6,
    8,
    0.1,
    onMount('loop')
  ),

  signature: choice('signature', null, 'Mark', MARK_IDS, 'none', {
    choiceLabels: {
      argyle: 'Argyle',
      bret: 'Bret',
      none: 'None',
      reversal: 'Reversal',
    },
  }),
  signaturePlace: choice(
    'signature',
    null,
    'On',
    ['base', 'piece', 'both'],
    'base',
    {
      choiceLabels: {
        base: 'Stand base (underside)',
        both: 'Both',
        piece: 'The piece (back)',
      },
      when: { signature: ['argyle', 'bret', 'reversal'] },
    }
  ),
  signatureStyle: choice(
    'signature',
    null,
    'Style on the piece',
    ['deboss', 'emboss'],
    'deboss',
    {
      choiceLabels: { deboss: 'Cut in', emboss: 'Raised' },
      when: {
        signature: ['argyle', 'bret', 'reversal'],
        signaturePlace: ['piece', 'both'],
      },
    }
  ),
  signatureSize: num('signature', null, 'Size (mm, 0 = auto)', 0, 0, 60, 0.5, {
    when: { signature: ['argyle', 'bret', 'reversal'] },
  }),
  signatureDepth: num(
    'signature',
    null,
    'Depth per layer (mm)',
    0.5,
    0.1,
    3,
    0.05,
    {
      when: { signature: ['argyle', 'bret', 'reversal'] },
    }
  ),
  signatureHeight: num(
    'signature',
    null,
    'Height on the piece (0–1)',
    0.65,
    0.05,
    0.95,
    0.05,
    {
      when: {
        signature: ['argyle', 'bret', 'reversal'],
        signaturePlace: ['piece', 'both'],
      },
    }
  ),

  stl: flag('output', null, 'STL', true),
  '3mf': flag('output', null, '3MF', true),
  glb: flag('output', null, 'GLB', true),
  variants: text(
    'output',
    'Variants to batch (comma list; default the variant above)',
    {
      cliOnly: true,
    }
  ),
  sizes: text(
    'output',
    'Sizes to batch in mm (comma list; default the size above)',
    {
      cliOnly: true,
    }
  ),
  out: text('output', 'Output directory', {
    cliOnly: true,
    placeholder: 'DIR',
  }),
};

const SECTION_LABELS = {
  mount: 'Mount',
  signature: 'Signature',
  output: 'Files',
  print: 'Print',
};

// One schema per printable: the shared print table plus the printable's own,
// with its preferred defaults (a floating ghost wants a base).
export function createPrintSchema(printable) {
  const options = {};
  Object.entries({ ...printable.options, ...PRINT_OPTIONS }).forEach(
    ([key, spec]) => {
      options[key] =
        key in (printable.defaults ?? {})
          ? { ...spec, default: printable.defaults[key] }
          : spec;
    }
  );
  const schema = createOptionSchema({
    options,
    sectionLabels: { ...SECTION_LABELS, ...printable.sectionLabels },
    validate: (kind, normalized, fail) => {
      if (!FORMATS.some((format) => normalized[format])) {
        throw fail('Select at least one file format: STL, 3MF or GLB.');
      }
    },
  });
  return { ...schema, RENDER_OPTIONS: options };
}
