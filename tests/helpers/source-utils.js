const fs = require('node:fs');

function readJavaScriptSources(dir) {
  return fs.readdirSync(dir, { withFileTypes: true })
    .flatMap((entry) => {
      const path = `${dir}/${entry.name}`;
      if (entry.isDirectory()) return readJavaScriptSources(path);
      if (entry.isFile() && entry.name.endsWith('.js')) return [fs.readFileSync(path, 'utf8')];
      return [];
    })
    .join('\n');
}

module.exports = { readJavaScriptSources };
