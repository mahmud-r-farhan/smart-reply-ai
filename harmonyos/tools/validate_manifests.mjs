#!/usr/bin/env node
/**
 * HarmonyOS project validator.
 *
 * The previous CI check only asserted that a handful of files exist, which is
 * how a schema-invalid `buildOption.arkOptions.entry` block and unresolvable
 * `$media:` references could sit in the project undetected. This script checks
 * the things hvigor/DevEco would fail on:
 *
 *   1. every manifest is valid JSON5 (the subset used by these files)
 *   2. every `$string:` / `$media:` / `$color:` / `$profile:` reference resolves
 *      to a real resource in AppScope/resources or the module resources
 *   3. every `.ets` entry point referenced by the manifests exists
 *   4. `buildOption.arkOptions` only uses fields hvigor's schema accepts
 *
 * Usage: node harmonyos/tools/validate_manifests.mjs   (from the repo root)
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const APP_SCOPE = join(ROOT, 'AppScope');
const ENTRY = join(ROOT, 'entry');
const RESOURCE_ROOTS = [
  join(APP_SCOPE, 'resources'),
  join(ENTRY, 'src', 'main', 'resources'),
];
const ETES_ROOTS = [join(APP_SCOPE, 'resources'), join(ENTRY, 'src', 'main')];

/** hvigor rejects unknown keys under buildOption.arkOptions (schema enum). */
const ALLOWED_ARK_OPTIONS = new Set([
  'apPath',
  'hostPGO',
  'types',
  'obfuscation',
  'buildProfileFields',
  'runtimeOnly',
]);

const failures = [];
const notes = [];

const fail = (message) => failures.push(message);
const note = (message) => notes.push(message);

/** Parse the JSON5 subset these manifests use (comments + trailing commas). */
function parseJson5(path) {
  const raw = readFileSync(path, 'utf8');
  const withoutComments = raw
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:"'\\])\/\/.*$/gm, '$1');
  const withoutTrailingCommas = withoutComments.replace(/,(\s*[}\]])/g, '$1');
  try {
    return JSON.parse(withoutTrailingCommas);
  } catch (error) {
    fail(`${path}: invalid JSON5 — ${error.message}`);
    return null;
  }
}

/** Collect declared resource names: element entries + media/profile file stems. */
function collectResources() {
  const byType = { string: new Set(), color: new Set(), media: new Set(), profile: new Set() };

  for (const resourceRoot of RESOURCE_ROOTS) {
    for (const qualifierDir of ['base', 'dark', 'en_US']) {
      const base = join(resourceRoot, qualifierDir);
      if (!existsSync(base) || !statSync(base).isDirectory()) continue;

      for (const group of readdirSync(base)) {
        const groupDir = join(base, group);
        if (!statSync(groupDir).isDirectory()) continue;

        for (const file of readdirSync(groupDir)) {
          const stem = file.replace(/\.[^.]+$/, '');
          if (group === 'element' && file.endsWith('.json')) {
            const parsed = parseJson5(join(groupDir, file));
            for (const type of ['string', 'color']) {
              for (const item of parsed?.[type] ?? []) {
                byType[type].add(item.name);
              }
            }
          } else if (group === 'media') {
            byType.media.add(stem);
          } else if (group === 'profile') {
            byType.profile.add(stem);
          }
        }
      }
    }
  }
  return byType;
}

const resources = collectResources();

/** Verify every $type:name reference on a manifest line resolves. */
function checkResourceReferences(path) {
  const raw = readFileSync(path, 'utf8');
  const referencePattern = /\$(string|media|color|profile):([A-Za-z0-9_.]+)/g;
  for (const match of raw.matchAll(referencePattern)) {
    const [, type, name] = match;
    if (!resources[type]?.has(name)) {
      fail(
        `${path}: $${type}:${name} does not resolve — no such ${type} resource in ` +
          `AppScope/resources or entry/src/main/resources`
      );
    }
  }
}

/** Confirm an .ets source path resolves inside one of the expected roots. */
function checkEtsPath(path, relative, baseDir) {
  const candidates = [
    resolve(baseDir, relative),
    ...ETES_ROOTS.map((root) => resolve(root, relative.replace(/^\.\//, ''))),
  ];
  const withExtension = candidates.flatMap((candidate) => [candidate, `${candidate}.ets`]);
  if (!withExtension.some((candidate) => existsSync(candidate))) {
    fail(`${path}: referenced ArkTS entry "${relative}" does not exist`);
  }
}

console.log('Validating HarmonyOS manifests…');

for (const manifest of [
  join(APP_SCOPE, 'app.json5'),
  join(ENTRY, 'src', 'main', 'module.json5'),
  join(ROOT, 'build-profile.json5'),
  join(ENTRY, 'build-profile.json5'),
]) {
  if (!existsSync(manifest)) {
    fail(`missing manifest: ${manifest}`);
    continue;
  }
  const parsed = parseJson5(manifest);
  if (!parsed) continue;

  checkResourceReferences(manifest);
  console.log(`  parsed ${manifest.replace(`${ROOT}/`, '')}`);

  const buildOption = parsed?.buildOption ?? parsed?.app?.products?.[0]?.buildOption;
  const arkOptions = buildOption?.arkOptions;
  if (arkOptions) {
    for (const key of Object.keys(arkOptions)) {
      if (!ALLOWED_ARK_OPTIONS.has(key)) {
        fail(
          `${manifest}: buildOption.arkOptions.${key} is not a valid hvigor field ` +
            `(allowed: ${[...ALLOWED_ARK_OPTIONS].join(', ')}) — hvigor fails with ` +
            '"Schema validate failed"'
        );
      }
    }
  }
}

// Module entry points and pages.
const moduleManifestPath = join(ENTRY, 'src', 'main', 'module.json5');
if (existsSync(moduleManifestPath)) {
  const moduleManifest = parseJson5(moduleManifestPath);
  const moduleDir = dirname(moduleManifestPath);

  for (const ability of moduleManifest?.module?.abilities ?? []) {
    if (ability.srcEntry) checkEtsPath(moduleManifestPath, ability.srcEntry, moduleDir);
  }

  const pagesProfile = moduleManifest?.module?.pages?.replace('$profile:', '') ?? 'main_pages';
  const profilePath = join(ENTRY, 'src', 'main', 'resources', 'base', 'profile', `${pagesProfile}.json`);
  if (!existsSync(profilePath)) {
    fail(`pages profile "${pagesProfile}.json" not found at ${profilePath}`);
  } else {
    const pages = parseJson5(profilePath)?.src ?? [];
    for (const page of pages) {
      checkEtsPath(profilePath, `ets/${page}.ets`, join(ENTRY, 'src', 'main'));
    }
    console.log(`  parsed pages profile (${pages.length} page(s))`);
  }
}

if (notes.length > 0) {
  console.log('\nNotes:');
  for (const message of notes) console.log(`  - ${message}`);
}

if (failures.length > 0) {
  console.error(`\n✖ HarmonyOS validation failed (${failures.length} problem(s)):`);
  for (const message of failures) console.error(`  - ${message}`);
  process.exit(1);
}

console.log('\n✓ HarmonyOS manifests, resources and ArkTS entry points are consistent.');
