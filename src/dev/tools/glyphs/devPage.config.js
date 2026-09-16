import { lazy } from 'react';

export default {
  slug: 'glyphs',
  aliases: ['Glyphic', 'fonts'],
  label: 'Glyphic',
  description: 'Design and fine-tune the generative glyph fontsets.',
  order: 60,
  Component: lazy(() => import('./GlyphsWorkbenchPage')),
};
