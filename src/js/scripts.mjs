import race_list from '../assets/list.json' with { type: 'json' };

import BootstrapTemplate from './bootstrap_template.mjs';
const templater = new BootstrapTemplate();

import ColorPallets from './color_pallets.mjs';
const color_pallets = new ColorPallets();

import QueryManager from './query_manager.mjs';
const query_manager = new QueryManager(window);

import DataManagerTri from './data_manager.mjs';


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

const data_manager = new DataManagerTri(all_laps);



/**
 * @typedef LapResultContext
 * @property {Element} panel
 * @property {Chart} chart
 * @property {DataStats} stats
 * @property {HTMLCanvasElement} context
 */


/**
 * @typedef GlobalVars
 * @property {string} race レースID, fuji2024など
 * @property {Course} course
 * @property {LapResultContext} record
 * @property {LapResultContext} swim
 * @property {LapResultContext} bike
 * @property {LapResultContext} run 
 */

/** @type {GlobalVars} */
const g = {
	race: 'sample',
	course: {},
	record: {},
	swim: {},
	bike: {},
	run: {},
};

{
	const q = query_manager.getQueryParameter();
	g.race = q.race ?? 'sample';
}


const data_async = import(`/assets/result/${g.race}.json`, { with: { type: 'json' } })
	.then(({ default: json }) => {
		g.course = json.course;
		data_manager.setData(json.result);

		const initial_member_ids = [query_manager.getQueryParameter().members].flat();
		data_manager.setMembers(json.result.filter(x => initial_member_ids.includes(x.number)));

		return json.result;
	});

/**
 * 現在の表示状態をsearch文字列に反映させる
 */
const update_search_string = () => {
	const query = query_manager.setQueryParameter(g.race === 'sample' ? {} : {
		race: g.race,
		members: data_manager.member_data.map(x => x.number),
	});

	// Xシェアリンクを更新
	const text = g.race === 'sample' ? 'Trist' : encodeURIComponent(g.course.name + 'のリザルト');
	const url = 'https://trist.amamiya-studio.com/' + query;
	document.querySelector('#share-x-link')
		.setAttribute('href', `https://x.com/intent/tweet?text=${text}&url=${url}`);
};

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
		if (data_manager.member_data.length > 0) {
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
		if (data_manager.member_data.length > 0) {
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

	data_manager.member_data
		.sort((a, b) => a.stats.record.time - b.stats.record.time)
		.forEach(member => {
			const row = template.cloneNode(true);

			row.querySelector('.name').textContent = member.display_name;
			sub_laps.forEach(lap => {
				const v = member.stats?.[lap]?.time;

				if (v) {
					// 比較値が含まれている場合は、差分表示。いない場合は絶対値表示
					const time = current_time[lap] ? sec_to_mss_with_sign(v - current_time[lap]) : sec_to_hhmmss(v);
					// 比較値が含まれていない場合はセットする
					current_time[lap] ||= v;

					row.querySelector('.time.' + lap).textContent = time;
					row.querySelector('.stack_bar.' + lap).style.width = Math.round(v * 100 / current_time[lap]) + '%';
				} else {
					row.querySelector('.stack_bar.' + lap).style.color = 'gray';
				}
			});

			while (row.firstElementChild) root.appendChild(row.firstElementChild);
		});



	// データ欠落時の代替タイム
	const base_time = ((() => {
		let sum = 0;
		let count = 0;
		data_manager.member_data.forEach(member => {
			sub_laps
				.filter(lap => member.stats[lap].time)
				.forEach(lap => {
					sum += member.stats[lap].time;
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

	data_manager.member_data
		.sort((a, b) => a.stats.record.time - b.stats.record.time)
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

	data_manager.member_data
		.map((member, i) => ({ color: color_pallets.indexOf(i), display: member.display_name, time: member.stats[lap].time }))
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

	const stats = data_manager.time_ranking_data[lap].stats;
	if (stats.count < 2) return;

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
			data: data_manager.time_ranking_data[lap].data,
			parsing: { xAxisKey: 'time', yAxisKey: 'count' },
			// backgroundColor: 'rgb(000, 111, 222)',
			order: 1000,
		}, {
			type: 'line',
			showLine: false,
			pointRadius: 0,
			pointHitRadius: 0,
			data: data_manager.time_ranking_data[lap].stats.density,
			parsing: { xAxisKey: 'time', yAxisKey: 'count' },
			order: 1001,
			yAxisID: 'y_density',
			backgroundColor: 'hsla(214, 40%, 90%, 0.45)',
			fill: true,
		}, {
			showLine: false,
			data: data_manager.member_data,
			parsing: { xAxisKey: `stats.${lap}.time`, yAxisKey: `stats.${lap}.ranking` },
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
							const d = item.raw;
							const stats = item.raw.stats[lap];
							const time = sec_to_hhmmss(stats.time);

							const tips = [`${d.display_name} ${time}`, `${stats.ranking}位`];

							return tips.join(', ');
						},
						afterLabel: item => {
							const tips = [];
							const stats = item.raw.stats[lap];

							if (!isNaN(stats.percentile)) tips.push(`上位${(stats.percentile * 100).toString().substring(0, 4)}%`);
							if (!isNaN(stats.score)) tips.push(`スコア ${stats.score.toString().substring(0, 2)}`);


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

window.addEventListener('load', () => {
	/** 'load' イベントの中身は次の順で実行する
	 * 1. Template作成
	 * 2. リザルトを読み込んだらやる処理 (async)
	 * 3. load直後に可能なしょり。イベント登録など
	 */

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
		elem.removeAttribute('id');

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

				data_manager.addMember(member_data);
			} else if (mode === 'remove') {
				active_member_list_element.removeChild(elem);

				data_manager.removeMember(member_data);
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


	data_async
		.then(result => {
			// 初期メンバーリスト要素を作る
			data_manager.member_data.map(d => generate_member_list_element(d, 'remove'))
				.forEach(elem => active_member_list_element.appendChild(elem));

			return result;
		})
		.then(result => {
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
			return result;
		})
		.then(result => {
			// 各Panelにレース名をいれる（薄字のやつ）
			Array.from(document.querySelectorAll('.course_name')).forEach(elem => elem.textContent = g.course.name);

			// 種目別ビューの距離をいれる
			sub_laps.forEach(lap => g[lap].panel.querySelector(`.distance`).textContent = g.course.distance[lap] + ' km');

			// 総合は距離の代わりに、ディタンスカテゴリ
			g.record.panel.querySelector('.distance').textContent = g.course.category;


			document.querySelector('#share-x-link')
				.setAttribute('href', `https://x.com/intent/tweet?text=${encodeURIComponent(g.course.name + 'のリザルト')}&url=${encodeURIComponent(window.location.href)}`);

			return result;
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
		.then(result => {
			// Groupフィルタ
			const group = document.querySelector('#group');

			group.addEventListener('change', () => {
				if (group.firstElementChild.selected) {
					data_manager.setFilter(() => true);
				} else {
					const values = Array.from(group.querySelectorAll('option')).filter(x => x.selected).map(x => x.value);
					if (values.length === 0) return;

					data_manager.setFilter(k => values.includes(k.section));
				}
				draw_all();
			});

			return result;
		})
		.then(result => {
			// メンバー追加処理
			document.querySelector('#new_member_input').addEventListener('input', event => {
				new_member_list_element.textContent = '';

				const v = event.target.value;
				if (v === '') return;

				result
					.filter(x => x.number === v || x.display_name.includes(v))
					// ToDo: 追加済みメンバーとの重複チェックをここにいれる
					.map(x => generate_member_list_element(x, 'add'))
					.forEach(x => new_member_list_element.appendChild(x));
			});
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
