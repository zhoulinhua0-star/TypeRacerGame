/**
 * PrecisionTyper: 
 * A rigorous typing speed and accuracy trainer.
 * Requires 100% character-match accuracy for completion.
 * - Procedural Mechanical Click Engine (Web Audio Version)
 * - Persistent Theme (Dark/Light) [FIXED & ENHANCED]
 * - Passage database loaded from texts.json
 */

const APP_ASSET_VERSION = '3';

const FALLBACK_TEXT_DATABASE = [
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
        "The quick brown fox jumps over the lazy dog.",
        "Logic will get you from A to B. Imagination will take you everywhere.",
        "First, solve the problem. Then, write the code.",
        "Make it work, make it right, make it fast.",
        "Talk is cheap. Show me the code.",
        "Good code is its own best documentation.",
        "The secret of getting ahead is getting started.",
        "Quality is not an act, it is a habit.",
        "There are only two hard things in computer science: cache invalidation and naming things.",
        "Do not count the days; make the days count."
    ],
    [
        "To be, or not to be, that is the question.",
        "Complexity is the enemy of reliability.",
        "Two roads diverged in a wood, and I took the one less traveled by, and that has made all the difference.",
        "Premature optimization is the root of all evil in programming.",
        "The purpose of software engineering is to control complexity, not to create it.",
        "A user interface is like a joke; if you have to explain it, it is not that good.",
        "The cost of adding a feature is not just the time it takes to code it.",
        "When you have eliminated the impossible, whatever remains must be the truth."
    ]
];

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
        return data.map(sanitizePassageList);
    }

    if (data && data.easy && data.medium && data.hard) {
        return [
            sanitizePassageList(data.easy),
            sanitizePassageList(data.medium),
            sanitizePassageList(data.hard)
        ];
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
        this.secondsElapsed = 0;
        this.gameTimer = null;
        this.completionOverlay = null;
        
        // DOM elements
        this.textDisplay = document.getElementById('text-display');
        this.inputArea = document.getElementById('input-area');
        this.timerLabel = document.getElementById('timer-label');
        this.wpmLabel = document.getElementById('wpm-label');
        this.accuracyLabel = document.getElementById('accuracy-label');
        this.difficultySelect = document.getElementById('difficulty-select');
        this.soundToggle = document.getElementById('sound-toggle');
        this.modeToggle = document.getElementById('mode-toggle');
        
        // Initialize sound engine
        this.soundEngine = new ClickSoundEngine();
        
        // Load settings and initialize
        this.loadSettings();
        this.pickNewText(1);
        this.setupEventListeners();
        this.updateTextStyles('');
    }

    pickNewText(difficultyIndex) {
        const options = this.TEXT_DATABASE[difficultyIndex];
        if (!options || options.length === 0) {
            this.currentTargetText = 'Practice makes perfect.';
            return;
        }
        this.currentTargetText = options[Math.floor(Math.random() * options.length)];
    }

    setupEventListeners() {
        // Input area listener
        this.inputArea.addEventListener('input', (e) => {
            this.handleInput(true);
        });

        // Difficulty change
        this.difficultySelect.addEventListener('change', () => {
            this.resetGame();
        });

        // Sound toggle
        this.soundToggle.addEventListener('change', () => {
            // No action needed, just stored for later use
        });

        // Theme toggle
        this.modeToggle.addEventListener('change', () => {
            this.toggleTheme();
            this.saveSettings();
        });

        // Prevent tab from leaving input area
        this.inputArea.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                e.preventDefault();
            }
        });
    }

    handleInput(playSound) {
        if (playSound && this.soundToggle.checked) {
            this.soundEngine.playClick();
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

    saveSettings() {
        const settings = {
            isLightMode: this.modeToggle.checked,
            soundEnabled: this.soundToggle.checked
        };
        localStorage.setItem('precisionTyperSettings', JSON.stringify(settings));
    }

    loadSettings() {
        const saved = localStorage.getItem('precisionTyperSettings');
        if (saved) {
            try {
                const settings = JSON.parse(saved);
                this.modeToggle.checked = settings.isLightMode || false;
                this.soundToggle.checked = settings.soundEnabled !== false;
                this.toggleTheme();
            } catch (e) {
                console.error('Error loading settings:', e);
            }
        }
    }

    startTimer() {
        if (this.isGameRunning) return;
        this.isGameRunning = true;
        this.gameTimer = setInterval(() => {
            this.secondsElapsed++;
            this.timerLabel.textContent = `Time: ${this.secondsElapsed}s`;
            this.updateLiveStats();
        }, 1000);
    }

    checkProgress() {
        const typed = this.inputArea.value.replace(/\n/g, '').replace(/\r/g, '');
        if (!this.isGameRunning && typed.length > 0) {
            this.startTimer();
        }
        this.updateTextStyles(typed);
        this.updateLiveStats();
        if (typed === this.currentTargetText) {
            this.gameOver();
        }
    }

    updateLiveStats() {
        const typed = this.inputArea.value.replace(/\n/g, '').replace(/\r/g, '');
        if (typed.length === 0) return;
        
        const mins = Math.max(this.secondsElapsed / 60.0, 0.01);
        const wpm = Math.floor((typed.length / 5.0) / mins);
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
        let html = '';
        for (let i = 0; i < this.currentTargetText.length; i++) {
            let char = this.currentTargetText[i];
            // Escape HTML special characters
            if (char === '<') char = '&lt;';
            else if (char === '>') char = '&gt;';
            else if (char === '&') char = '&amp;';
            else if (char === ' ') char = '&nbsp;';
            
            if (i < typed.length) {
                const match = typed[i] === this.currentTargetText[i];
                html += `<span class="char-${match ? 'correct' : 'wrong'}">${char}</span>`;
            } else {
                if (i === typed.length) {
                    html += `<span class="char-cursor">${char}</span>`;
                } else {
                    html += `<span class="char-untyped">${char}</span>`;
                }
            }
        }
        this.textDisplay.innerHTML = html;
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
                <p class="completion-subtitle">Perfect match — great work.</p>
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

        this.completionTimeEl.textContent = time;
        this.completionWpmEl.textContent = wpm.replace('WPM: ', '');
        this.completionAccuracyEl.textContent = accuracy.replace('Accuracy: ', '');

        this.inputArea.disabled = true;
        this.completionOverlay.hidden = false;
        requestAnimationFrame(() => {
            this.completionOverlay.classList.add('is-visible');
        });
        this.completionOverlay.querySelector('.completion-btn').focus();
    }

    dismissCompletionOverlay() {
        if (!this.completionOverlay || this.completionOverlay.hidden) return;

        this.completionOverlay.classList.remove('is-visible');
        window.setTimeout(() => {
            this.completionOverlay.hidden = true;
            this.inputArea.disabled = false;
            this.isShowingCompletion = false;
            this.resetGame();
        }, 280);
    }

    gameOver() {
        if (this.isShowingCompletion) return;
        this.isShowingCompletion = true;

        if (this.gameTimer) {
            clearInterval(this.gameTimer);
        }
        this.isGameRunning = false;

        const wpm = this.wpmLabel.textContent;
        const accuracy = this.accuracyLabel.textContent;
        const time = this.timerLabel.textContent.replace('Time: ', '');
        this.showCompletionOverlay(wpm, accuracy, time);
    }

    resetGame() {
        if (this.gameTimer) {
            clearInterval(this.gameTimer);
        }
        this.secondsElapsed = 0;
        this.isGameRunning = false;
        this.timerLabel.textContent = 'Time: 0s';
        this.wpmLabel.textContent = 'WPM: 0';
        this.accuracyLabel.textContent = 'Accuracy: 100%';
        this.inputArea.value = '';
        this.pickNewText(parseInt(this.difficultySelect.value));
        this.updateTextStyles('');
        this.inputArea.focus();
    }
}

/**
 * Mechanical Sound Engine: Procedural White Noise Version (Web Audio API)
 */
class ClickSoundEngine {
    constructor() {
        this.audioContext = null;
        this.buffer = null;
        this.initializeAudio();
    }

    initializeAudio() {
        try {
            // Create audio context (works in modern browsers)
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Generate click sound buffer
            const sampleRate = this.audioContext.sampleRate;
            const durationMs = 25;
            const bufferSize = Math.floor(sampleRate * (durationMs / 1000.0));
            
            this.buffer = this.audioContext.createBuffer(1, bufferSize, sampleRate);
            const data = this.buffer.getChannelData(0);
            
            // Generate procedural white noise with decay
            for (let i = 0; i < bufferSize; i++) {
                const noise = (Math.random() * 2.0) - 1.0;
                const decay = 1.0 - (i / bufferSize);
                const amplitude = noise * (decay * decay);
                data[i] = amplitude * 0.3; // Lower volume for web
            }
        } catch (e) {
            console.error('Audio initialization failed:', e);
        }
    }

    playClick() {
        if (!this.audioContext || !this.buffer) {
            // Try to reinitialize if needed
            if (this.audioContext && this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }
            return;
        }

        try {
            // Resume audio context if suspended (browser autoplay policy)
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }

            const source = this.audioContext.createBufferSource();
            source.buffer = this.buffer;
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
