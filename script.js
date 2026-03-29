/**
 * PrecisionTyper: 
 * A rigorous typing speed and accuracy trainer.
 * Requires 100% character-match accuracy for completion.
 * - Procedural Mechanical Click Engine (Web Audio Version)
 * - Persistent Theme (Dark/Light)
 * - Full Comprehensive Database
 */

const TEXT_DATABASE = [
    [ // EASY
        "The sun rises in the east and sets in the west.",
        "System.out.println(\"Hello, World!\");",
        "A rolling stone gathers no moss.",
        "Clean code is happy code.",
        "Java is a high-level, class-based, object-oriented language.",
        "Practice makes perfect.",
        "Keep it simple, stupid (KISS).",
        "Debugging is like being the detective in a crime movie.",
        "While there is life, there is hope.",
        "Rome was not built in a day.",
        "public static void main(String[] args)",
        "Knowledge is power.",
        "Better late than never.",
        "A friend in need is a friend indeed.",
        "Every cloud has a silver lining.",
        "Time flies like an arrow.",
        "Errors should never pass silently.",
        "Love is the bridge between you and everything."
    ],
    [ // MEDIUM
        "Success is not final, failure is not fatal: it is the courage to continue that counts.",
        "Programming is the art of telling another human what one wants the computer to do.",
        "The quick brown fox jumps over the lazy dog. This sentence contains every letter in the alphabet.",
        "Any fool can write code that a computer can understand. Good programmers write code that humans can understand.",
        "Happiness can be found, even in the darkest of times, if one only remembers to turn on the light.",
        "Logic will get you from A to B. Imagination will take you everywhere.",
        "The only way to do great work is to love what you do. If you haven't found it yet, keep looking.",
        "Life is what happens when you are busy making other plans.",
        "Your time is limited, so don't waste it living someone else's life.",
        "Design is not just what it looks like and feels like. Design is how it works.",
        "A person who never made a mistake never tried anything new.",
        "The best way to predict the future is to create it. Learning never exhausts the mind.",
        "Programs must be written for people to read, and only incidentally for machines to execute.",
        "It does not matter how slowly you go as long as you do not stop.",
        "Change is the only constant in life, so do not be afraid of it, embrace it instead.",
        "Coding is not just about syntax; it is about solving complex problems.",
        "It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife."
    ],
    [ // HARD
        "To be, or not to be, that is the question: Whether 'tis nobler in the mind to suffer the slings and arrows of outrageous fortune, or to take arms against a sea of troubles.",
        "A computer is like a violin. You can imagine it making music, but you have to learn how to play it. It takes thousands of hours of practice to become a virtuoso.",
        "Complexity is the enemy of reliability. Therefore, we must strive for simplicity in our architectures. A well-designed system is one that is easy to reason about.",
        "In software engineering, loose coupling is a design goal that seeks to reduce the interdependencies between components of a system with the goal of reducing the risk that changes in one component will require changes in any other component.",
        "It was the best of times, it was the worst of times, it was the age of wisdom, it was the age of foolishness, it was the epoch of belief, it was the epoch of incredulity.",
        "Two roads diverged in a wood, and I took the one less traveled by, and that has made all the difference.",
        "Abstraction is the process of removing physical, spatial, or temporal details or attributes in the study of objects or systems to focus attention on details of greater importance.",
        "Refactoring is a disciplined technique for restructuring an existing body of code, altering its internal structure without changing its external behavior.",
        "To understand recursion, one must first understand recursion; it is a fundamental concept that requires a shift in logical perspective.",
        "In the face of ambiguity, refuse the temptation to guess; instead, seek a solution based on empirical evidence and rigorous testing.",
        "The difference between a successful person and others is not a lack of strength, not a lack of knowledge, but rather a lack of will.",
        "What's in a name? That which we call a rose by any other name would smell as sweet; so Romeo would, were he not Romeo call'd, retain that dear perfection which he owes without that title.",
        "Our greatest glory is not in never falling, but in rising every time we fall, regardless of how daunting the challenge may appear.",
        "Technical debt is a concept in software development that reflects the implied cost of additional rework caused by choosing an easy solution now instead of using a better approach that would take longer.",
        "Strength does not come from winning; your struggles develop your strengths, and when you go through hardships and decide not to surrender, that is strength.",
        "Tis but thy name that is my enemy; thou art thyself, though not a Montague. What's Montague? It is nor hand, nor foot, nor arm, nor face, nor any other part belonging to a man. O, be some other name!"
    ]
];

class PrecisionTyper {
    constructor() {
        this.currentTargetText = '';
        this.lastTargetText = ''; // 【新增】：记录上一局的句子，用于查重
        this.isGameRunning = false;
        this.startTime = 0;
        this.gameTimer = null;

        // DOM 元素缓存
        this.DOM = {
            textDisplay: document.getElementById('text-display'),
            inputArea: document.getElementById('input-area'),
            timerLabel: document.getElementById('timer-label'),
            wpmLabel: document.getElementById('wpm-label'),
            accuracyLabel: document.getElementById('accuracy-label'),
            difficultySelect: document.getElementById('difficulty-select'),
            soundToggle: document.getElementById('sound-toggle')
        };

        this.soundEngine = new ClickSoundEngine();
        this.init();
    }

    async init() {
        this.loadSettings();
        this.setupEventListeners();
        await this.resetGame();
    }

    async pickNewText(difficultyIndex) {
        const difficultyTags = ['short,famous', 'technology,famous', 'wisdom,technology'];
        const apiUrl = `https://api.quotable.io/random?tags=${difficultyTags[difficultyIndex]}&maxLength=140`;
        let newText = "";

        // 尝试从 API 获取
        try {
            const response = await fetch(apiUrl);
            if (response.ok) {
                const data = await response.json();
                if (data?.content?.length > 0 && data.content !== this.lastTargetText) {
                    newText = data.content;
                }
            }
        } catch (e) {
            console.warn('API fetch failed, falling back to local database.');
        }

        // 如果 API 失败或者获取到的句子刚好和上一句一样，回退到本地题库
        if (!newText) {
            const options = TEXT_DATABASE[difficultyIndex] || TEXT_DATABASE[0];
            // 【核心防重复逻辑】：不断随机抽取，直到抽到的句子与上一局不同为止
            do {
                newText = options[Math.floor(Math.random() * options.length)];
            } while (newText === this.lastTargetText && options.length > 1);
        }

        this.currentTargetText = newText;
        this.lastTargetText = newText; // 更新历史记录
    }

    setupEventListeners() {
        this.DOM.inputArea.addEventListener('input', () => this.handleInput());
        this.DOM.difficultySelect.addEventListener('change', () => this.resetGame());
        this.DOM.soundToggle.addEventListener('change', () => this.saveSettings());
        
        // 禁用 Tab 键，防止输入框失去焦点
        this.DOM.inputArea.addEventListener('keydown', (e) => { 
            if(e.key === 'Tab') e.preventDefault(); 
        });
    }

    handleInput() {
        if (this.DOM.soundToggle.checked) this.soundEngine.playClick();
        this.checkProgress();
    }

    saveSettings() {
        localStorage.setItem('precisionTyperSettings', JSON.stringify({ 
            soundEnabled: this.DOM.soundToggle.checked 
        }));
    }

    loadSettings() {
        try {
            const saved = localStorage.getItem('precisionTyperSettings');
            if (saved) {
                this.DOM.soundToggle.checked = JSON.parse(saved).soundEnabled;
            }
        } catch (e) { console.error('Failed to load settings', e); }
    }

    startTimer() {
        if (this.isGameRunning) return;
        this.isGameRunning = true;
        this.startTime = performance.now();
        
        this.gameTimer = setInterval(() => {
            const secondsElapsed = Math.floor((performance.now() - this.startTime) / 1000);
            this.DOM.timerLabel.textContent = `Time: ${secondsElapsed}s`;
            this.updateLiveStats();
        }, 500);
    }

    checkProgress() {
        const typed = this.DOM.inputArea.value.replace(/[\r\n]/g, '');
        
        if (!this.isGameRunning && typed.length > 0) this.startTimer();
        
        this.updateTextStyles(typed);
        this.updateLiveStats(typed);

        if (typed === this.currentTargetText) this.gameOver();
    }

    updateLiveStats(typed = this.DOM.inputArea.value.replace(/[\r\n]/g, '')) {
        if (!this.isGameRunning || typed.length === 0) return;

        const minsPassed = Math.max((performance.now() - this.startTime) / 60000, 0.01);
        const wpm = Math.floor((typed.length / 5.0) / minsPassed);
        this.DOM.wpmLabel.textContent = `WPM: ${wpm}`;

        let correct = 0;
        const len = Math.min(typed.length, this.currentTargetText.length);
        for (let i = 0; i < len; i++) {
            if (typed[i] === this.currentTargetText[i]) correct++;
        }
        const accuracy = Math.floor((correct / Math.max(typed.length, 1)) * 100);
        this.DOM.accuracyLabel.textContent = `Accuracy: ${accuracy}%`;
    }

    updateTextStyles(typed) {
        const escapeMap = { '<': '&lt;', '>': '&gt;', '&': '&amp;', ' ': '&nbsp;' };
        
        const html = this.currentTargetText.split('').map((char, i) => {
            const displayChar = escapeMap[char] || char;

            if (i < typed.length) {
                const isCorrect = typed[i] === char;
                return `<span class="char-${isCorrect ? 'correct' : 'wrong'}">${displayChar}</span>`;
            } else if (i === typed.length) {
                return `<span class="char-cursor">${displayChar}</span>`;
            } else {
                return `<span class="char-untyped">${displayChar}</span>`;
            }
        }).join('');

        this.DOM.textDisplay.innerHTML = html;
    }

    gameOver() {
        clearInterval(this.gameTimer);
        this.isGameRunning = false;

        const wpm = this.DOM.wpmLabel.textContent;
        const accuracy = this.DOM.accuracyLabel.textContent;
        
        setTimeout(() => {
            alert(`🎉 Test Complete!\n${wpm}\n${accuracy}`);
            this.resetGame();
        }, 50);
    }

    async resetGame() {
        clearInterval(this.gameTimer);
        this.isGameRunning = false;
        
        this.DOM.timerLabel.textContent = 'Time: 0s';
        this.DOM.wpmLabel.textContent = 'WPM: 0';
        this.DOM.accuracyLabel.textContent = 'Accuracy: 100%';
        this.DOM.inputArea.value = '';
        
        this.DOM.inputArea.disabled = true; 
        await this.pickNewText(parseInt(this.DOM.difficultySelect.value));
        this.DOM.inputArea.disabled = false;
        
        this.updateTextStyles('');
        this.DOM.inputArea.focus();
    }
}

class ClickSoundEngine {
    constructor() {
        this.audioContext = null;
        this.buffer = null;
        this.isInitialized = false;
    }

    initializeAudio() {
        if (this.isInitialized) return;
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContext();
            
            const sampleRate = this.audioContext.sampleRate;
            const bufferSize = Math.floor(sampleRate * 0.025);

            this.buffer = this.audioContext.createBuffer(1, bufferSize, sampleRate);
            const data = this.buffer.getChannelData(0);

            for (let i = 0; i < bufferSize; i++) {
                const noise = (Math.random() * 2.0) - 1.0;
                const decay = 1.0 - (i / bufferSize);
                data[i] = noise * decay * 0.2;
            }
            this.isInitialized = true;
        } catch (e) { console.error('AudioContext error:', e); }
    }

    playClick() {
        this.initializeAudio();
        if (!this.audioContext || !this.buffer) return;
        
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        
        const source = this.audioContext.createBufferSource();
        source.buffer = this.buffer;
        source.connect(this.audioContext.destination);
        source.start(0);
    }
}

document.addEventListener('DOMContentLoaded', () => { new PrecisionTyper(); });
