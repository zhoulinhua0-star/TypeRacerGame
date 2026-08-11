import fs from 'node:fs';
import {
    DIFFICULTY_BANDS,
    DIFFICULTY_SCORE_VERSION,
    MINIMUM_RAW_SCORE_GAPS,
    scoreFitsDifficulty,
    scorePassage,
    validatePassageProfile
} from './difficulty-score.mjs';

const path = new URL('../PrecisionTyper/texts.json', import.meta.url);
const database = JSON.parse(fs.readFileSync(path, 'utf8'));
const collections = ['general', 'calm', 'quotes', 'code'];
const difficulties = ['easy', 'medium', 'hard'];
const minimumPoolSize = 15;
const errors = [];
const warnings = [];
const passages = [];
const scoreSummaries = [];

if (database.schemaVersion !== 3) {
    errors.push('schemaVersion must be 3');
}

if (database.difficultyStandard?.version !== DIFFICULTY_SCORE_VERSION) {
    errors.push(`difficultyStandard.version must be ${DIFFICULTY_SCORE_VERSION}`);
}
if (!Array.isArray(database.difficultyStandard?.signals) || database.difficultyStandard.signals.length < 4) {
    errors.push('difficultyStandard.signals must define at least four shared signals');
}
for (const difficulty of difficulties) {
    if (typeof database.difficultyStandard?.tiers?.[difficulty] !== 'string') {
        errors.push(`difficultyStandard.tiers.${difficulty} must be a string`);
    }
}

const scoreModel = database.difficultyStandard?.scoreModel;
if (JSON.stringify(scoreModel?.range) !== JSON.stringify([0, 100])) {
    errors.push('difficultyStandard.scoreModel.range must be [0, 100]');
}
for (const difficulty of difficulties) {
    const band = DIFFICULTY_BANDS[difficulty];
    if (JSON.stringify(scoreModel?.bands?.[difficulty]) !== JSON.stringify([band.minimum, band.maximum])) {
        errors.push(`difficultyStandard.scoreModel.bands.${difficulty} does not match the scoring model`);
    }
}
if (!Number.isInteger(scoreModel?.boundaryBuffer) || scoreModel.boundaryBuffer < 0) {
    errors.push('difficultyStandard.scoreModel.boundaryBuffer must be a non-negative integer');
}
if (!Number.isInteger(scoreModel?.minimumMedianGap) || scoreModel.minimumMedianGap < 1) {
    errors.push('difficultyStandard.scoreModel.minimumMedianGap must be a positive integer');
}
for (const collection of collections) {
    if (scoreModel?.minimumRawScoreGaps?.[collection] !== MINIMUM_RAW_SCORE_GAPS[collection]) {
        errors.push(`difficultyStandard.scoreModel.minimumRawScoreGaps.${collection} does not match the scoring model`);
    }
}

const median = (values) => {
    const sorted = [...values].sort((left, right) => left - right);
    return sorted[Math.floor(sorted.length / 2)];
};

for (const collection of collections) {
    const levels = database.collections?.[collection];
    if (!levels || typeof levels !== 'object') {
        errors.push(`collections.${collection} must be an object`);
        continue;
    }
    const scoresByDifficulty = Object.fromEntries(difficulties.map((difficulty) => [difficulty, []]));
    const rawScoresByDifficulty = Object.fromEntries(difficulties.map((difficulty) => [difficulty, []]));

    for (const difficulty of difficulties) {
        const pool = levels[difficulty];
        const group = `${collection}.${difficulty}`;
        if (!Array.isArray(pool) || pool.length < minimumPoolSize) {
            errors.push(`${group} must contain at least ${minimumPoolSize} passages`);
            continue;
        }

        pool.forEach((passage, index) => {
            const location = `${group}[${index}]`;
            if (!passage || typeof passage !== 'object') {
                errors.push(`${location} must be an object`);
                return;
            }
            if (typeof passage.id !== 'string' || !/^[a-z]+-[0-9]{3}$/.test(passage.id)) {
                errors.push(`${location} has an invalid id`);
            }
            if (typeof passage.text !== 'string' || passage.text.trim() !== passage.text || passage.text.length === 0) {
                errors.push(`${location} has invalid or untrimmed text`);
            }
            if (passage.text?.includes('\r') || passage.text?.includes('\t')) {
                errors.push(`${location} contains a tab or carriage return`);
            }
            if (/[^\n\x20-\x7e“”‘’—–]/u.test(passage.text || '')) {
                errors.push(`${location} contains a character without a standard English-keyboard equivalent`);
            }
            if (/[\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff]/u.test(passage.text)) {
                errors.push(`${location} contains non-standard whitespace`);
            }
            if (/[\u00ad\u200b-\u200d\u2060]/u.test(passage.text)) {
                errors.push(`${location} contains a zero-width or soft-hyphen character`);
            }
            if (/ +$/mu.test(passage.text)) {
                errors.push(`${location} contains trailing spaces on a line`);
            }
            passage.text?.split('\n').forEach((line, lineIndex) => {
                const contentWithoutIndentation = line.replace(/^ +/u, '');
                if (/ {2,}/u.test(contentWithoutIndentation)) {
                    errors.push(`${location} contains repeated spaces on line ${lineIndex + 1}`);
                }
            });

            const source = passage.source;
            for (const field of ['type', 'title', 'author', 'url', 'license']) {
                if (!source || typeof source[field] !== 'string' || source[field].trim().length === 0) {
                    errors.push(`${location}.source.${field} is required`);
                }
            }
            if (!source || typeof source.verified !== 'boolean') {
                errors.push(`${location}.source.verified must be a boolean`);
            }
            if (collection === 'quotes') {
                if (source?.verified !== true) {
                    errors.push(`${location} must have a verified source`);
                }
                if (source?.type !== 'public-domain-literature') {
                    errors.push(`${location} must identify public-domain literature`);
                }
                if (!/^https:\/\/(www\.)?gutenberg\.org\//u.test(source?.url || '')) {
                    errors.push(`${location} must link to a Project Gutenberg source`);
                }
                if (!source?.license?.startsWith('Public domain in the United States')) {
                    errors.push(`${location} must state its public-domain license status`);
                }
            }
            if (collection === 'code' && difficulty === 'easy' && passage.text?.includes('\n')) {
                errors.push(`${location} easy code must remain a single line`);
            }
            if (collection === 'code' && difficulty === 'hard' && passage.text?.split('\n').length < 4) {
                errors.push(`${location} hard code must contain at least four lines`);
            }

            if (typeof passage.text === 'string' && passage.text.length > 0) {
                const scoredPassage = scorePassage(collection, passage.text);
                const difficultyScore = scoredPassage.score;
                const band = DIFFICULTY_BANDS[difficulty];
                const boundaryBuffer = scoreModel?.boundaryBuffer || 0;
                if (!scoreFitsDifficulty(difficultyScore, difficulty)) {
                    errors.push(`${location} has score ${difficultyScore}, outside the ${difficulty} band`);
                } else if (difficulty === 'easy' && difficultyScore > band.maximum - boundaryBuffer) {
                    errors.push(`${location} has score ${difficultyScore}, too close to the medium boundary`);
                } else if (
                    difficulty === 'medium' &&
                    (difficultyScore < band.minimum + boundaryBuffer || difficultyScore > band.maximum - boundaryBuffer)
                ) {
                    errors.push(`${location} has score ${difficultyScore}, too close to an adjacent boundary`);
                } else if (difficulty === 'hard' && difficultyScore < band.minimum + boundaryBuffer) {
                    errors.push(`${location} has score ${difficultyScore}, too close to the medium boundary`);
                }
                scoresByDifficulty[difficulty].push(difficultyScore);
                rawScoresByDifficulty[difficulty].push(scoredPassage.rawScore);
                for (const profileFailure of validatePassageProfile(collection, difficulty, passage.text)) {
                    errors.push(`${location} fails its ${difficulty} profile: ${profileFailure}`);
                }
            }

            passages.push({ ...passage, collection, difficulty, group, location });
        });
    }

    const medians = difficulties.map((difficulty) => median(levels[difficulty]?.map((passage) => passage.text.length) || []));
    if (!medians.every(Number.isFinite) || !(medians[0] < medians[1] && medians[1] < medians[2])) {
        errors.push(`${collection} median passage length must increase from easy to medium to hard`);
    }

    const scoreMedians = difficulties.map((difficulty) => median(scoresByDifficulty[difficulty]));
    const minimumMedianGap = scoreModel?.minimumMedianGap || 0;
    if (
        !scoreMedians.every(Number.isFinite) ||
        scoreMedians[1] - scoreMedians[0] < minimumMedianGap ||
        scoreMedians[2] - scoreMedians[1] < minimumMedianGap
    ) {
        errors.push(`${collection} difficulty-score medians must be separated by at least ${minimumMedianGap} points`);
    }
    const rawGaps = [
        Math.min(...rawScoresByDifficulty.medium) - Math.max(...rawScoresByDifficulty.easy),
        Math.min(...rawScoresByDifficulty.hard) - Math.max(...rawScoresByDifficulty.medium)
    ];
    const minimumRawGap = MINIMUM_RAW_SCORE_GAPS[collection];
    if (rawGaps.some((gap) => gap < minimumRawGap)) {
        errors.push(`${collection} adjacent raw-score gaps must each be at least ${minimumRawGap} points`);
    }
    scoreSummaries.push({ collection, scoresByDifficulty, scoreMedians, rawGaps });
}

const ids = new Map();
const normalizedTexts = new Map();
const normalize = (text) => text
    .normalize('NFKC')
    .toLocaleLowerCase('en-US')
    .replace(/[\p{P}\p{S}\s]+/gu, ' ')
    .trim();

for (const passage of passages) {
    if (ids.has(passage.id)) {
        errors.push(`duplicate id: ${passage.id} (${ids.get(passage.id)} and ${passage.location})`);
    } else {
        ids.set(passage.id, passage.location);
    }

    const normalized = normalize(passage.text);
    if (normalizedTexts.has(normalized)) {
        errors.push(`duplicate text: ${normalizedTexts.get(normalized)} and ${passage.location}`);
    } else {
        normalizedTexts.set(normalized, passage.location);
    }
}

const trigrams = (text) => {
    const words = normalize(text).split(' ').filter(Boolean);
    const values = new Set();
    for (let index = 0; index + 2 < words.length; index++) {
        values.add(words.slice(index, index + 3).join(' '));
    }
    return values;
};

for (let left = 0; left < passages.length; left++) {
    const leftTrigrams = trigrams(passages[left].text);
    for (let right = left + 1; right < passages.length; right++) {
        const rightTrigrams = trigrams(passages[right].text);
        let shared = 0;
        for (const trigram of leftTrigrams) {
            if (rightTrigrams.has(trigram)) shared++;
        }
        const union = leftTrigrams.size + rightTrigrams.size - shared;
        const similarity = union === 0 ? 0 : shared / union;
        if (shared >= 8 && similarity >= 0.12) {
            warnings.push(
                `possible overlap: ${passages[left].id} and ${passages[right].id} ` +
                `(${shared} shared trigrams, ${(similarity * 100).toFixed(0)}%)`
            );
        }
    }
}

const pendingSources = passages.filter((passage) => passage.source.verified === false).length;
if (pendingSources > 0) {
    warnings.push(`${pendingSources} project-curated passages still have legacy provenance pending review`);
}

for (const warning of warnings) {
    console.warn(`Warning: ${warning}`);
}

if (errors.length > 0) {
    for (const error of errors) {
        console.error(`Error: ${error}`);
    }
    process.exitCode = 1;
} else {
    console.log(`Validated ${passages.length} passages across ${collections.length} collections and ${difficulties.length} difficulty levels.`);
    for (const { collection, scoresByDifficulty, scoreMedians, rawGaps } of scoreSummaries) {
        const summary = difficulties.map((difficulty, index) => {
            const scores = scoresByDifficulty[difficulty];
            return `${difficulty} ${Math.min(...scores)}-${Math.max(...scores)} (median ${scoreMedians[index]})`;
        }).join('; ');
        console.log(`  ${collection}: ${summary}; raw gaps ${rawGaps.map((gap) => gap.toFixed(1)).join(' / ')}`);
    }
}
