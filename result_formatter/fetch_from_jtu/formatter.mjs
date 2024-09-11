export default class {
	constructor() { };

	to_trist_from_jtu(json) {
		const cols = json.res.body.result_cols;
		const table = json.res.body.result_list;

		const hmmss_to_number = hmmss => {
			console.log(hmmss);
			return hmmss?.split(':').reduce((a, b) => a * 60 + parseInt(b), 0);
		};

		const mapper = {
			rank: {
				key_name: 'col_' + (cols.findIndex(col => col.result_col_caption === '総合順位') + 1),
				converter: value => value,
			},
			number: {
				key_name: 'col_' + (cols.findIndex(col => col.result_col_caption === 'No.') + 1),
				converter: value => value,
			},
			display_name: {
				key_name: 'col_' + (cols.findIndex(col => col.result_col_caption === '氏名') + 1),
				converter: value => value,
			},
			section: {
				key_name: 'col_' + (cols.findIndex(col => col.result_col_caption === '区分') + 1),
				converter: value => value,
			},
			record_sec: {
				key_name: 'col_' + (cols.findIndex(col => col.result_col_caption === '総合記録') + 1),
				converter: hmmss_to_number,
			},
			swim_sec: {
				key_name: 'col_' + (cols.findIndex(col => col.result_col_caption === 'ｽｲﾑﾗｯﾌﾟ') + 1),
				converter: hmmss_to_number,
			},
			bike_sec: {
				key_name: 'col_' + (cols.findIndex(col => col.result_col_caption === 'ﾊﾞｲｸﾗｯﾌﾟ') + 1),
				converter: hmmss_to_number,
			},
			run_sec: {
				key_name: 'col_' + (cols.findIndex(col => col.result_col_caption === 'ﾗﾝﾗｯﾌﾟ') + 1),
				converter: hmmss_to_number,
			},
		};

		const mapper_entry = Object.entries(mapper);
		return table.map(item => {
			return Object.fromEntries(
				mapper_entry.map(([k, {key_name, converter}]) => [k, converter(item[key_name])])
			);
		});
	};
};