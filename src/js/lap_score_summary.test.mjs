import LapScoreSummary from "./lap_score_summary.mjs";
import BootstrapTemplate from "./bootstrap_template.mjs";

window.addEventListener('load', () => {
	// 動作確認用にとりあえず5つくらいパネルを作っておく
	const templater = new BootstrapTemplate();
	templater.init(document.body, 'template_panel');

	const view = document.querySelector('#view');
	const test_views = [];
	for (let i = 0; i < 5; i++) {
		const panel = templater.generate('test');
		view.appendChild(panel);
		test_views.push(panel);
	}

	let test_view_index = 0;
	{
		// 一つ目、オーソドックスなもの。見本と同じデータ
		const x = test_views[test_view_index++];

		const laps = [
			{ name: 'swim', range: 1.5, units: 'km' },
			{ name: 'bike-3', range: 72, units: 'km' },
			{ name: 'run-2', range: 5.0, units: 'km' }
		];
		const test_data = [];

		const lap_score_summary = new LapScoreSummary(laps, test_data, x);

		test_data.push({
			display_name: '昭和 太郎',
			stats: {
				swim: { score: 62 },
				'bike-3': { score: 60 },
				'run-2': { score: 62 },
			},
		}, {
			display_name: '平成 次郎',
			stats: {
				swim: { score: 50 },
				'bike-3': { score: 36 },
				'run-2': { score: 51 },
			},
		},);
		lap_score_summary.update();
	}


	{
		// ラップが2つしかない
		const x = test_views[test_view_index++];

		const laps = [
			{ name: 'swim', range: 1.5, units: 'km' },
			{ name: 'bike-3', range: 72, units: 'km' },
		];
		const test_data = [];

		const lap_score_summary = new LapScoreSummary(laps, test_data, x);

		test_data.push({
			display_name: '昭和 太郎',
			stats: {
				swim: { score: 62 },
				'bike-3': { score: 60 },
				'run-2': { score: 62 },
			},
		}, {
			display_name: '平成 次郎',
			stats: {
				swim: { score: 50 },
				'bike-3': { score: 36 },
				'run-2': { score: 51 },
			},
		},);
		lap_score_summary.update();
	}


	{
		// ラップが4つある、種目が同じ
		const x = test_views[test_view_index++];

		const laps = [
			{ name: 'swim', range: 1.5, units: 'km' },
			{ name: 'bike-3', range: 72, units: 'km' },
			{ name: 'run-2', range: 5.0, units: 'km' },
			{ name: 'bike-1', range: 172, units: 'km' },
		];
		const test_data = [];

		const lap_score_summary = new LapScoreSummary(laps, test_data, x);

		test_data.push({
			display_name: '昭和 太郎',
			stats: {
				swim: { score: 62 },
				'bike-3': { score: 60 },
				'run-2': { score: 62 },
				'bike-1': { score: 24 },
			},
		}, {
			display_name: '平成 次郎',
			stats: {
				swim: { score: 50 },
				'bike-3': { score: 36 },
				'run-2': { score: 51 },
				'bike-1': { score: 82 },
			},
		},);
		lap_score_summary.update();
	}

	{
		// ボタンを押すと数値が変わる
		const x = test_views[test_view_index++];

		const laps = [
			{ name: 'swim', range: 1.5, units: 'km' },
			{ name: 'bike-3', range: 72, units: 'km' },
			{ name: 'run-2', range: 5.0, units: 'km' },
			{ name: 'bike-1', range: 172, units: 'km' },
		];
		const test_data = [];

		const lap_score_summary = new LapScoreSummary(laps, test_data, x);

		const button = document.createElement('button');
		button.addEventListener('click', () => {
			test_data.splice(0, Infinity);

			const data_count = Math.floor(Math.random() * 10);
			for (let i = 0; i < data_count; i++) {
				test_data.push({
					display_name: `サンプル${i}`,
					stats: Object.fromEntries(laps.map(({ name: lap }) => [lap, { score: Math.floor(Math.random() * 40 + 30) }])),
				});
			}

			lap_score_summary.update();
		});

		button.textContent = 'Random';
		document.body.appendChild(button);
	}
}, { once: true });