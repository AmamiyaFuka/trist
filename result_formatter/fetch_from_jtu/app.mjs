import fs from 'node:fs/promises';

import Course from './course.mjs';
import Result from './result.mjs';
import Formatter from './formatter.mjs';

const formatter = new Formatter();

// 今はハードコーティング
const minami_hokkaido = {
	course: {
		name: 'アイアンマンジャパン みなみ北海道',
		short_name: 'IMジャパン',
		starttime: new Date('2024-09-15T06:30' + '+09:00').getTime(),
		weather: '曇り',
		distance: {
			swim: 3.8,
			bike: 180,
			run: 42.2,
		},
		locale: '日本, 北海道',
		url: 'https://triathlon-south-hokkaido.com',
	},
	result_id: 'xxx_x', output_file: 'imj_minami-hokkaido_2024'
};

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
	result_id: '225_1', output_file: 'murakami_2023'
};

const yusui_2024_m = {
	course: {
		name: '第31回遊水地ふれあい トライアスロン群馬大会 2024 男子',
		short_name: '遊水地2024(男子)',
		starttime: new Date('2024-05-19T09:30' + '+09:00').getTime(),
		weather: '曇りのち雨',
		distance: {
			swim: 1.5,
			bike: 42,
			run: 10,
		},
		locale: '日本, 群馬県',
		url: 'https://www.gunma-triathlon.com/wp-content/uploads/2024/05/39751804b1f4c77387574b5511344435.pdf',
	},
	result_id: '246_1', output_file: 'yusui_2024m'
};

const yusui_2024_f = {
	course: {
		name: '第31回遊水地ふれあい トライアスロン群馬大会 2024 女子',
		short_name: '遊水地2024(女子)',
		starttime: new Date('2024-05-19T09:30' + '+09:00').getTime(),
		weather: '曇りのち雨',
		distance: {
			swim: 1.5,
			bike: 42,
			run: 10,
		},
		locale: '日本, 群馬県',
		url: 'https://www.gunma-triathlon.com/wp-content/uploads/2024/05/39751804b1f4c77387574b5511344435.pdf',
	},
	result_id: '246_2', output_file: 'yusui_2024f'
};

const setouchi = {
	course: {
		name: '瀬戸内しまなみ海道 今治伯方島トライアスロン',
		short_name: '今治伯方島',
		starttime: new Date('2024-09-15T08:00' + '+09:00').getTime(),
		weather: '曇り',
		distance: {
			swim: 1.5,
			bike: 40,
			run: 10,
		},
		locale: '日本, 愛媛県',
		url: 'https://imabari-triathlon.com/',
	},
	result_id: '285_1', output_file: 'imabari_2024'
};


const ishigaki_2023 = {
	course: {
		name: '石垣島トライアスロン大会2023',
		short_name: 'イシトラ',
		starttime: new Date('2023-04-09T08:00' + '+09:00').getTime(),
		weather: '晴れ',
		distance: {
			swim: 1.5,
			bike: 40,
			run: 10,
		},
		locale: '日本, 沖縄県',
		url: 'https://www.jtu.or.jp/news/2023/04/11/49661/',
	},
	result_id: '172_1', output_file: 'ishigaki_2023'
};

const world_2023_yokohama = {
	course: {
		name: 'ワールドトライアスロンシリーズ （2023/横浜）エイジグループ',
		short_name: 'ワールドS(横浜/std)',
		starttime: new Date('2023-05-11T08:00' + '+09:00').getTime(),
		weather: '晴れ',
		distance: {
			swim: 1.5,
			bike: 40,
			run: 10,
		},
		locale: '日本, 神奈川県',
		url: 'https://www.jtu.or.jp/news/2023/05/11/50081/',
	},
	result_id: '176_2', output_file: 'world_2023_yokohama'
};



const target = world_2023_yokohama;

Promise.all([
	Course.get(target.course),
	Result.get(target.result_id).then(json => formatter.to_trist_from_jtu(json))
]).then(([course, result]) => fs.writeFile('./out/' + target.output_file + '.json', JSON.stringify({ course, result })));

