// Standard QWERTY touch-typing reference; queried independently of practice results.
const FINGER_GROUPS = [
    ['lp', 'Left little finger', 'A', 'qaz'],
    ['lr', 'Left ring finger', 'S', 'wsx'],
    ['lm', 'Left middle finger', 'D', 'edc'],
    ['li', 'Left index finger', 'F', 'rfvtgb'],
    ['ri', 'Right index finger', 'J', 'yhnujm'],
    ['rm', 'Right middle finger', 'K', 'ik'],
    ['rr', 'Right ring finger', 'L', 'ol'],
    ['rp', 'Right little finger', ';', 'p']
];
const FINGER_MAPPING = Object.fromEntries(FINGER_GROUPS.flatMap(([finger, name, home, letters]) =>
    [...letters].map((letter) => [letter, { finger, name, home }])
));

class FingerGuide {
    constructor(game) {
        this.game = game;
        this.dialog = document.getElementById('finger-guide');
        this.trigger = document.getElementById('finger-guide-trigger');
        this.trigger.disabled = false;
        this.input = document.getElementById('finger-guide-letter');
        this.isMac = /Mac|iPhone|iPad/.test(navigator.platform);
        this.pausedAt = null;
        this.closeTimer = null;
        this.isComposing = false;
        const shortcut = this.isMac ? '⌘ ⇧ X' : 'Ctrl ⇧ X';
        this.trigger.setAttribute('aria-keyshortcuts', this.isMac ? 'Meta+Shift+X' : 'Control+Shift+X');
        this.trigger.title = `Open finger guide (${this.isMac ? 'Command' : 'Ctrl'} + Shift + X)`;
        document.querySelectorAll('[data-finger-shortcut]').forEach((badge) => { badge.textContent = shortcut; });
        this.buildKeyboard();

        this.trigger.addEventListener('click', () => this.open());
        this.dialog.querySelectorAll('.lookup-close, .lookup-return').forEach((button) => {
            button.addEventListener('click', () => this.close());
        });
        // Only a press and release on the backdrop closes it; dragging from the card does not.
        let backdropPress = false;
        const isBackdrop = (event) => {
            const bounds = this.dialog.getBoundingClientRect();
            return event.target === this.dialog && (event.clientX < bounds.left || event.clientX > bounds.right ||
                event.clientY < bounds.top || event.clientY > bounds.bottom);
        };
        this.dialog.addEventListener('pointerdown', (event) => { backdropPress = isBackdrop(event); });
        this.dialog.addEventListener('click', (event) => {
            if (isBackdrop(event) && backdropPress) this.close();
            backdropPress = false;
        });
        this.dialog.addEventListener('cancel', (event) => {
            event.preventDefault();
            if (!this.isComposing) this.close();
        });
        this.dialog.addEventListener('keydown', (event) => this.handleDialogKeydown(event));
        this.input.addEventListener('focus', () => this.input.select());
        this.input.addEventListener('compositionstart', () => { this.isComposing = true; });
        this.input.addEventListener('compositionend', () => {
            this.isComposing = false;
            this.renderInput();
        });
        this.input.addEventListener('input', (event) => {
            if (!event.isComposing && !this.isComposing) this.renderInput();
        });
        document.addEventListener('keydown', (event) => this.handleShortcut(event), true);
    }

    get isOpen() { return this.dialog.open; }

    buildKeyboard() {
        const keyboard = this.dialog.querySelector('.lookup-board');
        for (const letters of ['qwertyuiop', 'asdfghjkl', 'zxcvbnm']) {
            const row = document.createElement('div');
            row.className = 'lookup-board-row';
            for (const letter of letters) {
                const key = document.createElement('button');
                key.type = 'button';
                key.className = 'lookup-key';
                key.dataset.key = letter;
                key.textContent = letter.toUpperCase();
                key.setAttribute('aria-label', `${letter.toUpperCase()}: ${FINGER_MAPPING[letter].name}`);
                key.setAttribute('aria-pressed', 'false');
                if (letter === 'f' || letter === 'j') key.classList.add('home-anchor');
                key.addEventListener('click', () => {
                    this.render(letter);
                    this.input.focus({ preventScroll: true });
                    this.input.select();
                });
                row.append(key);
            }
            keyboard.append(row);
        }
    }

    renderInput() {
        const letters = this.input.value.match(/[a-z]/gi);
        this.render(letters?.at(-1)?.toLowerCase() || '');
    }

    render(letter) {
        const entry = FINGER_MAPPING[letter];
        this.input.value = letter.toUpperCase();
        this.dialog.querySelector('.lookup-answer-key').textContent = entry ? letter.toUpperCase() : '?';
        this.dialog.querySelector('.lookup-finger').textContent = entry ? entry.name : 'Choose a letter';
        const reference = this.dialog.querySelector('.lookup-reference');
        reference.replaceChildren();
        if (entry) {
            reference.append('Home key ');
            for (const text of [entry.home, letter.toUpperCase()]) {
                if (reference.querySelector('kbd')) reference.append(' → ');
                const key = document.createElement('kbd');
                key.textContent = text;
                reference.append(key);
            }
        } else reference.textContent = 'Standard QWERTY finger placement';
        this.dialog.querySelectorAll('[data-finger]').forEach((finger) => {
            finger.classList.toggle('active', Boolean(entry) && finger.dataset.finger === entry.finger);
        });
        this.dialog.querySelectorAll('[data-key]').forEach((key) => {
            key.setAttribute('aria-pressed', String(key.dataset.key === letter));
        });
        this.dialog.querySelector('svg').setAttribute('aria-label', entry
            ? `${entry.name} is recommended for ${letter.toUpperCase()}`
            : 'Choose a letter to highlight the recommended finger');
    }

    handleShortcut(event) {
        if (event.code !== 'KeyX' || !event.shiftKey || event.altKey ||
            !(this.isMac ? event.metaKey && !event.ctrlKey : event.ctrlKey && !event.metaKey)) return;
        const control = event.target?.closest?.('input, textarea, select, [contenteditable]:not([contenteditable="false"])');
        if (event.defaultPrevented || event.isComposing || event.repeat || this.isComposing ||
            this.game.compositionEdit || this.game.isSettingsMode || this.game.isShowingCompletion ||
            this.game.inputArea.disabled || (!this.isOpen && control && control !== this.game.inputArea)) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        this.open();
    }

    handleDialogKeydown(event) {
        // The guide owns keys while open; passage navigation, restart, and Focus stay paused.
        event.stopPropagation();
        if (event.isComposing || this.isComposing) return;
        if (event.key === 'Escape') {
            event.preventDefault();
            this.close();
        } else if (event.key === 'Tab' && !event.ctrlKey && !event.metaKey && !event.altKey) {
            // Explicit routing also includes buttons when Safari's full keyboard access is off.
            const stops = [...this.dialog.querySelectorAll('button, input')];
            const index = stops.indexOf(document.activeElement);
            const next = index === -1 ? (event.shiftKey ? stops.length - 1 : 0)
                : (index + (event.shiftKey ? -1 : 1) + stops.length) % stops.length;
            event.preventDefault();
            stops[next].focus();
        }
    }

    open() {
        if (this.game.isSettingsMode || this.game.isShowingCompletion || this.game.inputArea.disabled ||
            this.game.compositionEdit) return;
        if (this.isOpen) {
            window.clearTimeout(this.closeTimer);
            this.closeTimer = null;
            this.dialog.classList.remove('is-closing');
            this.input.focus({ preventScroll: true });
            this.input.select();
            return;
        }
        const typing = this.game.inputArea;
        this.selection = [typing.selectionStart, typing.selectionEnd, typing.selectionDirection];
        if (this.game.isGameRunning) {
            this.game.updateLiveStats();
            this.pausedAt = performance.now();
            clearInterval(this.game.gameTimer);
            this.game.gameTimer = null;
        }
        this.dialog.querySelector('.lookup-pause-pill').textContent = this.game.isGameRunning ? 'Practice paused' : 'Quick lookup';
        this.trigger.setAttribute('aria-expanded', 'true');
        document.body.classList.add('finger-guide-open');
        this.dialog.showModal();
        this.input.focus({ preventScroll: true });
        this.input.select();
    }

    close() {
        if (!this.isOpen || this.closeTimer !== null) return;
        this.dialog.classList.add('is-closing');
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) this.finishClose();
        else this.closeTimer = window.setTimeout(() => this.finishClose(), 180);
    }

    finishClose() {
        window.clearTimeout(this.closeTimer);
        this.closeTimer = null;
        this.dialog.close();
        this.dialog.classList.remove('is-closing');
        this.isComposing = false;
        document.body.classList.remove('finger-guide-open');
        this.trigger.setAttribute('aria-expanded', 'false');
        if (this.pausedAt !== null) {
            if (this.game.isGameRunning && this.game.startedAt !== null) {
                this.game.startedAt += performance.now() - this.pausedAt;
                this.game.gameTimer = setInterval(() => this.game.updateLiveStats(), 250);
            }
            this.pausedAt = null;
        }
        if (!this.game.inputArea.disabled) {
            this.game.inputArea.focus({ preventScroll: true });
            this.game.inputArea.setSelectionRange(...this.selection);
            this.game.updateTextStyles(this.game.getTypedText());
        }
        this.game.announce('Finger guide closed. Typing canvas focused.');
    }
}
