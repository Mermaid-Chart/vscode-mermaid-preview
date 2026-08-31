/**
 * Regenerates src/mermaidDiagramTypes.generated.json.
 *
 * The Markdown preview renders mermaid inside a webview owned by the built-in Markdown
 * extension, which cannot message us back, so the diagram type for those events has to be
 * derived in the extension host from the block source. Bundling mermaid into the host to call
 * `detectType` there costs ~3.9MB, so instead we ask mermaid once at build time what each
 * diagram keyword resolves to and ship the resulting lookup table.
 *
 * Running this on every build keeps the table in step with the installed mermaid version.
 */
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const require = createRequire(import.meta.url);
const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputPath = path.join(repoRoot, 'src', 'mermaidDiagramTypes.generated.json');

const diagramMappings = require(path.join(repoRoot, 'src', 'diagramTypeWords.json'));
const mermaid = (await import('@mermaid-chart/mermaid')).default;

// Diagram detectors are registered lazily; initialize() is what installs the built-ins.
mermaid.initialize({ startOnLoad: false });

/** Internal diagrams that are never something a user types at the top of a block. */
const notUserAuthored = new Set(['---', 'error']);

/**
 * Suffixes and bodies to try, since some detectors only match with content after the keyword
 * and others (`venn`, `wardley`) only match the `-beta` spelling. The entry is still keyed on
 * the bare id, which is what the caller looks up after trimming any suffix.
 */
const bodies = ['', '\n', ' LR\n A-->B', '\n title x', '-beta\n', '-v2\n'];

// Only keywords mermaid or this repo actually know about. Suffixed spellings that are not
// registered ids (`architecture-beta`) are handled by the caller trimming the suffix.
const candidates = new Set();
for (const alias of Object.values(diagramMappings).flat()) {
  candidates.add(alias);
}
for (const { id } of mermaid.getRegisteredDiagramsMetadata()) {
  candidates.add(id);
}

const types = {};
const conflicts = [];
for (const candidate of [...candidates].sort()) {
  if (notUserAuthored.has(candidate)) {
    continue;
  }

  let detected;
  for (const body of bodies) {
    try {
      detected = mermaid.detectType(`${candidate}${body}`);
      break;
    } catch {
      /* keyword needs a different body shape, try the next one */
    }
  }
  if (!detected || notUserAuthored.has(detected)) {
    continue;
  }

  // getDiagramKeyword() lowercases, so the lookup table must be keyed that way too.
  const key = candidate.toLowerCase();
  if (types[key] && types[key] !== detected) {
    conflicts.push(`${key}: ${types[key]} vs ${detected}`);
  }
  types[key] = detected;
}

if (conflicts.length > 0) {
  console.error(
    `Ambiguous mermaid diagram keywords, cannot build a reliable lookup table:\n  ${conflicts.join('\n  ')}`
  );
  process.exit(1);
}

const sorted = Object.fromEntries(Object.entries(types).sort(([a], [b]) => a.localeCompare(b)));
writeFileSync(outputPath, `${JSON.stringify(sorted, null, 2)}\n`);

console.log(
  `Wrote ${Object.keys(sorted).length} mermaid diagram keywords ` +
    `(${new Set(Object.values(sorted)).size} distinct types) to ${path.relative(repoRoot, outputPath)}`
);
