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
    `${source}\nglobalThis.__testExports = { getTextDatabaseErrorMessage, normalizeTextDatabase, readStoredValue, writeStoredValue, SegmentedControl, PrecisionTyper };`,
    context
);

const {
    getTextDatabaseErrorMessage,
    normalizeTextDatabase,
    SegmentedControl,
    PrecisionTyper
} = context.__testExports;
const database = JSON.parse(fs.readFileSync(new URL('../PrecisionTyper/texts.json', import.meta.url), 'utf8'));
const normalized = normalizeTextDatabase(database);
const toEnglishKeyboardText = (text) => text
    .replace(/[“”]/gu, '"')
    .replace(/[‘’]/gu, "'")
    .replace(/[—–]/gu, '-');
assert.equal(
    JSON.stringify(Object.fromEntries(Object.entries(normalized.collections).map(([collection, levels]) => [
        collection,
        levels.map((passages) => passages.length)
    ]))),
    JSON.stringify({
        general: [40, 36, 22],
        calm: [15, 15, 15],
        quotes: [15, 15, 15],
        code: [15, 19, 15]
    })
);
assert.equal(normalized.collections.quotes.flat().every((passage) => passage.source.verified), true);
assert.equal(
    normalized.collections.quotes.flat().some((passage) => /[“”]/u.test(passage.text)),
    true,
    'Quote passages must preserve their original curly-quote typography'
);
assert.equal(normalized.collections.code[0].every((passage) => !passage.text.includes('\n')), true);
assert.equal(normalized.collections.code[2].every((passage) => passage.text.includes('\n')), true);
const gameIds = [...gameHtml.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
assert.equal(new Set(gameIds).size, gameIds.length, 'Game page IDs must be unique');
assert.match(gameHtml, /id="input-area"[\s\S]*id="session-settings-button"/);
assert.match(gameHtml, /id="session-settings-button"[\s\S]*aria-controls="session-controls"/);
assert.match(gameHtml, /aria-keyshortcuts="[^"]*Control\+ArrowLeft[^"]*Meta\+ArrowRight"/);
assert.equal((gameHtml.match(/name="collection"/g) || []).length, 4);
assert.equal((gameHtml.match(/name="difficulty"/g) || []).length, 3);
assert.match(gameHtml, /<fieldset[^>]+id="collection-options"/);
assert.match(gameHtml, /<fieldset[^>]+id="difficulty-options"/);
assert.doesNotMatch(gameHtml, /<select\b/);
assert.doesNotMatch(gameHtml, /value="custom"|custom-passages|save-custom/);
assert.doesNotMatch(source, /precisionTyperCustomPassages|saveCustomPassages|getCustomPassageList/);
assert.match(gameStyles, /\.segmented-option input:checked \+ span/);
assert.match(gameStyles, /\.segmented-option input:focus-visible \+ span/);
assert.doesNotMatch(gameHtml, /mode-toggle|Light Mode/);
assert.doesNotMatch(source, /modeToggle|toggleTheme|isLightMode/);
assert.doesNotMatch(gameStyles, /light-mode/);
assert.doesNotMatch(source, /FALLBACK_TEXT_DATABASE|using fallback passages/);
assert.match(gameStyles, /\.text-display\.is-load-error/);
assert.match(getTextDatabaseErrorMessage('file:'), /python3 -m http\.server 8000/);
assert.match(getTextDatabaseErrorMessage('https:'), /texts\.json/);
assert.throws(
    () => normalizeTextDatabase([[], [], []]),
    /schema version 3/
);
const incompleteDatabase = JSON.parse(JSON.stringify(database));
incompleteDatabase.collections.quotes.easy = [];
assert.throws(
    () => normalizeTextDatabase(incompleteDatabase),
    /quotes:easy/
);

// Segmented controls preserve select-like state access while using native radio inputs.
const segmentedInputs = [
    { value: 'general', checked: true, listeners: [], addEventListener(type) { this.listeners.push(type); }, focus() {} },
    { value: 'calm', checked: false, listeners: [], addEventListener(type) { this.listeners.push(type); }, focus() { testDocument.activeElement = this; } }
];
const segmentedControl = Object.create(SegmentedControl.prototype);
segmentedControl.inputs = segmentedInputs;
assert.equal(segmentedControl.value, 'general');
segmentedControl.value = 'calm';
assert.equal(segmentedControl.value, 'calm');
assert.equal(segmentedInputs[0].checked, false);
segmentedControl.addEventListener('change', () => {});
assert.deepEqual(segmentedInputs.map((input) => input.listeners), [['change'], ['change']]);
segmentedControl.focus();
assert.equal(testDocument.activeElement, segmentedInputs[1]);
assert.equal(segmentedControl.contains(segmentedInputs[1]), true);
testDocument.activeElement = null;

// Every collection uses its selected Difficulty pool.
const collectionGame = Object.create(PrecisionTyper.prototype);
collectionGame.TEXT_DATABASE = normalized;
collectionGame.collectionSelect = { value: 'code' };
collectionGame.difficultySelect = { value: '2' };
assert.equal(collectionGame.getAvailablePassages().length, 15);
assert.equal(collectionGame.getPassagePoolKey(), 'code:2');

// Built-in passages preserve smart typography while accepting standard English-keyboard keys.
const punctuationGame = Object.create(PrecisionTyper.prototype);
punctuationGame.collectionSelect = { value: 'quotes' };
assert.equal(punctuationGame.getTypingTargetText('Call me Ishmael.'), '“Call me Ishmael.”');
assert.equal(
    punctuationGame.getTypingTargetText('“Already quoted.”'),
    '“Already quoted.”'
);
punctuationGame.currentTargetText = '“I’ll wait—now.”';
punctuationGame.inputArea = { value: "\"I'll wait-now.\"" };
assert.equal(punctuationGame.getTypedText(), punctuationGame.currentTargetText);
assert.equal(punctuationGame.inputArea.value, "\"I'll wait-now.\"");

for (const [collection, levels] of Object.entries(normalized.collections)) {
    punctuationGame.collectionSelect.value = collection;
    for (const passage of levels.flat()) {
        punctuationGame.currentTargetText = punctuationGame.getTypingTargetText(passage.text);
        punctuationGame.inputArea.value = toEnglishKeyboardText(punctuationGame.currentTargetText);
        assert.match(
            punctuationGame.inputArea.value,
            /^[\n\x20-\x7e]+$/u,
            `${passage.id} must be typeable with standard English-keyboard characters`
        );
        assert.equal(
            punctuationGame.getTypedText(),
            punctuationGame.currentTargetText,
            `${passage.id} must match through its English-keyboard equivalents`
        );
        if (collection === 'quotes') {
            assert.match(punctuationGame.currentTargetText, /[“”]/u);
        }
    }
}
punctuationGame.collectionSelect.value = 'quotes';
punctuationGame.currentTargetText = '“I’ll wait—now.”';
punctuationGame.inputArea.value = "\"I'll wait-now.\"";
punctuationGame.isShowingCompletion = false;
let punctuationCompletions = 0;
punctuationGame.gameOver = () => { punctuationCompletions++; };
punctuationGame.handleEnterSubmit();
assert.equal(punctuationCompletions, 1);

punctuationGame.inputArea.value = punctuationGame.currentTargetText;
assert.equal(punctuationGame.getTypedText(), punctuationGame.currentTargetText);

punctuationGame.inputArea.value = "'I'll wait-now.'";
assert.notEqual(punctuationGame.getTypedText(), punctuationGame.currentTargetText);

punctuationGame.currentTargetText = 'const label = "ready";';
punctuationGame.inputArea.value = 'const label = "ready";';
assert.equal(punctuationGame.getTypedText(), punctuationGame.currentTargetText);

punctuationGame.currentTargetText = '“I’ll wait—now.”';
punctuationGame.inputArea.value = '';
punctuationGame.canvasPrompt = { textContent: '' };
punctuationGame.zenToggle = { checked: false };
testDocument.activeElement = punctuationGame.inputArea;
punctuationGame.updateCanvasPrompt();
assert.match(punctuationGame.canvasPrompt.textContent, /Use English keys/);

testDocument.activeElement = null;

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

// Tab from the typing capture deterministically focuses the settings entry point.
const tabGame = Object.create(PrecisionTyper.prototype);
let tabFocuses = 0;
let tabAnnouncements = 0;
tabGame.sessionSettingsButton = {
    focus(options) {
        tabFocuses++;
        assert.equal(options.preventScroll, true);
    }
};
tabGame.canvasPrompt = { textContent: '' };
tabGame.announce = () => { tabAnnouncements++; };
let tabPrevented = false;
tabGame.handleTypingTab({
    isComposing: false,
    shiftKey: false,
    ctrlKey: false,
    metaKey: false,
    altKey: false,
    preventDefault() { tabPrevented = true; }
});
assert.equal(tabPrevented, true);
assert.equal(tabFocuses, 1);
assert.equal(tabAnnouncements, 1);
assert.match(tabGame.canvasPrompt.textContent, /Press Enter to open session settings/);

tabPrevented = false;
tabGame.handleTypingTab({
    isComposing: false,
    shiftKey: true,
    ctrlKey: false,
    metaKey: false,
    altKey: false,
    preventDefault() { tabPrevented = true; }
});
assert.equal(tabPrevented, false);
assert.equal(tabFocuses, 1);

// Settings focus traversal is explicit so Safari does not depend on its native Tab preference.
const settingsTabGame = Object.create(PrecisionTyper.prototype);
const collectionRadio = { name: 'collection' };
const difficultyRadio = { name: 'difficulty' };
const focusOrder = [];
let settingsTabCloses = 0;
let settingsTabPreventions = 0;
settingsTabGame.collectionSelect = {
    contains(element) { return element === collectionRadio; },
    focus() {
        focusOrder.push('collection');
        testDocument.activeElement = collectionRadio;
    }
};
settingsTabGame.difficultySelect = {
    contains(element) { return element === difficultyRadio; },
    focus() {
        focusOrder.push('difficulty');
        testDocument.activeElement = difficultyRadio;
    }
};
settingsTabGame.soundToggle = {
    contains(element) { return element === this; },
    focus() {
        focusOrder.push('sound');
        testDocument.activeElement = this;
    }
};
settingsTabGame.zenToggle = {
    contains(element) { return element === this; },
    focus() {
        focusOrder.push('zen');
        testDocument.activeElement = this;
    }
};
settingsTabGame.closeSessionSettings = () => { settingsTabCloses++; };
const moveSettingsFocus = (shiftKey = false) => settingsTabGame.handleSessionSettingsTab({
    isComposing: false,
    ctrlKey: false,
    metaKey: false,
    altKey: false,
    shiftKey,
    preventDefault() { settingsTabPreventions++; }
});

testDocument.activeElement = collectionRadio;
moveSettingsFocus();
assert.equal(testDocument.activeElement, difficultyRadio);
moveSettingsFocus();
assert.equal(testDocument.activeElement, settingsTabGame.soundToggle);
moveSettingsFocus();
assert.equal(testDocument.activeElement, settingsTabGame.zenToggle);
moveSettingsFocus();
assert.equal(settingsTabCloses, 1);
assert.deepEqual(focusOrder, ['difficulty', 'sound', 'zen']);

testDocument.activeElement = collectionRadio;
moveSettingsFocus(true);
assert.equal(settingsTabCloses, 2);
assert.equal(settingsTabPreventions, 5);

testDocument.activeElement = null;
moveSettingsFocus();
assert.equal(testDocument.activeElement, collectionRadio);
assert.equal(settingsTabPreventions, 6);

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

// Passage navigation is document-scoped so it works even when a collection radio retains focus.
const navigationGame = Object.create(PrecisionTyper.prototype);
navigationGame.isSettingsMode = false;
navigationGame.isShowingCompletion = false;
let nextNavigations = 0;
let previousNavigations = 0;
let navigationPreventions = 0;
navigationGame.skipPassage = () => { nextNavigations++; };
navigationGame.previousPassage = () => { previousNavigations++; };
const navigationEvent = {
    key: 'ArrowRight',
    ctrlKey: false,
    metaKey: true,
    isComposing: false,
    target: { type: 'radio' },
    preventDefault() { navigationPreventions++; }
};
assert.equal(navigationGame.handlePassageNavigation(navigationEvent), true);
assert.equal(nextNavigations, 1);
navigationEvent.key = 'ArrowLeft';
navigationEvent.ctrlKey = true;
navigationEvent.metaKey = false;
assert.equal(navigationGame.handlePassageNavigation(navigationEvent), true);
assert.equal(previousNavigations, 1);
assert.equal(navigationPreventions, 2);
navigationEvent.ctrlKey = false;
assert.equal(navigationGame.handlePassageNavigation(navigationEvent), false);

navigationGame.isSettingsMode = true;
navigationEvent.ctrlKey = true;
assert.equal(navigationGame.handlePassageNavigation(navigationEvent), true);
assert.equal(previousNavigations, 2);

// Zen keeps evaluative chrome hidden across idle, typing, completion, and passage changes.
bodyClasses.clear();
const zenChromeGame = Object.create(PrecisionTyper.prototype);
zenChromeGame.isSettingsMode = false;
zenChromeGame.isFocusMode = false;
zenChromeGame.zenToggle = { checked: true };
zenChromeGame.gameToolbar = {
    inert: false,
    setAttribute(name, value) { this[name] = value; }
};
for (const state of [
    { isGameRunning: false, isShowingCompletion: false },
    { isGameRunning: true, isShowingCompletion: false },
    { isGameRunning: false, isShowingCompletion: true }
]) {
    Object.assign(zenChromeGame, state);
    zenChromeGame.syncChromeVisibility();
    assert.equal(bodyClasses.has('zen-active'), true);
    assert.equal(zenChromeGame.gameToolbar.inert, true);
    assert.equal(zenChromeGame.gameToolbar['aria-hidden'], 'true');
}

zenChromeGame.isSettingsMode = true;
zenChromeGame.syncChromeVisibility();
assert.equal(bodyClasses.has('zen-active'), true);
assert.equal(zenChromeGame.gameToolbar.inert, false);
assert.equal(zenChromeGame.gameToolbar['aria-hidden'], 'false');

zenChromeGame.isSettingsMode = false;
zenChromeGame.zenToggle.checked = false;
zenChromeGame.syncChromeVisibility();
assert.equal(bodyClasses.has('zen-active'), false);
assert.equal(zenChromeGame.gameToolbar.inert, false);
assert.equal(zenChromeGame.gameToolbar['aria-hidden'], 'false');

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

// Every collection and difficulty behaves as a fixed, bidirectional circular deck.
for (const [collection, levels] of Object.entries(normalized.collections)) {
    for (const [difficulty, pool] of levels.entries()) {
        const deckGame = Object.create(PrecisionTyper.prototype);
        deckGame.collectionSelect = { value: collection };
        deckGame.difficultySelect = { value: String(difficulty) };
        deckGame.canvasSource = null;
        deckGame.currentPassage = null;
        deckGame.currentTargetText = '';
        deckGame.passageDecks = {};
        deckGame.savePassageDecks = () => {};
        deckGame.getAvailablePassages = () => pool;

        const firstCycle = [];
        for (let index = 0; index < pool.length; index++) {
            assert.equal(deckGame.pickNewText(), true);
            firstCycle.push(deckGame.currentPassage.id);
        }
        assert.equal(new Set(firstCycle).size, pool.length, `${collection}:${difficulty} must exhaust its deck`);

        assert.equal(deckGame.pickNewText(), true);
        assert.equal(deckGame.currentPassage.id, firstCycle[0], `${collection}:${difficulty} must wrap forward`);
        assert.equal(deckGame.pickPreviousText(), true);
        assert.equal(deckGame.currentPassage.id, firstCycle.at(-1), `${collection}:${difficulty} must wrap backward`);
    }
}

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
blockedGame.passageDecks = {};
assert.equal(Object.keys(blockedGame.loadPassageDecks()).length, 0);
assert.doesNotThrow(() => blockedGame.savePassageDecks());

blockedGame.soundToggle = { checked: true };
blockedGame.zenToggle = { checked: true };
blockedGame.difficultySelect = { value: '1' };
blockedGame.collectionSelect = { value: 'general' };
blockedGame.applyZenMode = () => {};
assert.doesNotThrow(() => blockedGame.loadSettings());
assert.doesNotThrow(() => blockedGame.saveSettings());

console.log('Web passage, circular-deck, and storage-resilience tests passed.');
