import fs from 'node:fs/promises';


const d = 'goto_international_2024_a';

import('./' + d + '.json', { with: { type: 'json' } })
	.then(({ default: { course, result } }) => {
		const distance = course.distance;
		delete course.distance;

		course.category = course.laps.keys[0].range + ' distance';

		const r = result.map(d => {
			const q = [];
			const stats = {};

			Object.keys(d).filter(x => !x.endsWith('_sec'))
				.forEach(x => q.push([x, x === 'display_name' ? d[x].replaceAll('　', ' ') : d[x]]));

			Object.keys(d).filter(x => x.endsWith('_sec'))
				.filter(x => d[x])
				.forEach(x => stats[x.slice(0, -4)] = { time: d[x] });

			q.push(['stats', stats]);

			return Object.fromEntries(q);
		});

		return { course, result: r };
	})
	.then(json => fs.writeFile('_' + d + '.json', JSON.stringify(json)));