import fs from 'node:fs/promises';

import Course from './course.mjs';
import Result from './result.mjs';
import Formatter from './formatter.mjs';

const formatter = new Formatter();

// 今はハードコーティング
const course_id = {
	"name": "2024佐渡国際 トライアスロン大会 国際B",
	"starttime": new Date('2024-09-01T07:30+09:00').getTime(),
	"weather": "晴れ",
	"distance": {
		"swim": 2.0,
		"bike": 108,
		"run": 21.1
	},
	"locale": "日本, 新潟県",
	"category": "ironman70.3",
	"url": "https://www.scsf.jp/triathlon/",
};
// JTUのリザルトページURLのprogram_id
const result_id = '281_2';
const output_file = 'sado_international_2024_b';

Promise.all([
	Course.get(course_id),
	Result.get(result_id).then(json => formatter.to_trist_from_jtu(json))
])
	.then(([course, result]) => fs.writeFile(output_file + '.json', JSON.stringify({ course, result })));

