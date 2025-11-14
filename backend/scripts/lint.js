const { readdirSync, statSync } = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const rootDir = path.join(__dirname, '..');
const ignoreDirectories = new Set(['node_modules', '.git']);
const jsFiles = [];

const collectFiles = (dir) => {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (ignoreDirectories.has(entry.name)) {
      continue;
    }

    const resolved = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      collectFiles(resolved);
      continue;
    }

    if (entry.isFile() && entry.name.endsWith('.js')) {
      jsFiles.push(resolved);
    }
  }
};

collectFiles(rootDir);

if (!jsFiles.length) {
  console.log('No JavaScript files to lint.');
  process.exit(0);
}

for (const file of jsFiles) {
  const result = spawnSync('node', ['--check', file], { stdio: 'inherit' });
  if (result.status !== 0) {
    process.exit(result.status);
  }
}
