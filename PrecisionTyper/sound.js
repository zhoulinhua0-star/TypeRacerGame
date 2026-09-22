// Shared by the homepage and practice page. Keep the sound choice separate
// from session settings so choosing a sound cannot overwrite a saved session.
const SOUND_PROFILE_KEY = 'precisionTyperSoundProfile';

function readSoundProfile() {
    try {
        return localStorage.getItem(SOUND_PROFILE_KEY) === '10fastfingers' ? '10fastfingers' : 'soft';
    } catch (error) {
        return 'soft';
    }
}

function setupSoundPicker(engine, soundEnabled = () => true) {
    const picker = document.getElementById('sound-options');
    const inputs = [...picker.querySelectorAll('input[type="radio"]')];
    const preview = document.getElementById('sound-preview');
    const status = document.getElementById('sound-status');

    async function selectProfile(profile, audition = false) {
        engine.profile = profile;
        inputs.forEach((input) => { input.checked = input.value === profile; });
        status.textContent = profile === '10fastfingers' && !engine.samples ? 'Loading keyboard sounds…' : '';
        const previewing = audition && soundEnabled() ? engine.preview() : null;
        const ready = await engine.prepare();
        await previewing;
        if (engine.profile !== profile) return;
        status.textContent = ready ? '' : 'Sound unavailable. Select again to retry.';
    }

    inputs.forEach((input) => input.addEventListener('change', () => {
        if (!input.checked) return;
        try { localStorage.setItem(SOUND_PROFILE_KEY, input.value); } catch (error) {
            // The selection still works for this page when storage is blocked.
        }
        selectProfile(input.value, true);
    }));
    preview.addEventListener('click', async () => {
        await engine.preview();
        status.textContent = await engine.prepare() ? '' : 'Sound unavailable. Select again to retry.';
    });
    window.addEventListener('storage', (event) => {
        if (event.key === SOUND_PROFILE_KEY || event.key === null) selectProfile(readSoundProfile());
    });
    // Refresh a page restored from the back/forward cache as well.
    window.addEventListener('pageshow', () => selectProfile(readSoundProfile()));
    selectProfile(engine.profile);
}

/**
 * Shared keyboard audio: original Soft tap synthesis and per-key recordings.
 */
class ClickSoundEngine {
    constructor() {
        this.audioContext = null;
        this.buffers = {};
        this.profile = readSoundProfile();
        this.samples = null;
        this.samplesLoading = null;
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

    async loadSamples() {
        if (this.samples) return true;
        if (!this.audioContext) return false;
        if (this.samplesLoading) return this.samplesLoading;

        const keys = [...'abcdefghijklmnopqrstuvwxyz', 'space', 'backspace'];
        this.samplesLoading = Promise.all(keys.map(async (key) => {
            const response = await fetch(`sounds/10fastfingers/${key}.mp3`);
            if (!response.ok) throw new Error(`Sound sample unavailable: ${key}`);
            const buffer = await this.audioContext.decodeAudioData(await response.arrayBuffer());
            return [key, buffer];
        })).then((entries) => {
            this.samples = Object.fromEntries(entries);
            return true;
        }).catch(() => false).finally(() => {
            this.samplesLoading = null;
        });
        return this.samplesLoading;
    }

    async prepare() {
        return this.profile === '10fastfingers' ? this.loadSamples() : Boolean(this.audioContext);
    }

    async preview() {
        const profile = this.profile;
        try {
            // Resume during the click gesture, before waiting for sample downloads.
            if (this.audioContext?.state === 'suspended') await this.audioContext.resume().catch(() => {});
            if (await this.prepare() && this.profile === profile) this.play('tap', 'a');
        } catch (error) {
            // Audio may be unavailable; typing must remain usable.
        }
    }

    play(type = 'tap', key = '') {
        let variants = this.buffers[type] || this.buffers.tap;
        if (this.profile === '10fastfingers') {
            // Preserve the source's letter-specific recordings. Space also covers
            // Enter; unrecorded digits and punctuation use the A-key sample.
            const sampleKey = type === 'delete' ? 'backspace'
                : type === 'space' || type === 'enter' ? 'space'
                : /^[a-z]$/i.test(key) ? key.toLowerCase() : 'a';
            variants = this.samples?.[sampleKey] ? [this.samples[sampleKey]] : null;
        }
        if (!this.audioContext || !variants || variants.length === 0) return;

        try {
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume().catch(() => {});
            }

            const source = this.audioContext.createBufferSource();
            source.buffer = variants[Math.floor(Math.random() * variants.length)];
            if (this.profile === '10fastfingers') {
                const gain = this.audioContext.createGain();
                gain.gain.value = 0.3;
                source.connect(gain);
                gain.connect(this.audioContext.destination);
                source.onended = () => { source.disconnect(); gain.disconnect(); };
            } else {
                source.playbackRate.value = 0.975 + (Math.random() * 0.05);
                source.connect(this.audioContext.destination);
                source.onended = () => source.disconnect();
            }
            source.start(0);
        } catch (e) {
            // Silently fail if audio can't play
        }
    }
}
