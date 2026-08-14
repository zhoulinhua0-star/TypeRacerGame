/**
 * PrecisionTyper: 
 * A rigorous typing speed and accuracy trainer.
 * Requires 100% character-match accuracy for completion.
 * - Procedural Soft Tap Engine (Web Audio Version)
 * - Immersive dark interface with Zen and Focus views
 * - Passage database loaded from texts.json
 */

const APP_ASSET_VERSION = '26';
const PASSAGE_DECKS_STORAGE_KEY = 'precisionTyperPassageDecksV4';
const BUILT_IN_COLLECTIONS = ['general', 'calm', 'quotes', 'code'];
const DIFFICULTY_KEYS = ['easy', 'medium', 'hard'];
const ENGLISH_KEYBOARD_EQUIVALENTS = {
    '“': '"',
    '”': '"',
    '‘': "'",
    '’': "'",
    '—': '-',
    '–': '-'
};
const STORAGE_WARNING_KEYS = new Set();
const DEFAULT_SOURCE = {
    type: 'project-curated',
    title: 'PrecisionTyper passage collection',
    author: 'PrecisionTyper contributors',
    url: 'https://github.com/zhoulinhua0-star/TypeRacerGame',
    license: 'Repository MIT; legacy provenance pending review',
    verified: false
};

function warnStorageOnce(action, key, error) {
    const warningKey = `${action}:${key}`;
    if (STORAGE_WARNING_KEYS.has(warningKey)) return;

    STORAGE_WARNING_KEYS.add(warningKey);
    console.warn(`Browser storage ${action} failed for ${key}:`, error);
}

function readStoredValue(key, fallback = null) {
    try {
        const value = localStorage.getItem(key);
        return value === null ? fallback : value;
    } catch (error) {
        warnStorageOnce('read', key, error);
        return fallback;
    }
}

function writeStoredValue(key, value) {
    try {
        localStorage.setItem(key, value);
        return true;
    } catch (error) {
        warnStorageOnce('write', key, error);
        return false;
    }
}

async function loadTextDatabase() {
    const response = await fetch(`texts.json?v=${APP_ASSET_VERSION}`, { cache: 'no-store' });
    if (!response.ok) {
        throw new Error(`Failed to load texts.json (${response.status})`);
    }

    const data = await response.json();
    return normalizeTextDatabase(data);
}

function normalizeTextDatabase(data) {
    if (data?.schemaVersion === 3 && data.collections) {
        const collections = {};
        for (const collection of BUILT_IN_COLLECTIONS) {
            collections[collection] = DIFFICULTY_KEYS.map((difficulty) => {
                const passages = sanitizePassageList(
                    data.collections?.[collection]?.[difficulty],
                    `${collection}-${difficulty}`
                );
                if (passages.length === 0) {
                    throw new Error(`texts.json is missing passages for ${collection}:${difficulty}`);
                }
                return passages;
            });
        }
        return {
            difficultyStandard: data.difficultyStandard,
            collections
        };
    }

    throw new Error('texts.json must use schema version 3 with every built-in collection and difficulty');
}

function getTextDatabaseErrorMessage(protocol) {
    if (protocol === 'file:') {
        return 'The passage library cannot load from a local file. From the project folder, run “python3 -m http.server 8000”, then open http://localhost:8000/PrecisionTyper/.';
    }
    return 'The passage library could not load. Reload the page, or verify that texts.json is deployed beside game.html.';
}

function hashPassage(text) {
    let hash = 2166136261;
    for (let index = 0; index < text.length; index++) {
        hash ^= text.charCodeAt(index);
        hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(36);
}

function sanitizePassageList(passages, group = 'passage') {
    if (!Array.isArray(passages)) {
        return [];
    }

    return passages
        .map((passage, index) => {
            const text = typeof passage === 'string' ? passage.trim() : passage?.text?.trim();
            if (!text) return null;

            return {
                id: typeof passage?.id === 'string'
                    ? passage.id
                    : `${group}-${String(index + 1).padStart(3, '0')}-${hashPassage(text)}`,
                text,
                source: passage?.source && typeof passage.source === 'object'
                    ? { ...DEFAULT_SOURCE, ...passage.source }
                    : { ...DEFAULT_SOURCE }
            };
        })
        .filter(Boolean);
}

class SegmentedControl {
    constructor(elementId) {
        const element = document.getElementById(elementId);
        this.inputs = Array.from(element.querySelectorAll('input[type="radio"]'));
    }

    get value() {
        return this.inputs.find((input) => input.checked)?.value || '';
    }

    set value(value) {
        const matchingInput = this.inputs.find((input) => input.value === value);
        if (matchingInput) {
            this.inputs.forEach((input) => {
                input.checked = input === matchingInput;
            });
        }
    }

    addEventListener(type, listener) {
        this.inputs.forEach((input) => input.addEventListener(type, listener));
    }

    focus() {
        (this.inputs.find((input) => input.checked) || this.inputs[0])?.focus();
    }

    contains(element) {
        return this.inputs.includes(element);
    }
}

class PrecisionTyper {
    constructor(textDatabase) {
        this.TEXT_DATABASE = textDatabase;

        this.currentPassage = null;
        this.currentTargetText = '';
        this.passageDecks = this.loadPassageDecks();
        this.isGameRunning = false;
        this.isShowingCompletion = false;
        this.isDismissingCompletion = false;
        this.elapsedSeconds = 0;
        this.startedAt = null;
        this.gameTimer = null;
        this.autoAdvanceTimer = null;
        this.completionOverlay = null;
        this.isShakeActive = false;
        this.isFocusMode = false;
        this.isSettingsMode = false;
        this.restoreFocusModeAfterSettings = false;
        this.mismatchFeedbackTimer = null;
        
        // DOM elements
        this.textDisplay = document.getElementById('text-display');
        this.inputArea = document.getElementById('input-area');
        this.skipLink = document.querySelector('.skip-link');
        this.playZone = document.querySelector('.play-zone');
        this.typingCanvas = document.getElementById('typing-canvas');
        this.typingSurface = document.getElementById('typing-surface');
        this.gameToolbar = document.querySelector('.game-toolbar');
        this.timerLabel = document.getElementById('timer-label');
        this.wpmLabel = document.getElementById('wpm-label');
        this.accuracyLabel = document.getElementById('accuracy-label');
        this.collectionSelect = new SegmentedControl('collection-options');
        this.difficultySelect = new SegmentedControl('difficulty-options');
        this.soundToggle = document.getElementById('sound-toggle');
        this.zenToggle = document.getElementById('zen-toggle');
        this.restartButton = document.getElementById('restart-button');
        this.skipButton = document.getElementById('skip-button');
        this.focusButton = document.getElementById('focus-button');
        this.focusButtonLabel = document.getElementById('focus-button-label');
        this.sessionSettingsButton = document.getElementById('session-settings-button');
        this.canvasPrompt = document.getElementById('canvas-prompt');
        this.canvasSource = document.getElementById('canvas-source');
        this.canvasProgress = document.getElementById('canvas-progress');
        this.targetTextA11y = document.getElementById('target-text-a11y');
        this.gameStatus = document.getElementById('game-status');
        
        // Initialize sound engine
        this.soundEngine = new ClickSoundEngine();
        
        // Load settings and initialize
        this.loadSettings();
        this.pickNewText();
        this.setupEventListeners();
        this.updateTextStyles('');
        this.inputArea.disabled = !this.currentTargetText;
        if (!this.inputArea.disabled) {
            this.focusInput();
        }
    }

    getAvailablePassages() {
        const collection = this.collectionSelect.value;
        return this.TEXT_DATABASE.collections[collection]?.[Number(this.difficultySelect.value)] || [];
    }

    getTypingTargetText(text) {
        if (this.collectionSelect.value === 'quotes' && !/[“”]/u.test(text)) {
            return `“${text}”`;
        }
        return text;
    }

    pickNewText() {
        return this.movePassage(1);
    }

    pickPreviousText() {
        return this.movePassage(-1);
    }

    movePassage(offset) {
        const options = this.getAvailablePassages();
        if (!options || options.length === 0) {
            this.currentPassage = null;
            this.currentTargetText = '';
            this.updatePassageSource();
            return false;
        }

        const key = this.getPassagePoolKey();
        if (!this.passageDecks) {
            this.passageDecks = {};
        }
        const passageIds = options.map((passage) => passage.id);
        const signature = [...passageIds].sort().join('|');
        let deck = this.passageDecks[key];
        const hasValidOrder = deck?.signature === signature &&
            Array.isArray(deck.order) &&
            deck.order.length === passageIds.length &&
            new Set(deck.order).size === passageIds.length &&
            deck.order.every((id) => passageIds.includes(id));

        if (!hasValidOrder) {
            deck = { signature, order: this.shuffle(passageIds), index: -1 };
        }

        const passageCount = deck.order.length;
        deck.index = deck.index < 0
            ? (offset < 0 ? passageCount - 1 : 0)
            : (deck.index + offset + passageCount) % passageCount;
        const passage = options.find((option) => option.id === deck.order[deck.index]);
        this.setCurrentPassage(passage);
        this.passageDecks[key] = deck;
        this.savePassageDecks();
        return true;
    }

    setCurrentPassage(passage) {
        this.currentPassage = passage;
        this.currentTargetText = this.getTypingTargetText(passage.text);
        this.updatePassageSource();
    }

    getPassagePoolKey() {
        const collection = this.collectionSelect.value;
        return `${collection}:${this.difficultySelect.value}`;
    }

    shuffle(values) {
        const shuffled = [...values];
        for (let index = shuffled.length - 1; index > 0; index--) {
            const swapIndex = Math.floor(Math.random() * (index + 1));
            [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
        }
        return shuffled;
    }

    loadPassageDecks() {
        try {
            return JSON.parse(readStoredValue(PASSAGE_DECKS_STORAGE_KEY, '{}')) || {};
        } catch (error) {
            console.warn('Unable to load passage order:', error);
            return {};
        }
    }

    savePassageDecks() {
        writeStoredValue(PASSAGE_DECKS_STORAGE_KEY, JSON.stringify(this.passageDecks));
    }

    setupEventListeners() {
        this.skipLink.addEventListener('click', (e) => {
            e.preventDefault();
            this.returnToTyping();
        });

        // Input area listener
        this.inputArea.addEventListener('input', (e) => {
            this.handleInput(this.getInputSoundType(e));
        });

        // Difficulty change
        this.difficultySelect.addEventListener('change', () => {
            this.saveSettings();
            this.resetGame();
        });

        this.collectionSelect.addEventListener('change', () => {
            this.saveSettings();
            this.resetGame();
        });

        // Sound toggle
        this.soundToggle.addEventListener('change', () => {
            this.saveSettings();
        });

        // Zen mode toggle
        this.zenToggle.addEventListener('change', () => {
            this.applyZenMode();
            this.saveSettings();
        });

        this.restartButton.addEventListener('click', () => {
            this.restartPassage();
        });

        this.skipButton.addEventListener('click', () => {
            this.skipPassage();
        });

        this.focusButton.addEventListener('click', () => {
            this.setFocusMode(!this.isFocusMode);
        });

        this.sessionSettingsButton.addEventListener('click', () => {
            this.openSessionSettings();
        });

        this.gameToolbar.addEventListener('keydown', (e) => {
            if (e.key === 'Tab' && this.isSettingsMode) {
                this.handleSessionSettingsTab(e);
            } else if (e.key === 'Escape' && this.isSettingsMode) {
                e.preventDefault();
                this.closeSessionSettings();
            }
        });

        this.typingSurface.addEventListener('click', () => {
            this.returnToTyping();
        });

        this.inputArea.addEventListener('focus', () => {
            this.typingCanvas.classList.add('is-focused');
            this.updateCanvasPrompt();
        });

        this.inputArea.addEventListener('blur', () => {
            this.typingCanvas.classList.remove('is-focused');
            this.updateCanvasPrompt();
        });

        this.inputArea.addEventListener('select', () => {
            this.updateTextStyles(this.getTypedText());
        });

        document.addEventListener('keydown', (e) => {
            if (e.key.toLowerCase() === 'f' && e.shiftKey && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                this.setFocusMode(!this.isFocusMode);
                return;
            }

            if (this.handlePassageNavigation(e)) return;

            const isTypingInput = e.target === this.inputArea;
            const isEditableElement = e.target?.isContentEditable;
            if (
                e.key === '/' &&
                !e.ctrlKey &&
                !e.metaKey &&
                !e.altKey &&
                !e.isComposing &&
                !isTypingInput &&
                !isEditableElement &&
                !this.isShowingCompletion
            ) {
                e.preventDefault();
                this.returnToTyping();
            }
        });

        // Tab moves to session settings. Enter checks unless the target expects a newline.
        this.inputArea.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                this.handleTypingTab(e);
            } else if (e.key === 'Enter') {
                this.handleTypingEnter(e);
            } else if (e.key === 'Escape') {
                e.preventDefault();
                if (this.isFocusMode) {
                    this.setFocusMode(false);
                } else {
                    this.restartPassage();
                }
            }
        });

        this.inputArea.addEventListener('keyup', (e) => {
            if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) {
                this.updateTextStyles(this.getTypedText());
            }
        });
    }

    getTypedText() {
        const typed = this.inputArea.value.replace(/\r\n?/g, '\n');
        let matched = '';
        for (let index = 0; index < typed.length; index++) {
            const character = typed[index];
            const targetCharacter = this.currentTargetText[index];
            matched += ENGLISH_KEYBOARD_EQUIVALENTS[targetCharacter] === character
                ? targetCharacter
                : character;
        }
        return matched;
    }

    handlePassageNavigation(event) {
        if (
            event.isComposing ||
            this.isShowingCompletion ||
            (!event.ctrlKey && !event.metaKey)
        ) {
            return false;
        }

        if (event.key === 'ArrowRight') {
            event.preventDefault();
            this.skipPassage();
            return true;
        }

        if (event.key === 'ArrowLeft') {
            event.preventDefault();
            this.previousPassage();
            return true;
        }

        return false;
    }

    shouldInsertTargetNewline() {
        const caretPosition = Number.isInteger(this.inputArea.selectionStart)
            ? this.inputArea.selectionStart
            : this.getTypedText().length;
        return this.currentTargetText[caretPosition] === '\n';
    }

    handleTypingTab(event) {
        if (event.isComposing || event.shiftKey || event.ctrlKey || event.metaKey || event.altKey) return;

        event.preventDefault();
        this.sessionSettingsButton.focus({ preventScroll: true });
        this.canvasPrompt.textContent = 'Press Enter to open session settings, or / to return to typing.';
        this.announce('Session settings button focused. Press Enter to open settings.');
    }

    handleSessionSettingsTab(event) {
        if (event.isComposing || event.ctrlKey || event.metaKey || event.altKey) return;

        const focusStops = [
            this.collectionSelect,
            this.difficultySelect,
            this.soundToggle,
            this.zenToggle
        ];
        const activeIndex = focusStops.findIndex((stop) => stop.contains(document.activeElement));
        const nextIndex = activeIndex === -1
            ? (event.shiftKey ? focusStops.length - 1 : 0)
            : activeIndex + (event.shiftKey ? -1 : 1);

        event.preventDefault();
        if (nextIndex < 0 || nextIndex >= focusStops.length) {
            this.closeSessionSettings();
            return;
        }

        focusStops[nextIndex].focus();
    }

    handleTypingEnter(event) {
        if (event.isComposing) return;

        const forceCheck = event.ctrlKey || event.metaKey;
        if (!forceCheck && this.shouldInsertTargetNewline()) {
            return;
        }

        event.preventDefault();
        this.handleEnterSubmit();
    }

    handleEnterSubmit() {
        if (this.isShowingCompletion) return;

        const typed = this.getTypedText();
        if (typed === this.currentTargetText) {
            this.gameOver();
        } else {
            if (this.zenToggle.checked) {
                this.showGentleMismatchFeedback();
            } else {
                this.triggerMismatchShake();
            }
            this.announce('The passage is not an exact match yet. Correct the highlighted characters and try again.');
        }
    }

    showGentleMismatchFeedback() {
        if (this.mismatchFeedbackTimer) {
            window.clearTimeout(this.mismatchFeedbackTimer);
        }
        this.canvasPrompt.textContent = 'Not an exact match yet — stay with the highlighted keys.';
        this.mismatchFeedbackTimer = window.setTimeout(() => {
            this.mismatchFeedbackTimer = null;
            this.updateCanvasPrompt();
        }, 1800);
    }

    announce(message) {
        this.gameStatus.textContent = '';
        window.setTimeout(() => {
            this.gameStatus.textContent = message;
        }, 0);
    }

    triggerMismatchShake() {
        if (!this.playZone || this.isShakeActive) return;

        this.isShakeActive = true;
        this.playZone.classList.add('is-shake');

        let finished = false;
        const onShakeEnd = () => {
            if (finished) return;
            finished = true;
            this.playZone.classList.remove('is-shake');
            this.isShakeActive = false;
            this.playZone.removeEventListener('animationend', onShakeEnd);
            window.clearTimeout(fallbackId);
        };

        this.playZone.addEventListener('animationend', onShakeEnd);
        const fallbackId = window.setTimeout(onShakeEnd, 500);
    }

    getInputSoundType(event) {
        const inputType = event.inputType || '';
        if (inputType.startsWith('delete')) return 'delete';
        if (inputType === 'insertLineBreak' || inputType === 'insertParagraph') return 'enter';
        if (inputType === 'insertFromPaste' || inputType === 'insertFromDrop' || inputType.startsWith('history')) {
            return null;
        }
        if (event.data === ' ') return 'space';
        return event.data && event.data.length > 1 ? null : 'tap';
    }

    handleInput(soundType) {
        if (soundType && this.soundToggle.checked) {
            this.soundEngine.play(soundType);
        }
        this.checkProgress();
    }

    focusInput() {
        if (this.inputArea.disabled) return;

        const wasFocused = document.activeElement === this.inputArea;
        this.inputArea.focus({ preventScroll: true });
        if (!wasFocused) {
            const end = this.inputArea.value.length;
            this.inputArea.setSelectionRange(end, end);
        }
        this.updateTextStyles(this.getTypedText());
    }

    returnToTyping() {
        if (this.isSettingsMode) {
            this.closeSessionSettings();
            return;
        }
        if (this.inputArea.disabled) return;

        this.focusInput();
        this.announce('Typing canvas focused.');
    }

    openSessionSettings() {
        if (this.isSettingsMode || this.isShowingCompletion) return;

        this.isSettingsMode = true;
        this.restoreFocusModeAfterSettings = this.isFocusMode;
        document.body.classList.add('settings-active');
        if (this.restoreFocusModeAfterSettings) {
            document.body.classList.remove('focus-mode');
        }
        this.syncChromeVisibility();
        this.focusFirstSessionControl();
        this.announce('Session settings opened. Use Tab to move, arrow keys to choose, Space to toggle, and Tab past the edge, Escape, or slash to return to typing.');
    }

    focusFirstSessionControl() {
        const focusControl = () => {
            if (!this.isSettingsMode) return;
            this.collectionSelect.focus();
        };
        const focusAndVerify = () => {
            focusControl();
            const hasFocus = typeof this.collectionSelect.contains === 'function'
                ? this.collectionSelect.contains(document.activeElement)
                : document.activeElement === this.collectionSelect;
            if (this.isSettingsMode && !hasFocus) {
                window.requestAnimationFrame(focusControl);
            }
        };

        window.requestAnimationFrame(focusAndVerify);
    }

    closeSessionSettings() {
        if (!this.isSettingsMode) return;

        this.isSettingsMode = false;
        document.body.classList.remove('settings-active');
        if (this.restoreFocusModeAfterSettings && this.isFocusMode) {
            document.body.classList.add('focus-mode');
        }
        this.restoreFocusModeAfterSettings = false;
        this.syncChromeVisibility();
        if (this.inputArea.disabled) {
            this.sessionSettingsButton.focus({ preventScroll: true });
        } else {
            this.focusInput();
        }
        this.typingCanvas.scrollIntoView({ block: 'center' });
        this.announce(this.inputArea.disabled
            ? 'Session settings closed. Add a passage to begin typing.'
            : 'Session settings closed. Typing canvas focused.');
    }

    setFocusMode(enabled) {
        if (this.isSettingsMode) {
            this.closeSessionSettings();
        }
        this.isFocusMode = enabled;
        document.body.classList.toggle('focus-mode', enabled);
        this.focusButton.setAttribute('aria-pressed', String(enabled));
        this.focusButtonLabel.textContent = enabled ? 'Exit focus' : 'Focus';
        this.syncChromeVisibility();
        this.focusInput();
        this.announce(enabled ? 'Focus view enabled.' : 'Focus view closed.');
    }

    syncChromeVisibility() {
        const zenIsActive = this.zenToggle.checked;
        const hideToolbar = !this.isSettingsMode && (this.isFocusMode || zenIsActive);
        document.body.classList.toggle('zen-active', zenIsActive);
        this.gameToolbar.inert = hideToolbar;
        this.gameToolbar.setAttribute('aria-hidden', String(hideToolbar));
    }

    applyZenMode() {
        document.body.classList.toggle('zen-mode', this.zenToggle.checked);
        this.syncChromeVisibility();
    }

    updateCanvasPrompt() {
        const hasLongToken = this.currentTargetText
            .split(/\s/u)
            .some((token) => token.length > 32);
        const hasTargetNewline = this.currentTargetText.includes('\n');
        const hasEnglishKeyboardEquivalent = /[“”‘’—–]/u.test(this.currentTargetText);

        if (!this.currentTargetText) {
            this.canvasPrompt.textContent = 'No passages are available in this collection. Try another collection or reload.';
        } else if (document.activeElement !== this.inputArea) {
            this.canvasPrompt.textContent = 'Press / or click anywhere in the canvas to continue.';
        } else if (this.getTypedText().length === 0) {
            if (hasTargetNewline) {
                this.canvasPrompt.textContent = '↵ marks a required line break; press Enter when you reach it.';
            } else if (hasEnglishKeyboardEquivalent) {
                this.canvasPrompt.textContent = 'Use English keys: " for curly quotes, \' for curly apostrophes, and - for long dashes.';
            } else {
                this.canvasPrompt.textContent = hasLongToken
                    ? '↳ marks a visual-only long-token wrap; do not type the arrow or Enter.'
                    : 'Start typing when you are ready.';
            }
        } else if (this.zenToggle.checked) {
            this.canvasPrompt.textContent = 'Stay with the next key.';
        } else {
            this.canvasPrompt.textContent = 'Keep typing, then check the exact match.';
        }
    }

    updatePassageSource() {
        if (!this.canvasSource) return;

        const source = this.currentPassage?.source;
        if (!source || source.verified !== true) {
            this.canvasSource.hidden = true;
            this.canvasSource.removeAttribute('href');
            this.canvasSource.textContent = '';
            return;
        }

        this.canvasSource.textContent = `${source.author} · ${source.title}`;
        this.canvasSource.href = source.url;
        this.canvasSource.hidden = false;
    }

    saveSettings() {
        const settings = {
            soundEnabled: this.soundToggle.checked,
            zenEnabled: this.zenToggle.checked,
            difficulty: this.difficultySelect.value,
            collection: this.collectionSelect.value
        };
        writeStoredValue('precisionTyperSettings', JSON.stringify(settings));
    }

    loadSettings() {
        const saved = readStoredValue('precisionTyperSettings');
        if (saved) {
            try {
                const settings = JSON.parse(saved);
                this.soundToggle.checked = settings.soundEnabled !== false;
                this.zenToggle.checked = settings.zenEnabled !== false;
                if (['0', '1', '2'].includes(String(settings.difficulty))) {
                    this.difficultySelect.value = String(settings.difficulty);
                }
                if (['general', 'calm', 'quotes', 'code'].includes(settings.collection)) {
                    this.collectionSelect.value = settings.collection;
                }
            } catch (e) {
                console.error('Error loading settings:', e);
            }
        }

        this.applyZenMode();
    }

    startTimer() {
        if (this.isGameRunning) return;
        this.isGameRunning = true;
        this.startedAt = performance.now();
        this.syncChromeVisibility();
        this.gameTimer = setInterval(() => {
            this.updateLiveStats();
        }, 250);
    }

    updateElapsedTime() {
        if (this.startedAt !== null) {
            this.elapsedSeconds = Math.max((performance.now() - this.startedAt) / 1000, 0);
        }
        this.timerLabel.textContent = `Time: ${this.formatDuration(this.elapsedSeconds)}`;
    }

    formatDuration(seconds) {
        if (seconds < 10) {
            return `${seconds.toFixed(1)}s`;
        }
        return `${Math.floor(seconds)}s`;
    }

    checkProgress() {
        const typed = this.getTypedText();
        if (!this.isGameRunning && typed.length > 0) {
            this.startTimer();
        }
        this.updateTextStyles(typed);
        this.updateLiveStats();
        this.updateCanvasPrompt();
    }

    updateLiveStats() {
        const typed = this.getTypedText();
        if (typed.length === 0) return;

        this.updateElapsedTime();
        const wpm = this.elapsedSeconds < 1
            ? 0
            : Math.floor((typed.length / 5.0) / (this.elapsedSeconds / 60));
        this.wpmLabel.textContent = `WPM: ${wpm}`;
        
        let correct = 0;
        const len = Math.min(typed.length, this.currentTargetText.length);
        for (let i = 0; i < len; i++) {
            if (typed[i] === this.currentTargetText[i]) {
                correct++;
            }
        }
        const accuracy = Math.floor((correct / Math.max(typed.length, 1)) * 100);
        this.accuracyLabel.textContent = `Accuracy: ${accuracy}%`;
    }

    updateTextStyles(typed) {
        if (!this.currentTargetText) {
            this.textDisplay.textContent = 'This collection could not be loaded. Try another collection or reload the page.';
            this.textDisplay.classList.add('is-loading');
            this.targetTextA11y.textContent = '';
            this.canvasProgress.textContent = '0 / 0';
            this.updateCanvasPrompt();
            return;
        }

        this.textDisplay.classList.remove('is-loading');
        this.targetTextA11y.textContent = `Target passage: ${this.currentTargetText}`;
        this.canvasProgress.textContent = `${typed.length} / ${this.currentTargetText.length}`;
        const caretPosition = Math.max(
            0,
            Math.min(Number.isInteger(this.inputArea.selectionStart) ? this.inputArea.selectionStart : typed.length, typed.length)
        );
        const displayCharacters = [];
        for (let i = 0; i < this.currentTargetText.length; i++) {
            const char = this.escapeCharacter(this.currentTargetText[i]);
            const isSpace = this.currentTargetText[i] === ' ';

            if (i < typed.length) {
                const match = typed[i] === this.currentTargetText[i];
                const cursorClass = i === caretPosition ? ' char-cursor' : '';
                const spaceClass = isSpace ? ' text-space' : '';
                const visibleSpaceClass = isSpace && (!match || i === caretPosition)
                    ? ' text-space-visible'
                    : '';
                displayCharacters.push({
                    value: this.currentTargetText[i],
                    markup: `<span class="char-${match ? 'correct' : 'wrong'}${cursorClass}${spaceClass}${visibleSpaceClass}">${char}</span>`
                });
            } else {
                if (i === caretPosition) {
                    displayCharacters.push({
                        value: this.currentTargetText[i],
                        markup: `<span class="char-cursor${isSpace ? ' text-space text-space-visible' : ''}">${char}</span>`
                    });
                } else {
                    displayCharacters.push({
                        value: this.currentTargetText[i],
                        markup: `<span class="char-untyped${isSpace ? ' text-space' : ''}">${char}</span>`
                    });
                }
            }
        }

        for (let i = this.currentTargetText.length; i < typed.length; i++) {
            const cursorClass = i === caretPosition ? ' char-cursor' : '';
            const spaceClass = typed[i] === ' ' ? ' text-space text-space-visible' : '';
            displayCharacters.push({
                value: typed[i],
                markup: `<span class="char-wrong char-extra${cursorClass}${spaceClass}">${this.escapeCharacter(typed[i])}</span>`
            });
        }

        let html = '';
        let tokenMarkup = '';
        let tokenLength = 0;
        const flushToken = () => {
            if (!tokenMarkup) return;
            const isLongToken = tokenLength > 32;
            const marker = isLongToken
                ? '<span class="soft-wrap-marker" aria-hidden="true">↳</span>'
                : '';
            html += `<span class="text-token${isLongToken ? ' text-token-long' : ''}">${marker}${tokenMarkup}</span>`;
            tokenMarkup = '';
            tokenLength = 0;
        };

        for (const character of displayCharacters) {
            if (character.value === '\n') {
                flushToken();
                html += '<span class="text-newline" aria-hidden="true">↵</span><br>';
            } else if (/\s/u.test(character.value)) {
                flushToken();
                html += character.markup;
            } else {
                tokenMarkup += character.markup;
                tokenLength++;
            }
        }
        flushToken();

        if (caretPosition === typed.length && typed.length >= this.currentTargetText.length) {
            html += '<span class="char-cursor char-end" aria-hidden="true">&nbsp;</span>';
        }
        this.textDisplay.innerHTML = html;
    }

    escapeCharacter(char) {
        if (char === '<') return '&lt;';
        if (char === '>') return '&gt;';
        if (char === '&') return '&amp;';
        if (char === ' ') return ' ';
        if (char === '\n') return '';
        return char;
    }

    ensureCompletionOverlay() {
        if (this.completionOverlay) return;

        const overlay = document.createElement('div');
        overlay.className = 'completion-overlay';
        overlay.hidden = true;
        overlay.innerHTML = `
            <div class="completion-backdrop" data-dismiss aria-hidden="true"></div>
            <div class="completion-card" role="dialog" aria-modal="true" aria-labelledby="completion-title">
                <div class="completion-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none">
                        <circle class="completion-icon-ring" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                        <path class="completion-icon-check" d="M8 12.5l2.5 2.5L16 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </div>
                <h2 id="completion-title" class="completion-title">Passage complete!</h2>
                <p class="completion-subtitle" id="completion-subtitle">Perfect match — great work.</p>
                <div class="completion-stats">
                    <div class="completion-stat">
                        <span class="completion-stat-label">Time</span>
                        <span class="completion-stat-value" id="completion-time"></span>
                    </div>
                    <div class="completion-stat">
                        <span class="completion-stat-label">WPM</span>
                        <span class="completion-stat-value" id="completion-wpm"></span>
                    </div>
                    <div class="completion-stat">
                        <span class="completion-stat-label">Accuracy</span>
                        <span class="completion-stat-value" id="completion-accuracy"></span>
                    </div>
                </div>
                <button type="button" class="completion-btn" id="completion-continue">Next passage</button>
            </div>
        `;
        document.body.appendChild(overlay);

        this.completionOverlay = overlay;
        this.completionTimeEl = overlay.querySelector('#completion-time');
        this.completionWpmEl = overlay.querySelector('#completion-wpm');
        this.completionAccuracyEl = overlay.querySelector('#completion-accuracy');
        this.completionSubtitleEl = overlay.querySelector('#completion-subtitle');

        const dismiss = () => this.dismissCompletionOverlay();
        overlay.querySelector('#completion-continue').addEventListener('click', dismiss);
        overlay.querySelector('[data-dismiss]').addEventListener('click', dismiss);
        overlay.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === 'Escape') {
                e.preventDefault();
                dismiss();
            }
        });
    }

    showCompletionOverlay(wpm, accuracy, time) {
        this.ensureCompletionOverlay();
        this.isDismissingCompletion = false;

        this.completionTimeEl.textContent = time;
        this.completionWpmEl.textContent = wpm.replace('WPM: ', '');
        this.completionAccuracyEl.textContent = accuracy.replace('Accuracy: ', '');
        this.completionSubtitleEl.textContent = this.zenToggle.checked
            ? 'Perfect match — the next passage will begin in a moment.'
            : 'Perfect match — great work.';

        this.inputArea.disabled = true;
        this.completionOverlay.hidden = false;
        requestAnimationFrame(() => {
            this.completionOverlay.classList.add('is-visible');
        });
        this.completionOverlay.querySelector('.completion-btn').focus();

        if (this.zenToggle.checked) {
            this.autoAdvanceTimer = window.setTimeout(() => {
                this.dismissCompletionOverlay();
            }, 2400);
        }
    }

    dismissCompletionOverlay() {
        if (!this.completionOverlay || this.completionOverlay.hidden || this.isDismissingCompletion) return;
        this.isDismissingCompletion = true;

        if (this.autoAdvanceTimer) {
            window.clearTimeout(this.autoAdvanceTimer);
            this.autoAdvanceTimer = null;
        }
        if (this.mismatchFeedbackTimer) {
            window.clearTimeout(this.mismatchFeedbackTimer);
            this.mismatchFeedbackTimer = null;
        }

        this.completionOverlay.classList.remove('is-visible');
        window.setTimeout(() => {
            this.completionOverlay.hidden = true;
            this.inputArea.disabled = false;
            this.isShowingCompletion = false;
            this.isDismissingCompletion = false;
            this.resetGame();
        }, 280);
    }

    gameOver() {
        if (this.isShowingCompletion) return;
        this.isShowingCompletion = true;

        if (this.gameTimer) {
            clearInterval(this.gameTimer);
            this.gameTimer = null;
        }
        this.updateLiveStats();
        this.isGameRunning = false;
        this.syncChromeVisibility();

        const wpm = this.wpmLabel.textContent;
        const accuracy = this.accuracyLabel.textContent;
        const time = this.timerLabel.textContent.replace('Time: ', '');
        this.showCompletionOverlay(wpm, accuracy, time);
    }

    restartPassage() {
        if (this.isShowingCompletion) return;
        this.resetGame({ pickNew: false });
        this.announce('Passage restarted.');
    }

    skipPassage() {
        if (this.isShowingCompletion) return;
        this.resetGame();
        this.announce('Next passage.');
    }

    previousPassage() {
        if (this.isShowingCompletion) return;
        if (!this.pickPreviousText()) {
            this.announce('No passages are available in this collection and difficulty.');
            return;
        }
        this.resetGame({ pickNew: false });
        this.announce('Previous passage.');
    }

    resetGame({ pickNew = true } = {}) {
        if (this.gameTimer) {
            clearInterval(this.gameTimer);
            this.gameTimer = null;
        }
        if (this.autoAdvanceTimer) {
            window.clearTimeout(this.autoAdvanceTimer);
            this.autoAdvanceTimer = null;
        }
        if (this.mismatchFeedbackTimer) {
            window.clearTimeout(this.mismatchFeedbackTimer);
            this.mismatchFeedbackTimer = null;
        }
        this.elapsedSeconds = 0;
        this.startedAt = null;
        this.isGameRunning = false;
        this.syncChromeVisibility();
        this.timerLabel.textContent = 'Time: 0s';
        this.wpmLabel.textContent = 'WPM: 0';
        this.accuracyLabel.textContent = 'Accuracy: 100%';
        this.inputArea.value = '';
        if (pickNew || !this.currentTargetText) {
            this.pickNewText();
        }
        this.updateTextStyles('');
        this.inputArea.disabled = !this.currentTargetText;
        if (!this.inputArea.disabled && !this.isSettingsMode) {
            this.focusInput();
        }
    }
}

/**
 * Soft Tap Engine: original procedural synthesis using the Web Audio API.
 */
class ClickSoundEngine {
    constructor() {
        this.audioContext = null;
        this.buffers = {};
        this.initializeAudio();
    }

    initializeAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const voices = {
                tap: { durationMs: 24, frequency: 510, volume: 0.11, noiseMix: 0.48, smoothing: 0.20 },
                space: { durationMs: 30, frequency: 330, volume: 0.085, noiseMix: 0.45, smoothing: 0.16 },
                delete: { durationMs: 27, frequency: 270, volume: 0.09, noiseMix: 0.55, smoothing: 0.14 },
                enter: { durationMs: 34, frequency: 410, volume: 0.10, noiseMix: 0.42, smoothing: 0.18 }
            };

            Object.entries(voices).forEach(([name, voice]) => {
                this.buffers[name] = Array.from({ length: 3 }, () => this.createTapBuffer(voice));
            });
        } catch (e) {
            console.error('Audio initialization failed:', e);
        }
    }

    createTapBuffer({ durationMs, frequency, volume, noiseMix, smoothing }) {
        const sampleRate = this.audioContext.sampleRate;
        const bufferSize = Math.floor(sampleRate * (durationMs / 1000));
        const buffer = this.audioContext.createBuffer(1, bufferSize, sampleRate);
        const data = buffer.getChannelData(0);
        const attackSamples = Math.max(1, Math.floor(sampleRate * 0.0015));
        let softenedNoise = 0;

        for (let i = 0; i < bufferSize; i++) {
            const progress = i / Math.max(bufferSize - 1, 1);
            const attack = Math.min(i / attackSamples, 1);
            const decay = Math.pow(1 - progress, 3.2);
            const rawNoise = (Math.random() * 2) - 1;
            softenedNoise += smoothing * (rawNoise - softenedNoise);
            const tone = Math.sin(2 * Math.PI * frequency * (i / sampleRate));
            data[i] = ((softenedNoise * noiseMix) + (tone * (1 - noiseMix))) * attack * decay * volume;
        }

        return buffer;
    }

    play(type = 'tap') {
        const variants = this.buffers[type] || this.buffers.tap;
        if (!this.audioContext || !variants || variants.length === 0) return;

        try {
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }

            const source = this.audioContext.createBufferSource();
            source.buffer = variants[Math.floor(Math.random() * variants.length)];
            source.playbackRate.value = 0.975 + (Math.random() * 0.05);
            source.connect(this.audioContext.destination);
            source.start(0);
        } catch (e) {
            // Silently fail if audio can't play
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    const textDisplay = document.getElementById('text-display');
    const inputArea = document.getElementById('input-area');

    textDisplay.textContent = 'Loading passages…';
    textDisplay.classList.add('is-loading');
    inputArea.disabled = true;

    try {
        const textDatabase = await loadTextDatabase();
        textDisplay.classList.remove('is-loading');
        inputArea.disabled = false;
        new PrecisionTyper(textDatabase);
    } catch (error) {
        console.error('Failed to load texts.json:', error);
        const message = getTextDatabaseErrorMessage(window.location.protocol);
        textDisplay.textContent = message;
        textDisplay.classList.remove('is-loading');
        textDisplay.classList.add('is-load-error');
        document.getElementById('canvas-prompt').textContent = 'Passage library unavailable.';
        document.getElementById('target-text-a11y').textContent = message;
        document.getElementById('game-status').textContent = message;
    }
});
