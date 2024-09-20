const fs = require('node:fs');

const manifest_name = 'manifest.json';
fs.writeFileSync('./dist/' + manifest_name, fs.readFileSync('./src/' + manifest_name));

[
	'amamiya.svg.html'
].forEach(file => fs.unlinkSync('./dist/' + file))

