import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import vm from 'node:vm';

const source = readFileSync(new URL('../PrecisionTyper/sound.js', import.meta.url), 'utf8');
const played = [];
const requests = [];
let savedProfile = null;
let failDownloads = false;
const settingsStorage = new Map();
const context = vm.createContext({
    console,
    localStorage: {
        getItem(key) {
            if (savedProfile instanceof Error) throw savedProfile;
            return key === 'precisionTyperSoundProfile' ? savedProfile : settingsStorage.get(key) ?? null;
        }
    },
    window: {
        AudioContext: class {
            sampleRate = 48000;
            state = 'suspended';
            destination = {};
            currentTime = 0;
            resume() { this.state = 'running'; return Promise.resolve(); }
            createBuffer(channels, length) {
                const data = new Float32Array(length);
                return { getChannelData: () => data };
            }
            createBufferSource() {
                return {
                    playbackRate: { value: 1 },
                    connect(target) { this.target = target; },
                    disconnect() {},
                    start() { played.push(this); }
                };
            }
            createGain() {
                return {
                    gain: { value: 1, setTargetAtTime(value) { this.value = value; } },
                    connect(target) { this.target = target; }, disconnect() {}
                };
            }
            createDynamicsCompressor() {
                return {
                    threshold: {}, knee: {}, ratio: {}, attack: {}, release: {},
                    connect(target) { this.target = target; }
                };
            }
            async decodeAudioData(data) { return { sample: data }; }
        }
    },
    async fetch(url) {
        requests.push(url);
        if (failDownloads) throw new Error('Offline');
        return { ok: true, arrayBuffer: async () => url };
    }
});
vm.runInContext(`${source}\nglobalThis.exports = { ClickSoundEngine, readSoundProfile, readSoundSettings, soundVolumeGain };`, context);
const { ClickSoundEngine, readSoundProfile, readSoundSettings, soundVolumeGain } = context.exports;

for (const value of [null, 'unknown', new Error('Storage blocked')]) {
    savedProfile = value;
    assert.equal(readSoundProfile(), 'soft');
}
savedProfile = '10fastfingers';
assert.equal(readSoundProfile(), '10fastfingers');
savedProfile = null;
const engine = new ClickSoundEngine();
assert.equal(await engine.prepare(), true);
assert.equal(requests.length, 0, 'The default sound must not download recordings');
engine.play('tap', 'a');
assert.equal(played.length, 1);
assert.ok(played[0].playbackRate.value >= 0.975 && played[0].playbackRate.value <= 1.025);
assert.equal(played[0].target, engine.masterGain);
assert.equal(engine.masterGain.gain.value, 1, '60% preserves the original sound level');
assert.equal(engine.masterGain.target.target, engine.audioContext.destination, 'Both sounds pass through the peak limiter');
assert.equal(soundVolumeGain(0), 0);
assert.equal(soundVolumeGain(60), 1);
assert.equal(soundVolumeGain(100), 8, 'Maximum volume provides substantial extra gain');
for (let volume = 1; volume <= 100; volume++) {
    assert.ok(soundVolumeGain(volume) > soundVolumeGain(volume - 1), 'Volume must increase smoothly');
}
settingsStorage.set('precisionTyperSettings', JSON.stringify({ soundEnabled: false }));
assert.equal(readSoundSettings().enabled, false, 'Migrate existing muted sessions');
settingsStorage.set('precisionTyperSoundSettings', JSON.stringify({ volume: 85, enabled: true }));
assert.equal(readSoundSettings().volume, 85);
assert.equal(readSoundSettings().enabled, true, 'Shared sound settings override the old practice-only mute setting');
for (const [saved, expected] of [[-10, 0], [140, 100], ['oops', 60]]) {
    settingsStorage.set('precisionTyperSoundSettings', JSON.stringify({ volume: saved }));
    assert.equal(readSoundSettings().volume, expected);
}
settingsStorage.clear();

const beforeMute = played.length;
engine.enabled = false;
engine.updateVolume();
assert.equal(engine.masterGain.gain.value, 0);
engine.play();
assert.equal(await engine.preview(), false);
assert.equal(played.length, beforeMute, 'Typing and preview both respect mute');
engine.enabled = true;
engine.volume = 0;
engine.updateVolume();
engine.play();
assert.equal(await engine.preview(), false);
assert.equal(played.length, beforeMute, 'Zero volume is silent');
engine.volume = 100;
engine.updateVolume();
assert.equal(engine.masterGain.gain.value, 8);
engine.volume = 60;
engine.updateVolume();

engine.profile = '10fastfingers';
engine.play('tap', 'a');
assert.equal(played.length, 1, 'Do not substitute a different sound while samples load');
await Promise.all([engine.prepare(), engine.prepare()]);
assert.equal(requests.length, 28, 'Concurrent preparation must share one download');
for (const [type, key, sample] of [
    ['tap', 'a', 'a'], ['tap', 'Z', 'z'], ['space', ' ', 'space'],
    ['delete', '', 'backspace'], ['enter', '', 'space'], ['tap', '1', 'a']
]) {
    engine.play(type, key);
    const last = played.at(-1);
    assert.equal(last.buffer.sample, `sounds/10fastfingers/${sample}.mp3`);
    assert.equal(last.playbackRate.value, 1, 'Keep the recordings at their original pitch');
    assert.equal(last.target.gain.value, 0.3, 'Match the source volume');
}
assert.notEqual(played.at(-1), played.at(-2), 'Rapid keys need independent overlapping sources');

const retryEngine = new ClickSoundEngine();
retryEngine.profile = '10fastfingers';
failDownloads = true;
assert.equal(await retryEngine.prepare(), false);
assert.equal(retryEngine.samples, null);
failDownloads = false;
assert.equal(await retryEngine.prepare(), true, 'A failed download must be retryable');
retryEngine.profile = 'soft';
retryEngine.play('space');
assert.equal(played.at(-1).target, retryEngine.masterGain);

const samplesRoot = new URL('../PrecisionTyper/sounds/10fastfingers/', import.meta.url);
const manifest = JSON.parse(readFileSync(new URL('sources.json', samplesRoot), 'utf8'));
assert.equal(manifest.files.length, 28);
for (const entry of manifest.files) {
    const bytes = readFileSync(new URL(entry.file, samplesRoot));
    assert.equal(bytes.length, entry.bytes);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), entry.sha256);
}
console.log('Sound defaults, storage fallback, sample loading, key mapping, playback, retry, and asset integrity passed.');
