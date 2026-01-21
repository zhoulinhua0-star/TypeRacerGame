/**
 * PrecisionTyper: 
 * A rigorous typing speed and accuracy trainer.
 * Requires 100% character-match accuracy for completion.
 * - Procedural Mechanical Click Engine (Web Audio Version)
 * - Persistent Theme (Dark/Light)
 * - Full Comprehensive Database
 */

class PrecisionTyper {
    constructor() {
        // Text database
        this.TEXT_DATABASE = [
            [ // EASY
                "The sun rises in the east and sets in the west.",
                "System.out.println(\"Hello, World!\");",
                "A rolling stone gathers no moss.",
                "Clean code is happy code.",
                "Java is a high-level, class-based, object-oriented language.",
                "Practice makes perfect.",
                "Keep it simple, stupid (KISS).",
                "Debugging is like being the detective in a crime movie.",
                "While there is life, there is hope."
            ],
            [ // MEDIUM
                "Success is not final, failure is not fatal: it is the courage to continue that counts.",
                "Programming is the art of telling another human what one wants the computer to do.",
                "The quick brown fox jumps over the lazy dog. This sentence contains every letter in the alphabet.",
                "Any fool can write code that a computer can understand. Good programmers write code that humans can understand.",
                "Happiness can be found, even in the darkest of times, if one only remembers to turn on the light.",
                "Logic will get you from A to B. Imagination will take you everywhere.",
                "The only way to do great work is to love what you do. If you haven't found it yet, keep looking."
            ],
            [ // HARD
                "To be, or not to be, that is the question: Whether 'tis nobler in the mind to suffer the slings and arrows of outrageous fortune, or to take arms against a sea of troubles.",
                "A computer is like a violin. You can imagine it making music, but you have to learn how to play it. It takes thousands of hours of practice to become a virtuoso.",
                "Complexity is the enemy of reliability. Therefore, we must strive for simplicity in our architectures. A well-designed system is one that is easy to reason about.",
                "In software engineering, loose coupling is a design goal that seeks to reduce the interdependencies between components of a system with the goal of reducing the risk that changes in one component will require changes in any other component.",
                "It was the best of times, it was the worst of times, it was the age of wisdom, it was the age of foolishness, it was the epoch of belief, it was the epoch of incredulity."
            ]
        ];

        this.currentTargetText = '';
        this.isGameRunning = false;
        this.secondsElapsed = 0;
        this.gameTimer = null;
        
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

    gameOver() {
        if (this.gameTimer) {
            clearInterval(this.gameTimer);
        }
        this.isGameRunning = false;
        
        const wpm = this.wpmLabel.textContent;
        const accuracy = this.accuracyLabel.textContent;
        alert(`Done!\n${wpm}\n${accuracy}`);
        
        this.resetGame();
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
document.addEventListener('DOMContentLoaded', () => {
    new PrecisionTyper();
});

