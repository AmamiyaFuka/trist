import list_json from '/assets/list.json' with { type: 'json' };

/** @type {Array<{race: string, label: string, course: Course}} */
const race_list = list_json;

import BootstrapTemplate from './element_template.mjs';
import ColorPallets from './color_pallets.mjs';

const color_pallets = new ColorPallets();

const templater = new BootstrapTemplate();

/** @typedef {'record'|'swim'|'bike'|'run'} Lap */

/**
 * @readonly
 * @enum {Lap}
 */
const lap_enum = { record: 'record', swim: 'swim', bike: 'bike', run: 'run' };

/** @type {Array<Lap>} */
const all_laps = Object.values(lap_enum);

/** @type {Array<Lap>} */
const sub_laps = [lap_enum.swim, lap_enum.bike, lap_enum.run];

/**
 * @type {Object} key
 * @property {string} key
 */
const m = {};

/**
 * @typedef LapPointData
 * @property {number} x
 * @property {number?} record
 * @property {number?} swim
 * @property {number?} bike
 * @property {number?} run
 */

/**
 * @typedef Point
 * @property {number} x
 * @property {number} y
 */

/**
 * @typedef PersonChartData
 * @property {Point} record
 * @property {Point} swim
 * @property {Point} bike
 * @property {Point} run
 */

/**
 * @typedef LapResultContext
 * @property {Element} panel
 * @property {Chart} chart
 * @property {DataStats} stats
 * @property {HTMLCanvasElement} context
 */

/** 
 * @typedef DataStats
 * @property {boolean} valid
 * @property {number} count
 * @property {Array<number>} sorted_times
 * @property {{min: number, max: number}} time
 * @property {number} average 平均
 * @property {number} variance 分散
 * @property {number} stdev 標準偏差
 */

/**
 * @typedef GlobalVars
 * @property {string} race_file
 * @property {string} race レースID, fuji2024など
 * @property {Array<PersonResult>} data
 * @property {Array<PersonResult>} member_data
 * @property {Array<PersonChartData>} member_chart_data
 * @property {Array<LapPointData>} density_data
 * @property {Array<LapPointData>} chart_data
 * @property {Course} course
 * @property {LapResultContext} record
 * @property {LapResultContext} swim
 * @property {LapResultContext} bike
 * @property {LapResultContext} run 
 * @property {Array<string>} member_ids
 * 
 */

/** @type {GlobalVars} */
const g = {
	race_file: 'assets/result/sample.json',
	race: '',
	data: [],
	member_data: [],
	member_chart_data: [],
	density_data: [],
	chart_data: [],
	course,
	record: {},
	swim: {},
	bike: {},
	run: {},
	member_ids: [],
};

/**
 * 現在の表示状態をsearch文字列に反映させる
 */
const update_search_string = () => {
	const race = g.race_file.match(/\/?assets\/result\/(.*?)\.json/)[1];
	window.history.replaceState(null, null, `?race=${race}&members=${g.member_data.map(x => x.number).join(',')}`);

	// Xシェアリンクを更新
	document.querySelector('#share-x-link').setAttribute('href', `https://x.com/intent/tweet?text=${encodeURIComponent(g.course.name + 'のリザルト')}&url=${encodeURIComponent(window.location.href)}`);
};


/**
 * search文字列から、表示に関わるパラメータを抽出する
 */
{
	const query = window.location.search.substring(1).split('&');

	/** @type {Object.<string, string>} */
	const r = Object.fromEntries(['race', 'members'].map(k => {
		const v = query.find(q => q.startsWith(k));
		return v ? [k, v.split('=')[1]] : [k];
	}));

	// パラメータから必要なものをグローバル変数に格納
	if (r.race) {
		g.race_file = `assets/result/${r.race}.json`;
		g.race = r.race;
	}
	if (r.members) g.member_ids = r.members.split(',');
}

/**
 * 秒数をHH:mm:ss表記にする
 * 3200 -> 00:53:20
 * @param {number} sec 
 * @returns {string}
 */
const sec_to_hhmmss = sec => {
	const h = Math.floor(sec / 3600);
	const m = Math.floor((sec - h * 3600) / 60);
	const s = sec % 60;
	return [h, m, s].map(x => ('00' + x).slice(-2)).join(':');
};

/**
 * 秒数を、符号付のm:ss表記にする
 * @param {number} sec 
 * @returns {string}
 */
const sec_to_mss_with_sign = sec => {
	let sign = '±';
	if (sec < 0) {
		sign = '-';
		sec = -sec;
	} else if (sec > 0) {
		sign = '+';
	}

	const m = Math.floor(sec / 60);
	const s = sec % 60;

	return `${sign}${m}:${('00' + s).slice(-2)}`;
};


/**
 * サマリーパネルを再描画する
 */
const draw_summaries = () => {
	{
		//ラップタイムサマリー
		const root = document.querySelector('#lap_time_chart');
		const template = document.querySelector('#lap_time_row');
		if (g.member_data.length > 0) {
			draw_lap_time_summary(root, template);

			root.parentElement.classList.remove('d-none');
		} else {
			root.parentElement.classList.add('d-none');
		}
	}


	{
		//ラップタイムスコア
		const root = document.querySelector('#lap_score_chart');
		const template = document.querySelector('#lap_score_row');
		if (g.member_data.length > 0) {
			draw_lap_score_summary(root, template);

			root.parentElement.classList.remove('d-none');
		} else {
			root.parentElement.classList.add('d-none');
		}
	}
};

/**
 * すべてのラップパネルのチャート、ランキングと、サマリーパネルを描画する
 */
const draw_all = () => {
	all_laps
		.forEach(x => {
			draw(x);
			draw_member_ranking(x);
		});

	draw_summaries();
};

/**
 * ラップタイムサマリーテーブルを描画する
 * @param {Element} root 描画要素を配置するルートエレメント
 * @param {Element} template スタイル付けされた行要素
 */
const draw_lap_time_summary = (root, template) => {
	// 初期化
	root.textContent = '';

	// 比較値
	const current_time = {};

	g.member_data
		.sort((a, b) => a.record_sec - b.record_sec)
		.forEach(member => {
			const row = template.cloneNode(true);

			row.querySelector('.name').textContent = member.display_name;
			sub_laps.forEach(k => {
				const v = member[k + '_sec'];

				// 比較値が含まれている場合は、差分表示。いない場合は絶対値表示
				const time = current_time[k] ? sec_to_mss_with_sign(v - current_time[k]) : sec_to_hhmmss(v);
				// 比較値が含まれていない場合はセットする
				current_time[k] ||= v;

				if (v) {
					row.querySelector('.time.' + k).textContent = time;
					row.querySelector('.stack_bar.' + k).style.width = Math.round(v * 100 / current_time[k]) + '%';
				} else {
					row.querySelector('.stack_bar.' + k).style.color = 'gray';
				}
			});

			while (row.firstElementChild) root.appendChild(row.firstElementChild);
		});



	// データ欠落時の代替タイム
	const base_time = ((() => {
		let sum = 0;
		let count = 0;
		g.member_data.forEach(x => {
			sub_laps.map(k => k + '_sec')
				.filter(k => x[k])
				.forEach(k => {
					sum += x[k];
					count++;
				});
		})
		return sum / count;
	}))();
	// current_time のうち一番小さい数値（または代替タイム）を 1fr にする
	const base_width = Math.min(...Object.values(current_time).filter(x => x).concat(base_time));
	root.style.gridTemplateColumns = ['auto', ...sub_laps.map(k => (current_time[k] || base_time) / base_width + 'fr'), '0.5fr'].join(' 1px ');
	// 出力例: auto 1px 1fr 1px 1.5fr 1px 1.3fr 1px 0.5fr;
};


/**
 * ラップタイムサマリーテーブルを描画する
 * @param {Element} root 描画要素を配置するルートエレメント
 * @param {Element} template スタイル付けされた行要素
 */
const draw_lap_score_summary = (root, template) => {
	// 初期化
	const insert_position = root.querySelector('#lap_score_footer_start');
	while (root.firstElementChild != insert_position) root.removeChild(root.firstElementChild);

	g.member_data
		.sort((a, b) => a.record_sec - b.record_sec)
		.forEach((member, i) => {
			const row = template.cloneNode(true);

			row.querySelector('.name').textContent = member.display_name;
			sub_laps.forEach(lap => {
				if (!member.stats) return;
				const v = member.stats[lap]?.score;
				const elem = row.querySelector('.stack_bar.' + lap);

				// 幅の計算方法は styles.scss を参照のこと
				const score_to_width = dev => Math.round(dev * 20 / 7) + '%';
				if (v) {
					elem.textContent = Math.round(v);
					elem.style.width = score_to_width(v);
				} else {
					elem.textContent = '';
					elem.style.color = 'rgba(0 0 0 0.7)';
					elem.style.width = '0';
				}
			});

			// 最初の要素だけ角丸用のクラスを追加
			if (i == 0) {
				row.querySelector('.score-bg-l').classList.add('score-bg-t');
				row.querySelector('.score-bg-r').classList.add('score-bg-t');
			}

			while (row.firstElementChild) root.insertBefore(row.firstElementChild, insert_position);
		});
};


/**
 * ランキング要素を描画する
 * @param {Lap} lap 
 */
const draw_member_ranking = (lap) => {
	// 一度、内容を全て消去する
	g[lap].panel.querySelector('ul.ranking').textContent = '';

	let front = null;
	const parent = g[lap].panel.querySelector('ul.ranking');

	g.member_data
		.map((x, i) => ({ color: color_pallets.indexOf(i), display: x.display_name, time: x[lap + '_sec'] }))
		.sort((a, b) => a.time - b.time)
		.map(x => {
			const d = x.time - front;
			const delta = (front && !isNaN(d)) ? sec_to_mss_with_sign(x.time - front, true) : '';
			if (!isNaN(d)) front = x.time;

			const item = templater.generate('ranking_item', {
				'.display_name': x.display,
				'.time': x.time ? sec_to_hhmmss(x.time) : 'No data',
				'.delta': delta,
			});
			item.querySelector('.circle').style.backgroundColor = x.color;
			return item;
		})
		.forEach(x => parent.appendChild(x));
};

/**
 * チャートを描画する
 * @param {Lap} lap 
 */
const draw = (lap) => {
	// 既に描画されている場合は消去する
	if (g[lap].chart) g[lap].chart.destroy();
	g[lap].chart = null;

	const time_step_sec = 600;

	const stats = g[lap].stats;
	if (!stats.valid) return;

	const time_min = Math.floor(stats.time.min / time_step_sec) * time_step_sec;
	const time_max = Math.ceil(stats.time.max / time_step_sec) * time_step_sec;

	const data = {
		datasets: [{
			label: '順位',
			type: 'line',
			showLine: true,
			tension: 0.05,
			pointRadius: 0,
			pointHitRadius: 0,
			data: g.chart_data,
			parsing: { xAxisKey: 'x', yAxisKey: lap },
			// backgroundColor: 'rgb(000, 111, 222)',
			order: 1000,
		}, {
			type: 'line',
			showLine: false,
			pointRadius: 0,
			pointHitRadius: 0,
			data: g.density_data,
			parsing: { xAxisKey: 'x', yAxisKey: lap },
			order: 1001,
			yAxisID: 'y_density',
			backgroundColor: 'hsla(214, 40%, 90%, 0.45)',
			fill: true,
		}, {
			showLine: false,
			data: g.member_chart_data,
			parsing: { xAxisKey: lap + '.x', yAxisKey: lap + '.y' },
			order: 1,
			pointRadius: 8,
			pointHitRadius: 3,
			backgroundColor: color_pallets.all(),
		}],
	};

	g[lap].chart = new Chart(g[lap].context, {
		type: 'line',
		data,
		options: {
			parsing: true,
			scales: {
				x: {
					type: 'linear',
					position: 'bottom',
					min: time_min,
					max: time_max,
					ticks: {
						callback: sec_to_hhmmss,
						autoSkip: true,
						stepSize: 600,
					},
					title: {
						display: true,
						text: 'Finish',
					},
				},
				y: {
					type: 'linear',
					position: 'left',
					min: -50,
					reverse: true,
					ticks: {
						includesBounds: true,
						callback: value => {
							if (value < 0) return '';
							if (value % 10 !== 0) return '';
							return (value + 1) + 'st';
						},
						stepSize: 100,
						autoSkip: true,
					},
					beginAtZero: true,
				},
				y_density: {
					type: 'linear',
					position: 'right',
					min: 0,
					grid: { drawOnChartArea: false },
					ticks: { display: false },
				},
			},
			plugins: {
				tooltip: {
					callbacks: {
						title: () => '',
						label: (item) => {
							const d = item.raw.tag;
							const time = sec_to_hhmmss(d[lap + '_sec']);

							const tips = [`${d.display_name} ${time}`, `${item.raw[lap].y}位`];

							return tips.join(', ');
						},
						afterLabel: item => {
							const tips = [];
							const stats = item.raw.tag.stats[lap];

							if (stats.valid) {
								if (stats.percentile) tips.push(`上位${(stats.percentile * 100).toString().substring(0, 4)}%`);
								if (stats.score) tips.push(`スコア ${stats.score.toString().substring(0, 2)}`);
							}

							return tips.join(', ');
						}
					},
					// mode: 'nearest',
				},

				legend: {
					display: false,
				},
			},
			responsive: true,
			aspectRatio: 1,
		}
	});
};

/**
 * 表示する母集団を設定する
 * @param {Array<PersonResult>} target 
 */
const update_target_data = target => {
	all_laps.forEach(lap => {
		const k = lap + '_sec';

		const sorted_times = target.map(x => x[k]).filter(x => x).sort((a, b) => a - b);

		if (sorted_times.length < 2) {
			g[lap].stats = { valid: false };
			return;
		}

		const min = sorted_times[0];
		const max = sorted_times[sorted_times.length - 1];

		// 平均
		const average = sorted_times.reduce((a, b) => a + b / sorted_times.length, 0);
		// 分散
		const variance = sorted_times.reduce((a, b) => a + Math.pow(b - average, 2) / sorted_times.length, 0);
		// 標準偏差
		const stdev = Math.sqrt(variance);

		g[lap].stats = {
			valid: true,
			count: sorted_times.length,
			sorted_times,
			time: { min, max },
			average,
			variance,
			stdev,
		};
	});

	// 全レコードのデータをまとめる
	const time_min = Math.min(...all_laps.filter(lap => g[lap]?.stats?.valid).map(lap => g[lap].stats.time.min));
	const time_max = Math.max(...all_laps.filter(lap => g[lap]?.stats?.valid).map(lap => g[lap].stats.time.max));

	if (!(isFinite(time_max) && isFinite(time_min))) {
		g.chart_data = [];
		g.density_data = [];
		g.member_chart_data = [];

		return;
	}

	g.chart_data = Array(time_max - time_min).fill(0)
		.map((_, i) => time_min + i)
		.map(x => ({
			x,
			...Object.fromEntries(
				all_laps
					.filter(lap => g[lap].stats.valid)
					.map(lap => {
						const v = g[lap].stats.sorted_times.findIndex(t => t > x);
						return [lap, v > 0 ? v : undefined];
					})),
		}));

	const density_sampling = Math.min(80, g.chart_data.length);
	const density_step = Math.floor(g.chart_data.length / density_sampling);

	g.density_data = Array(density_sampling).fill(0)
		.map((_, i) => {
			const src = Math.max(0, (i - 1) * density_step);
			const dst = Math.min(g.chart_data.length - 1, i * density_step);
			return {
				x: i * density_step + time_min,
				...Object.fromEntries(all_laps.map(lap => [lap, g.chart_data[dst][lap] - g.chart_data[src][lap] || undefined])),
			};
		});

	update_all_member_stats();

	g.member_chart_data = g.member_data.map(d => generate_member_chart_data(d));
};

/**
 * 個人のレース結果から、ポイントするチャート描画用のデータを作成する
 * @param {PersonResult} member_data 
 * @returns {PersonChartData}
 */
const generate_member_chart_data = member_data => {
	return Object.fromEntries([
		['tag', member_data],
		...all_laps.map(lap => {
			const lap_x = member_data[lap + '_sec'];
			const lap_y = g.chart_data[lap_x - g.chart_data[0]?.x]?.[lap];
			return [lap, { x: lap_x, y: lap_y }];
		})]);
};

/**
 * メンバーの統計データを再計算する
 * @param {PersonResult} member 
 * @param {Lap} lap 
 */
const update_member_stats = (member, lap) => {
	if (!('stats' in member)) member.stats = {};

	const data_stats = g[lap].stats;

	if (!data_stats.valid) {
		member.stats[lap] = { valid: false };
		return;
	}

	member.stats[lap] = { valid: true };

	const v = member[lap + '_sec'];
	if (v) {
		member.stats[lap].score = (data_stats.average - v) / data_stats.stdev * 10 + 50;
		member.stats[lap].percentile = data_stats.sorted_times.findIndex(t => t > v) / data_stats.count;
	}
};


const update_all_member_stats = () => {
	g.member_data.forEach(member => all_laps.forEach(lap => update_member_stats(member, lap)));
};

window.addEventListener('load', () => {
	templater.init(document);

	{
		const parent = document.querySelector('#view');
		const position = document.querySelector('#panel_positioner');

		const lap_names = {
			record: '総合',
			swim: 'スイム',
			bike: 'バイク',
			run: 'ラン',
		};
		all_laps.forEach(lap => {
			const panel = templater.generate('lap_panel', { '.lap_name': lap_names[lap] });
			panel.classList.add(lap);

			g[lap].panel = panel;
			g[lap].context = panel.querySelector(`canvas`);
			parent.insertBefore(panel, position);
		});
	}

	{
		// Groupフィルタ
		const group = document.querySelector('#group');

		group.addEventListener('change', () => {
			if (group.firstElementChild.selected) {
				update_target_data(g.data);
			} else {
				const values = Array.from(group.querySelectorAll('option')).filter(x => x.selected).map(x => x.value);

				if (values.length === 0) return;
				update_target_data(g.data.filter(k => values.includes(k.section)));
			}
			draw_all();
		});
	}

	// メンバー追加・削除要素作成
	const active_member_list_element = document.querySelector('#member_list');
	const new_member_list_element = document.querySelector('#new_member_list');
	const member_list_template = document.querySelector('#member_list_template');

	/**
	 * 
	 * @param {PersonResult} member_data 
	 * @param {'add'|'remove'} mode add: メンバー追加候補状態 remove: 既にメンバーに追加されてチャートに描画されてる状態 
	 */
	const generate_member_list_element = (member_data, mode) => {
		const elem = member_list_template.cloneNode(true);
		elem.id = '';

		elem.querySelector('.display_name').textContent = member_data.display_name;
		elem.querySelector('.number').textContent = member_data.number;

		const button = elem.querySelector('button');

		button.setAttribute('data-member-update-mode', mode);

		button.addEventListener('click', () => {
			const mode = button.getAttribute('data-member-update-mode');

			if (mode === 'add') {
				button.setAttribute('data-member-update-mode', 'remove');

				new_member_list_element.removeChild(elem);
				active_member_list_element.appendChild(elem);

				all_laps.forEach(lap => update_member_stats(member_data, lap));

				g.member_data.push(member_data);
				g.member_chart_data.push(generate_member_chart_data(member_data));
			} else if (mode === 'remove') {
				active_member_list_element.removeChild(elem);

				const i = g.member_data.findIndex(d => d == member_data);
				g.member_data.splice(i, 1);
				g.member_chart_data.splice(i, 1);
			} else {
				throw new Error('Unset data-member-update-mode');
			}

			// 関係する要素の再描画処理
			all_laps.forEach(lap => {
				g[lap]?.chart?.update();
				draw_member_ranking(lap);
			});

			update_search_string();

			draw_summaries();
		});

		return elem;
	};


	fetch(g.race_file)
		.then(res => res.json())
		.then(json => {
			g.course = json.course;
			g.data = json.result;

			g.member_data = g.data.filter(x => g.member_ids.includes(x.number));
			delete g.member_ids;

			update_target_data(g.data);

			// 初期メンバーリスト要素を作る
			g.member_data.map(d => generate_member_list_element(d, 'remove'))
				.forEach(elem => active_member_list_element.appendChild(elem));


			{
				// ヘッダー情報としてレース情報を格納する
				document.querySelector('title').textContent = `${g.course.name} :: Trist`;

				const course_summary = document.querySelector('#course_summary');
				[
					`${new Date(g.course.starttime).toLocaleString('ja-JP')} スタート`,
					`場所：${g.course.locale} ${g.course.weather}`,
					`${g.course.category} distance`,
					sub_laps.map(lap => `${lap} ${g.course.distance[lap]} km`).join(', '),
				].forEach(text => {
					const p = document.createElement('p');
					p.textContent = text;
					course_summary.appendChild(p);
				});
			}

			// 各Panelにレース名をいれる（薄字のやつ）
			Array.from(document.querySelectorAll('.course_name')).forEach(elem => elem.textContent = g.course.name);

			{
				// 種目別ビューの距離をいれる
				sub_laps.forEach(lap => g[lap].panel.querySelector(`.distance`).textContent = g.course.distance[lap] + ' km');

				// 総合は距離の代わりに、ディタンスカテゴリ
				g.record.panel.querySelector('.distance').textContent = g.course.category;
			}

			document.querySelector('#share-x-link')
				.setAttribute('href', `https://x.com/intent/tweet?text=${encodeURIComponent(g.course.name + 'のリザルト')}&url=${encodeURIComponent(window.location.href)}`);


			return json.result;
		})
		.then(result => {
			const groups = result.map(d => d.section).filter(x => x).filter((x, i, a) => a.indexOf(x) === i);
			const s = document.querySelector('#group');

			{
				const option = document.createElement('option');
				option.value = 'all';
				option.textContent = 'すべて';
				option.selected = true;
				s.appendChild(option);
			}

			groups.sort().forEach(k => {
				const option = document.createElement('option');
				option.value = k;
				option.textContent = k;
				s.appendChild(option);
			});
			s.setAttribute('size', s.childElementCount);

			return result;
		})
		.then(() => draw_all());

	{
		// レースリスト		
		const container = document.querySelector('#race_list');
		container.textContent = '';

		const item_template = document.querySelector('#race_list_item_template');
		const divider_template = document.querySelector('#race_list_divider_template');

		/** @type {Object.<string, Array<{race: string, label: string, course: Course}>>} */
		const group_by_year = race_list.reduce((a, b) => {
			const y = new Date(b.course.starttime).getFullYear();
			if (!(y in a)) a[y] = [];

			a[y].push(b);
			return a;
		}, {});

		Object.keys(group_by_year).sort((a, b) => b - a).forEach(year => {
			const races = group_by_year[year];

			/** @type {Element} */
			const divider = divider_template.cloneNode(true);
			divider.removeAttribute('id');
			divider.classList.remove('d-none');
			divider.querySelector('.year_value').textContent = year;
			container.appendChild(divider);

			races.forEach(({ race, label }) => {
				const item = item_template.cloneNode(true);
				item.removeAttribute('id');
				item.classList.remove('d-none');

				item.textContent = label;
				item.setAttribute('href', '?race=' + race);

				if (g.race === race) {
					item.classList.remove('btn-outline-dark');
					item.classList.add('btn-dark');
					item.classList.add('disabled');
				}

				container.appendChild(item);
			});
		});
	}

	// メンバー追加処理
	document.querySelector('#new_member_input').addEventListener('input', event => {
		new_member_list_element.textContent = '';

		const v = event.target.value;
		if (v === '') return;

		g.data
			.filter(x => x.number === v || x.display_name.includes(v))
			// ToDo: 追加済みメンバーとの重複チェックをここにいれる
			.map(x => generate_member_list_element(x, 'add'))
			.forEach(x => new_member_list_element.appendChild(x));
	});

	{
		// Share機能
		const hide_toast = document.querySelector('#hide_toast');
		const hide_toast_bootstrap = bootstrap.Toast.getOrCreateInstance(hide_toast);

		const no_hide_toast = document.querySelector('#no_hide_toast');
		const no_hide_toast_bootstrap = bootstrap.Toast.getOrCreateInstance(no_hide_toast);

		document.querySelector('#share-link').addEventListener('click', () => {
			navigator.permissions.query({ name: "clipboard-write" })
				.then((result) => {
					if (result.state === "granted" || result.state === "prompt") return;
					throw 'permission request failed.';
				})
				// Safariは clipboard.writeText は出来るが、permissions.query はできない
				// Chromeは permission.query は出来るし、特にAndroidでは clipboard.writeText より前に実行する
				// permission.query の結果にかかわらず clipboard.writeText を試すことで両方に対応する
				.finally(() => navigator.clipboard.writeText(window.location.href))
				.then(() => 'URLをコピーしました')
				.catch(() => 'URLのコピーに失敗しました')
				.then(message => {
					hide_toast.querySelector('.toast-message').textContent = message;
					hide_toast_bootstrap.show();
				});

		});

		document.querySelector('#share-qr').addEventListener('click', () => {
			no_hide_toast.querySelector('.toast-message').textContent = document.title;

			no_hide_toast.querySelector('.toast-body').textContent = '';
			new QRCode(no_hide_toast.querySelector('.toast-body'), window.location.href);

			no_hide_toast_bootstrap.show();
		});
	}

	{
		// 一旦
		// メニューモーダル表示時にタブも切り替える
		Array.from(document.querySelectorAll('.btn-menu')).forEach(elem => {
			const tab = document.querySelector(elem.getAttribute('data-tab'));
			const tab_trigger = bootstrap.Tab.getOrCreateInstance(tab);
			elem.addEventListener('click', () => tab_trigger.show());
		});
	}

	Array.from(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
		.forEach(elem => new bootstrap.Tooltip(elem));
}, { once: true });

window.addEventListener('resume', () => {
	//	alert('resume');
});