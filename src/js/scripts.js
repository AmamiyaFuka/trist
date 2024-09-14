class ColorPallets {
	constructor() {
		this.pallets = [
			'#36a2eb',
			'#ff6384',
			'#4bc0c0',
			'#ff9f40',
			'#9966ff',
			'#ffcd56',
			'#c9cbcf',
		];
		this.index = 0;
	};

	new() {
		return this.pallets[this.index = (this.index + 1) % this.pallets.length];
	};

	get_array(length) {
		const n = Math.floor(length / this.pallets.length) + 1;
		const p = this.pallets.length * n - length;
		return Array(n).fill(this.pallets).flat().slice(0, -p);
	}

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

/**
 * 各ラップカードの内容をクリアする
 * 特にチャートやランキングの再構築前に必要となる
 * @param {'swim'|'bike'|'run'|'record'} lap 
 */
const clear = lap => {
	if (g[lap].chart) g[lap].chart.destroy();
	g[lap].chart = null;

	document.querySelector(`#view_${lap} ul.ranking`).textContent = '';
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
		draw_member_ranking(x);
	});

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
					elem.style.width = score_to_width(50);
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
 * アイコンSVG要素を作成する
 * SVGデータは、assets/icon ディレクトリ下に保存されている必要がある
 * @param {string} name 
 * @returns {Element}
 */
const generate_svg_icon_element = name => {
	return document.querySelector('#icon_' + name).cloneNode(true);
};

/**
 * ランキング要素を描画する
 * @param {'swim'|'bike'|'run'|'record'} lap 
 */
const draw_member_ranking = (lap) => {
	let front = null;
	const parent = document.querySelector(`#view_${lap} ul.ranking`);

	const colors = color_pallets.get_array(g.member_data.length);

	g.member_data
		.map((x, i) => ({ color: colors[i], display: x.display_name, time: x[lap + '_sec'] }))
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
			backgroundColor: color_pallets.get_array(g.member_data.length),
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
					max: g.target.length + 50,
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
 */
const updated_target_data = () => {
	laps.forEach(lap => {
		const k = lap + '_sec';

		const sorted_times = g.target.map(x => x[k]).filter(x => x).sort((a, b) => a - b);

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
};

/**
 * メンバーリストが変更されたイベントを発行する
 * メンバーリスト要素の再構築が期待される
 */
const updated_member_list = () => {
	document.querySelector('#member_list').dispatchEvent(new Event('member_list_update'));

	// 色指定が無かったら追加する
	g.member_data.forEach(member => {
		laps.forEach(lap => update_member_stats(member, lap));
	});

	g.member_chart_data = g.member_data.map(d => {
		return Object.fromEntries([
			['tag', d],
			...laps.map(lap => {
				const lap_x = d[lap + '_sec'];
				const lap_y = g.chart_data[lap_x - g.chart_data[0]?.x]?.[lap];
				return [lap, { x: lap_x, y: lap_y }];
			})]);
	});
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
				g.target = g.data;
			} else {
				const values = Array.from(group.querySelectorAll('option')).filter(x => x.selected).map(x => x.value);

				if (values.length === 0) return;
				g.target = g.data.filter(k => values.includes(k.section));
			}

			updated_target_data();
			draw_all();
		});
	}

	fetch(g.race_file)
		.then(res => res.json())
		.then(json => {
			g.course = json.course;
			g.target = g.data = json.result;
			updated_target_data();

			Array.from(document.querySelectorAll('.course_name')).forEach(elem => elem.textContent = g.course.name);

			['swim', 'bike', 'run'].forEach(x => document.querySelector(`#view_${x} .distance`).textContent = g.course.distance[x] + ' km');
			document.querySelector('#view_record .distance').textContent = g.course.category;

			{
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

			g.member_data = g.data.filter(x => g.member_ids.includes(x.number));
			delete g.member_ids;
			updated_member_list();

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
		const v = event.target.value;

		const ul = document.querySelector('#new_member_list');
		ul.textContent = '';

		if (v === '') return;

		g.data
			.filter(x => x.number === v || x.display_name.includes(v))
			// ToDo: 追加済みメンバーとの重複チェックをここにいれる
			.map(x => {
				return {
					tag: 'li',
					class: 'list-group-item d-flex',
					child: [{
						tag: 'span',
						text: `${x.display_name}`,
						class: 'align-self-center',
					}, {
						tag: 'span',
						text: `(${x.number})`,
						class: 'align-self-center',
					},
					{
						tag: 'button',
						class: 'btn ms-auto',
					}],
					object: x,
				};
			})
			.map(x => {
				const elem = generate_element(x);
				const button = elem.querySelector('button');

				button.addEventListener('click', () => {
					g.member_data.push(x.object);

					ul.removeChild(elem);

					updated_member_list();
					draw_all();
				}, { once: true });

				const icon = generate_svg_icon_element('user-plus');
				icon.classList.add('touchable_small_icon');
				button.appendChild(icon);

				return elem;
			})
			.forEach(x => ul.appendChild(x));
	});

	document.querySelector('#member_list').addEventListener('member_list_update', event => {
		const ul = event.target;

		ul.textContent = '';
		g.member_data
			.map(x => ({
				object: x,
				tag: 'li',
				class: 'list-group-item d-flex',
				child: [{
					tag: 'span',
					text: `${x.display_name}`,
					class: 'align-self-center',
				}, {
					tag: 'span',
					text: `(${x.number})`,
					class: 'align-self-center',
				},
				{
					tag: 'button',
					class: 'btn ms-auto',
				}],

			}))
			.map((x, i) => {
				const elem = generate_element(x);
				const button = elem.querySelector('button');

				button.addEventListener('click', () => {
					g.member_data.splice(i, 1);
					g.member_chart_data.splice(i, 1);
					ul.removeChild(elem);

					laps.forEach(lap => g[lap].chart.update());
				}, { once: true });

				const icon = generate_svg_icon_element('user-minus');
				icon.classList.add('touchable_small_icon');
				button.appendChild(icon);

				return elem;
			})
			.forEach(x => ul.appendChild(x));

		update_search_string();
		draw_all();
	});

}, { once: true });

window.addEventListener('resume', () => {
	//	alert('resume');
});