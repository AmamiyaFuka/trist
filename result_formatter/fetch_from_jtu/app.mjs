import fs from 'node:fs/promises';

import Course from './course.mjs';
import Result from './result.mjs';
import Formatter from './formatter.mjs';

const formatter = new Formatter();

// 今はハードコーティング
const course_id = {
	"name": "石垣島トライアスロン大会2024",
	"starttime": new Date('2024-04-21T08:00+09:00').getTime(),
	"weather": "晴れ",
	"distance": {
		"swim": 1.5,
		"bike": 40,
		"run": 10
	},
	"locale": "日本, 沖縄県",
	"category": "standard",
	"url": "https://www.tate-tra.com/",
};
// JTUのリザルトページURLのprogram_id
const result_id = '240_1';
const output_file = 'ishitora2014';

Promise.all([
	Course.get(course_id),
	Result.get(result_id).then(json => formatter.to_trist_from_jtu(json))
])
	.then(([course, result]) => fs.writeFile(output_file + '.json', JSON.stringify({ course, result })));

