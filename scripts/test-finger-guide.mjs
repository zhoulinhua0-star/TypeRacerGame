import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

let now = 2000;
let reducedMotion = true;
const timers = new Map();
const intervals = new Map();
let nextTimer = 1;
const classList = () => {
    const values = new Set();
    return { add: (name) => values.add(name), remove: (name) => values.delete(name), contains: (name) => values.has(name) };
};
const context = vm.createContext({
    console,
    document: { addEventListener() {}, body: { classList: classList() } },
    performance: { now: () => now },
    window: {
        matchMedia: () => ({ matches: reducedMotion }),
        setTimeout(callback) { const id = nextTimer++; timers.set(id, callback); return id; },
        clearTimeout: (id) => timers.delete(id)
    },
    setInterval(callback) { const id = nextTimer++; intervals.set(id, callback); return id; },
    clearInterval: (id) => intervals.delete(id)
});
const guideSource = fs.readFileSync(new URL('../PrecisionTyper/finger-guide.js', import.meta.url), 'utf8');
const gameSource = fs.readFileSync(new URL('../PrecisionTyper/script.js', import.meta.url), 'utf8');
vm.runInContext(`${guideSource}\n${gameSource}\nglobalThis.exports = { FingerGuide, FINGER_MAPPING, PrecisionTyper };`, context);
const { FingerGuide, FINGER_MAPPING, PrecisionTyper } = context.exports;

assert.equal(Object.keys(FINGER_MAPPING).sort().join(''), 'abcdefghijklmnopqrstuvwxyz');
for (const [letters, name, home] of [
    ['QAZ', 'Left little finger', 'A'], ['WSX', 'Left ring finger', 'S'],
    ['EDC', 'Left middle finger', 'D'], ['RFVTGB', 'Left index finger', 'F'],
    ['YHNUJM', 'Right index finger', 'J'], ['IK', 'Right middle finger', 'K'],
    ['OL', 'Right ring finger', 'L'], ['P', 'Right little finger', ';']
]) {
    for (const letter of letters.toLowerCase()) {
        assert.equal(FINGER_MAPPING[letter].name, name);
        assert.equal(FINGER_MAPPING[letter].home, home);
    }
}

const game = Object.create(PrecisionTyper.prototype);
const typing = {
    value: 'hello world', disabled: false,
    selectionStart: 2, selectionEnd: 7, selectionDirection: 'backward',
    focus() {},
    setSelectionRange(start, end, direction) {
        this.selectionStart = start; this.selectionEnd = end; this.selectionDirection = direction;
    }
};
Object.assign(game, {
    inputArea: typing, isGameRunning: true, startedAt: 0, elapsedSeconds: 0,
    mistakeTracker: { count: 3 }, timerLabel: {}, wpmLabel: {}, mistakesLabel: {},
    getTypedText: () => typing.value, updateTextStyles() {}, announce() {}
});
game.gameTimer = context.setInterval(() => game.updateLiveStats());
const guide = Object.create(FingerGuide.prototype);
const pill = {};
Object.assign(guide, {
    game, pausedAt: null, closeTimer: null, isMac: true, isComposing: false,
    dialog: {
        open: false, classList: classList(), querySelector: () => pill,
        showModal() { this.open = true; }, close() { this.open = false; }
    },
    trigger: { setAttribute() {} }, input: { focus() {}, select() {} }
});

guide.open();
const frozenClock = game.timerLabel.textContent;
const frozenWpm = game.wpmLabel.textContent;
assert.equal(intervals.size, 0, 'Lookup stops the live statistics interval');
assert.equal(pill.textContent, 'Practice paused');
now += 60000;
typing.selectionStart = 0; typing.selectionEnd = 0;
guide.close();
assert.equal(game.startedAt, 60000, 'The entire lookup duration is excluded');
assert.equal(intervals.size, 1, 'Returning starts exactly one statistics interval');
assert.deepEqual([typing.selectionStart, typing.selectionEnd, typing.selectionDirection], [2, 7, 'backward']);
game.updateLiveStats();
assert.equal(game.timerLabel.textContent, frozenClock);
assert.equal(game.wpmLabel.textContent, frozenWpm, 'Lookup does not lower WPM');
assert.equal(game.mistakeTracker.count, 3);
assert.equal(typing.value, 'hello world');

// Reopening during the close animation keeps one paused session and cancels its close callback.
reducedMotion = false;
guide.open();
guide.close();
assert.equal(timers.size, 1);
guide.open();
assert.equal(timers.size, 0);
assert.equal(intervals.size, 0);
now += 1000;
reducedMotion = true;
guide.close();
assert.equal(intervals.size, 1);

context.clearInterval(game.gameTimer);
game.isGameRunning = false; game.startedAt = null;
guide.open();
assert.equal(pill.textContent, 'Quick lookup');
now += 2000;
guide.close();
assert.equal(game.startedAt, null, 'An idle lookup must not start a typing run');
assert.equal(intervals.size, 0);

let opened = 0;
guide.open = () => opened++;
const shortcut = { code: 'KeyX', shiftKey: true, metaKey: true, target: typing, preventDefault() {}, stopImmediatePropagation() {} };
guide.handleShortcut(shortcut);
assert.equal(opened, 1);
for (const extra of [{ repeat: true }, { isComposing: true }, { altKey: true }, { ctrlKey: true }, { defaultPrevented: true }, { code: 'KeyC' }]) {
    guide.handleShortcut({ ...shortcut, ...extra });
}
for (const field of ['isSettingsMode', 'isShowingCompletion', 'compositionEdit']) {
    game[field] = true;
    guide.handleShortcut(shortcut);
    game[field] = false;
}
typing.disabled = true; guide.handleShortcut(shortcut); typing.disabled = false;
guide.handleShortcut({ ...shortcut, target: { closest: () => ({}) } });
assert.equal(opened, 1, 'Reserved states, IME, repeat, and other controls stay undisturbed');
guide.isMac = false;
guide.handleShortcut({ ...shortcut, metaKey: false, ctrlKey: true });
assert.equal(opened, 2, 'Windows/Linux use Ctrl instead of Command');

console.log('Finger guide: A–Z reference, paused clock/WPM, idle lookup, caret selection, close/reopen, and shortcut guards passed.');
