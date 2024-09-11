import fs from 'node:fs/promises';

import Course from './course.mjs';
import Result from './result.mjs';
import Formatter from './formatter.mjs';

const formatter = new Formatter();

// 今はハードコーティング
const course_id = {
	"name": "第38回2024 トライアスロン伊良湖大会 B",
	"starttime": new Date('2024-09-08T10:00+09:00').getTime(),
	"weather": "晴れ",
	"distance": {
		"swim": 1.5,
		"bike": 42.0,
		"run": 10.0
	},
	"locale": "日本, 愛知県",
	"category": "standard",
	"url": "https://www.irago-triathlon.jp/",
};
// JTUのリザルトページURLのprogram_id
const result_id = '282_2';
const output_file = 'irako_2024_b';

Promise.all([
	Course.get(course_id),
	Result.get(result_id).then(json => formatter.to_trist_from_jtu(json))
])
	.then(([course, result]) => fs.writeFile(output_file + '.json', JSON.stringify({ course, result })));

