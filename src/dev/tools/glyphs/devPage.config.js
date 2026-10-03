import { lazy } from 'react';

export default {
  slug: 'glyphs',
  aliases: ['Glyphic', 'fonts'],
  label: 'Glyphic',
  description: 'Design and fine-tune the generative glyph fontsets.',
  Component: lazy(() => import('./GlyphsWorkbenchPage')),
};
