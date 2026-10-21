import fs from 'node:fs';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import {
  CURIO,
  INITIALIZE,
  STATUS,
  VERSION,
  decodeStatus,
  encode,
  jobPasses,
  passCommands,
  testCommands,
} from '../../tools/plotterizer/kernel/index.mjs';

const POLL_MS = 50;
const READ_MS = 5000;
const UNLOADED_WAIT_MS = 10 * 60 * 1000;

const sleep = (ms) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

// Through the `usb` package (v3, libusb behind a WebUSB-style API), when it
// is installed: the Mac's way in. Bulk out on endpoint 1, in on 2 (0x82),
// interface 0.
async function usbTransport() {
  let usb;
  try {
    ({ usb } = await import('usb'));
  } catch {
    return null;
  }
  const device = await usb.findDeviceByIds(CURIO.vendorId, CURIO.productId);
  if (!device) return null;
  await device.open();
  if (!device.configuration) await device.selectConfiguration(1);
  if (process.platform === 'linux') {
    await device.detachKernelDriver(0).catch(() => {});
  }
  await device.claimInterface(0);
  return {
    close: async () => {
      await device.releaseInterface(0).catch(() => {});
      await device.close().catch(() => {});
    },
    kind: 'usb',
    read: async (timeout = READ_MS) => {
      try {
        const { data } = await device.transferIn(2, 64, timeout);
        return data
          ? new Uint8Array(data.buffer, data.byteOffset, data.byteLength)
          : null;
      } catch {
        return null;
      }
    },
    write: async (bytes) => {
      const { bytesWritten } = await device.transferOut(1, bytes, 10000);
      if (bytesWritten !== bytes.length) {
        throw new Error(`Wrote ${bytesWritten} of ${bytes.length} bytes.`);
      }
    },
  };
}

// Linux's printer driver exposes the cutter as /dev/usb/lpN: no libraries,
// the Pi's way in (its user needs the `lp` group).
async function deviceFileTransport() {
  if (process.platform !== 'linux') return null;
  const names = (await readdir('/dev/usb').catch(() => [])).filter((name) =>
    /^lp\d+$/u.test(name)
  );
  const ids = async (name) => {
    const base = `/sys/class/usbmisc/${name}/device/..`;
    const read = (file) =>
      readFile(path.join(base, file), 'utf8').then(
        (text) => parseInt(text, 16),
        () => null
      );
    return [await read('idVendor'), await read('idProduct')];
  };
  const matches = await Promise.all(
    names.map(async (name) => {
      const [vendor, product] = await ids(name);
      return vendor === CURIO.vendorId && product === CURIO.productId
        ? name
        : null;
    })
  );
  const name = matches.find(Boolean);
  if (!name) return null;
  // eslint-disable-next-line no-bitwise
  const flags = fs.constants.O_RDWR | fs.constants.O_NONBLOCK;
  const fd = fs.openSync(`/dev/usb/${name}`, flags);
  return {
    close: async () => fs.closeSync(fd),
    kind: `/dev/usb/${name}`,
    read: async (timeout = READ_MS) => {
      const buffer = Buffer.alloc(64);
      const until = Date.now() + timeout;
      while (Date.now() < until) {
        try {
          const n = fs.readSync(fd, buffer, 0, 64, null);
          if (n > 0) return new Uint8Array(buffer.subarray(0, n));
        } catch (error) {
          if (error.code !== 'EAGAIN') throw error;
        }
        // eslint-disable-next-line no-await-in-loop
        await sleep(10);
      }
      return null;
    },
    write: async (bytes) => {
      let offset = 0;
      while (offset < bytes.length) {
        try {
          offset += fs.writeSync(fd, bytes, offset);
        } catch (error) {
          if (error.code !== 'EAGAIN') throw error;
          // eslint-disable-next-line no-await-in-loop
          await sleep(10);
        }
      }
    },
  };
}

// No cutter: every byte is kept, and the cutter is always ready.
function dryRunTransport() {
  const chunks = [];
  return {
    bytes: () => Buffer.concat(chunks),
    close: async () => {},
    kind: 'dry run',
    read: async () => Uint8Array.of(0x30, 0x03),
    write: async (chunk) => {
      chunks.push(Buffer.from(chunk));
    },
  };
}

export async function openCutter({ dryRun = false } = {}) {
  if (dryRun) return dryRunTransport();
  return (await deviceFileTransport()) ?? usbTransport();
}

async function status(transport) {
  await transport.write(STATUS);
  return decodeStatus(await transport.read());
}

async function waitReady(transport, onWait, isCancelled) {
  const started = Date.now();
  let silent = 0;
  for (;;) {
    if (isCancelled()) return;
    // eslint-disable-next-line no-await-in-loop
    const state = await status(transport);
    if (state === 'ready') return;
    if (state === 'none') {
      silent += 1;
      if (silent > 3) throw new Error('The cutter stopped answering.');
    } else if (state === 'unloaded') {
      onWait('Load the mat on the cutter.');
      if (Date.now() - started > UNLOADED_WAIT_MS) {
        throw new Error('No mat was loaded.');
      }
    }
    // eslint-disable-next-line no-await-in-loop
    await sleep(POLL_MS);
  }
}

async function send(transport, commands, { isCancelled, onProgress, onWait }) {
  const pieces = encode(commands);
  for (let i = 0; i < pieces.length; i += 1) {
    if (isCancelled()) return;
    // eslint-disable-next-line no-await-in-loop
    await transport.write(pieces[i]);
    // eslint-disable-next-line no-await-in-loop
    await waitReady(transport, onWait, isCancelled);
    onProgress((i + 1) / pieces.length);
  }
}

const ETX_CHAR = String.fromCharCode(0x03);

const ESCAPES = { 4: '<ESC EOT: initialize>', 5: '<ESC ENQ: status?>' };

// The bytes a dry run sent, one command per line.
const gpglText = (bytes) => {
  const lines = [];
  let line = '';
  for (let i = 0; i < bytes.length; i += 1) {
    if (bytes[i] === 0x1b) {
      if (line) lines.push(line);
      lines.push(ESCAPES[bytes[i + 1]] ?? `<ESC ${bytes[i + 1]}>`);
      line = '';
      i += 1;
    } else if (bytes[i] === 0x03) {
      lines.push(line);
      line = '';
    } else {
      line += String.fromCharCode(bytes[i]);
    }
  }
  if (line) lines.push(line);
  return `${lines.join('\n')}\n`;
};

const BUSY = ['plotting', 'waiting'];

// One cutter, one job at a time: start → (waiting for a pen → plotting)
// per pass → done. Every pass waits for Continue, so a pen can be swapped
// with the mat left where it is. A pass runs for minutes, so it runs in the
// background and the page polls the state.
export default function createPlotter(root) {
  let state = { status: 'idle' };
  let transport = null;
  let cancelled = false;
  let job = null;

  const set = (patch) => {
    state = { ...state, ...patch };
  };
  const hooks = {
    isCancelled: () => cancelled,
    onProgress: (progress) => set({ progress }),
    onWait: (message) => set({ message }),
  };

  async function release() {
    const used = transport;
    transport = null;
    if (used) await used.close().catch(() => {});
    return used;
  }

  async function keepDryRun(used, name) {
    if (!used?.bytes) return null;
    const dir = path.join(root, 'output', 'plotterizer', 'dry-runs');
    await mkdir(dir, { recursive: true });
    const file = path.join(dir, `${name}.gpgl.txt`);
    await writeFile(file, gpglText(used.bytes()));
    return path.relative(root, file);
  }

  async function connect(dryRun) {
    transport = await openCutter({ dryRun });
    if (!transport) {
      throw new Error(
        'No Curio found. On Linux, check /dev/usb/lp* and the lp group; on a Mac, install the usb package.'
      );
    }
    await transport.write(INITIALIZE);
    await transport.write(encode([VERSION])[0]);
    if (dryRun) return 'dry run';
    const version = await transport.read(10000);
    return version
      ? Buffer.from(version).toString('latin1').split(ETX_CHAR).join('').trim()
      : 'unknown';
  }

  const inBackground = (work) => {
    work().catch(async (error) => {
      await release();
      set({ message: error.message, status: 'failed' });
    });
    return state;
  };

  return {
    state: () => state,

    async detect() {
      if (transport) return { device: state.device, transport: transport.kind };
      const found = await openCutter();
      if (!found) return { device: null, transport: null };
      await found.close();
      return { device: CURIO.name, transport: found.kind };
    },

    async start({ dryRun = false, passes, slug }) {
      if (BUSY.includes(state.status)) {
        throw new Error('A plot is already running.');
      }
      const file = path.join(
        root,
        'output',
        'plotterizer',
        'jobs',
        slug,
        'job.json'
      );
      job = JSON.parse(await readFile(file, 'utf8'));
      job.decoded = jobPasses(job);
      cancelled = false;
      const version = await connect(dryRun);
      state = {
        device: `${CURIO.name} (${version})`,
        dryRun,
        job: { name: job.name, slug },
        message: '',
        passIndex: 0,
        passes: job.decoded.map((pass, i) => ({
          force: passes?.[i]?.force,
          holder: passes?.[i]?.holder ?? 1,
          lifts: pass.runs.length,
          pen: pass.pen,
          speed: passes?.[i]?.speed,
        })),
        progress: 0,
        status: 'waiting',
        transport: transport.kind,
      };
      return state;
    },

    resume() {
      if (state.status !== 'waiting') throw new Error('Nothing is waiting.');
      const index = state.passIndex;
      set({ message: '', progress: 0, status: 'plotting' });
      return inBackground(async () => {
        await send(
          transport,
          passCommands(job.decoded[index], {
            ...state.passes[index],
            paper: job.paper,
          }),
          hooks
        );
        if (cancelled) return;
        if (index + 1 < job.decoded.length) {
          set({ passIndex: index + 1, progress: 1, status: 'waiting' });
          return;
        }
        const used = await release();
        set({
          dryRunFile: await keepDryRun(used, job.name.replace(/\W+/gu, '-')),
          progress: 1,
          status: 'done',
        });
      });
    },

    async cancel() {
      cancelled = true;
      if (transport && !state.dryRun) {
        await transport.write(encode(['M0,0'])[0]).catch(() => {});
      }
      await release();
      set({ status: 'cancelled' });
      return state;
    },

    async test({ dryRun = false, force, holder = 1, kind, paper, speed }) {
      if (BUSY.includes(state.status)) throw new Error('A plot is running.');
      cancelled = false;
      const version = await connect(dryRun);
      state = {
        device: `${CURIO.name} (${version})`,
        dryRun,
        message: `${kind} test`,
        progress: 0,
        status: 'plotting',
        transport: transport.kind,
      };
      return inBackground(async () => {
        await send(
          transport,
          testCommands(kind, { force, holder, paper, speed }),
          hooks
        );
        const used = await release();
        set({
          dryRunFile: await keepDryRun(used, `test-${kind}`),
          status: 'done',
        });
      });
    },
  };
}
