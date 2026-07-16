import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const siteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const htmlFiles = [];
const errors = [];
const passed = [];

const walk = (directory) => {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory() && !['scripts', 'templates'].includes(entry.name)) walk(target);
    if (entry.isFile() && entry.name.endsWith('.html')) htmlFiles.push(target);
  }
};

const localTarget = (source, href) => {
  const clean = href.split('#', 1)[0].split('?', 1)[0];
  if (!clean || clean.startsWith('#') || /^(?:https?:|mailto:|tel:|data:)/iu.test(clean) || clean.includes('{{')) return null;
  const candidate = clean.startsWith('/')
    ? path.resolve(siteRoot, `.${clean}`)
    : path.resolve(path.dirname(source), clean);
  if (!candidate.startsWith(siteRoot)) return 'OUTSIDE_SITE_ROOT';
  return existsSync(candidate) && statSync(candidate).isDirectory() ? path.join(candidate, 'index.html') : candidate;
};

walk(siteRoot);
for (const file of htmlFiles) {
  const contents = readFileSync(file, 'utf8');
  for (const match of contents.matchAll(/\bhref\s*=\s*(["'])(.*?)\1/giu)) {
    const href = match[2];
    const target = localTarget(file, href);
    if (!target) continue;
    if (target === 'OUTSIDE_SITE_ROOT' || !existsSync(target)) {
      errors.push(`${path.relative(siteRoot, file)} links to a missing local page: ${href}`);
    }
  }
}

if (existsSync(path.join(siteRoot, 'app-ads.txt'))) {
  passed.push('Root app-ads.txt exists.');
} else {
  errors.push('Root app-ads.txt is missing.');
}
passed.push(`${htmlFiles.length} HTML file(s) were scanned for local links.`);

process.stdout.write('# Static site link verification\n\n## Passed\n');
process.stdout.write(`${passed.map((message) => `- ${message}`).join('\n')}\n\n## Blocking issues\n`);
process.stdout.write(`${errors.length ? errors.map((message) => `- ${message}`).join('\n') : '- None'}\n`);
if (errors.length) process.exitCode = 1;
