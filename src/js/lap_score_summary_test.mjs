import LapScoreSummary from "./lap_score_summary.mjs";

window.addEventListener('load', () => {
	const laps = ['swim', 'bike-3', 'run-2'];
	const test_data = [];

	const lap_score_summary = new LapScoreSummary(laps, test_data, document.querySelector('#generated_by_template'));

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
	}, );
	lap_score_summary.update();
}, { once: true });