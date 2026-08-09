import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [html, css, javascript] = await Promise.all([
    readFile(new URL('../PrecisionTyper/index.html', import.meta.url), 'utf8'),
    readFile(new URL('../PrecisionTyper/website.css', import.meta.url), 'utf8'),
    readFile(new URL('../PrecisionTyper/website.js', import.meta.url), 'utf8')
]);

const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
assert.equal(new Set(ids).size, ids.length, 'Landing page IDs must be unique');

assert.match(html, /id="keyboard-guide-trigger"[\s\S]*?aria-controls="keyboard-guide"/);
assert.match(html, /id="keyboard-guide-trigger"[\s\S]*?aria-keyshortcuts="\?"/);
assert.match(html, /id="keyboard-guide" hidden/);
assert.match(html, /role="dialog" aria-modal="true"/);
assert.ok((html.match(/data-guide-close/g) || []).length >= 2, 'Guide needs close and backdrop controls');
assert.match(html, /Normal visual line wraps never require/);
assert.match(html, /<kbd>Enter<\/kbd><span>Check the passage<\/span>/);
assert.match(html, /Reach Session settings from the canvas/);
assert.match(html, /Return to the typing canvas/);

assert.match(css, /\.guide-trigger\s*\{/);
assert.match(css, /\.guide-dialog\.is-visible\s*\{/);
assert.match(css, /@media \(max-width: 480px\)/);

assert.match(javascript, /event\.key === '\?'/);
assert.match(javascript, /event\.key === 'Escape'/);
assert.match(javascript, /event\.key === 'Tab'/);
assert.match(javascript, /element\.inert = isInert/);
assert.match(javascript, /previouslyFocused\.focus\(\)/);

console.log('Landing-page keyboard guide checks passed.');
