import fs from 'node:fs/promises';

const get = id => {
	return fetch(`https://results.jtu.or.jp/api/programs/${id}/result_tables`)
		.then(res => res.json())
		.then(json => json.res.body[0].result_table_id)
		.then(result_table_id => {
			return fetch('https://results.jtu.or.jp/api/results?cond%5Bresult_table_id%5D=' + result_table_id)
				.then(res => res.json())
				.then(json => fs.writeFile(`./cache/${result_table_id}.json`, JSON.stringify(json)).then(() => json));
		});
};

export default {
	get,
};