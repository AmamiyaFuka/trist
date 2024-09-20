import fs from 'node:fs/promises';
import result from './result.json' with {type: 'json'};


const course = {
	name: 'アイアンマンジャパン みなみ北海道',
	short_name: 'IMジャパン',
	starttime: new Date('2024-09-15T06:30' + '+09:00').getTime(),
	weather: '曇り',
	category: 'long distance',
	laps: {
		keys: [
			{ name: 'record', range: 'long', units: '' },
			{ name: 'swim', range: 3.8, units: 'km' },
			{ name: 'bike', range: 180, units: 'km' },
			{ name: 'run', range: 42.2, units: 'km' },
		],
		main: 'record',
	},
	locale: '日本, 北海道',
	url: 'https://triathlon-south-hokkaido.com',
};

fs.writeFile('ironman_japan_2024.json', JSON.stringify({ course, result }));