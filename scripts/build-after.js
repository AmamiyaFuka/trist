const fs = require('node:fs');

[
	'amamiya.svg.html'
].forEach(file => fs.unlinkSync('./dist/' + file))

