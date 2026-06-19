/**
 * PrecisionTyper: 
 * A rigorous typing speed and accuracy trainer.
 * Requires 100% character-match accuracy for completion.
 * - Procedural Mechanical Click Engine (Web Audio Version)
 * - Persistent Theme (Dark/Light) [FIXED & ENHANCED]
 * - Passage database loaded from texts.json
 */

const APP_ASSET_VERSION = '4';

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
