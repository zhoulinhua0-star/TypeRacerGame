const clamp = (value, minimum = 0, maximum = 100) => (
    Math.min(maximum, Math.max(minimum, value))
);

const scale = (value, easyAnchor, hardAnchor) => (
    clamp(((value - easyAnchor) / (hardAnchor - easyAnchor)) * 100)
);

const round = (value, digits = 3) => Number(value.toFixed(digits));

const proseWords = (text) => text.match(/[A-Za-z]+(?:['’][A-Za-z]+)?/g) || [];

const countMatches = (text, pattern) => (text.match(pattern) || []).length;

const maxDelimiterDepth = (text) => {
    const opening = new Set(['(', '[', '{']);
    const closing = new Set([')', ']', '}']);
    let depth = 0;
    let maximum = 0;

    for (const character of text) {
        if (opening.has(character)) {
            depth++;
            maximum = Math.max(maximum, depth);
        } else if (closing.has(character)) {
            depth = Math.max(0, depth - 1);
        }
    }

    return maximum;
};

const maxIndentationDepth = (text) => Math.max(
    ...text.split('\n').map((line) => Math.floor((line.match(/^ */u)?.[0].length || 0) / 2))
);

const PROSE_CONFIG = {
    general: {
        weights: { length: 45, lexical: 25, precision: 12, structure: 18 },
        anchors: {
            length: [24, 410],
            averageWordLength: [4.1, 6.7],
            longWordRatio: [0.04, 0.38],
            precisionDensity: [0.018, 0.07],
            structureEvents: [1, 18],
            maximumSentenceWords: [7, 55]
        }
    },
    calm: {
        weights: { length: 50, lexical: 10, precision: 15, structure: 25 },
        anchors: {
            length: [55, 235],
            averageWordLength: [4.15, 5.35],
            longWordRatio: [0.02, 0.18],
            precisionDensity: [0.015, 0.055],
            structureEvents: [1, 16],
            maximumSentenceWords: [9, 36]
        }
    },
    quotes: {
        weights: { length: 50, lexical: 10, precision: 15, structure: 25 },
        anchors: {
            length: [24, 430],
            averageWordLength: [3.9, 5.5],
            longWordRatio: [0.03, 0.20],
            precisionDensity: [0.02, 0.07],
            structureEvents: [1, 22],
            maximumSentenceWords: [7, 55]
        }
    }
};

export const DIFFICULTY_SCORE_VERSION = 3;

export const DIFFICULTY_BANDS = {
    easy: { minimum: 0, maximum: 24 },
    medium: { minimum: 40, maximum: 60 },
    hard: { minimum: 72, maximum: 100 }
};

export const RAW_SCORE_THRESHOLDS = {
    general: { easyMaximum: 35, hardMinimum: 63 },
    calm: { easyMaximum: 20, hardMinimum: 60 },
    quotes: { easyMaximum: 20, hardMinimum: 60 },
    code: { easyMaximum: 20, hardMinimum: 65 }
};

export const MINIMUM_RAW_SCORE_GAPS = {
    general: 8,
    calm: 10,
    quotes: 10,
    code: 10
};

export const PROFILE_RULES = {
    calm: {
        easy: {
            characters: { maximum: 70 },
            words: { maximum: 14 },
            structureEvents: { maximum: 0 }
        },
        medium: {
            characters: { minimum: 125, maximum: 180 },
            words: { minimum: 20, maximum: 32 },
            structureEvents: { minimum: 1, maximum: 6 }
        },
        hard: {
            characters: { minimum: 350 },
            words: { minimum: 52 },
            averageWordLength: { minimum: 4.5 },
            structureEvents: { minimum: 7 }
        }
    },
    quotes: {
        easy: {
            characters: { maximum: 70 },
            words: { maximum: 14 },
            structureEvents: { maximum: 2 }
        },
        medium: {
            characters: { minimum: 80, maximum: 310 },
            words: { minimum: 13, maximum: 60 },
            structureEvents: { minimum: 3, maximum: 10 }
        },
        hard: {
            characters: { minimum: 350 },
            words: { minimum: 60 },
            structureEvents: { minimum: 8 },
            maximumSentenceWords: { minimum: 25 }
        }
    },
    code: {
        easy: {
            characters: { maximum: 55 },
            lines: { minimum: 1, maximum: 1 },
            maximumDelimiterDepth: { maximum: 1 },
            syntaxTransitions: { maximum: 2 }
        },
        medium: {
            characters: { minimum: 44, maximum: 120 },
            lines: { minimum: 2, maximum: 5 },
            maximumDelimiterDepth: { maximum: 2 },
            syntaxTransitions: { maximum: 4 }
        },
        hard: {
            characters: { minimum: 170 },
            lines: { minimum: 6 },
            maximumDelimiterDepth: { minimum: 2 },
            maximumIndentationDepth: { minimum: 1 }
        }
    }
};

const calibrateScore = (collection, rawScore) => {
    const thresholds = RAW_SCORE_THRESHOLDS[collection];
    if (rawScore <= thresholds.easyMaximum) {
        return Math.round(scale(rawScore, 0, thresholds.easyMaximum) * 0.24);
    }
    if (rawScore < thresholds.hardMinimum) {
        return Math.round(40 + scale(
            rawScore,
            thresholds.easyMaximum,
            thresholds.hardMinimum
        ) * 0.20);
    }
    return Math.round(72 + scale(rawScore, thresholds.hardMinimum, 100) * 0.28);
};

export function analyzePassage(text) {
    const words = proseWords(text);
    const letterCount = words.reduce(
        (total, word) => total + word.replace(/[^A-Za-z]/gu, '').length,
        0
    );
    const punctuationCount = countMatches(text, /[\p{P}\p{S}]/gu);
    const sentenceTransitions = countMatches(text, /[.!?](?:\s|$)/gu);
    const clauseMarks = countMatches(text, /[,;:—–()[\]{}]/gu);
    const quoteTransitions = countMatches(text, /[“”"‘’]/gu);
    const lines = text.split('\n');
    const sentenceWordCounts = text
        .split(/[.!?]+(?:\s|$)/gu)
        .map((sentence) => proseWords(sentence).length)
        .filter(Boolean);

    return {
        characters: text.length,
        words: words.length,
        averageWordLength: words.length === 0 ? 0 : round(letterCount / words.length),
        longWordRatio: words.length === 0
            ? 0
            : round(words.filter((word) => word.replace(/[^A-Za-z]/gu, '').length >= 8).length / words.length),
        precisionDensity: text.length === 0 ? 0 : round(punctuationCount / text.length),
        structureEvents: clauseMarks + Math.max(0, sentenceTransitions - 1) * 2 + Math.ceil(quoteTransitions / 2),
        maximumSentenceWords: Math.max(0, ...sentenceWordCounts),
        lines: lines.length,
        maximumDelimiterDepth: maxDelimiterDepth(text),
        maximumIndentationDepth: maxIndentationDepth(text),
        syntaxTransitions: countMatches(
            text,
            /\b(?:if|else|for|while|return|function|class|try|catch|throw|await|async|select|from|where|join|group|order|begin|commit|match|some|none)\b|=>|\?\?|::|\.\w+\s*\(/giu
        )
    };
}

function scoreProse(collection, metrics) {
    const config = PROSE_CONFIG[collection];
    const lexicalScore = (
        scale(metrics.averageWordLength, ...config.anchors.averageWordLength) * 0.45 +
        scale(metrics.longWordRatio, ...config.anchors.longWordRatio) * 0.55
    );

    const structureScore = (
        scale(metrics.structureEvents, ...config.anchors.structureEvents) * 0.55 +
        scale(metrics.maximumSentenceWords, ...config.anchors.maximumSentenceWords) * 0.45
    );
    const components = {
        length: scale(metrics.characters, ...config.anchors.length),
        lexical: lexicalScore,
        precision: scale(metrics.precisionDensity, ...config.anchors.precisionDensity),
        structure: structureScore
    };

    const score = Object.entries(config.weights).reduce(
        (total, [component, weight]) => total + components[component] * weight / 100,
        0
    );

    return { score, components };
}

function scoreCode(metrics) {
    const components = {
        length: scale(metrics.characters, 24, 220),
        lines: scale(metrics.lines, 1, 5),
        symbols: scale(metrics.precisionDensity, 0.09, 0.27),
        nesting: scale(metrics.maximumDelimiterDepth, 0, 3),
        indentation: scale(metrics.maximumIndentationDepth, 0, 3),
        syntax: scale(metrics.syntaxTransitions, 1, 11)
    };
    const weights = {
        length: 25,
        lines: 35,
        symbols: 10,
        nesting: 15,
        indentation: 5,
        syntax: 10
    };
    const score = Object.entries(weights).reduce(
        (total, [component, weight]) => total + components[component] * weight / 100,
        0
    );

    return { score, components };
}

export function scorePassage(collection, text) {
    if (!PROSE_CONFIG[collection] && collection !== 'code') {
        throw new Error(`Unsupported collection: ${collection}`);
    }

    const metrics = analyzePassage(text);
    const result = collection === 'code'
        ? scoreCode(metrics)
        : scoreProse(collection, metrics);

    return {
        score: calibrateScore(collection, result.score),
        rawScore: round(result.score),
        metrics,
        components: Object.fromEntries(
            Object.entries(result.components).map(([key, value]) => [key, round(value, 1)])
        )
    };
}

export function validatePassageProfile(collection, difficulty, text) {
    const rules = PROFILE_RULES[collection]?.[difficulty];
    if (!rules) return [];

    const metrics = analyzePassage(text);
    const failures = [];
    for (const [metric, limits] of Object.entries(rules)) {
        const value = metrics[metric];
        if (limits.minimum !== undefined && value < limits.minimum) {
            failures.push(`${metric} ${value} is below ${limits.minimum}`);
        }
        if (limits.maximum !== undefined && value > limits.maximum) {
            failures.push(`${metric} ${value} exceeds ${limits.maximum}`);
        }
    }
    return failures;
}

export function scoreFitsDifficulty(score, difficulty) {
    const band = DIFFICULTY_BANDS[difficulty];
    return Boolean(band && score >= band.minimum && score <= band.maximum);
}
