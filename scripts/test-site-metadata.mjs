import assert from 'node:assert/strict';
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = fileURLToPath(new URL('..', import.meta.url));
const siteRoot = path.join(repositoryRoot, 'PrecisionTyper');
const legacySitePattern = /zhoulinhua0-star\.github\.io\/TypeRacerGame/;

async function collectFiles(directory) {
    const entries = await readdir(directory, { withFileTypes: true });
    const files = [];

    for (const entry of entries) {
        if (entry.name === '.git') continue;
        const entryPath = path.join(directory, entry.name);
        if (entry.isDirectory()) files.push(...await collectFiles(entryPath));
        else if (entry.isFile()) files.push(entryPath);
    }

    return files;
}

const repositoryFiles = await collectFiles(repositoryRoot);
for (const file of repositoryFiles) {
    const contents = await readFile(file, 'utf8');
    assert.doesNotMatch(
        contents,
        legacySitePattern,
        `${path.relative(repositoryRoot, file)} must not reference the legacy GitHub Pages URL`
    );
}

const pageExpectations = [
    ['index.html', 'https://precisiontyper.com/'],
    ['game.html', 'https://precisiontyper.com/game.html']
];

for (const [filename, canonicalUrl] of pageExpectations) {
    const pagePath = path.join(siteRoot, filename);
    const html = await readFile(pagePath, 'utf8');

    assert.match(html, new RegExp(`<link rel="canonical" href="${canonicalUrl.replaceAll('.', '\\.')}">`));
    assert.match(html, /<meta property="og:type" content="website">/);
    assert.match(html, /<meta property="og:site_name" content="PrecisionTyper">/);
    assert.match(html, /<meta property="og:title" content="[^"]+">/);
    assert.match(html, /<meta property="og:description" content="[^"]+">/);
    assert.match(html, new RegExp(`<meta property="og:url" content="${canonicalUrl.replaceAll('.', '\\.')}">`));

    for (const match of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
        const reference = match[1];
        if (/^(?:#|https?:|mailto:|tel:|data:|javascript:)/.test(reference)) continue;
        const localReference = reference.split(/[?#]/, 1)[0];
        if (!localReference) continue;
        const target = path.resolve(path.dirname(pagePath), localReference);
        assert.ok((await stat(target)).isFile(), `${filename} references missing file ${localReference}`);
    }
}

const gameScript = await readFile(path.join(siteRoot, 'script.js'), 'utf8');
assert.match(gameScript, /fetch\(`texts\.json\?v=\$\{APP_ASSET_VERSION\}`/);
assert.ok((await stat(path.join(siteRoot, 'texts.json'))).isFile());

const robots = await readFile(path.join(siteRoot, 'robots.txt'), 'utf8');
assert.match(robots, /^User-agent: \*$/m);
assert.match(robots, /^Allow: \/$/m);
assert.match(robots, /^Sitemap: https:\/\/precisiontyper\.com\/sitemap\.xml$/m);

const sitemap = await readFile(path.join(siteRoot, 'sitemap.xml'), 'utf8');
assert.match(sitemap, /<loc>https:\/\/precisiontyper\.com\/<\/loc>/);
assert.match(sitemap, /<loc>https:\/\/precisiontyper\.com\/game\.html<\/loc>/);

console.log('Site domain, metadata, and local-link checks passed.');
