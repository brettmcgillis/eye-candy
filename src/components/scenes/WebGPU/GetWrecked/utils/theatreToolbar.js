import { isAppUiHidden, setAppUiHidden } from './appUi';
import toggleTheatreShortcuts from './theatreShortcuts';

// Two buttons in the studio's global toolbar.
//
// The eye: hiding the app UI also hides Leva, which is where the Drive Scene
// toggle lives — so without a way back you'd be stuck in the sequencer. Studio
// renders its own root outside the overlay, so it stays visible while the app
// UI is hidden and can host the way back. Shift+H still works too.
//
// The question mark: Theatre ships no shortcut reference, and its bindings are
// not discoverable from the UI at all (Space for play/pause being the one that
// costs everyone an afternoon). See theatreShortcuts.js.
const HELP_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12" y2="17"/></svg>`;

const EYE_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;

let registered = false;

export default function registerTheatreUiToolbar(studio) {
  if (registered || !studio) return;
  registered = true;

  studio.extend({
    id: 'get-wrecked-app-ui',
    toolbars: {
      global(set) {
        set([
          {
            type: 'Icon',
            svgSource: EYE_SVG,
            title: 'Toggle app UI (Shift+H)',
            onClick: () => setAppUiHidden(!isAppUiHidden()),
          },
          {
            type: 'Icon',
            svgSource: HELP_SVG,
            title: 'Theatre shortcuts',
            onClick: () => toggleTheatreShortcuts(),
          },
        ]);

        return () => {};
      },
    },
  });
}
