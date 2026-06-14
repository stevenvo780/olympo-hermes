const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const nodeModulesRoot = path.join(projectRoot, 'node_modules');
const buildHookPattern =
  /\/\* build-hook-start \*\/[\s\S]*?\/\* build-hook-end \*\//g;

const shouldScanFile = filePath => {
  const ext = path.extname(filePath);
  return ext === '.js' || ext === '.cjs' || ext === '.mjs';
};

const stripFile = filePath => {
  let contents;
  try {
    contents = fs.readFileSync(filePath, 'utf8');
  } catch {
    return;
  }

  if (!contents.includes('build-hook-start')) {
    return;
  }

  const stripped = contents.replace(buildHookPattern, '');
  if (stripped !== contents) {
    try {
      fs.writeFileSync(filePath, stripped, 'utf8');
    } catch {
      // Ignore write failures to avoid blocking tests in read-only environments.
    }
  }
};

const walk = currentPath => {
  let entries;
  try {
    entries = fs.readdirSync(currentPath, {withFileTypes: true});
  } catch {
    return;
  }

  for (const entry of entries) {
    if (entry.name === '.bin') {
      continue;
    }

    const nextPath = path.join(currentPath, entry.name);
    if (entry.isDirectory()) {
      walk(nextPath);
      continue;
    }

    if (entry.isSymbolicLink()) {
      continue;
    }

    if (entry.isFile() && shouldScanFile(nextPath)) {
      stripFile(nextPath);
    }
  }
};

if (fs.existsSync(nodeModulesRoot)) {
  walk(nodeModulesRoot);
}
