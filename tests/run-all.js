const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const testsDir = __dirname;
const testFiles = fs.readdirSync(testsDir)
  .filter((name) => name.endsWith('.test.js'))
  .sort();

for (const testFile of testFiles) {
  const result = spawnSync(process.execPath, [path.join(testsDir, testFile)], {
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_OPTIONS: [process.env.NODE_OPTIONS, '--no-warnings'].filter(Boolean).join(' '),
    },
  });

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}
