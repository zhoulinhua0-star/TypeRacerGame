import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../PrecisionTyper/script.js', import.meta.url), 'utf8');
const gameHtml = fs.readFileSync(new URL('../PrecisionTyper/game.html', import.meta.url), 'utf8');
const gameStyles = fs.readFileSync(new URL('../PrecisionTyper/styles.css', import.meta.url), 'utf8');
const storage = new Map();
const bodyClasses = new Set();
const animationFrames = [];
const testDocument = {
    activeElement: null,
    addEventListener() {},
    body: {
        classList: {
            add(value) { bodyClasses.add(value); },
            remove(value) { bodyClasses.delete(value); },
            toggle(value, enabled) {
                if (enabled) bodyClasses.add(value);
                else bodyClasses.delete(value);
            }
        }
    }
};
const context = vm.createContext({
    console,
    document: testDocument,
    window: {
        requestAnimationFrame(callback) {
            animationFrames.push(callback);
            return animationFrames.length;
        }
    },
    localStorage: {
        getItem(key) { return storage.get(key) ?? null; },
        setItem(key, value) { storage.set(key, value); }
    }
});
const runNextAnimationFrame = () => {
    const callback = animationFrames.shift();
    assert.ok(callback, 'Expected a queued animation frame');
    callback(0);
};

vm.runInContext(
    `${source}\nglobalThis.__testExports = { FALLBACK_TEXT_DATABASE, normalizeTextDatabase, readStoredValue, writeStoredValue, PrecisionTyper };`,
    context
);

const {
    FALLBACK_TEXT_DATABASE,
    normalizeTextDatabase,
    PrecisionTyper
} = context.__testExports;
const database = JSON.parse(fs.readFileSync(new URL('../PrecisionTyper/texts.json', import.meta.url), 'utf8'));
const normalized = normalizeTextDatabase(database);
assert.equal(normalized.difficulty.flat().length, 98);
assert.equal(Object.values(normalized.collections).flat().length, 42);
assert.equal(normalized.collections.quotes.every((passage) => passage.source.verified), true);
assert.equal(normalized.collections.code.filter((passage) => passage.text.includes('\n')).length, 6);
const gameIds = [...gameHtml.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
assert.equal(new Set(gameIds).size, gameIds.length, 'Game page IDs must be unique');
assert.match(gameHtml, /id="input-area"[\s\S]*id="session-settings-button"/);
assert.match(gameHtml, /id="session-settings-button"[\s\S]*aria-controls="session-controls"/);
assert.match(gameHtml, /aria-keyshortcuts="\/ Enter Control\+Enter Meta\+Enter"/);
assert.doesNotMatch(gameHtml, /mode-toggle|Light Mode/);
assert.doesNotMatch(source, /modeToggle|toggleTheme|isLightMode/);
assert.doesNotMatch(gameStyles, /light-mode/);

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

renderGame.currentTargetText = 'word next';
renderGame.inputArea.selectionStart = 4;
renderGame.updateTextStyles('word');
assert.match(renderGame.textDisplay.innerHTML, /char-cursor text-space text-space-visible/);

renderGame.inputArea.selectionStart = 5;
renderGame.updateTextStyles('word ');
assert.doesNotMatch(renderGame.textDisplay.innerHTML, /text-space-visible/);

renderGame.updateTextStyles('wordx');
assert.match(renderGame.textDisplay.innerHTML, /char-wrong text-space text-space-visible/);

// Enter checks by default, but preserves a real newline when the target expects one.
const enterGame = Object.create(PrecisionTyper.prototype);
enterGame.currentTargetText = 'first\nsecond';
enterGame.inputArea = { value: 'first', selectionStart: 5 };
let checks = 0;
enterGame.handleEnterSubmit = () => { checks++; };
let prevented = false;
enterGame.handleTypingEnter({
    ctrlKey: false,
    metaKey: false,
    isComposing: false,
    preventDefault() { prevented = true; }
});
assert.equal(prevented, false);
assert.equal(checks, 0);

enterGame.inputArea.selectionStart = 2;
enterGame.handleTypingEnter({
    ctrlKey: false,
    metaKey: false,
    isComposing: false,
    preventDefault() { prevented = true; }
});
assert.equal(prevented, true);
assert.equal(checks, 1);

prevented = false;
enterGame.inputArea.selectionStart = 5;
enterGame.handleTypingEnter({
    ctrlKey: true,
    metaKey: false,
    isComposing: false,
    preventDefault() { prevented = true; }
});
assert.equal(prevented, true);
assert.equal(checks, 2);

const mismatchGame = Object.create(PrecisionTyper.prototype);
mismatchGame.isShowingCompletion = false;
mismatchGame.currentTargetText = 'target';
mismatchGame.inputArea = { value: 'typo' };
mismatchGame.zenToggle = { checked: true };
let gentleFeedback = 0;
let shakes = 0;
mismatchGame.showGentleMismatchFeedback = () => { gentleFeedback++; };
mismatchGame.triggerMismatchShake = () => { shakes++; };
mismatchGame.announce = () => {};
mismatchGame.handleEnterSubmit();
assert.equal(gentleFeedback, 1);
assert.equal(shakes, 0);

mismatchGame.zenToggle.checked = false;
mismatchGame.handleEnterSubmit();
assert.equal(gentleFeedback, 1);
assert.equal(shakes, 1);

// Session settings reuse native controls and restore an active Focus view on exit.
bodyClasses.clear();
bodyClasses.add('focus-mode');
const settingsGame = Object.create(PrecisionTyper.prototype);
settingsGame.isSettingsMode = false;
settingsGame.isShowingCompletion = false;
settingsGame.isFocusMode = true;
settingsGame.isGameRunning = true;
settingsGame.zenToggle = { checked: true };
settingsGame.gameToolbar = {
    inert: true,
    setAttribute(name, value) { this[name] = value; }
};
let settingsButtonFocused = 0;
settingsGame.sessionSettingsButton = {
    focus() { settingsButtonFocused++; }
};
settingsGame.inputArea = { disabled: false };
let settingsFocused = 0;
let canvasFocused = 0;
let canvasScrolled = 0;
settingsGame.collectionSelect = {
    focus() {
        settingsFocused++;
        if (settingsFocused > 1) {
            testDocument.activeElement = this;
        }
    }
};
settingsGame.typingCanvas = { scrollIntoView() { canvasScrolled++; } };
settingsGame.focusInput = () => { canvasFocused++; };
settingsGame.announce = () => {};

settingsGame.openSessionSettings();
assert.equal(settingsGame.isSettingsMode, true);
assert.equal(settingsFocused, 0);
assert.equal(settingsGame.gameToolbar.inert, false);
assert.equal(bodyClasses.has('settings-active'), true);
assert.equal(bodyClasses.has('focus-mode'), false);
runNextAnimationFrame();
assert.equal(settingsFocused, 1);
assert.notEqual(testDocument.activeElement, settingsGame.collectionSelect);
runNextAnimationFrame();
assert.equal(settingsFocused, 2);
assert.equal(testDocument.activeElement, settingsGame.collectionSelect);

settingsGame.closeSessionSettings();
assert.equal(settingsGame.isSettingsMode, false);
assert.equal(canvasFocused, 1);
assert.equal(canvasScrolled, 1);
assert.equal(settingsGame.gameToolbar.inert, true);
assert.equal(bodyClasses.has('settings-active'), false);
assert.equal(bodyClasses.has('focus-mode'), true);

settingsGame.focusButton = {
    setAttribute(name, value) { this[name] = value; }
};
settingsGame.focusButtonLabel = { textContent: '' };
testDocument.activeElement = null;
settingsGame.openSessionSettings();
runNextAnimationFrame();
settingsGame.setFocusMode(false);
assert.equal(settingsGame.isSettingsMode, false);
assert.equal(settingsGame.isFocusMode, false);
assert.equal(bodyClasses.has('settings-active'), false);
assert.equal(bodyClasses.has('focus-mode'), false);

settingsGame.inputArea.disabled = true;
settingsGame.openSessionSettings();
settingsGame.closeSessionSettings();
runNextAnimationFrame();
assert.equal(settingsButtonFocused, 1);

// Every canvas-return path closes settings before it focuses the typing input.
const returnGame = Object.create(PrecisionTyper.prototype);
returnGame.isSettingsMode = true;
returnGame.inputArea = { disabled: false };
let returnCloses = 0;
let returnFocuses = 0;
let returnAnnouncements = 0;
returnGame.closeSessionSettings = () => {
    returnCloses++;
    returnGame.isSettingsMode = false;
};
returnGame.focusInput = () => { returnFocuses++; };
returnGame.announce = () => { returnAnnouncements++; };

returnGame.returnToTyping();
assert.equal(returnCloses, 1);
assert.equal(returnFocuses, 0);
assert.equal(returnAnnouncements, 0);

returnGame.returnToTyping();
assert.equal(returnCloses, 1);
assert.equal(returnFocuses, 1);
assert.equal(returnAnnouncements, 1);
assert.ok((source.match(/this\.returnToTyping\(\);/g) || []).length >= 3);

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

blockedGame.soundToggle = { checked: true };
blockedGame.zenToggle = { checked: true };
blockedGame.difficultySelect = { value: '1' };
blockedGame.collectionSelect = { value: 'general' };
blockedGame.customPassages = { value: '' };
blockedGame.applyZenMode = () => {};
assert.doesNotThrow(() => blockedGame.loadSettings());
assert.doesNotThrow(() => blockedGame.saveSettings());

blockedGame.customPassages.value = 'Session-only passage';
blockedGame.customStatus = { textContent: '' };
blockedGame.resetGame = () => {};
assert.doesNotThrow(() => blockedGame.saveCustomPassages());
assert.match(blockedGame.customStatus.textContent, /session only/i);

console.log('Web passage, shuffle-bag, and storage-resilience tests passed.');
