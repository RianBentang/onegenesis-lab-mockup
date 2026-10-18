// PostToolUse hook: guard the CLAUDE.md hard rules on edited LAB/ and PANELIS/ files.
//  - .js  → `node --check` (syntax), no ES module syntax, no fetch()
//  - .html → no <script type="module">, no fetch()
// Exit 2 feeds the problem back to Claude; anything else is silent.
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';

let raw = '';
for await (const chunk of process.stdin) raw += chunk;

const input = JSON.parse(raw || '{}');
const filePath = input.tool_input?.file_path ?? input.tool_response?.filePath;
if (!filePath) process.exit(0);

const root = path.resolve(import.meta.dirname, '..', '..');
const rel = path.relative(root, path.resolve(filePath));
const top = rel.split(path.sep)[0];
if (rel.startsWith('..') || !['LAB', 'PANELIS'].includes(top)) process.exit(0);
if (rel.split(path.sep).includes('og-theme')) process.exit(0);
if (!/\.(js|html)$/.test(rel)) process.exit(0);

const problems = [];
let text = '';
try { text = readFileSync(filePath, 'utf8'); } catch { process.exit(0); }

if (rel.endsWith('.js')) {
  const result = spawnSync(process.execPath, ['--check', filePath], { encoding: 'utf8' });
  if (result.status !== 0) problems.push(`Syntax error:\n${result.stderr.trim()}`);
  if (/^\s*(import\s[^(]|export\s)/m.test(text)) problems.push('ES module syntax (import/export) — pages use classic <script src>, see CLAUDE.md.');
} else if (/<script[^>]*type=["']module["']/i.test(text)) {
  problems.push('<script type="module"> — pages must work from file:///, see CLAUDE.md.');
}
if (/\bfetch\s*\(/.test(text)) problems.push('fetch() — no fetching of local files, see CLAUDE.md.');

if (problems.length) {
  process.stderr.write(`${rel}:\n- ${problems.join('\n- ')}\n`);
  process.exit(2);
}
process.exit(0);
