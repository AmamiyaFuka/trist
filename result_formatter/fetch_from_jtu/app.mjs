import fs from 'node:fs/promises';

import Course from './course.mjs';
import Result from './result.mjs';
import Formatter from './formatter.mjs';

const formatter = new Formatter();

// 今はハードコーティング
const course_id = {
	"name": "五島長崎国際 トライアスロン2024 B",
	"starttime": new Date('2024-06-23T07:00+09:00').getTime(),
	"weather": "晴れ",
	"distance": {
		"swim": 1.6,
		"bike": 101.7,
		"run": 21.1
	},
	"locale": "日本, 長崎県",
	"category": "middle",
	"url": "https://gototri.com/",
};
// JTUのリザルトページURLのprogram_id
const result_id = '257_2';
const output_file = 'goto_international_2024_b';

Promise.all([
	Course.get(course_id),
	Result.get(result_id).then(json => formatter.to_trist_from_jtu(json))
])
	.then(([course, result]) => fs.writeFile(output_file + '.json', JSON.stringify({ course, result })));

