/* eslint-disable import/no-extraneous-dependencies, no-await-in-loop, no-restricted-syntax, no-inner-declarations */
import { spawn } from 'node:child_process';
import { access, mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { build } from 'vite';
import WebSocket from 'ws';

import { REPO_ROOT } from './loadModules.mjs';

async function bundle() {
  const config = JSON.parse(
    await readFile(path.join(REPO_ROOT, 'jsconfig.json'), 'utf8')
  );
  const alias = Object.entries(config.compilerOptions.paths)
    .filter(([key]) => !key.endsWith('/*'))
    .map(([key, [value]]) => ({
      find: new RegExp(`^${key}(?=/|$)`, 'u'),
      replacement: path.join(REPO_ROOT, value),
    }));
  const result = await build({
    configFile: false,
    root: REPO_ROOT,
    base: '/',
    logLevel: 'error',
    esbuild: { jsx: 'automatic', jsxDev: false },
    resolve: { alias },
    define: {
      'process.env.NODE_ENV': '"production"',
      __APP_VERSION__: '"capture"',
      __PARTY_HOST__: '""',
    },
    build: {
      write: false,
      minify: false,
      lib: {
        entry: path.join(REPO_ROOT, 'src/dev/tools/cumulus/browserEntry.js'),
        formats: ['iife'],
        name: 'CumulusCapture',
      },
      rollupOptions: { output: { inlineDynamicImports: true } },
    },
  });
  return (Array.isArray(result) ? result[0] : result).output.find(
    (item) => item.type === 'chunk'
  ).code;
}
const delay = (ms) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

export default async function createBrowser(options) {
  const candidates = [
    process.env.CUMULUS_CHROME,
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
  ].filter(Boolean);
  let executable;
  for (const candidate of candidates) {
    if (
      await access(candidate).then(
        () => true,
        () => false
      )
    ) {
      executable = candidate;
      break;
    }
  }
  if (!executable)
    throw new Error(
      'Chrome is required for Cumulus WebGL capture; set CUMULUS_CHROME to its executable.'
    );
  const debug = (...values) => {
    if (process.env.CUMULUS_DEBUG)
      process.stderr.write(`${values.join(' ')}\n`);
  };
  debug('bundling');
  const code = await bundle();
  debug('bundle ready');
  const profile = await mkdtemp(path.join(os.tmpdir(), 'cumulus-chrome-'));
  const chrome = spawn(
    executable,
    [
      '--headless=new',
      '--remote-debugging-port=0',
      '--remote-debugging-address=127.0.0.1',
      `--user-data-dir=${profile}`,
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-background-networking',
      '--disable-dev-shm-usage',
      '--autoplay-policy=no-user-gesture-required',
      'about:blank',
    ],
    { stdio: 'ignore' }
  );
  let socket;
  const pending = new Map();
  const errors = [];
  let sequence = 0;
  async function dispose() {
    socket?.close();
    chrome.kill();
    await new Promise((resolve) => {
      if (chrome.exitCode !== null) resolve();
      else {
        chrome.once('exit', resolve);
        setTimeout(resolve, 3000);
      }
    });
    await rm(profile, { force: true, recursive: true });
  }
  try {
    let port;
    for (let i = 0; i < 200 && !port; i += 1) {
      const info = await readFile(
        path.join(profile, 'DevToolsActivePort'),
        'utf8'
      ).catch(() => '');
      port = Number(info.split('\n')[0]);
      if (!port) await delay(50);
    }
    if (!port) throw new Error('Headless Chrome did not start.');
    const tabs = await fetch(`http://127.0.0.1:${port}/json/list`).then(
      (response) => response.json()
    );
    socket = new WebSocket(
      tabs.find((tab) => tab.type === 'page').webSocketDebuggerUrl
    );
    await new Promise((resolve, reject) => {
      socket.onopen = resolve;
      socket.onerror = reject;
    });
    function send(method, params = {}) {
      sequence += 1;
      const id = sequence;
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          pending.delete(id);
          reject(new Error(`Chrome capture timed out: ${method}`));
        }, 120000);
        pending.set(id, {
          resolve: (value) => {
            clearTimeout(timer);
            resolve(value);
          },
          reject: (error) => {
            clearTimeout(timer);
            reject(error);
          },
        });
        socket.send(JSON.stringify({ id, method, params }));
      });
    }
    socket.onmessage = async (event) => {
      const message = JSON.parse(event.data);
      if (message.method === 'Runtime.consoleAPICalled')
        debug('console', JSON.stringify(message.params.args));
      if (message.method === 'Runtime.exceptionThrown')
        errors.push(
          message.params.exceptionDetails.exception?.description ??
            message.params.exceptionDetails.text
        );
      if (message.id) {
        const task = pending.get(message.id);
        pending.delete(message.id);
        if (message.error) task?.reject(new Error(message.error.message));
        else task?.resolve(message.result);
      }
      if (message.method === 'Fetch.requestPaused') {
        const { request, requestId } = message.params;
        const url = new URL(request.url);
        debug('request', request.url);
        if (url.hostname !== 'cumulus.local') {
          await send('Fetch.continueRequest', { requestId });
          return;
        }
        const relative = decodeURIComponent(url.pathname).replace(/^\/+/, '');
        const file = path.resolve(REPO_ROOT, 'public', relative);
        let body;
        let mime = 'application/octet-stream';
        let status = 200;
        if (!relative || relative === 'index.html') {
          body =
            '<html><body><script src="/capture.js"></script></body></html>';
          mime = 'text/html';
        } else if (relative === 'capture.js') {
          body = code;
          mime = 'application/javascript';
        } else if (
          file.startsWith(`${path.resolve(REPO_ROOT, 'public')}${path.sep}`)
        ) {
          body = await readFile(file).catch(() => null);
          if (!body) {
            status = 404;
            body = 'Missing asset';
          }
          if (file.endsWith('.wasm')) mime = 'application/wasm';
        } else {
          status = 403;
          body = 'Invalid asset path';
        }
        await send('Fetch.fulfillRequest', {
          body: Buffer.from(body).toString('base64'),
          requestId,
          responseCode: status,
          responseHeaders: [
            { name: 'Content-Type', value: mime },
            { name: 'Access-Control-Allow-Origin', value: '*' },
          ],
        });
      }
    };
    socket.onclose = () => {
      pending.forEach((task) =>
        task.reject(new Error('Chrome closed during capture'))
      );
      pending.clear();
    };
    await send('Runtime.enable');
    await send('Page.enable');
    await send('Fetch.enable', { patterns: [{ urlPattern: '*' }] });
    debug('protocol ready');
    debug(
      'navigation',
      JSON.stringify(
        await send('Page.navigate', { url: 'http://cumulus.local/index.html' })
      )
    );
    async function evaluate(expression) {
      const result = await send('Runtime.evaluate', {
        awaitPromise: true,
        expression,
        returnByValue: true,
      });
      if (result.exceptionDetails)
        throw new Error(
          result.exceptionDetails.exception?.description ??
            result.exceptionDetails.text
        );
      return result.result.value;
    }
    let ready = false;
    for (let i = 0; i < 600 && !ready; i += 1) {
      ready = await evaluate('Boolean(window.cumulus)');
      if (!ready) await delay(50);
    }
    if (!ready) {
      debug(
        'document',
        JSON.stringify(
          await evaluate(
            '({url:location.href,html:document.documentElement.outerHTML.slice(0,1000)})'
          )
        )
      );
    }
    if (!ready)
      throw new Error(
        `Cumulus capture bundle failed to load: ${errors.join('; ')}`
      );
    const call = (method, ...args) =>
      evaluate(
        `window.cumulus[${JSON.stringify(method)}](...${JSON.stringify(args)})`
      );
    debug('bundle loaded', ...errors);
    await call('init', options);
    debug('stage initialized');
    return {
      load: (drawn) => call('load', drawn),
      async capture(view, seconds) {
        const frame = await call('capture', view, seconds);
        return { ...frame, data: Buffer.from(frame.data, 'base64') };
      },
      svg: (view, plotOptions) => call('svg', view, plotOptions),
      dispose,
    };
  } catch (error) {
    await dispose();
    throw error;
  }
}
