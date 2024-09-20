import race_list from '../assets/list.json' with { type: 'json' };

import BootstrapTemplate from './bootstrap_template.mjs';
import ColorPallets from './color_pallets.mjs';
import QueryManager from './query_manager.mjs';
import DataManagerTri from './data_manager.mjs';
import Utils from './utils.mjs';

import LapScoreSummary from './lap_score_summary.mjs';
import LapTimeSummary from './lap_time_summary.mjs';

const templater = new BootstrapTemplate();
const color_pallets = new ColorPallets();

const query_manager = new QueryManager(window);

/**
 * @typedef LapResultContext
 * @property {Element} panel
 * @property {Chart} chart
 * @property {DataStats} stats
 * @property {HTMLCanvasElement} canvas
 */

/**
 * @typedef GlobalVars
 * @property {string} race レースID, fuji2024など
 * @property {{main: Lap, all: Array<LapInfo>, sub: Array<LapInfo>}} laps
 * @property {Object.<Lap, LapResultContext>} context
 * @property {Course} course
 * @property {DataManagerTri} result
 * @property {Array<any>} summaries
 */

/** @type {GlobalVars} */
const g = {
	race: '',
	laps: {
		all: [],
		sub: [],
		main: '',
	},
	context: {},
	course: {},
	result: {},
	summaries: [],
};

/**
 * データは先行読み込みするため、即時実行する
 * @returns {Promise}
 */
const initializer = (async () => {
	/** @typedef {'record'|'swim'|'bike'|'run'} Lap */

	/** @type {Array<Lap>} */
	const default_laps = ['record', 'swim', 'bike', 'run'];
	const default_main_lap = 'record';

	const q = query_manager.getQueryParameter();
	if ('launch' in q) {
		const p = window.localStorage.getItem('last');
		if (p?.startsWith('?')) window.location.href = p;
	}

	g.race = q.race;

	return import(`/assets/result/${g.race ?? 'sample'}.json`, { with: { type: 'json' } })
		.then(({ default: { course, result } }) => {
			g.course = course;
			g.laps.main = g.course.laps?.main ?? default_main_lap;
			g.laps.all = g.course.laps?.keys;
			g.laps.sub = g.laps.all.filter(x => x.name !== g.laps.main);

			g.context = Object.fromEntries(g.laps.all.map(({ name: lap }) => [lap, {}]));

			g.result = new DataManagerTri(g.laps.all);
			g.result.setData(result);

			if (g.race) {
				const initial_member_ids = [q.members].flat();
				g.result.setMembers(result.filter(x => initial_member_ids.includes(x.number)));
			} else {
				// サンプルモードの時は、ランダムに4名表示する
				for (let i = 0; i < 4; i++) {
					const k = Math.floor(Math.random() * result.length);
					g.result.addMember(result[k]);
				}
			}
		});
})();

/**
 * 現在の表示状態をsearch文字列に反映させる
 */
const update_search_string = () => {
	if (g.race) {
		const query = query_manager.setQueryParameter({
			race: g.race,
			members: g.result.member_data.map(x => x.number),
		});
		// 起動時 (?launch アクセス時)に最後の閲覧ポイントに飛ぶ
		window.localStorage.setItem('last', query);

		// Xシェアリンクを更新
		const text = encodeURIComponent(g.course.name + 'のリザルト');
		const url = 'https://trist.amamiya-studio.com/' + query;
		document.querySelector('#share-x-link')
			.setAttribute('href', `https://x.com/intent/tweet?text=${text}&url=${url}`);
	} else {
		// サンプル表示時

		// Xシェアリンクはルートページへ
		const text = 'Trist';
		const url = 'https://trist.amamiya-studio.com/';
		document.querySelector('#share-x-link')
			.setAttribute('href', `https://x.com/intent/tweet?text=${text}&url=${url}`);
	}
};


/**
 * サマリーパネルを再描画する
 */
const draw_summaries = () => {
	g.summaries.forEach(s => s.container.classList[s.update() ? 'remove' : 'add']('d-none'));
};

/**
 * すべてのラップパネルのチャート、ランキングと、サマリーパネルを描画する
 */
const draw_all = () => {
	// 描画前にメインタイムでソートする
	g.result.member_data.sort((a, b) => a.stats[g.laps.main].time - b.stats[g.laps.main].time);
	
	g.laps.all
		.forEach(({ name: lap }) => {
			draw_chart(lap);
			draw_member_ranking(lap);
		});

	draw_summaries();
};

/**
 * ランキング要素を描画する
 * @param {Lap} lap 
 */
const draw_member_ranking = lap => {
	// 一度、内容を全て消去する
	g.context[lap].panel.querySelector('ul.ranking').textContent = '';

	let front = null;
	const parent = g.context[lap].panel.querySelector('ul.ranking');

	g.result.member_data
		.map((member, i) => ({ color: color_pallets.indexOf(i), display: member.display_name, time: member.stats[lap].time }))
		.sort((a, b) => !a.time ? 1 : !b.time ? -1 : a.time - b.time) // No dataは最後にする
		.map(x => {
			const d = x.time - front;
			const delta = (front && !isNaN(d)) ? Utils.sec_to_mss_with_sign(x.time - front, true) : '';
			if (!isNaN(d)) front = x.time;

			const item = templater.generate('ranking_item', {
				'.display_name': x.display,
				'.time': x.time ? Utils.sec_to_hhmmss(x.time) : 'No data',
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
const draw_chart = lap => {
	// 既に描画されている場合は消去する
	if (g.context[lap].chart) {
		g.context[lap].chart.update();
		return;
	}

	const time_step_sec = 600;

	const stats = g.result.time_ranking_data[lap].stats;
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
			data: g.result.time_ranking_data[lap].data,
			parsing: { xAxisKey: 'time', yAxisKey: 'count' },
			// backgroundColor: 'rgb(000, 111, 222)',
			order: 1000,
		}, {
			type: 'line',
			showLine: false,
			pointRadius: 0,
			pointHitRadius: 0,
			data: g.result.time_ranking_data[lap].stats.density,
			parsing: { xAxisKey: 'time', yAxisKey: 'count' },
			order: 1001,
			yAxisID: 'y_density',
			backgroundColor: 'hsla(214, 40%, 90%, 0.45)',
			fill: true,
		}, {
			showLine: false,
			data: g.result.member_data,
			parsing: { xAxisKey: `stats.${lap}.time`, yAxisKey: `stats.${lap}.ranking` },
			order: 1,
			pointRadius: 8,
			pointHitRadius: 3,
			backgroundColor: color_pallets.all(),
		}],
	};

	g.context[lap].chart = new Chart(g.context[lap].canvas, {
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
						callback: Utils.sec_to_hhmmss,
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
							const time = Utils.sec_to_hhmmss(stats.time);

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
	templater.init(document, 'template');

	// メンバー追加・削除要素作成
	const active_member_list_element = document.querySelector('#member_list');
	const new_member_list_element = document.querySelector('#new_member_list');

	/**
	 * 
	 * @param {PersonResult} member_data 
	 * @param {'add'|'remove'} mode add: メンバー追加候補状態 remove: 既にメンバーに追加されてチャートに描画されてる状態 
	 */
	const generate_member_list_element = (member_data, mode) => {
		const elem = templater.generate('member_list_template', {
			'.display_name': member_data.display_name,
			'.number': member_data.number,
		});

		const button = elem.querySelector('button');

		button.setAttribute('data-member-update-mode', mode);

		button.addEventListener('click', () => {
			const mode = button.getAttribute('data-member-update-mode');

			if (mode === 'add') {
				button.setAttribute('data-member-update-mode', 'remove');

				new_member_list_element.removeChild(elem);
				active_member_list_element.appendChild(elem);

				g.result.addMember(member_data);
			} else if (mode === 'remove') {
				active_member_list_element.removeChild(elem);

				g.result.removeMember(member_data);
			} else {
				throw new Error('Unset data-member-update-mode');
			}

			update_search_string();

			// 関係する要素の再描画処理
			g.laps.all.forEach(({ name: lap }) => {
				g.context[lap]?.chart?.update();
				draw_member_ranking(lap);
			});
			draw_summaries();
		});

		return elem;
	};

	const lap_names = {
		record: '総合',
		swim: 'スイム',
		bike: 'バイク',
		run: 'ラン',
	};

	initializer
		.then(() => {
			// メインパネルの作成
			const parent = document.querySelector('#view');
			const position = document.querySelector('#panel_positioner');


			g.laps.all.forEach(({ name: lap }) => {
				const kind = lap.split('-')[0];
				const panel = templater.generate('lap_panel', { '.lap_name': lap_names[kind] });
				panel.classList.add(lap);
				panel.classList.add(kind);

				g.context[lap].panel = panel;
				g.context[lap].canvas = panel.querySelector(`canvas`);
				parent.insertBefore(panel, position);
			});
		})
		.then(() => {
			// ヘッダー情報としてレース情報を格納する
			document.querySelector('title').textContent = `${g.course.name} :: Trist`;

			const course_summary = document.querySelector('#course_summary');

			const course_distance =
				g.laps.sub.map(({ name, range, units }) => `${name.split('-')[0]} ${range}${units}`).join(', ');

			[
				`${new Date(g.course.starttime).toLocaleString('ja-JP')} スタート`,
				`場所：${g.course.locale} ${g.course.weather}`,
				`${g.course.category}`,
				course_distance,
			].forEach(text => {
				const p = document.createElement('p');
				p.textContent = text;
				course_summary.appendChild(p);
			});
		})
		.then(() => {
			// 各Panelにレース名をいれる（薄字のやつ）
			Array.from(document.querySelectorAll('.course_name')).forEach(elem => elem.textContent = g.course.name);

			g.laps.all.forEach(({ name, range, units }) => {
				g.context[name].panel.querySelector('.range').textContent = range + ' ' + units;
			})


			document.querySelector('#share-x-link')
				.setAttribute('href', `https://x.com/intent/tweet?text=${encodeURIComponent(g.course.name + 'のリザルト')}&url=${encodeURIComponent(window.location.href)}`);
		})
		.then(() => {
			// Nav内の初期メンバーリスト要素を作る
			g.result.member_data.map(d => generate_member_list_element(d, 'remove'))
				.forEach(elem => active_member_list_element.appendChild(elem));
		})
		.then(() => {
			// Groupフィルタ要素を作る
			const s = document.querySelector('#group');

			{
				const option = document.createElement('option');
				option.value = 'all';
				option.textContent = 'すべて';
				option.selected = true;
				s.appendChild(option);
			}

			g.result.sections.sort().forEach(group_name => {
				const option = document.createElement('option');
				option.value = group_name;
				option.textContent = group_name;
				s.appendChild(option);
			});
			s.setAttribute('size', s.childElementCount);
		})
		.then(() => {
			// GroupフィルタItemの動作定義
			const group = document.querySelector('#group');

			group.addEventListener('change', () => {
				if (group.firstElementChild.selected) {
					g.result.setFilter(() => true);
				} else {
					const values = Array.from(group.querySelectorAll('option')).filter(x => x.selected).map(x => x.value);
					if (values.length === 0) return;

					g.result.setFilter(k => values.includes(k.section));
				}
				draw_all();
			});
		})
		.then(() => {
			// メンバー追加フォーム
			document.querySelector('#new_member_input').addEventListener('input', event => {
				new_member_list_element.textContent = '';

				const v = event.target.value;
				if (v === '') return;

				g.result
					.getResults(x => x.number === v || x.display_name.includes(v))
					.filter(x => !g.result.member_data.includes(x))
					.map(x => generate_member_list_element(x, 'add'))
					.forEach(x => new_member_list_element.appendChild(x));
			});
		})
		.then(() => {
			// サマリー登録
			g.summaries.push(
				new LapScoreSummary(g.laps.sub, g.result.member_data, document.querySelector('#lap_score')));
			g.summaries.push(
				new LapTimeSummary(g.laps.sub, g.result.member_data, document.querySelector('#lap_time')));
		})
		.then(() => draw_all());

	//-- ここから、リザルト情報が読み込まれていなくても可能な処理 --//
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
			const divider = templater.generate('race_list_divider_template', {
				'.year_value': year,
			});
			container.appendChild(divider);

			races.forEach(({ race, label }) => {
				const item = templater.generate('race_list_item_template', {
					'span': label,
				});
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
				.catch(err => {
					console.log(err);
				})
				.finally(() => navigator.clipboard.writeText(window.location.href))
				.catch(err => {
					console.log(err);
					// iOS Safari向け。 navigator.clipboard.writeText ではなく、 navigator.clipboard.write を使う
					navigator.clipboard.write([new ClipboardItem({ 'text/plain': new Blob['url'] })]);
				})
				.then(() => 'シェアリンクをコピーしました')
				.catch(err => {
					console.log(err);
					return 'シェアリンクのコピーに失敗しました<br>別の方法でシェアしてください';
				})
				.then(message => {
					hide_toast.querySelector('.toast-message').innerHTML = message;
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
