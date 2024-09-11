import fs from 'node:fs/promises';

import Course from './course.mjs';
import Result from './result.mjs';
import Formatter from './formatter.mjs';

const formatter = new Formatter();

const course_id = '';
const result_id = '';

const output_file = 'wakashio_14th.json';

Promise.all([
	Course.get(course_id),
	Result.get(result_id).then(json => formatter.to_trist_from_jtu(json))
])
	.then(([course, result]) => fs.writeFile(output_file, JSON.stringify({ course, result })));

