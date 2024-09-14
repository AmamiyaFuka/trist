class ColorPallets {
	#pallets = [
		'#36a2eb',
		'#ff6384',
		'#4bc0c0',
		'#ff9f40',
		'#9966ff',
		'#ffcd56',
		'#c9cbcf',
	];
	#index = 0;
	constructor() { };

	new() {
		return this.#pallets[this.#index = (this.#index + 1) % this.#pallets.length];
	};

	all() {
		return this.#pallets;
	};

	indexOf(i) {
		return this.#pallets[i % this.#pallets.length];
	};

	swim(alpha) { return `hsla(198, 82%, 75%, ${alpha ?? '0'})`; };
	bike(alpha) { return `hsla(0, 69%, 100%, ${alpha ?? '0'})`; };
	run(alpha) { return `hsla(134, 46%, 80%, ${alpha ?? '0'})`; };
	record(alpha) { return `hsla(43, 41%, 100%, ${alpha ?? '0'})`; };
};

const color_pallets = new ColorPallets();

const laps = ['record', 'swim', 'bike', 'run'];
const sub_laps = ['swim', 'bike', 'run'];

/**
 * 
 * data: [],
 * 	data.
 * target: filted data,
 */
const g = {
	race_file: 'assets/result/sample.json',
	data: [],
	target: [],
	member_ids: [],
	member_data: [],
	swim: {
		chart: undefined,
		context: undefined,
	},
	bike: {
		chart: undefined,
		context: undefined,
	},
	run: {
		chart: undefined,
		context: undefined,
	},
	record: {
		chart: undefined,
		context: undefined,
	},
};

const update_search_string = () => {
	const race = g.race_file.match(/\/?assets\/result\/(.*?)\.json/)[1];
	window.history.replaceState(null, null, `?race=${race}&members=${g.member_data.map(x => x.number).join(',')}`);
};


/**
 * search文字列から、表示に関わるパラメータを抽出する
 */
{
	const query = window.location.search.substring(1).split('&');

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
 * 各ラップカードのランキング内容をクリアする
 * 特にチャートやランキングの再構築前に必要となる
 * @param {'swim'|'bike'|'run'|'record'} lap 
 */
const clear_ranking = lap => {
	document.querySelector(`#view_${lap} ul.ranking`).textContent = '';
};

/**
 * 各ラップカードのチャートの内容をクリアする
 * 特にチャートやランキングの再構築前に必要となる
 * @param {'swim'|'bike'|'run'|'record'} lap 
 */
const clear = lap => {
	if (g[lap].chart) g[lap].chart.destroy();
	g[lap].chart = null;
};

/**
 * すべてのラップカードの内容をクリアする
 */
const clear_all = () => {
	laps.forEach(lap => clear(lap));
};

/**
 * すべてのラップカードのチャート、ランキングを描画する
 */
const draw_all = () => {
	laps.forEach(x => {
		draw(x);
		clear_ranking(x);
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
	const base_width = sub_laps.reduce((a, k) => Math.min(a, current_time[k]), base_time);
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

const summary_drawer = [
	draw_lap_time_summary,
	draw_lap_score_summary,
];

/**
 * 
 * @param {ParsedElement} arg 
 * @returns {Element}
 */
const generate_element = arg => {
	const elem = document.createElement(arg.tag);

	if ('text' in arg) {
		elem.appendChild(document.createTextNode(arg.text));
	}

	if ('child' in arg) {
		arg.child.forEach(x => elem.appendChild(generate_element(x)));
	}

	if ('class' in arg) {
		arg.class.split(' ').forEach(x => elem.classList.add(x));
	}

	if ('style' in arg) {
		Object.keys(arg.style).forEach(x => elem.style[x] = arg.style[x]);
	}

	if ('attributes' in arg) {
		Object.keys(arg.attributes).forEach(x => elem.setAttribute(x, arg.attributes[x]));
	}

	return elem;
};

/**
 * ランキング要素を描画する
 * @param {'swim'|'bike'|'run'|'record'} lap 
 */
const draw_member_ranking = (lap) => {
	let front = null;
	const parent = document.querySelector(`#view_${lap} ul.ranking`);

	g.member_data
		.map((x, i) => ({ color: color_pallets.indexOf(i), display: x.display_name, time: x[lap + '_sec'] }))
		.sort((a, b) => a.time - b.time)
		.map(x => {
			const d = x.time - front;
			const delta = (front && !isNaN(d)) ? sec_to_mss_with_sign(x.time - front, true) : '';
			if (!isNaN(d)) front = x.time;
			return {
				tag: 'li',
				child: [{
					tag: 'span',
					class: 'circle',
					style: {
						'background-color': x.color,
					},
				}, {
					tag: 'span',
					class: 'display_name',
					text: x.display,
				}, {
					tag: 'span',
					class: 'time',
					text: x.time ? sec_to_hhmmss(x.time) : 'No data',
				}, {
					tag: 'span',
					class: 'delta',
					text: delta,
				}],
			};
		})
		.map(x => generate_element(x))
		.forEach(x => parent.appendChild(x));
};

/**
 * チャートを描画する
 * @param {'swim'|'bike'|'run'|'record'} lap 
 */
const draw = (lap) => {
	clear(lap);

	const key_sec = lap + '_sec';

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
		}, ({
			showLine: false,
			data: g.member_chart_data,
			parsing: { xAxisKey: lap + '.x', yAxisKey: lap + '.y' },
			order: 1,
			pointRadius: 8,
			pointHitRadius: 3,
			backgroundColor: color_pallets.all(),
		})],
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
				}
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
 * 
 * @param {Array<PersonResult} target 
 */
const update_target_data = target => {
	g.target = target; // この代入は不要だがデバッグ用にまだおいとく

	laps.forEach(lap => {
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
	const time_min = Math.min(...laps.map(lap => g[lap]?.stats?.time?.min).filter(x => x));
	const time_max = Math.max(...laps.map(lap => g[lap]?.stats?.time?.max).filter(x => x));

	g.chart_data = Array(time_max - time_min).fill(0)
		.map((_, i) => time_min + i)
		.map(x => ({
			x,
			...Object.fromEntries(laps.map(lap => {
				const v = g[lap].stats.sorted_times.findIndex(t => t > x);
				return [lap, v > 0 ? v : undefined];
			})),
		}));

	update_all_member_stats();

	g.member_chart_data = g.member_data.map(d => generate_member_chart_data(d));
};

/**
 * 
 * @param {PersonResult} member_data 
 * @returns {PersonChartData}
 */
const generate_member_chart_data = member_data => {
	return Object.fromEntries([
		['tag', member_data],
		...laps.map(lap => {
			const lap_x = member_data[lap + '_sec'];
			const lap_y = g.chart_data[lap_x - g.chart_data[0]?.x]?.[lap];
			return [lap, { x: lap_x, y: lap_y }];
		})]);
};

/**
 * メンバーの統計データを再計算する
 * @param {PersonResult} member 
 * @param {'record' | 'swim' | 'bike' | 'run'} lap 
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
	g.member_data.forEach(member => laps.forEach(lap => update_member_stats(member, lap)));
};

window.addEventListener('load', () => {
	laps.forEach(lap => g[lap].context = document.querySelector(`#view_${lap} canvas`))


	{
		// デバッグ用
		document.querySelector('#redraw').addEventListener('click', () => draw_all());
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

				laps.forEach(lap => update_member_stats(member_data, lap));

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
			laps.forEach(lap => {
				g[lap].chart.update();

				clear_ranking(lap);
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

			// 各Viewにレース名をいれる（薄字のやつ）
			Array.from(document.querySelectorAll('.course_name')).forEach(elem => elem.textContent = g.course.name);

			{
				// 種目別ビューの距離をいれる
				sub_laps.forEach(x => document.querySelector(`#view_${x} .distance`).textContent = g.course.distance[x] + ' km');

				// 総合は距離の代わりに、ディタンスカテゴリ
				document.querySelector('#view_record .distance').textContent = g.course.category;
			}

			{
				// レース情報
				document.querySelector('title').textContent = `${g.course.name} :: Trist`;

				const course_summary = document.querySelector('#course_summary');
				[
					`${new Date(g.course.starttime).toLocaleString('ja-JP')} スタート`,
					`場所：${g.course.locale} ${g.course.weather}`,
					`${g.course.category} distance`,
					`swim ${g.course.distance.swim} km, bike ${g.course.distance.bike} km, run ${g.course.distance.run} km`,
				].forEach(text => {
					const p = document.createElement('p');
					p.textContent = text;
					course_summary.appendChild(p);
				})
			}

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

	//レースリスト
	fetch('assets/list.json')
		.then(res => res.json())
		.then(json => {
			const ul = document.querySelector('#race_list');
			ul.textContent = '';

			json.forEach(({ race, label }) => {
				const li = document.createElement('li');
				['btn', 'rounded-pill', 'm-2'].forEach(x => li.classList.add(x));

				const a = document.createElement('a');

				a.textContent = label;
				a.setAttribute('href', '?race=' + race);

				if (g.race === race) {
					a.classList.add('pe-none');
					li.classList.add('active');
				}

				li.appendChild(a);
				ul.appendChild(li);
			});
		});

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
}, { once: true });

window.addEventListener('resume', () => {
	//	alert('resume');
});