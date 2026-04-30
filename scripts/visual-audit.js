// scripts/visual-audit.js

const fs = require('node:fs');
const path = require('node:path');

const SRC_DIR = path.join(process.cwd(), 'src');

const ignoredPathParts = [
  `${path.sep}theme${path.sep}`,
  `${path.sep}assets${path.sep}`,
];

const allowedThemeOnly = (filePath) => {
  return filePath.includes(`${path.sep}theme${path.sep}`);
};

const checks = [
  {
    label: 'Hardcoded hex color',
    pattern: /#[0-9a-fA-F]{3,8}\b/g,
    allowed: allowedThemeOnly,
  },
  {
    label: 'Hardcoded rgb/rgba color',
    pattern: /rgba?\(/g,
    allowed: allowedThemeOnly,
  },
  {
    label: 'Hardcoded fontSize',
    pattern: /fontSize\s*:\s*\d+/g,
    allowed: allowedThemeOnly,
  },
  {
    label: 'Hardcoded borderRadius',
    pattern: /borderRadius\s*:\s*\d+/g,
    allowed: allowedThemeOnly,
  },
  {
    label: 'Hardcoded padding/margin/gap',
    pattern:
      /\b(padding|paddingHorizontal|paddingVertical|paddingTop|paddingBottom|paddingLeft|paddingRight|margin|marginHorizontal|marginVertical|marginTop|marginBottom|marginLeft|marginRight|gap)\s*:\s*\d+/g,
    allowed: allowedThemeOnly,
  },
];

const isScannableFile = (filePath) => {
  return filePath.endsWith('.ts') || filePath.endsWith('.tsx');
};

const shouldIgnoreFile = (filePath) => {
  return ignoredPathParts.some((part) => filePath.includes(part));
};

const walk = (dirPath) => {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  return entries.flatMap((entry) => {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      return walk(fullPath);
    }

    return [fullPath];
  });
};

if (!fs.existsSync(SRC_DIR)) {
  console.error('Could not find src directory. Run this command from the project root.');
  process.exit(1);
}

const files = walk(SRC_DIR).filter(isScannableFile);

const findings = [];

for (const filePath of files) {
  if (shouldIgnoreFile(filePath)) {
    continue;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    checks.forEach((check) => {
      if (check.allowed(filePath)) {
        return;
      }

      const matches = [...line.matchAll(check.pattern)];

      matches.forEach((match) => {
        findings.push({
          filePath,
          lineNumber: index + 1,
          label: check.label,
          match: match[0],
          line: line.trim(),
        });
      });
    });
  });
}

if (findings.length === 0) {
  console.log('Visual audit passed: no obvious hardcoded visual tokens found.');
  process.exit(0);
}

console.log(`Visual audit found ${findings.length} issue(s):\n`);

for (const finding of findings) {
  const relativePath = path.relative(process.cwd(), finding.filePath);

  console.log(`${relativePath}:${finding.lineNumber}`);
  console.log(`  ${finding.label}: ${finding.match}`);
  console.log(`  ${finding.line}\n`);
}

process.exit(1);