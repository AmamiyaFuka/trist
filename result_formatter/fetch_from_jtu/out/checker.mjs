import fs from 'node:fs/promises';
import path from 'node:path';

const __dirname = import.meta.dirname;

const course_types = {
	name: 'string',
	short_name: 'string',
	starttime: 'number',
	weather: 'string',
	distance: {
		swim: 'number',
		bike: 'number',
		run: 'number',
	},
	locale: 'string',
	category: 'string',
	url: 'string?',
};

const result_types = {
	rank: 'string',
	number: 'string',
	display_name: 'string',
	section: 'string',

	record_sec: 'number?',
	swim_sec: 'number?',
	bike_sec: 'number?',
	run_sec: 'number?',
};

const check_type = (types, checker, info) => {
	Object.entries(types).forEach(([k, v]) => {
		if (typeof (v) === 'object') return check_type(v, checker[k]);

		if (v.endsWith('?')) {
			// nullable
			if (!checker[k]) return;

			const t = typeof (checker[k]);
			if (t !== v.slice(0, -1)) {
				throw new Error(`Type not equal. Key: "${k}", ${v} !== ${t}. ${info}`);
			}
		} else {
			const t = typeof (checker[k]);
			if (t !== v) {
				throw new Error(`Type not equal. Key: "${k}", ${v} !== ${t}. ${info}`);
			}
		}
	})
};


fs.readdir(path.join(__dirname), { withFileTypes: true })
	.then(dirents => {
		dirents.forEach(d => {
			if (!d.name.endsWith('.json')) return;

			fs.readFile(path.join(__dirname, d.name))
				.then(buffer => JSON.parse(buffer.toString()))
				.then(json => {
					check_type(course_types, json.course, d.name + '.course');

					const r = json.result;

					const times = ['record_sec', 'swim_sec', 'bike_sec', 'run_sec'];
					const invalid_count = Object.fromEntries(times.map(k => ([k, 0])));
					for (let i = 0; i < r.length; i++) {
						check_type(result_types, r[i], `${d.name} .result[${i}]: ${JSON.stringify(r[i])}`);

						times.forEach(k => {
							if (!r[i][k]) invalid_count[k]++;
						});
					}

					const invalid_ratio = Object.fromEntries(times.map(k => ([k, invalid_count[k] / r.length])));
					console.debug(d.name + 'Invalid count: ' + JSON.stringify(invalid_count, null, '\t'));
					console.debug(d.name + 'Invalid ratio: ' + JSON.stringify(invalid_ratio, null, '\t'));
				});
		});
	});