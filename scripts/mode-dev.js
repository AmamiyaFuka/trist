const fs = require('node:fs');

const manifest_file = './dist/manifest.json';
const manifest = JSON.parse(fs.readFileSync(manifest_file).toString());
manifest.scope = 'https://trist-dev.amamiya-studio.com/';
fs.writeFileSync(manifest_file, JSON.stringify(manifest));
