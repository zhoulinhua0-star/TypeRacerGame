import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
    DIFFICULTY_BANDS,
    DIFFICULTY_SCORE_VERSION,
    MINIMUM_RAW_SCORE_GAPS,
    scoreFitsDifficulty,
    scorePassage,
    validatePassageProfile
} from './difficulty-score.mjs';

const database = JSON.parse(
    fs.readFileSync(new URL('../PrecisionTyper/texts.json', import.meta.url), 'utf8')
);
const difficulties = ['easy', 'medium', 'hard'];
const median = (values) => {
    const sorted = [...values].sort((left, right) => left - right);
    return sorted[Math.floor(sorted.length / 2)];
};

assert.equal(database.difficultyStandard.version, DIFFICULTY_SCORE_VERSION);

for (const [collection, levels] of Object.entries(database.collections)) {
    const scoreGroups = [];
    const rawScoreGroups = [];

    for (const difficulty of difficulties) {
        const scores = levels[difficulty].map((passage) => {
            const first = scorePassage(collection, passage.text);
            const second = scorePassage(collection, passage.text);
            assert.deepEqual(second, first, `${passage.id} score must be deterministic`);
            assert.equal(
                scoreFitsDifficulty(first.score, difficulty),
                true,
                `${passage.id} score ${first.score} must fit ${difficulty}`
            );
            assert.deepEqual(
                validatePassageProfile(collection, difficulty, passage.text),
                [],
                `${passage.id} must fit the perceptual ${difficulty} profile`
            );
            return first;
        });
        scoreGroups.push(scores.map(({ score }) => score));
        rawScoreGroups.push(scores.map(({ rawScore }) => rawScore));
    }

    const minimumRawGap = MINIMUM_RAW_SCORE_GAPS[collection];
    assert.ok(
        Math.min(...rawScoreGroups[1]) - Math.max(...rawScoreGroups[0]) >= minimumRawGap,
        `${collection} easy-to-medium raw-score gap`
    );
    assert.ok(
        Math.min(...rawScoreGroups[2]) - Math.max(...rawScoreGroups[1]) >= minimumRawGap,
        `${collection} medium-to-hard raw-score gap`
    );

    const medians = scoreGroups.map(median);
    const minimumMedianGap = database.difficultyStandard.scoreModel.minimumMedianGap;
    assert.ok(medians[1] - medians[0] >= minimumMedianGap, `${collection} easy-to-medium median gap`);
    assert.ok(medians[2] - medians[1] >= minimumMedianGap, `${collection} medium-to-hard median gap`);
}

assert.ok(
    scorePassage('calm', 'Breathe slowly.').score < scorePassage(
        'calm',
        'Notice the unhurried movement of each deliberate keystroke; when attention wanders, acknowledge the interruption, release unnecessary tension, and return to the exact punctuation before you continue.'
    ).score
);
assert.ok(
    scorePassage('code', 'let count = 0;').score < scorePassage(
        'code',
        'for (const group of groups) {\n  if (group.items.length > 0) {\n    results.push(group.items.map((item) => item.value));\n  }\n}'
    ).score
);

for (const band of Object.values(DIFFICULTY_BANDS)) {
    assert.ok(band.minimum >= 0 && band.maximum <= 100 && band.minimum <= band.maximum);
}

console.log('Difficulty scoring, calibration, and separation tests passed.');
