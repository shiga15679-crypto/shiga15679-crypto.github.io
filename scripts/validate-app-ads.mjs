import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const siteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);

const option = (name, fallback) => {
  const index = args.indexOf(name);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
};

const expectedPublisherId = option('--publisher-id', 'pub-3567457461509987');
const expectedAuthorityId = option('--authority-id', 'f08c47fec0942fa0');
const expectedPublicUrl = option('--public-url', 'https://shiga15679-crypto.github.io/app-ads.txt');
const localFile = path.resolve(siteRoot, option('--file', 'app-ads.txt'));
const remoteUrl = option('--url', null);

const report = { passed: [], errors: [] };
const pass = (message) => report.passed.push(message);
const fail = (message) => report.errors.push(message);

const validate = (bytes, source) => {
  if (!bytes.length) {
    fail(`${source}: app-ads.txt is empty.`);
    return;
  }
  if (bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
    fail(`${source}: app-ads.txt must not contain a UTF-8 BOM.`);
  } else {
    pass(`${source}: UTF-8 BOM is not present.`);
  }

  const contents = bytes.toString('utf8');
  if (/<(?:!doctype|html|head|body|script)\b/iu.test(contents)) {
    fail(`${source}: HTML was returned instead of app-ads.txt text.`);
  } else {
    pass(`${source}: no HTML markup was found.`);
  }

  const lines = contents.split(/\r?\n/u);
  if (lines.at(-1) === '') lines.pop();
  if (lines.some((line) => line.length === 0)) {
    fail(`${source}: blank lines are not allowed in app-ads.txt.`);
  }
  if (!lines.length) {
    fail(`${source}: no authorization records were found.`);
    return;
  }
  if (new Set(lines).size !== lines.length) {
    fail(`${source}: duplicate authorization records were found.`);
  } else {
    pass(`${source}: authorization records are not duplicated.`);
  }

  const records = [];
  for (const [index, rawLine] of lines.entries()) {
    const line = rawLine.trim();
    if (line !== rawLine) fail(`${source}: line ${index + 1} has unnecessary leading or trailing whitespace.`);
    const match = line.match(/^([a-z0-9.-]+),\s*(pub-\d+),\s*(DIRECT|RESELLER),\s*([a-f0-9]{16})$/iu);
    if (!match) {
      fail(`${source}: line ${index + 1} is not a valid app-ads.txt record.`);
      continue;
    }
    const [, domain, publisherId, relationship, authorityId] = match;
    if (domain !== 'google.com') fail(`${source}: line ${index + 1} must use google.com for this AdMob record.`);
    if (!publisherId.startsWith('pub-')) fail(`${source}: line ${index + 1} Publisher ID must begin with pub-.`);
    if (!['DIRECT', 'RESELLER'].includes(relationship)) fail(`${source}: line ${index + 1} relationship must be DIRECT or RESELLER.`);
    records.push({ domain, publisherId, relationship, authorityId });
  }

  const expectedRecord = records.find((record) =>
    record.domain === 'google.com'
    && record.publisherId === expectedPublisherId
    && record.authorityId.toLowerCase() === expectedAuthorityId.toLowerCase(),
  );
  if (expectedRecord) {
    pass(`${source}: Google Publisher ID and authority ID match the configured values.`);
  } else {
    fail(`${source}: no google.com record matches Publisher ID ${expectedPublisherId} and authority ID ${expectedAuthorityId}.`);
  }
};

const print = () => {
  process.stdout.write('# app-ads.txt verification\n\n');
  process.stdout.write(`Expected public URL: ${expectedPublicUrl}\n`);
  for (const [label, values] of [['Passed', report.passed], ['Blocking issues', report.errors]]) {
    process.stdout.write(`\n## ${label}\n`);
    process.stdout.write(`${values.length ? values.map((value) => `- ${value}`).join('\n') : '- None'}\n`);
  }
};

if (remoteUrl) {
  try {
    const response = await fetch(remoteUrl, { redirect: 'follow' });
    if (response.status === 200) {
      pass(`Remote URL returned HTTP 200: ${response.url}`);
    } else {
      fail(`Remote URL returned HTTP ${response.status}: ${response.url}`);
    }
    validate(Buffer.from(await response.arrayBuffer()), `Remote ${remoteUrl}`);
  } catch (error) {
    fail(`Could not fetch ${remoteUrl}: ${error.message}`);
  }
} else if (!existsSync(localFile)) {
  fail(`Local file does not exist: ${localFile}`);
} else {
  validate(readFileSync(localFile), `Local ${path.relative(siteRoot, localFile) || 'app-ads.txt'}`);
}

print();
if (report.errors.length) process.exitCode = 1;
