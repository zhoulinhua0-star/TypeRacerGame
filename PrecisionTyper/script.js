/**
 * PrecisionTyper: 
 * A rigorous typing speed and accuracy trainer.
 * Requires 100% character-match accuracy for completion.
 * - Procedural Soft Tap Engine (Web Audio Version)
 * - Persistent Theme (Dark/Light) [FIXED & ENHANCED]
 * - Passage database loaded from texts.json
 */

const APP_ASSET_VERSION = '9';

const FALLBACK_TEXT_DATABASE = {
    difficulty: [
        [
            "Practice makes perfect.",
            "The sun rises in the east and sets in the west.",
            "Clean code is happy code.",
            "Actions speak louder than words.",
            "No pain, no gain.",
            "Think before you type.",
            "const greeting = \"Hello, world!\";",
            "Save your work often.",
            "Less is more.",
            "Focus on the next key."
        ],
        [
            "Object-oriented design emphasizes encapsulation, inheritance, and polymorphism, yet experienced architects frequently prefer composition over inheritance when modeling systems that must evolve under changing requirements.",
            "Relational databases enforce integrity through normalization, foreign keys, and transactional isolation levels; understanding ACID properties remains essential when reasoning about consistency under failure.",
            "Microservices decompose monoliths into independently deployable services, trading operational complexity for scalability, though distributed tracing becomes mandatory when diagnosing latency across network boundaries.",
            "CAP theorem states that distributed systems cannot simultaneously guarantee consistency, availability, and partition tolerance, forcing architects to choose trade-offs aligned with business requirements.",
            "Continuous integration pipelines automate compilation, testing, and deployment, converting integration from a periodic crisis into a routine feedback loop after every commit.",
            "Cryptographic hash functions map inputs to fixed-length digests with collision resistance; they underpin blockchains, password storage, and integrity verification of downloaded artifacts.",
            "Functional programming treats computation as evaluation of mathematical functions, minimizing mutable state and side effects to simplify reasoning about correctness in concurrent environments.",
            "Observability combines metrics, structured logging, and distributed tracing so engineers can infer internal system states from external outputs during production incidents.",
            "Semantic versioning communicates compatibility through major, minor, and patch increments, signaling whether dependent projects can upgrade safely without breaking API contracts.",
            "Test-driven development writes failing tests before implementation, forcing explicit requirements and enabling refactoring confidence when suites remain comprehensive."
        ],
        [
            "To be, or not to be, that is the question: whether 'tis nobler in the mind to suffer the slings and arrows of outrageous fortune, or to take arms against a sea of troubles, and by opposing end them; to die, to sleep—no more—and by a sleep to say we end the heart-ache and the thousand natural shocks that flesh is heir to.",
            "It was the best of times, it was the worst of times, it was the age of wisdom, it was the age of foolishness, it was the epoch of belief, it was the epoch of incredulity, it was the season of Light, it was the season of Darkness, it was the spring of hope, it was the winter of despair.",
            "The Byzantine Generals Problem illustrates how distributed processes must reach consensus despite unreliable communication channels and potentially malicious participants, forming the theoretical foundation for fault-tolerant replication protocols that underpin modern blockchain consensus mechanisms.",
            "In software engineering, loose coupling is a design goal that seeks to reduce the interdependencies between components of a system with the goal of reducing the risk that changes in one component will require changes in any other component, thereby improving modularity and testability.",
            "Technical debt, a metaphor introduced by Cunningham, describes the implied cost of additional rework caused by choosing an expedient solution now instead of a better approach that would take longer; compound interest applies until refactoring becomes archaeological excavation.",
            "Concurrency is not parallelism: the former structures programs as interacting events while the latter executes simultaneous computation on multiple processors; conflating them produces race conditions that manifest only under production load.",
            "When you have eliminated the impossible, whatever remains, however improbable, must be the truth; yet in production postmortems, teams discover that the impossible persisted because logging sampled away critical spans and metrics aggregated away outliers.",
            "Shakespeare, Dickens, Austen, Tolstoy, and Knuth collectively remind us that precision in language demands patience: every character matters, every punctuation mark alters meaning, and every careless substitution propagates errors downstream with equal severity."
        ]
    ],
    collections: {
        calm: [
            "Breathe in slowly, breathe out gently, and return to the next key.",
            "There is nowhere else to be and nothing else to finish right now.",
            "Let each quiet keystroke make a little more room in your mind."
        ],
        quotes: [
            "The journey of a thousand miles begins with a single step.",
            "Well begun is half done.",
            "Simplicity is the ultimate sophistication."
        ],
        code: [
            "const pause = (milliseconds) => new Promise(resolve => setTimeout(resolve, milliseconds));",
            "function breathe() { return 'slow and steady'; }",
            "git commit -m \"Keep the change small and clear\""
        ]
    }
};

async function loadTextDatabase() {
    const response = await fetch(`texts.json?v=${APP_ASSET_VERSION}`, { cache: 'no-store' });
    if (!response.ok) {
        throw new Error(`Failed to load texts.json (${response.status})`);
    }

    const data = await response.json();
    return normalizeTextDatabase(data);
}

function normalizeTextDatabase(data) {
    if (Array.isArray(data) && data.length >= 3) {
        return {
            difficulty: data.map(sanitizePassageList),
            collections: FALLBACK_TEXT_DATABASE.collections
        };
    }

    if (data && data.easy && data.medium && data.hard) {
        return {
            difficulty: [
                sanitizePassageList(data.easy),
                sanitizePassageList(data.medium),
                sanitizePassageList(data.hard)
            ],
            collections: {
                calm: sanitizePassageList(data.calm),
                quotes: sanitizePassageList(data.quotes),
                code: sanitizePassageList(data.code)
            }
        };
    }

    throw new Error('texts.json must contain easy, medium, and hard arrays');
}

function sanitizePassageList(passages) {
    if (!Array.isArray(passages)) {
        return [];
    }

    return passages
        .filter((passage) => typeof passage === 'string')
        .map((passage) => passage.trim())
        .filter(Boolean);
}

class PrecisionTyper {
    constructor(textDatabase) {
        this.TEXT_DATABASE = textDatabase;

        this.currentTargetText = '';
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
        
        // DOM elements
        this.textDisplay = document.getElementById('text-display');
        this.inputArea = document.getElementById('input-area');
        this.playZone = document.querySelector('.play-zone');
        this.typingCanvas = document.getElementById('typing-canvas');
        this.typingSurface = document.getElementById('typing-surface');
        this.gameToolbar = document.querySelector('.game-toolbar');
        this.timerLabel = document.getElementById('timer-label');
        this.wpmLabel = document.getElementById('wpm-label');
        this.accuracyLabel = document.getElementById('accuracy-label');
        this.collectionSelect = document.getElementById('collection-select');
        this.difficultySelect = document.getElementById('difficulty-select');
        this.soundToggle = document.getElementById('sound-toggle');
        this.zenToggle = document.getElementById('zen-toggle');
        this.modeToggle = document.getElementById('mode-toggle');
        this.customPanel = document.getElementById('custom-panel');
        this.customPassages = document.getElementById('custom-passages');
        this.customStatus = document.getElementById('custom-status');
        this.saveCustomButton = document.getElementById('save-custom');
        this.restartButton = document.getElementById('restart-button');
        this.skipButton = document.getElementById('skip-button');
        this.focusButton = document.getElementById('focus-button');
        this.focusButtonLabel = document.getElementById('focus-button-label');
        this.canvasPrompt = document.getElementById('canvas-prompt');
        this.canvasProgress = document.getElementById('canvas-progress');
        this.targetTextA11y = document.getElementById('target-text-a11y');
        this.gameStatus = document.getElementById('game-status');
        
        // Initialize sound engine
        this.soundEngine = new ClickSoundEngine();
        
        // Load settings and initialize
        this.loadSettings();
        this.updateCollectionControls();
        this.pickNewText();
        this.setupEventListeners();
        this.updateTextStyles('');
        this.inputArea.disabled = !this.currentTargetText;
        if (!this.inputArea.disabled) {
            this.focusInput();
        }
    }

    getCustomPassageList() {
        return sanitizePassageList(this.customPassages.value.split(/\r?\n/));
    }

    getAvailablePassages() {
        const collection = this.collectionSelect.value;
        if (collection === 'custom') {
            return this.getCustomPassageList();
        }
        if (collection === 'general') {
            return this.TEXT_DATABASE.difficulty[Number(this.difficultySelect.value)] || [];
        }
        return this.TEXT_DATABASE.collections[collection] || [];
    }

    pickNewText() {
        const options = this.getAvailablePassages();
        if (!options || options.length === 0) {
            this.currentTargetText = '';
            return false;
        }

        const candidates = options.length > 1
            ? options.filter((passage) => passage !== this.currentTargetText)
            : options;
        this.currentTargetText = candidates[Math.floor(Math.random() * candidates.length)];
        return true;
    }

    setupEventListeners() {
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
            this.updateCollectionControls();
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

        // Theme toggle
        this.modeToggle.addEventListener('change', () => {
            this.toggleTheme();
            this.saveSettings();
        });

        this.saveCustomButton.addEventListener('click', () => {
            this.saveCustomPassages();
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

        this.typingSurface.addEventListener('click', () => {
            this.focusInput();
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
            }
        });

        // Ctrl/Cmd+Enter checks, Escape restarts, and Ctrl/Cmd+Right skips.
        this.inputArea.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                this.handleEnterSubmit();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                if (this.isFocusMode) {
                    this.setFocusMode(false);
                } else {
                    this.restartPassage();
                }
            } else if (e.key === 'ArrowRight' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                this.skipPassage();
            }
        });

        this.inputArea.addEventListener('keyup', (e) => {
            if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) {
                this.updateTextStyles(this.getTypedText());
            }
        });
    }

    getTypedText() {
        return this.inputArea.value.replace(/\r\n?/g, '\n');
    }

    handleEnterSubmit() {
        if (this.isShowingCompletion) return;

        const typed = this.getTypedText();
        if (typed === this.currentTargetText) {
            this.gameOver();
        } else {
            this.triggerMismatchShake();
            this.announce('The passage is not an exact match yet. Correct the highlighted characters and try again.');
        }
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

    toggleTheme() {
        if (this.modeToggle.checked) {
            document.body.classList.add('light-mode');
        } else {
            document.body.classList.remove('light-mode');
        }
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

    setFocusMode(enabled) {
        this.isFocusMode = enabled;
        document.body.classList.toggle('focus-mode', enabled);
        this.focusButton.setAttribute('aria-pressed', String(enabled));
        this.focusButtonLabel.textContent = enabled ? 'Exit focus' : 'Focus';
        this.syncChromeVisibility();
        this.focusInput();
        this.announce(enabled ? 'Focus view enabled.' : 'Focus view closed.');
    }

    syncChromeVisibility() {
        const zenIsActive = this.zenToggle.checked && this.isGameRunning;
        const hideToolbar = this.isFocusMode || zenIsActive;
        document.body.classList.toggle('zen-active', zenIsActive);
        this.gameToolbar.inert = hideToolbar;
        this.gameToolbar.setAttribute('aria-hidden', String(hideToolbar));
    }

    applyZenMode() {
        document.body.classList.toggle('zen-mode', this.zenToggle.checked);
        this.syncChromeVisibility();
    }

    updateCanvasPrompt() {
        if (!this.currentTargetText) {
            this.canvasPrompt.textContent = 'Add a custom passage above to begin.';
        } else if (document.activeElement !== this.inputArea) {
            this.canvasPrompt.textContent = 'Click anywhere in the canvas to continue.';
        } else if (this.getTypedText().length === 0) {
            this.canvasPrompt.textContent = 'Start typing when you are ready.';
        } else if (this.zenToggle.checked) {
            this.canvasPrompt.textContent = 'Stay with the next key.';
        } else {
            this.canvasPrompt.textContent = 'Keep typing, then check the exact match.';
        }
    }

    updateCollectionControls() {
        const isGeneral = this.collectionSelect.value === 'general';
        const isCustom = this.collectionSelect.value === 'custom';
        this.difficultySelect.disabled = !isGeneral;
        this.customPanel.hidden = !isCustom;
    }

    saveCustomPassages() {
        const passages = this.getCustomPassageList();
        if (passages.length === 0) {
            this.customStatus.textContent = 'Add at least one non-empty passage.';
            this.customPassages.focus();
            return;
        }

        localStorage.setItem('precisionTyperCustomPassages', this.customPassages.value);
        this.customStatus.textContent = `${passages.length} custom passage${passages.length === 1 ? '' : 's'} saved.`;
        this.resetGame();
    }

    saveSettings() {
        const settings = {
            isLightMode: this.modeToggle.checked,
            soundEnabled: this.soundToggle.checked,
            zenEnabled: this.zenToggle.checked,
            difficulty: this.difficultySelect.value,
            collection: this.collectionSelect.value
        };
        localStorage.setItem('precisionTyperSettings', JSON.stringify(settings));
    }

    loadSettings() {
        const saved = localStorage.getItem('precisionTyperSettings');
        if (saved) {
            try {
                const settings = JSON.parse(saved);
                this.modeToggle.checked = settings.isLightMode === true;
                this.soundToggle.checked = settings.soundEnabled !== false;
                this.zenToggle.checked = settings.zenEnabled !== false;
                if (['0', '1', '2'].includes(String(settings.difficulty))) {
                    this.difficultySelect.value = String(settings.difficulty);
                }
                if (['general', 'calm', 'quotes', 'code', 'custom'].includes(settings.collection)) {
                    this.collectionSelect.value = settings.collection;
                }
                this.toggleTheme();
            } catch (e) {
                console.error('Error loading settings:', e);
            }
        }

        this.customPassages.value = localStorage.getItem('precisionTyperCustomPassages') || '';
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
            this.textDisplay.textContent = 'Add a custom passage above, then choose Save & start.';
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
        let html = '';
        for (let i = 0; i < this.currentTargetText.length; i++) {
            const char = this.escapeCharacter(this.currentTargetText[i]);

            if (i < typed.length) {
                const match = typed[i] === this.currentTargetText[i];
                const cursorClass = i === caretPosition ? ' char-cursor' : '';
                html += `<span class="char-${match ? 'correct' : 'wrong'}${cursorClass}">${char}</span>`;
            } else {
                if (i === caretPosition) {
                    html += `<span class="char-cursor">${char}</span>`;
                } else {
                    html += `<span class="char-untyped">${char}</span>`;
                }
            }
        }

        for (let i = this.currentTargetText.length; i < typed.length; i++) {
            const cursorClass = i === caretPosition ? ' char-cursor' : '';
            html += `<span class="char-wrong char-extra${cursorClass}">${this.escapeCharacter(typed[i])}</span>`;
        }
        if (caretPosition === typed.length && typed.length >= this.currentTargetText.length) {
            html += '<span class="char-cursor char-end" aria-hidden="true">&nbsp;</span>';
        }
        this.textDisplay.innerHTML = html;
    }

    escapeCharacter(char) {
        if (char === '<') return '&lt;';
        if (char === '>') return '&gt;';
        if (char === '&') return '&amp;';
        if (char === ' ') return '&nbsp;';
        if (char === '\n') return '↵\n';
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
        this.announce('Passage skipped.');
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
        if (!this.inputArea.disabled) {
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

    let textDatabase = FALLBACK_TEXT_DATABASE;
    try {
        textDatabase = await loadTextDatabase();
    } catch (error) {
        console.error('Failed to load texts.json, using fallback passages:', error);
    }

    textDisplay.classList.remove('is-loading');
    inputArea.disabled = false;
    new PrecisionTyper(textDatabase);
});
