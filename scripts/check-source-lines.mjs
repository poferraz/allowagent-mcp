import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

function walk(dir) {
  const entries = readdirSync(dir);
  const files = [];
  for (const entry of entries) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      files.push(...walk(full));
    } else if (full.endsWith('.ts') || full.endsWith('.tsx') || full.endsWith('.css')) {
      files.push(full);
    }
  }
  return files;
}

let failed = false;
for (const file of walk('src')) {
  const lines = readFileSync(file, 'utf8').split('\n').length;
  if (lines >= 200) {
    console.error(`FAIL: ${file} has ${lines} lines (must be < 200)`);
    failed = true;
  }
}

if (failed) {
  process.exit(1);
}
console.log('PASS: All files in src/ are strictly under 200 lines.');
