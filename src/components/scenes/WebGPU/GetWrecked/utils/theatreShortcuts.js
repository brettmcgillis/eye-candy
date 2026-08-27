// Theatre ships no shortcut reference of its own, so this is one, opened from a
// button in the studio toolbar.
//
// Every binding below was read out of @theatre/studio's own key handler rather
// than recalled — it handles exactly three global shortcuts, all of which it
// ignores while focus is in an INPUT or TEXTAREA. Keyframe deletion looks like
// it should have a key but doesn't: Delete/Backspace aren't bound, it's a
// right-click menu item.
const THEATRE_BINDINGS = [
  [
    'Space',
    'Play / pause the sequence. No modifiers — Shift+Space does nothing.',
  ],
  ['Cmd / Ctrl + Z', 'Undo.'],
  ['Cmd / Ctrl + Shift + Z', 'Redo.'],
  ['Alt + \\', 'Hide / show the whole studio UI.'],
];

const SCENE_BINDINGS = [
  [
    'Shift + H',
    'Hide / show the app UI (Leva, version tag). Same as the eye button.',
  ],
];

const MOUSE_HINTS = [
  [
    'Sequence this prop',
    'The stopwatch button beside a prop. A prop has to be sequenced before it can hold keyframes.',
  ],
  [
    'Right-click a keyframe',
    'Copy or delete it — there is no Delete key binding.',
  ],
  [
    'Toggle graph editor',
    'Button in the sequence editor; switches the dopesheet to editable curves.',
  ],
  [
    'Length',
    'Field in the sequence editor. Keyframes past it are kept, but play() stops at it.',
  ],
];

const PANEL_ID = 'get-wrecked-theatre-shortcuts';

function row([keys, description]) {
  return `<tr>
    <td style="padding:4px 14px 4px 0;white-space:nowrap;vertical-align:top">
      <code style="background:#0e1114;border:1px solid #2a3038;border-radius:4px;padding:2px 6px;color:#8ef7ff;font-size:11px">${keys}</code>
    </td>
    <td style="padding:4px 0;color:#c3cad3;vertical-align:top">${description}</td>
  </tr>`;
}

function section(title, rows) {
  return `<div style="margin-bottom:16px">
    <div style="color:#7d8794;text-transform:uppercase;letter-spacing:.08em;font-size:10px;margin-bottom:6px">${title}</div>
    <table style="border-collapse:collapse;width:100%">${rows.map(row).join('')}</table>
  </div>`;
}

function build() {
  const panel = document.createElement('div');
  panel.id = PANEL_ID;
  // Studio's own layers top out at 10000, so this clears them.
  panel.style.cssText = [
    'position:fixed',
    'top:50%',
    'left:50%',
    'transform:translate(-50%,-50%)',
    'z-index:20000',
    'width:min(560px,90vw)',
    'max-height:80vh',
    'overflow:auto',
    'background:#181c22',
    'border:1px solid #2a3038',
    'border-radius:8px',
    'box-shadow:0 18px 60px rgba(0,0,0,.6)',
    'padding:20px 22px',
    'font:12px/1.5 ui-sans-serif,system-ui,sans-serif',
    'color:#e6ebf0',
  ].join(';');

  panel.innerHTML = `
    <div style="display:flex;align-items:baseline;justify-content:space-between;margin-bottom:14px">
      <strong style="font-size:14px">Theatre shortcuts</strong>
      <span style="color:#7d8794;font-size:11px">Esc or the ? button to close</span>
    </div>
    ${section('Theatre studio', THEATRE_BINDINGS)}
    ${section('This scene', SCENE_BINDINGS)}
    ${section('Not keyboard — worth knowing', MOUSE_HINTS)}
  `;

  return panel;
}

// Escape closes it. The handler is bound only while the panel is open, so it
// never competes with anything else for the key — Theatre's own Space binding
// included.
let keyHandler = null;

function closePanel() {
  const panel = document.getElementById(PANEL_ID);
  if (panel) panel.remove();

  if (keyHandler) {
    document.removeEventListener('keydown', keyHandler);
    keyHandler = null;
  }
}

export default function toggleTheatreShortcuts() {
  if (typeof document === 'undefined') return;

  if (document.getElementById(PANEL_ID)) {
    closePanel();
    return;
  }

  document.body.appendChild(build());

  keyHandler = (event) => {
    if (event.key === 'Escape') closePanel();
  };
  document.addEventListener('keydown', keyHandler);
}
