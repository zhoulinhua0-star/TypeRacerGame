import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

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
assert.match(html, /temporary <strong>·<\/strong> marks the next required space/);
assert.match(html, /<kbd>Enter<\/kbd><span>Check the passage<\/span>/);
assert.match(html, /Ctrl\/Cmd \+ ← \/ →<\/kbd><\/dt><dd>Move to the previous or next passage/);
assert.match(html, /Reach Session settings from the canvas/);
assert.match(html, /Return to the typing canvas/);
assert.match(html, /Multiline code practice/);
assert.doesNotMatch(html, /Light Mode|Dark &amp; light themes/);

assert.match(css, /\.guide-trigger\s*\{/);
assert.match(css, /\.guide-dialog\.is-visible\s*\{/);
assert.match(css, /@media \(max-width: 480px\)/);

assert.match(javascript, /event\.key === '\?'/);
assert.match(javascript, /event\.key === 'Escape'/);
assert.match(javascript, /event\.key === 'Tab'/);
assert.match(javascript, /element\.inert = isInert/);
assert.match(javascript, /previouslyFocused\.focus\(\)/);

// The guide owns its Tab order so Safari cannot skip its button or link.
const documentListeners = new Map();
const guideTrigger = {
    addEventListener() {},
    setAttribute() {},
    focus() {}
};
const guideCloseButton = {
    hidden: false,
    focus() { testDocument.activeElement = this; }
};
const guideStartLink = {
    hidden: false,
    focus() { testDocument.activeElement = this; }
};
const guideCard = {
    querySelectorAll() { return [guideCloseButton, guideStartLink]; }
};
const guideDialog = {
    hidden: false,
    querySelector(selector) {
        if (selector === '.guide-card') return guideCard;
        if (selector === '.guide-close') return guideCloseButton;
        return null;
    },
    querySelectorAll() { return []; }
};
const testDocument = {
    activeElement: guideCloseButton,
    body: { classList: { add() {}, remove() {} } },
    addEventListener(type, listener) { documentListeners.set(type, listener); },
    getElementById(id) {
        if (id === 'keyboard-guide-trigger') return guideTrigger;
        if (id === 'keyboard-guide') return guideDialog;
        return null;
    },
    querySelector() { return null; },
    querySelectorAll() { return []; }
};
vm.runInNewContext(javascript, {
    document: testDocument,
    window: {
        matchMedia() { return { matches: true }; },
        clearTimeout() {},
        requestAnimationFrame(callback) { callback(); return 1; },
        cancelAnimationFrame() {}
    }
});
documentListeners.get('DOMContentLoaded')();

let guideTabPreventions = 0;
const pressGuideTab = (shiftKey = false) => documentListeners.get('keydown')({
    key: 'Tab',
    shiftKey,
    preventDefault() { guideTabPreventions++; }
});

pressGuideTab();
assert.equal(testDocument.activeElement, guideStartLink);
pressGuideTab();
assert.equal(testDocument.activeElement, guideCloseButton);
pressGuideTab(true);
assert.equal(testDocument.activeElement, guideStartLink);
testDocument.activeElement = null;
pressGuideTab();
assert.equal(testDocument.activeElement, guideCloseButton);
assert.equal(guideTabPreventions, 4);

console.log('Landing-page keyboard guide checks passed.');
