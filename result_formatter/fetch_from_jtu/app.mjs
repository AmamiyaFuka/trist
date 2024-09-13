import fs from 'node:fs/promises';

import Course from './course.mjs';
import Result from './result.mjs';
import Formatter from './formatter.mjs';

const formatter = new Formatter();

// 今はハードコーティング
const minami_hokkaido = {
	course: {
		name: 'アイアンマンジャパン みなみ北海道',
		short_name: 'IMジャパン2024',
		starttime: new Date('2024-09-15T06:30' + '+09:00').getTime(),
		weather: '',
		distance: {
			swim: 3.8,
			bike: 180,
			run: 42.2,
		},
		locale: '日本, 北海道',
		url: 'https://triathlon-south-hokkaido.com/archives/3104',
	},
	result_id: 'xxx_x', output_file: 'minami-hokkaido_2024'};
	
const murakami_2023 = {
	course: {
		name: '2023村上・笹川流れ国際トライアスロン大会',
		short_name: '村上2023',
		starttime: new Date('2023-09-24T09:20' + '+09:00').getTime(),
		weather: '晴れ',
		distance: {
			swim: 1.5,
			bike: 40,
			run: 10,
		},
		locale: '日本, 新潟県',
		url: 'https://www.jtu.or.jp/wordpress/wp-content/uploads/2024/01/event.report_murakami2023.pdf',
	},
	result_id: '225_1', output_file: 'murakami_2023'};

const target = murakami_2023;

Promise.all([
	Course.get(target.course),
	Result.get(target.result_id).then(json => formatter.to_trist_from_jtu(json))
]).then(([course, result]) => fs.writeFile('./out/' + target.output_file + '.json', JSON.stringify({ course, result })));

