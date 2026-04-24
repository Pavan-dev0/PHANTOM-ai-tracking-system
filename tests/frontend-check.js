const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const frontendDir = path.join(rootDir, 'frontend');
const sourceDir = path.join(frontendDir, 'src');
const appCandidates = [
  path.join(frontendDir, 'src', 'App.js'),
  path.join(frontendDir, 'src', 'App.jsx'),
  path.join(frontendDir, 'App.js'),
  path.join(frontendDir, 'App.jsx'),
];

function collectSourceFiles(dir) {
  if (!fs.existsSync(dir)) {
    return [];
  }

  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectSourceFiles(fullPath));
      continue;
    }
    if (/\.(js|jsx|ts|tsx)$/i.test(entry.name)) {
      files.push(fullPath);
    }
  }
  return files;
}

function hasMatch(content, patterns) {
  return patterns.some((pattern) => pattern.test(content));
}

function printResult(missing) {
  console.log('PHANTOM Frontend Check\n');

  if (missing.length === 0) {
    console.log('PASS: Frontend structure looks ready');
    return;
  }

  for (const item of missing) {
    console.log(`Missing: ${item}`);
  }

  console.log('WARN: Frontend validation is non-blocking by design');
}

const appFile = appCandidates.find((candidate) => fs.existsSync(candidate));
const sourceFiles = collectSourceFiles(sourceDir);
const sourceContent = sourceFiles
  .map((file) => fs.readFileSync(file, 'utf8'))
  .join('\n')
  .toLowerCase();

const missing = [];

if (!appFile) {
  missing.push('App.js or App.jsx');
}

if (!sourceFiles.length) {
  missing.push('frontend source files');
  printResult(missing);
  process.exit(0);
}

const checks = [
  {
    label: 'Name input',
    patterns: [
      /(<input|<textarea|<select)[\s\S]{0,220}(name|full name|person name)/i,
      /(name|full name|person name)[\s\S]{0,220}(<input|<textarea|<select)/i,
    ],
  },
  {
    label: 'Hours input',
    patterns: [
      /(<input|<textarea|<select)[\s\S]{0,220}(hours|hours_missing|missing hours)/i,
      /(hours|hours_missing|missing hours)[\s\S]{0,220}(<input|<textarea|<select)/i,
    ],
  },
  {
    label: 'Transport input',
    patterns: [
      /(<input|<textarea|<select)[\s\S]{0,220}(transport|mode of transport|travel mode)/i,
      /(transport|mode of transport|travel mode)[\s\S]{0,220}(<input|<textarea|<select)/i,
    ],
  },
  {
    label: 'Submit button',
    patterns: [
      /type\s*=\s*["']submit["']/i,
      /<button[\s\S]{0,120}(submit|analy[sz]e|track|find|locate)/i,
    ],
  },
  {
    label: 'Confidence result',
    patterns: [/confidence/i],
  },
  {
    label: 'Reasoning result',
    patterns: [/reasoning/i, /reason\b/i],
  },
  {
    label: 'Category result',
    patterns: [/category/i],
  },
  {
    label: 'Google Maps link',
    patterns: [/google\.com\/maps/i, /maps\.google\.com/i, /google maps/i],
  },
  {
    label: 'Movement signal breakdown',
    patterns: [/movement/i],
  },
  {
    label: 'Cognitive signal breakdown',
    patterns: [/cognitive/i],
  },
  {
    label: 'Device signal breakdown',
    patterns: [/device/i],
  },
];

for (const check of checks) {
  if (!hasMatch(sourceContent, check.patterns)) {
    missing.push(check.label);
  }
}

printResult(missing);
process.exit(0);
