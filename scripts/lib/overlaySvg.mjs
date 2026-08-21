/* eslint-disable import/no-extraneous-dependencies */
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { GiInkSwirl } from 'react-icons/gi';

// A burn-in of src/app/scaffold/overlay/Overlay.jsx for headless video and
// stills. Values below are lifted from src/styles/tokens.css and global.css;
// the icons are the same react-icons components the app mounts, rendered to
// SVG markup here instead of to the DOM.

const FONT_STACK =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const PANEL_BG = '#ffffff';
const PANEL_FG = '#000000';
const ICON_SIZE = 17.5;
const LOGO_ASPECT = 294 / 215;

// Which branch of the app's CSS applies is decided by the emulated viewport
// width, exactly like the `max-width: 900px` media query it mirrors — not by
// whether an IG preset was passed. The IG safe-area offsets only exist inside
// that mobile branch, so they're applied only when it's the one in play.
const MOBILE_BREAKPOINT = 900;
// CSS viewport of a vertical iPhone (12/13/14/15/16): 1170x2532 device pixels
// at DPR 3. Emulating this is the whole point of rendering at those dimensions,
// and it's what makes the overlay come out the size it is on the phone.
const PHONE_VIEWPORT = 390;
const DESKTOP_VIEWPORT = 1440;

const LAYOUTS = {
  desktop: { font: 14, inset: 70, padX: 14, padY: 14, radius: 28 },
  mobile: { font: 13, inset: 16, padX: 11.05, padY: 8.45, radius: 20.8 },
};

const IG_OFFSETS = {
  post: { bottom: 80, top: 80 },
  reel: { bottom: 64, top: 52 },
  story: { bottom: 64, top: 52 },
};

function escapeXml(value) {
  return String(value).replace(
    /[<>&'"]/g,
    (c) =>
      ({
        '"': '&quot;',
        '&': '&amp;',
        "'": '&apos;',
        '<': '&lt;',
        '>': '&gt;',
      })[c]
  );
}

// Exact ink width rather than a per-character estimate: render the string
// alone on transparency and let sharp trim to its bounding box. Only the four
// fixed strings are ever measured, once per run, so the cost is irrelevant.
async function measureText(text, fontSize) {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="4000" height="${fontSize * 4}">` +
    `<text x="20" y="${fontSize * 2}" font-family="${FONT_STACK}" ` +
    `font-size="${fontSize}" font-weight="600" fill="#ffffff">${escapeXml(text)}</text>` +
    `</svg>`;

  const { info } = await sharp(Buffer.from(svg))
    .trim()
    .png()
    .toBuffer({ resolveWithObject: true });
  return info.width;
}

// react-icons already emits width/height from `size`, so nothing here needs
// rewriting — an earlier version tried to and clobbered `stroke-width` on
// outline icons, since "stroke-width" ends in "width".
function iconMarkup(Component, size, color) {
  return renderToStaticMarkup(React.createElement(Component, { color, size }));
}

function placeIcon(markup, x, y, size) {
  return markup.replace(
    /^<svg /,
    `<svg x="${x.toFixed(2)}" y="${(y - size / 2).toFixed(2)}" `
  );
}

function panel(x, y, width, height, radius, content, anchor) {
  const left = anchor === 'right' ? x - width : x;
  return (
    `<g filter="url(#overlayShadow)">` +
    `<rect x="${left.toFixed(2)}" y="${y.toFixed(2)}" width="${width.toFixed(2)}" ` +
    `height="${height.toFixed(2)}" rx="${radius.toFixed(2)}" fill="${PANEL_BG}"/>` +
    `</g>${content(left)}`
  );
}

function textPanel({ anchor, font, layout, text, textWidth, x, y }) {
  const width = textWidth + layout.padX * 2;
  const height = font * 1.35 + layout.padY * 2;
  const content = (left) =>
    `<text x="${(left + layout.padX).toFixed(2)}" y="${(y + height / 2).toFixed(2)}" ` +
    `font-family="${FONT_STACK}" font-size="${font}" font-weight="600" ` +
    `fill="${PANEL_FG}" dominant-baseline="central">${escapeXml(text)}</text>`;

  return {
    height,
    svg: panel(x, y, width, height, layout.radius, content, anchor),
    width,
  };
}

// The app's Scenemoji, in its Showcase form: the Reversal mark, an em-dash,
// then the scene icon. Deliberately omits the area icon — in the live app that
// slot carries a wrench for WIP scenes, and a burned-in wrench would mark a
// posted image as unfinished work. Scenemoji.jsx renders exactly this shape
// when AREA_ICONS has no icon for the area, which is the Showcase case.
async function scenemojiPanel({ font, layout, logoDataUri, x, y }) {
  const logoHeight = ICON_SIZE * 1.4;
  const logoWidth = logoHeight * LOGO_ASPECT;
  const sceneSize = 26;
  const gap = font * 0.45;
  const dashWidth = await measureText('—', font);

  const width = layout.padX * 2 + logoWidth + sceneSize + dashWidth + gap * 2;
  const height = Math.max(sceneSize, logoHeight) + layout.padY * 2;
  const midY = y + height / 2;

  const content = (left) => {
    const parts = [];
    let cursor = left + layout.padX;

    parts.push(
      `<image x="${cursor.toFixed(2)}" y="${(midY - logoHeight / 2).toFixed(2)}" ` +
        `width="${logoWidth.toFixed(2)}" height="${logoHeight.toFixed(2)}" ` +
        `href="${logoDataUri}"/>`
    );
    cursor += logoWidth + gap;

    parts.push(
      `<text x="${(cursor + dashWidth / 2).toFixed(2)}" y="${midY.toFixed(2)}" ` +
        `font-family="${FONT_STACK}" font-size="${font}" font-weight="600" ` +
        `fill="${PANEL_FG}" text-anchor="middle" dominant-baseline="central">—</text>`
    );
    cursor += dashWidth + gap;

    parts.push(
      placeIcon(
        iconMarkup(GiInkSwirl, sceneSize, PANEL_FG),
        cursor,
        midY,
        sceneSize
      )
    );

    return parts.join('');
  };

  return {
    height,
    svg: panel(x, y, width, height, layout.radius, content, 'left'),
    width,
  };
}

function formatDate(date) {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}.${month}.${date.getFullYear()}`;
}

// Returns an SVG the caller composites over a rendered frame. `viewport` is the
// CSS pixel width being emulated; the output width divided by it is the device
// pixel ratio the overlay is drawn at.
export default async function overlaySvg({
  date = new Date(),
  height,
  ig = null,
  repoRoot,
  version = '0.0.0',
  viewport = null,
  width,
}) {
  // The overlay is laid out in CSS pixels and the whole group is then scaled by
  // the device-pixel ratio the output implies — width / viewport. Scaling off
  // the raw output size instead (the previous `min(w,h)/1080`) drew a phone
  // export at roughly 1x, so every chip came out about a third of the size it
  // is on the device and the insets shrank to match.
  const cssWidth = viewport ?? (ig ? PHONE_VIEWPORT : DESKTOP_VIEWPORT);
  const zoom = width / cssWidth;
  const isMobile = cssWidth <= MOBILE_BREAKPOINT;
  const layout = isMobile ? LAYOUTS.mobile : LAYOUTS.desktop;
  const preset = isMobile && IG_OFFSETS[ig] ? ig : null;
  const { font } = layout;

  const logo = await readFile(
    path.join(repoRoot, 'public/icons/reversal-inner.png')
  );
  const logoDataUri = `data:image/png;base64,${logo.toString('base64')}`;

  const offsets = preset ? IG_OFFSETS[preset] : { bottom: 0, top: 0 };
  const topInset = layout.inset + offsets.top;
  const bottomInset = layout.inset + offsets.bottom;

  const versionText = `v. ${version}`;
  const nameText = 'Brett McGillis';
  const dateText = formatDate(date);

  const [versionWidth, nameWidth, dateWidth] = await Promise.all([
    measureText(versionText, font),
    measureText(nameText, font),
    measureText(dateText, font),
  ]);

  // Laid out in unscaled CSS pixels, then the whole group is scaled — the same
  // geometry the browser lays out, just sampled at the export resolution.
  const boardWidth = width / zoom;
  const boardHeight = height / zoom;

  const topLeft = await scenemojiPanel({
    font,
    layout,
    logoDataUri,
    x: layout.inset,
    y: topInset,
  });
  const topRight = textPanel({
    anchor: 'right',
    font,
    layout,
    text: versionText,
    textWidth: versionWidth,
    x: boardWidth - layout.inset,
    y: topInset,
  });
  const bottomLeftHeight = font * 1.35 + layout.padY * 2;
  const bottomLeft = textPanel({
    anchor: 'left',
    font,
    layout,
    text: nameText,
    textWidth: nameWidth,
    x: layout.inset,
    y: boardHeight - bottomInset - bottomLeftHeight,
  });
  const bottomRight = textPanel({
    anchor: 'right',
    font,
    layout,
    text: dateText,
    textWidth: dateWidth,
    x: boardWidth - layout.inset,
    y: boardHeight - bottomInset - bottomLeftHeight,
  });

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" ` +
    `width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">` +
    `<defs><filter id="overlayShadow" x="-50%" y="-50%" width="200%" height="200%">` +
    `<feDropShadow dx="0" dy="0" stdDeviation="10" flood-color="#888888" flood-opacity="0.9"/>` +
    `</filter></defs>` +
    `<g transform="scale(${zoom})">${topLeft.svg}${topRight.svg}${
      bottomLeft.svg
    }${bottomRight.svg}</g></svg>`
  );
}
