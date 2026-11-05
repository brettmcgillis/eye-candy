import { hash01 } from '../signals';
import { textParts } from './glyphs';

// Listings a terminal types out, a character at a time.
const LISTINGS = [
  [
    '// CONTROL PANEL V2.1',
    '#INCLUDE <BUS.H>',
    '#DEFINE CHANNELS 8',
    '',
    'INT GAIN[CHANNELS];',
    '',
    'FN PATCH(BUS, CH) {',
    '  IF (CH >= CHANNELS) {',
    '    RETURN ERR_RANGE;',
    '  }',
    '  GAIN[CH] = 0.82;',
    '  SEND(BUS, CH, GAIN);',
    '  RETURN OK;',
    '}',
    '',
    'FN SETTLE(W) {',
    '  I = 0;',
    '  WHILE (I++ < 240) {',
    '    W.STEP(1 / 60);',
    '    IF (W.ASLEEP) BREAK;',
    '  }',
    '}',
    '',
    'LOOP {',
    '  READ_INPUTS(&PANEL);',
    '  FOR (C : CONTROLS) {',
    '    C.SAMPLE(T);',
    '    C.POSE(T);',
    '  }',
    '  IF (!PATCH(BUS, 7)) {',
    '    LOG("NO CARRIER");',
    '  }',
    '  SETTLE(ROPES);',
    '  DRAW_FRAME();',
    '  T += DT;',
    '}',
  ],
  [
    '; BOOT ROM 0000',
    'ORG 0X0000',
    '',
    'START:  DI',
    '        LD   SP, 0XFFF0',
    '        CALL INIT_BUS',
    '        CALL SELF_TEST',
    '        JR   NZ, PANIC',
    '        EI',
    '',
    'MAIN:   IN   A, (0X40)',
    '        AND  0X7F',
    '        CP   (IX+2)',
    '        JR   Z, MAIN',
    '        LD   (IX+2), A',
    '        CALL SET_LEVEL',
    '        LD   B, 8',
    'SCAN:   IN   A, (C)',
    '        OUT  (0X41), A',
    '        INC  C',
    '        DJNZ SCAN',
    '        JP   MAIN',
    '',
    'PANIC:  LD   HL, 0X3F2A',
    '        PUSH HL',
    '        CALL DUMP_REGS',
    '        HALT',
  ],
];
// Characters a second, and the pause after a line (longer after a brace).
const TYPE_RATE = 16;
const LINE_PAUSE = [0.15, 0.5];
const BLOCK_PAUSE = 0.6;
const LISTING_PAUSE = 2.5;

// A log runs a cycle: boot, quiet running in bursts, warnings, errors, a
// fault, then a reboot. Messages are short enough to keep a timestamp on a
// 24-column screen; `{v}` is read from the audio when the line is written.
const BOOT = ['BOOT ROM V2.1', 'MEM 64K OK', 'BUS 0-3 ONLINE', 'CLOCK SYNC'];
const OK = [
  ['BUS2 {v}V', (a) => (47.6 + a).toFixed(1)],
  ['CH4 {v}DB', (a) => (-24 + 18 * a).toFixed(1)],
  ['FAN {v}RPM', (a) => String(2300 + Math.round(200 * a))],
  ['TEMP {v}C', (a) => String(40 + Math.round(4 * a))],
  ['PATCH OK', null],
  ['SYNC OK', null],
  ['CH1-8 ONLINE', null],
  ['MEM {v}K FREE', (a) => String(30 + Math.round(8 * a))],
];
const WARN = [
  ['CH7 +{v}DB', (a, k) => (0.2 + 0.3 * k + 0.2 * a).toFixed(1)],
  ['TEMP {v}C', (a, k) => String(66 + Math.round(8 * k + 2 * a))],
  ['BUS3 {v}V', (a, k) => (47 - 1.5 * k - a * 0.3).toFixed(1)],
  ['FAN {v}RPM', (a, k) => String(1400 - Math.round(700 * k))],
  ['CH7 CLIPPING', null],
];
const ERRORS = [
  'CH7 NO CARRIER',
  'RETRY 1/3...',
  'RETRY 2/3...',
  'RETRY 3/3...',
  'CRC 0X3F2A',
  'BUS3 DOWN',
];
const FAULT = '* FAULT 0X3F2A *';
const DUMP = ['CORE DUMP...', 'PC 0X3F2A SP 0XFFE4', 'HALTED'];
const REBOOT_SECONDS = 4;

const pad2 = (n) => String(n).padStart(2, '0');
const stampOf = (seconds) => {
  const s = Math.floor(seconds);
  return `${pad2(Math.floor(s / 60) % 60)}:${pad2(s % 60)}`;
};

// One cycle of a terminal's log from its own dice: events at `at` seconds
// into the cycle, each a level and a message (or a reading to take).
function logCycle(roll) {
  const events = [];
  let at = 0;
  let n = 0;
  const dice = () => {
    n += 1;
    return roll(n);
  };
  const add = (level, entry, gap) => {
    events.push({ at, entry, level });
    at += gap;
  };
  BOOT.forEach((text) => add('ok', [text, null], 0.15 + 0.2 * dice()));
  at += 1;
  const burst = (pool, level, seconds, gaps) => {
    const end = at + seconds;
    while (at < end) {
      const count = 2 + Math.floor(dice() * 4);
      for (let i = 0; i < count; i += 1) {
        const k = Math.min((at - (end - seconds)) / seconds, 1);
        const entry = pool[Math.floor(dice() * pool.length)];
        add(level, [...entry, k], gaps[0] + (gaps[1] - gaps[0]) * dice());
      }
      at += 1 + 3 * dice();
    }
  };
  burst(OK, 'ok', 22 + 10 * dice(), [0.15, 0.45]);
  burst(WARN, 'warn', 9 + 4 * dice(), [0.3, 0.9]);
  ERRORS.forEach((text) => add('err', [text, null], 0.6 + 0.8 * dice()));
  add('fault', [FAULT, null], 1.6);
  DUMP.forEach((text) => add('err', [text, null], 0.5 + 0.4 * dice()));
  at += 0.8;
  add('reboot', ['REBOOT', null], REBOOT_SECONDS + 0.5);
  return { events, seconds: at };
}

// A terminal: CODE screens type a listing out, LOG screens run their log
// cycle. Each screen starts somewhere of its own in its cycle and runs at
// its own pace; a touch scrubs through it.
export default function terminalPose(kit, hw, hh, z) {
  const pixel = Math.max(0.012, Math.min((2 * hw) / (24 * 4), (2 * hh) / 42));
  const cols = Math.floor((2 * hw) / (pixel * 4));
  const rows = Math.max(1, Math.min(8, Math.floor((2 * hh) / (pixel * 7))));
  const pick = kit.rng();
  const seed = Math.floor(pick * 2147483647);
  const roll = (k) => hash01(seed, k);
  const green = { c: [0.025, 0.65, 0.15], e: [0.04, 1.3, 0.24], m: 0, r: 0.6 };
  // Errors take the panel's reddest LED colour.
  const red = [0, 1, 2]
    .map((i) => kit.style.ledColor(i))
    .reduce((a, b) => (b[0] - b[1] > a[0] - a[1] ? b : a));
  const alarm = kit.style.lit(red, 1.4);
  const dark = { c: [0.01, 0.01, 0.01], m: 0, r: 0.6 };
  const looks = [green, alarm, dark];

  const lineY = (row) => hh - row * pixel * 7;
  const cache = new Map();
  const line = (row, text, look) => {
    const key = `${row}:${looks.indexOf(look)}:${text}`;
    let parts = cache.get(key);
    if (!parts) {
      if (cache.size > 160) cache.clear();
      parts = textParts(
        kit,
        text.slice(0, cols),
        -hw,
        lineY(row),
        pixel,
        z + 0.001,
        look
      );
      cache.set(key, parts);
    }
    return parts;
  };
  const block = (row, col, look) =>
    kit.slab(
      -hw + (col * 4 + 1.5) * pixel,
      lineY(row) - 2.5 * pixel,
      pixel * 1.5,
      pixel * 2.5,
      z,
      z + 0.004,
      look
    );

  if (pick >= 0.5) {
    const listing = LISTINGS[Math.floor(roll(1) * LISTINGS.length)];
    const starts = [];
    let total = 0;
    listing.forEach((text, i) => {
      starts.push(total);
      const brace = /[{}]$/.test(text) ? BLOCK_PAUSE : 0;
      total +=
        text.length / TYPE_RATE +
        LINE_PAUSE[0] +
        (LINE_PAUSE[1] - LINE_PAUSE[0]) * roll(10 + i) +
        brace;
    });
    total += LISTING_PAUSE;
    const offset = roll(2) * total;
    const pace = 0.85 + 0.3 * roll(3);
    return ({ t }, touch) => {
      const time = touch.on ? touch.y * total : t * pace + offset;
      const into = ((time % total) + total) % total;
      let current = listing.length - 1;
      while (current > 0 && starts[current] > into) current -= 1;
      const typed = Math.min(
        Math.floor((into - starts[current]) * TYPE_RATE),
        listing[current].length
      );
      const out = [];
      const first = current - rows + 1;
      for (let row = 0; row < rows; row += 1) {
        const i = first + row;
        const text =
          i === current
            ? listing[i].slice(0, typed)
            : listing[(i + listing.length) % listing.length];
        out.push(...line(row, text, green));
      }
      if (Math.floor(t * 2.5) % 2 === 0 && typed < cols)
        out.push(block(rows - 1, typed, green));
      return out;
    };
  }

  const { events, seconds: cycle } = logCycle((k) => roll(100 + k));
  const offset = roll(4) * cycle;
  const pace = 0.85 + 0.3 * roll(5);
  const stamped = cols >= 18;
  // Uptime the screen reports at the start of its first cycle.
  const uptime = 600 + roll(6) * 3000;
  const band = Math.floor(roll(7) * 8);
  const textOf = (event, when, into, audioAt) => {
    const [message, read, k] = event.entry;
    if (event.level === 'reboot') {
      const done = Math.min((into - event.at) / REBOOT_SECONDS, 1);
      const width = Math.max(4, Math.min(10, cols - 12));
      const filled = Math.round(done * width);
      return `BOOT [${'='.repeat(filled)}${filled < width ? '>' : ''}${' '.repeat(
        Math.max(width - filled - 1, 0)
      )}] ${Math.round(done * 100)}%`;
    }
    if (event.level === 'fault') return message;
    let text = message;
    if (read) {
      const levels = audioAt(when);
      text = text.replace('{v}', read(levels[band] ?? 0.5, k ?? 0));
    }
    const tag = { err: 'ERR', ok: 'OK ', warn: 'WRN' }[event.level];
    return stamped ? `${stampOf(uptime + when)} ${tag} ${text}` : text;
  };

  return (state, touch) => {
    const { t } = state;
    const audioAt = state.audioAt ?? (() => state.audio ?? []);
    const time = touch.on ? touch.y * cycle : t * pace + offset;
    const lap = Math.floor(time / cycle);
    const into = time - lap * cycle;
    // The latest `rows` lines written, this lap's and the last's.
    const shown = [];
    for (let back = 0; shown.length < rows && back < 2; back += 1) {
      const at = back === 0 ? into : cycle;
      for (let i = events.length - 1; i >= 0 && shown.length < rows; i -= 1) {
        if (events[i].at <= at)
          shown.unshift({ event: events[i], lap: lap - back });
      }
    }
    const blink = Math.floor(t * 2) % 2 === 0;
    const out = [];
    shown.forEach(({ event, lap: of }, row) => {
      const when = (of * cycle + event.at - offset) / pace;
      const text = textOf(event, when, of === lap ? into : cycle, audioAt);
      if (event.level === 'fault') {
        if (!blink) {
          out.push(...line(row, text, alarm));
          return;
        }
        out.push(
          kit.slab(
            -hw + Math.min(text.length, cols) * 2 * pixel,
            lineY(row) - 2.5 * pixel,
            (Math.min(text.length, cols) * 4 * pixel) / 2,
            pixel * 3.3,
            z,
            z + 0.0005,
            alarm
          ),
          ...line(row, text, dark)
        );
        return;
      }
      out.push(...line(row, text, event.level === 'err' ? alarm : green));
    });
    if (blink && shown.length < rows) out.push(block(shown.length, 0, green));
    return out;
  };
}
