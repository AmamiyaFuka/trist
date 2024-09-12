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
	const race = g.race_file.match(/assets\/result\/(.*?)\.json/)[1];
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
		.forEach((member, i) => {
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

	g.member_data
		.map(x => ({ color: x.color, display: x.display_name, time: x[lap + '_sec'] }))
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

	const valid_sec = g.target.map(x => x[key_sec]).filter(x => x);

	if (valid_sec.length < 2) return;

	const time_min = Math.floor(Math.min(...valid_sec) / time_step_sec) * time_step_sec;
	const time_max = Math.ceil(Math.max(...valid_sec) / time_step_sec) * time_step_sec;

	const average = valid_sec.reduce((a, b) => a + b / valid_sec.length, 0);
	const variance = valid_sec.reduce((a, b) => a + Math.pow(b - average, 2) / valid_sec.length, 0);
	const stdev = Math.sqrt(variance);

	const accumulate = Array(time_max - time_min).fill(0)
		.map((_, i) => time_min + i)
		.map(x => {
			return {
				x,
				y: valid_sec.filter(t => t < x).length,
			};
		});

	const data = {
		datasets: [{
			label: '全体累積分布',
			type: 'line',
			showLine: true,
			tension: 0.05,
			pointRadius: 0,
			pointHitRadius: 0,
			data: accumulate,
			// backgroundColor: 'rgb(000, 111, 222)',
			order: 1000,
		}, ...g.member_data.map((d, i) => {
			const x = d[key_sec];
			return {
				label: d.display_name,
				data: [{
					x, y: accumulate.find(n => n.x === x)?.y,
					tag: d,
					score: (x - average) / stdev * 10 + 50
				}],
				order: i + 1,
				pointRadius: 8,
				backgroundColor: d.color,
			};
		})],
	};

	g[lap].chart = new Chart(g[lap].context, {
		type: 'scatter',
		data,
		options: {
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
				},
				y: {
					type: 'linear',
					position: 'left',
					min: 0,
					max: g.target.length + 1,
					reverse: true,
					ticks: {
						stepSize: 10,
					},
				}
			},
			plugins: {
				tooltip: {
					callbacks: {
						label: (items) => {
							const d = items.raw.tag;
							const time = sec_to_hhmmss(d[lap + '_sec']);
							return `${d.display_name} ${time}, ${items.raw.y}位, 上位${(items.raw.y / g.target.length * 100).toString().substring(0, 4)}%, スコア ${items.raw.score.toString().substring(0, 2)}`
						},
					}
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
 * メンバーリストが変更されたイベントを発行する
 * メンバーリスト要素の再構築が期待される
 */
const update_member_list = () => document.querySelector('#member_list').dispatchEvent(new Event('member_list_update'));

window.addEventListener('load', () => {
	laps.forEach(lap => g[lap].context = document.querySelector(`#view_${lap} canvas`))


	{
		// デバッグ用
		document.querySelector('#redraw').addEventListener('click', () => draw_all());
	}

	{
		// Sectionフィルタ
		const section_all = document.querySelector('#section_all');
		const section = document.querySelector('#section');

		const update_data_filter = () => {
			if (section_all.checked) g.target = g.data;
			else {
				const values = Array.from(section.querySelectorAll('option')).filter(x => x.selected).map(x => x.value);
				g.target = g.data.filter(k => values.includes(k.section));
			}

			draw_all();
		};

		section_all.addEventListener('change', () => {
			section.disabled = section_all.checked;

			update_data_filter();
		});

		section.addEventListener('change', () => update_data_filter());
	}

	fetch(g.race_file)
		.then(res => res.json())
		.then(json => {
			g.course = json.course;
			g.target = g.data = json.result;
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

			g.member_data.forEach((x, i) => {
				if (!x.color) x.color = color_pallets.new();
			});
			update_member_list();

			return json.result;
		})
		.then(result => {
			const sections = result.map(d => d.section).filter(x => x).filter((x, i, a) => a.indexOf(x) === i);
			const s = document.querySelector('#section');
			sections.forEach(k => {
				const option = document.createElement('option');
				option.value = k;
				option.textContent = k;
				option.selected = true;
				s.appendChild(option);
			});
			s.setAttribute('size', s.childElementCount);

			return result;
		})
		.then(() => draw_all());

	//レースリスト
	fetch('./assets/list.json')
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
			// 追加済みメンバーとの重複チェックをここにいれる
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
					if (!x.object.color) x.object.color = color_pallets.new();
					g.member_data.push(x.object);

					ul.removeChild(elem);

					update_member_list();
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
			.map(x => {
				const elem = generate_element(x);
				const button = elem.querySelector('button');

				button.addEventListener('click', () => {
					g.member_data = g.member_data.filter(m => m.number !== x.object.number);
					update_member_list();
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