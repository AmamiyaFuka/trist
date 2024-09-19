import LapTimeSummary from './lap_time_summary.mjs';
import BootstrapTemplate from './bootstrap_template.mjs';

window.addEventListener('load', () => {
	// 動作確認用にとりあえず5つくらいパネルを作っておく
	const templater = new BootstrapTemplate();
	templater.init(document.body, 'template_panel');

	const view = document.querySelector('#view');
	const test_views = [];
	for (let i = 0; i < 6; i++) {
		const panel = templater.generate('test');
		view.appendChild(panel);
		test_views.push(panel);
	}

	let test_view_index = 0;
	{
		// 一つ目、オーソドックスなもの。見本と同じデータ
		const x = test_views[test_view_index++];

		const laps = ['swim', 'bike-3', 'run-2'];
		const test_data = [];

		const lap_score_summary = new LapTimeSummary(laps, test_data, x);

		test_data.push({
			display_name: '昭和 太郎',
			stats: {
				swim: { time: 1351 },
				'bike-3': { time: 4195 },
				'run-2': { time: 2348 },
			},
		}, {
			display_name: '平成 次郎',
			stats: {
				swim: { time: 1469 },
				'bike-3': { time: 4136 },
				'run-2': { time: 2252 },
			},
		}, {
			display_name: '令和 三郎',
			stats: {
				swim: { time: 1608 },
				'bike-3': { time: 4550 },
				'run-2': { time: 2304 },
			},
		});
		lap_score_summary.update();
	}


	{
		// ラップが2つしかない、ラップの順番がいつもと違う
		const x = test_views[test_view_index++];

		const laps = ['bike-3', 'swim'];
		const test_data = [];

		const lap_score_summary = new LapTimeSummary(laps, test_data, x);

		test_data.push({
			display_name: '昭和 太郎',
			stats: {
				swim: { time: 62 },
				'bike-3': { time: 60 },
				'run-2': { time: 62 },
			},
		}, {
			display_name: '平成 次郎',
			stats: {
				swim: { time: 50 },
				'bike-3': { time: 36 },
				'run-2': { time: 51 },
			},
		},);
		lap_score_summary.update();
	}

	{
		// ラップが4つある、種目が同じ
		const x = test_views[test_view_index++];

		const laps = ['swim', 'bike-3', 'run-2', 'bike-1'];
		const test_data = [];

		const lap_score_summary = new LapTimeSummary(laps, test_data, x);

		test_data.push({
			display_name: '昭和 太郎',
			stats: {
				swim: { time: 62 },
				'bike-3': { time: 60 },
				'run-2': { time: 62 },
				'bike-1': { time: 24 },
			},
		}, {
			display_name: '平成 次郎',
			stats: {
				swim: { time: 50 },
				'bike-3': { time: 36 },
				'run-2': { time: 51 },
				'bike-1': { time: 82 },
			},
		},);
		lap_score_summary.update();
	}

	{
		// 常に一部のデータが抜けている
		const x = test_views[test_view_index++];

		const laps = ['swim', 'bike-3', 'run-2', 'bike-1'];
		const test_data = [];

		const lap_score_summary = new LapTimeSummary(laps, test_data, x);

		test_data.push({
			display_name: '昭和 太郎',
			stats: {
				swim: { time: 40 },
				'run-2': { time: 60 },
				'bike-1': { time: 30 },
			},
		}, {
			display_name: '平成 次郎',
			stats: {
				swim: { time: 50 },
				'run-2': { time: 51 },
				'bike-1': { time: 82 },
			},
		}, {
			display_name: '昭和 太郎',
			stats: {
				'bike-3': { time: 60 },
				'run-2': { time: 62 },
				'bike-1': { time: 24 },
			},
		}, {
			display_name: '平成 次郎',
			stats: {
				'bike-3': { time: 36 },
				'bike-1': { time: 82 },
			},
		}, {
			display_name: '昭和 太郎',
			stats: {
				swim: { time: 62 },
				'bike-3': { time: 60 },
			},
		}, {
			display_name: '平成 次郎',
			stats: {
				swim: { time: 50 },
				'bike-3': { time: 36 },
				'run-2': { time: 51 },
			},
		});
		lap_score_summary.update();
	}
	

	{
		// さらに全てのラップのデータが抜けている
		const x = test_views[test_view_index++];

		const laps = ['swim', 'bike-3', 'run-2', 'bike-1'];
		const test_data = [];

		const lap_score_summary = new LapTimeSummary(laps, test_data, x);

		test_data.push({
			display_name: '昭和 太郎',
			stats: {
				'run-2': { time: 60 },
				'bike-1': { time: 30 },
			},
		}, {
			display_name: '平成 次郎',
			stats: {
				'run-2': { time: 51 },
				'bike-1': { time: 82 },
			},
		}, {
			display_name: '昭和 太郎',
			stats: {
				'bike-3': { time: 60 },
				'run-2': { time: 62 },
				'bike-1': { time: 24 },
			},
		}, {
			display_name: '平成 次郎',
			stats: {
				'bike-3': { time: 36 },
				'bike-1': { time: 82 },
			},
		}, {
			display_name: '昭和 太郎',
			stats: {
				'bike-3': { time: 60 },
			},
		}, {
			display_name: '平成 次郎',
			stats: {
				'bike-3': { time: 36 },
				'run-2': { time: 51 },
			},
		});
		lap_score_summary.update();
	}
	

	{
		// ボタンを押すと数値が変わる
		const x = test_views[test_view_index++];

		const laps = ['swim', 'bike-3', 'run-2', 'bike-1'];
		const test_data = [];

		const lap_score_summary = new LapTimeSummary(laps, test_data, x);

		const button = document.createElement('button');
		button.addEventListener('click', () => {
			test_data.splice(0, Infinity);

			const data_count = Math.floor(Math.random() * 10);
			for (let i = 0; i < data_count; i++) {
				test_data.push({
					display_name: `サンプル${i}`,
					stats: Object.fromEntries(laps.map(lap => [lap, { time: Math.floor(Math.random() * 40 + 30) }])),
				});
			}

			lap_score_summary.update();
		});

		button.textContent = 'Random';
		document.body.appendChild(button);
	}
}, { once: true });