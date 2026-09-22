import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import vm from 'node:vm';

const source = readFileSync(new URL('../PrecisionTyper/sound.js', import.meta.url), 'utf8');
const played = [];
const requests = [];
let savedProfile = null;
let failDownloads = false;
const context = vm.createContext({
    console,
    localStorage: {
        getItem() {
            if (savedProfile instanceof Error) throw savedProfile;
            return savedProfile;
        }
    },
    window: {
        AudioContext: class {
            sampleRate = 48000;
            state = 'suspended';
            destination = {};
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
            createGain() { return { gain: { value: 1 }, connect() {}, disconnect() {} }; }
            async decodeAudioData(data) { return { sample: data }; }
        }
    },
    async fetch(url) {
        requests.push(url);
        if (failDownloads) throw new Error('Offline');
        return { ok: true, arrayBuffer: async () => url };
    }
});
vm.runInContext(`${source}\nglobalThis.exports = { ClickSoundEngine, readSoundProfile };`, context);
const { ClickSoundEngine, readSoundProfile } = context.exports;

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
assert.equal(played[0].target, engine.audioContext.destination);

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
assert.equal(played.at(-1).target, retryEngine.audioContext.destination);

const samplesRoot = new URL('../PrecisionTyper/sounds/10fastfingers/', import.meta.url);
const manifest = JSON.parse(readFileSync(new URL('sources.json', samplesRoot), 'utf8'));
assert.equal(manifest.files.length, 28);
for (const entry of manifest.files) {
    const bytes = readFileSync(new URL(entry.file, samplesRoot));
    assert.equal(bytes.length, entry.bytes);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), entry.sha256);
}
console.log('Sound defaults, storage fallback, sample loading, key mapping, playback, retry, and asset integrity passed.');
