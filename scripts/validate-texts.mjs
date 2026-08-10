import fs from 'node:fs';

const path = new URL('../PrecisionTyper/texts.json', import.meta.url);
const database = JSON.parse(fs.readFileSync(path, 'utf8'));
const groups = ['easy', 'medium', 'hard', 'calm', 'quotes', 'code'];
const errors = [];
const warnings = [];
const passages = [];

if (database.schemaVersion !== 2) {
    errors.push('schemaVersion must be 2');
}

for (const group of groups) {
    if (!Array.isArray(database[group]) || database[group].length === 0) {
        errors.push(`${group} must be a non-empty array`);
        continue;
    }

    database[group].forEach((passage, index) => {
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
        if (group === 'quotes' && source?.verified !== true) {
            errors.push(`${location} must have a verified source`);
        }

        passages.push({ ...passage, group, location });
    });
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
    console.log(`Validated ${passages.length} passages across ${groups.length} collections.`);
}
