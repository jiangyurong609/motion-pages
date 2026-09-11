#!/usr/bin/env node
// motion-pages catalog check — the demo list is claimed in seven places; this asserts
// they still agree. Zero dependencies, no browser, runs in well under a second.
//
//   node scripts/check-catalog.mjs          # human report, exit 1 on any mismatch
//   node scripts/check-catalog.mjs --json
//
// Why this exists: an agent that reads a stale catalog invents demo names and prompt
// URLs that 404. The demo set is the one thing in this repo that changes often AND is
// duplicated across the skill, the site, the plugin manifest and llms.txt — so it is
// the one thing that drifts. It has, twice: marketplace.json said "eleven live demos"
// with thirteen shipped, and SKILL.md's example list lost volera-morph and tempo-easing.
//
// Two counts live here and must NOT be conflated:
//   demos     — every examples/*.html (currently 13)
//   archetypes — the re-themable subset the bench offers, docs/index.html ARCHS
//                (currently 11; sylva-replica is a replica study and tempo-easing is a
//                reference sheet, so neither is brand-themeable)

import {readFileSync, readdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname, join, resolve} from 'node:path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const jsonOut = process.argv.includes('--json');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');
const htmlNames = (dir) =>
  readdirSync(join(ROOT, dir))
    .filter((f) => f.endsWith('.html'))
    .map((f) => f.replace(/\.html$/, ''))
    .sort();

const fails = [];
const fail = (rule, msg) => fails.push({rule, msg});
const missing = (a, b) => a.filter((x) => !b.includes(x));

// ---------- the source of truth ----------

const demos = htmlNames('motion-pages/examples');
const N = demos.length;

// ---------- 1. the two example dirs are the same set ----------

const docsDemos = htmlNames('docs/examples');
for (const [label, gone] of [
  ['docs/examples', missing(demos, docsDemos)],
  ['motion-pages/examples', missing(docsDemos, demos)],
]) {
  if (gone.length) fail('examples in sync', `${label} is missing: ${gone.join(', ')}`);
}

// ---------- 2. every demo has a build-spec prompt, and vice versa ----------

const prompts = readdirSync(join(ROOT, 'docs/prompts'))
  .filter((f) => f.endsWith('.txt'))
  .map((f) => f.replace(/\.txt$/, ''))
  .sort();
const noPrompt = missing(demos, prompts);
const orphanPrompt = missing(prompts, demos);
if (noPrompt.length) fail('prompt per demo', `no docs/prompts/*.txt for: ${noPrompt.join(', ')}`);
if (orphanPrompt.length) fail('prompt per demo', `prompt with no demo: ${orphanPrompt.join(', ')}`);

// ---------- 3. llms.txt lists every demo AND every prompt ----------

const llms = read('docs/llms.txt');
const listed = (re) => [...llms.matchAll(re)].map((m) => m[1]);
for (const [what, found] of [
  ['example links', listed(/motion-pages\/examples\/([a-z0-9-]+)\.html/g)],
  ['prompt links', listed(/motion-pages\/prompts\/([a-z0-9-]+)\.txt/g)],
]) {
  const gone = missing(demos, found);
  const extra = missing([...new Set(found)], demos);
  if (gone.length) fail('llms.txt complete', `${what} missing: ${gone.join(', ')}`);
  if (extra.length) fail('llms.txt complete', `${what} point at nothing: ${extra.join(', ')}`);
}

// ---------- 4. SKILL.md's bundled example list matches what ships ----------

const skill = read('SKILL.md');
const inSkill = [
  ...new Set([...skill.matchAll(/`examples\/([a-z0-9-]+)\.html`/g)].map((m) => m[1])),
];
const skillGone = missing(demos, inSkill);
if (skillGone.length) {
  fail('SKILL.md catalog', `bundled example list omits: ${skillGone.join(', ')}`);
}
const skillGhost = missing(inSkill, demos);
if (skillGhost.length) {
  fail('SKILL.md catalog', `bundled example list cites missing files: ${skillGhost.join(', ')}`);
}

// ---------- 5. the spelled-out counts ----------

const WORD = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight',
  'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen',
  'seventeen', 'eighteen', 'nineteen', 'twenty'];
const index = read('docs/index.html');
const ARCHS = index.match(/const ARCHS=\[([\s\S]*?)\n\];/)?.[1] ?? '';
const archetypes = (ARCHS.match(/\{id:/g) ?? []).length;
const liveArchs = (ARCHS.match(/live:"/g) ?? []).length;

// "archetype" is used loosely in the prose — sometimes it means a demo (all 13 ship a
// recipe), sometimes the bench's re-themable subset (11). No heuristic can tell those
// apart, and a check that guesses wrong gets ignored. So each claim is DECLARED with
// the count it refers to; any count-phrase not covered by a declaration is reported as
// unchecked, which is how new prose gets noticed instead of silently drifting.
const COUNTS = {demos: N, bench: archetypes, live: liveArchs};
const CLAIMS = [
  ['.claude-plugin/marketplace.json', /(\w+) live demos/, 'demos'],
  ['README.md', /pick any of (\w+) archetypes/, 'bench'],
  ['README.md', /archetypes: (\w+) rebuild live/, 'live'],
  ['README.md', /(\w+)\s+archetypes, each a recipe/, 'demos'],
  ['README.md', /All (\w+) bundled demos pass it/, 'demos'],
  ['docs/index.html', /<b>(\w+) archetypes<\/b>/, 'demos'],
  ['docs/index.html', /(\w+) finished worlds below/, 'demos'],
  ['docs/index.html', /<h2 class="rev">(\w+) worlds\./, 'demos'],
  ['docs/index.html', /Pick any of the (\w+) archetypes/, 'bench'],
  ['docs/index.html', /(\w+) archetypes rebuild live as you type/, 'live'],
  ['docs/index.html', /\/\/ (\w+) re-themable archetypes/, 'bench'],
];

const files = new Map([
  ['.claude-plugin/marketplace.json', read('.claude-plugin/marketplace.json')],
  ['README.md', read('README.md')],
  ['docs/index.html', index],
]);
const num = (raw) => (/^\d+$/.test(raw) ? Number(raw) : WORD.indexOf(raw.toLowerCase()));
const seen = new Map([...files.keys()].map((f) => [f, []]));

for (const [file, re, kind] of CLAIMS) {
  const m = files.get(file).match(re);
  if (!m) {
    fail('counts agree', `${file}: the ${kind}-count claim /${re.source}/ is gone — re-point it`);
    continue;
  }
  seen.get(file).push(m[0]);
  const n = num(m[1]);
  const want = COUNTS[kind];
  if (n !== want) {
    fail('counts agree', `${file}: "${m[0].replace(/\s+/g, ' ')}" — should be ${WORD[want]} (${want})`);
  }
}

// Undeclared count-phrases: not a failure of arithmetic, but nobody has said what they
// count, so nothing is checking them.
const NOUN = /\b([a-z]+|\d+)\s+(?:(?:live|bundled|finished|re-themable)\s+)?(demos?|worlds?|archetypes?)\b/gi;
for (const [file, text] of files) {
  for (const m of text.matchAll(NOUN)) {
    if (num(m[1]) < 0) continue;                        // "every world", "the archetypes", …
    const phrase = m[0].replace(/\s+/g, ' ');
    if (seen.get(file).some((s) => s.replace(/\s+/g, ' ').includes(phrase))) continue;
    fail('counts declared', `${file}: "${phrase}" is unchecked — add it to CLAIMS`);
  }
}

// ---------- report ----------

if (jsonOut) {
  console.log(JSON.stringify({demos: N, archetypes, pass: !fails.length, fails}, null, 2));
} else if (fails.length) {
  console.error(`catalog check — ${fails.length} mismatch${fails.length > 1 ? 'es' : ''}\n`);
  for (const f of fails) console.error(`  FAIL  ${f.rule}\n        ${f.msg}`);
  console.error('');
} else {
  console.log(`catalog check — OK (${N} demos, ${archetypes} bench archetypes)`);
  console.log('  examples mirrored · prompt per demo · llms.txt complete · SKILL.md current · counts agree');
}
process.exit(fails.length ? 1 : 0);
