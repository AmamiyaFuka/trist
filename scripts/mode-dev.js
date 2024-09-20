const fs = require('node:fs');

const manifest_file = './dist/manifest.json';
const manifest = JSON.parse(fs.readFileSync(manifest_file).toString());
['scope', 'start_url'].forEach(key => manifest[key].replace('trist.amamiya-studio.com', 'trist-dev.amamiya-studio.com'));
fs.writeFileSync(manifest_file, JSON.stringify(manifest));
