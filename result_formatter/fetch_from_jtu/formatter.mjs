export default class {
	constructor() { };

	to_trist_from_jtu(json) {
		const cols = json.res.body.result_cols;
		const table = json.res.body.result_list;

		const hmmss_to_number = hmmss => {
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
				converter: value => value.replaceAll('　', ' '),
			},
			section: {
				key_name: 'col_' + (cols.findIndex(col => ['区分', '年齢区分', '年齢\n区分'].includes(col.result_col_caption)) + 1),
				converter: value => value,
			},
		};

		const stats_mapper = [
			['record', ['総合記録']],
			['swim', ['ｽｲﾑﾗｯﾌﾟ', 'SWIM', 'スイム']],
			['bike', ['ﾊﾞｲｸﾗｯﾌﾟ', 'BIKE', 'バイク']],
			['run', ['ﾗﾝﾗｯﾌﾟ', 'RUN', 'ラン']],
			['run-1', ['第1ﾗﾝﾗｯﾌﾟ']],
			['run-2', ['第2ﾗﾝﾗｯﾌﾟ']],
		].map(([k, keywords]) => [k, 'col_' + (cols.findIndex(col => keywords.includes(col.result_col_caption)) + 1)]);

		const mapper_entry = Object.entries(mapper);
		return table.map(item => {
			const stats = Object.fromEntries(
				stats_mapper.map(([k, v]) => [k, hmmss_to_number(item[v])])
					.filter(([_, v]) => v)
					.map(([k, v]) => [k, { time: v }])
			);

			return Object.fromEntries(
				[
					...mapper_entry.map(([k, { key_name, converter }]) => [k, converter(item[key_name])]),
					['stats', stats],
				]
			);
		});
	};
};