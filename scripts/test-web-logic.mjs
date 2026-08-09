import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../PrecisionTyper/script.js', import.meta.url), 'utf8');
const storage = new Map();
const context = vm.createContext({
    console,
    document: { addEventListener() {} },
    window: {},
    localStorage: {
        getItem(key) { return storage.get(key) ?? null; },
        setItem(key, value) { storage.set(key, value); }
    }
});

vm.runInContext(
    `${source}\nglobalThis.__testExports = { FALLBACK_TEXT_DATABASE, normalizeTextDatabase, readStoredValue, writeStoredValue, PrecisionTyper };`,
    context
);

const { FALLBACK_TEXT_DATABASE, normalizeTextDatabase, PrecisionTyper } = context.__testExports;
const database = JSON.parse(fs.readFileSync(new URL('../PrecisionTyper/texts.json', import.meta.url), 'utf8'));
const normalized = normalizeTextDatabase(database);
assert.equal(normalized.difficulty.flat().length, 98);
assert.equal(Object.values(normalized.collections).flat().length, 36);
assert.equal(normalized.collections.quotes.every((passage) => passage.source.verified), true);

// Regression: a failed texts.json request must still provide usable built-in passages.
const fallbackNormalized = normalizeTextDatabase(FALLBACK_TEXT_DATABASE.difficulty);
const fallbackGame = Object.create(PrecisionTyper.prototype);
fallbackGame.TEXT_DATABASE = fallbackNormalized;
fallbackGame.difficultySelect = { value: '0' };
fallbackGame.collectionSelect = { value: 'general' };
fallbackGame.canvasSource = null;
fallbackGame.shuffleBags = {};
assert.ok(fallbackGame.getAvailablePassages().every((passage) => typeof passage.text === 'string'));
for (const collection of ['general', 'calm', 'quotes', 'code']) {
    fallbackGame.collectionSelect.value = collection;
    const passages = fallbackGame.getAvailablePassages();
    assert.ok(passages.length > 0, `${collection} fallback must not be empty`);
    assert.ok(passages.every((passage) => typeof passage.text === 'string'));
    assert.equal(fallbackGame.pickNewText(), true);
    assert.ok(fallbackGame.currentTargetText.length > 0, `${collection} fallback must open a passage`);
}

const renderGame = Object.create(PrecisionTyper.prototype);
renderGame.currentTargetText = 'non-blocking word';
renderGame.textDisplay = { classList: { add() {}, remove() {} }, textContent: '', innerHTML: '' };
renderGame.targetTextA11y = { textContent: '' };
renderGame.canvasProgress = { textContent: '' };
renderGame.inputArea = { selectionStart: 0 };
renderGame.updateTextStyles('');
assert.match(renderGame.textDisplay.innerHTML, /class="text-token"/);
assert.doesNotMatch(renderGame.textDisplay.innerHTML, /text-token-long/);

renderGame.currentTargetText = "document.querySelector('#input-area').focus();";
renderGame.updateTextStyles('');
assert.match(renderGame.textDisplay.innerHTML, /text-token-long/);
assert.match(renderGame.textDisplay.innerHTML, /soft-wrap-marker/);

const deckGame = Object.create(PrecisionTyper.prototype);
deckGame.collectionSelect = { value: 'general' };
deckGame.difficultySelect = { value: '0' };
deckGame.canvasSource = null;
deckGame.currentPassage = null;
deckGame.currentTargetText = '';
deckGame.shuffleBags = {};
const pool = normalized.difficulty[0].slice(0, 3);
deckGame.getAvailablePassages = () => pool;

const firstCycle = [];
for (let index = 0; index < pool.length; index++) {
    assert.equal(deckGame.pickNewText(), true);
    firstCycle.push(deckGame.currentPassage.id);
}
assert.equal(new Set(firstCycle).size, pool.length);

const lastOfFirstCycle = deckGame.currentPassage.id;
deckGame.pickNewText();
assert.notEqual(deckGame.currentPassage.id, lastOfFirstCycle);

// Regression: denied or full browser storage must never interrupt a session.
const blockedStorageContext = vm.createContext({
    console: { log() {}, warn() {}, error() {} },
    document: { addEventListener() {} },
    window: {},
    localStorage: {
        getItem() { throw new Error('Storage access denied'); },
        setItem() { throw new Error('Storage quota exceeded'); }
    }
});
vm.runInContext(
    `${source}\nglobalThis.__storageExports = { readStoredValue, writeStoredValue, PrecisionTyper };`,
    blockedStorageContext
);
const blocked = blockedStorageContext.__storageExports;
assert.equal(blocked.readStoredValue('missing', 'fallback'), 'fallback');
assert.equal(blocked.writeStoredValue('setting', 'value'), false);

const blockedGame = Object.create(blocked.PrecisionTyper.prototype);
blockedGame.shuffleBags = {};
assert.equal(Object.keys(blockedGame.loadShuffleBags()).length, 0);
assert.doesNotThrow(() => blockedGame.saveShuffleBags());

blockedGame.modeToggle = { checked: false };
blockedGame.soundToggle = { checked: true };
blockedGame.zenToggle = { checked: true };
blockedGame.difficultySelect = { value: '1' };
blockedGame.collectionSelect = { value: 'general' };
blockedGame.customPassages = { value: '' };
blockedGame.toggleTheme = () => {};
blockedGame.applyZenMode = () => {};
assert.doesNotThrow(() => blockedGame.loadSettings());
assert.doesNotThrow(() => blockedGame.saveSettings());

blockedGame.customPassages.value = 'Session-only passage';
blockedGame.customStatus = { textContent: '' };
blockedGame.resetGame = () => {};
assert.doesNotThrow(() => blockedGame.saveCustomPassages());
assert.match(blockedGame.customStatus.textContent, /session only/i);

console.log('Web passage, shuffle-bag, and storage-resilience tests passed.');
