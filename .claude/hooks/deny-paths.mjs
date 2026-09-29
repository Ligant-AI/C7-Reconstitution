#!/usr/bin/env node
// PreToolUse guard that keeps an agent out of paths it must not see.
//
// Usage (from an agent's hook config):
//   node .claude/hooks/deny-paths.mjs src reimpl tests --write verification/cleanroom
// Each argument before --write is a project-relative prefix the agent may not
// read, search, list or write. Arguments after --write are the only prefixes
// Edit/Write/NotebookEdit may touch (omit --write to leave writes unfenced). The hook reads the tool call
// as JSON on stdin and exits 2 (block, reason on stderr) if the call would read,
// search or list inside a denied prefix.
//
// Scope, stated honestly: Read/Edit/Write/Grep/Glob/NotebookEdit are checked
// exactly on their path arguments. Bash is checked by substring on the command
// line — a best-effort guard against casual reads (cat src/…, grep -r …), not a
// sandbox. An agent determined to evade it could. Independence is therefore also
// enforced by the agent's instructions and audited afterwards: the evidence clerk
// checks each agent's transcript for denied-path access.
import { readFileSync, appendFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';

const norm = (p) => p.replace(/^\.\//, '').replace(/\/+$/, '');
const argv = process.argv.slice(2);
const w = argv.indexOf('--write');
const denied = (w < 0 ? argv : argv.slice(0, w)).map(norm);
const writable = w < 0 ? null : argv.slice(w + 1).map(norm);
let call;
try {
  call = JSON.parse(readFileSync(0, 'utf8'));
} catch {
  process.exit(0); // nothing to judge
}
const root = process.env.CLAUDE_PROJECT_DIR || call.cwd || process.cwd();
const tool = call.tool_name || '';
const input = call.tool_input || {};

const rel = (p) => {
  if (!p || typeof p !== 'string') return null;
  const abs = path.isAbsolute(p) ? p : path.join(call.cwd || root, p);
  return path.relative(root, path.normalize(abs));
};
const hits = (r) => r !== null && denied.some((d) => r === d || r.startsWith(`${d}/`));
// Every call this hook sees is logged, allowed or blocked, so the evidence clerk
// can audit each agent's access afterwards (verification/access-log.jsonl).
const log = (decision, why = '') => {
  try {
    mkdirSync(path.join(root, 'verification'), { recursive: true });
    appendFileSync(path.join(root, 'verification', 'access-log.jsonl'), `${JSON.stringify({ t: new Date().toISOString(), agent: call.agent_type || 'main', tool, target: input.file_path || input.path || input.pattern || (input.command || '').slice(0, 200) || null, decision, why })}\n`);
  } catch { /* logging never blocks */ }
};
const block = (why) => {
  log('blocked', why);
  process.stderr.write(`Blocked for independence: ${why}. This agent must not see ${denied.join(', ')}. Work from spec/ and the protocol in verification/ instead.\n`);
  process.exit(2);
};

const paths = [input.file_path, input.path, input.notebook_path].filter(Boolean);
if (writable && ['Edit', 'Write', 'NotebookEdit'].includes(tool)) {
  for (const p of paths) {
    const r = rel(p);
    if (r === null || !writable.some((d) => r === d || r.startsWith(`${d}/`))) block(`${tool} on ${p}, outside this agent's workspace (${writable.join(', ')})`);
  }
}
for (const p of paths) if (hits(rel(p))) block(`${tool} on ${p}`);

// Glob/Grep with no path search the project root: block patterns that name a denied prefix.
for (const pat of [input.pattern, input.glob].filter((x) => typeof x === 'string')) {
  if (['Glob', 'Grep'].includes(tool) && denied.some((d) => pat.includes(`${d}/`) || pat === d)) block(`${tool} pattern ${pat}`);
}
// A project-wide Grep or Glob would return denied files among its results.
if (['Grep', 'Glob'].includes(tool) && paths.length === 0) {
  const r = rel(root);
  if (r === '' && tool === 'Grep') block('Grep over the whole project (give a path outside the denied prefixes)');
}

if (tool === 'Bash' && typeof input.command === 'string') {
  const cmd = input.command;
  // A denied prefix counts when written as a path (`src/…`, `./src/…`, `…/src/…`),
  // or as a bare argument to a command that reads or lists files (`ls src`).
  // A bare word elsewhere — a variable called `dist` in inline Python — does not.
  const esc = (d) => d.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const READERS = /^(ls|cat|head|tail|less|more|find|grep|rg|ag|cp|mv|tar|zip|wc|sed|awk|open|file|stat|tree|du|diff|strings|xxd|od)$/;
  for (const d of denied) {
    const asPath = new RegExp(`(^|[\\s'"=:(<>|;&]|\\./|/)${esc(d)}/`);
    const exactFile = /\.[a-z0-9]+$/i.test(d) && new RegExp(`(^|[\\s'"=:(<>|;&/])${esc(d)}($|[\\s'"<>|;&)])`).test(cmd);
    if (asPath.test(cmd) || exactFile) block(`Bash command names ${d}`);
    for (const seg of cmd.split(/[|;&\n]+/)) {
      const words = seg.trim().split(/\s+/).map((w) => w.replace(/^['"]|['"]$/g, ''));
      if (READERS.test(words[0] || '') && words.slice(1).some((w) => w === d || w === `./${d}`)) block(`${words[0]} on ${d}`);
    }
  }
  // Paths written relative to a `cd` earlier in the same command (the evidence
  // clerk's audit found `cd verification; grep … check-fixtures.mjs` allowed).
  // Track the working directory through the segments and resolve every word
  // that could be a path against it; also match a denied FILE by its basename.
  {
    let cwd = call.cwd || root;
    for (const seg of cmd.split(/;|&&|\|\||\||\n/)) {
      const words = seg.trim().split(/\s+/).map((w) => w.replace(/^['"]|['"]$/g, ''));
      if (words[0] === 'cd') { cwd = path.resolve(cwd, words[1] || root); continue; }
      for (const w of words) {
        if (!w || w.startsWith('-') || /^[<>|&]/.test(w)) continue;
        const r = path.relative(root, path.resolve(cwd, w));
        if (hits(r)) block(`Bash names ${w}, which resolves to denied ${r}`);
      }
    }
    for (const d of denied) {
      const base = path.basename(d);
      if (/\.[a-z0-9]+$/i.test(base) && new RegExp(`(^|[\\s'"=:(<>|;&/])${base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}($|[\\s'"<>|;&)])`).test(cmd)) block(`Bash names ${base}, a denied file`);
    }
  }
  if (/\b(grep|rg|ag|find)\b[^|;&]*\s-([a-zA-Z]*[rR][a-zA-Z]*|-recursive)\b/.test(cmd) && !/verification\/|spec\//.test(cmd)) block('recursive search outside spec/ and verification/');
  // A recursive listing or search of a folder that CONTAINS a denied path would
  // show what is inside it (the evidence clerk's audit found `ls -R verification`
  // listing names under a denied verification/fixtures/). Block recursive
  // ls/tree/find/du/grep -r whose target is an ancestor of a denied prefix.
  for (const seg of cmd.split(/[|;&\n]+/)) {
    const words = seg.trim().split(/\s+/).map((w) => w.replace(/^['"]|['"]$/g, ''));
    const verb = words[0] || '';
    const recursive = verb === 'tree' || verb === 'find' || verb === 'du'
      || (/^(ls|grep|rg|ag)$/.test(verb) && words.some((w) => /^-[a-zA-Z]*R/.test(w) || (verb !== 'ls' && /^-[a-zA-Z]*r/.test(w)) || w === '--recursive'));
    if (!recursive) continue;
    const targets = words.slice(1).filter((w) => !w.startsWith('-'));
    const roots = targets.length ? targets : ['.'];
    for (const t of roots) {
      const r = rel(t);
      if (r === null) continue;
      const covers = denied.some((d) => r === '' || r === '.' || d === r || d.startsWith(`${r}/`));
      if (covers) block(`recursive ${verb} over ${t}, which contains a denied path`);
    }
  }
}
log('allowed');
process.exit(0);
