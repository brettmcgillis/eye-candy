// html2canvas approximates font ascent/descent metrics rather than using the
// browser's own text layout engine, so short single-line text (date/version
// pills) can end up rendering a couple px lower in the capture than on screen —
// a residual gap that persists even with an explicit line-height. Nudge those
// elements back up, but only in html2canvas's cloned document (passed via its
// `onclone` option), so the live page is never touched.
const TEXT_NUDGE_PX = -2;
const NUDGE_SELECTOR = '.date-display, .version-tag';

// The recording indicator is a live-only cue for whoever's holding the camera —
// it shouldn't end up baked into the screenshot/video it's indicating. Strip it
// from the clone regardless of capture timing, rather than relying on the
// recorder happening to snapshot the overlay before the indicator turns on.
const RECORDING_INDICATOR_SELECTOR = '.debug.is-recording';

// Real browsers never paint <noscript> content once JS is running — it's a
// UA-level rule html2canvas's DOM-cloning doesn't replicate, so it renders the
// raw text as if it were normal content (index.html's fallback message,
// sitting in normal flow near the top of <body>, ends up as unstyled text
// overlapping whatever's positioned near the top-left).
const NOSCRIPT_SELECTOR = 'noscript';

export default function applyOverlayCaptureFixups(clonedDoc) {
  clonedDoc.querySelectorAll(NUDGE_SELECTOR).forEach((el) => {
    el.style.setProperty('position', 'relative');
    el.style.setProperty('top', `${TEXT_NUDGE_PX}px`);
  });

  clonedDoc.querySelectorAll(RECORDING_INDICATOR_SELECTOR).forEach((el) => {
    el.classList.remove('is-recording');
  });

  clonedDoc.querySelectorAll(NOSCRIPT_SELECTOR).forEach((el) => el.remove());
}
