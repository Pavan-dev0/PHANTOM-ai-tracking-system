const fs = require('fs');
const path = require('path');

const filesToPatch = [
  path.join(__dirname, '..', 'node_modules', 'dompurify', 'dist', 'purify.es.mjs'),
  path.join(__dirname, '..', 'node_modules', 'dompurify', 'dist', 'purify.cjs.js'),
  path.join(__dirname, '..', 'node_modules', 'dompurify', 'dist', 'purify.js'),
  path.join(__dirname, '..', 'node_modules', 'dompurify', 'dist', 'purify.min.js'),
];

const sourceMapPattern = /\r?\n?\/\/# sourceMappingURL=.*$/m;

for (const filePath of filesToPatch) {
  if (!fs.existsSync(filePath)) {
    continue;
  }

  const original = fs.readFileSync(filePath, 'utf8');
  const patched = original.replace(sourceMapPattern, '');

  if (patched !== original) {
    fs.writeFileSync(filePath, patched, 'utf8');
  }
}
