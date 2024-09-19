import fs from 'node:fs/promises';

const gauss = (mean, stdev) => {
	// ボックス＝ミュラー法
	const x = Math.random();
	const y = Math.random();

	const log_x = Math.log(x);

	const z1 = Math.sqrt(-2 * log_x) * Math.cos(2 * Math.PI * y);
	const z2 = Math.sqrt(-2 * log_x) * Math.sin(2 * Math.PI * y);

	return { z1: mean + z1 * stdev, z2: mean + z2 * stdev };
};

const course = {
	name: "サンプルデータ",
	starttime: new Date().getTime(),
	weather: "晴れ",
	locale: "日本, 東京都",
	category: "standard distance",
	url: "",
	laps: {
		keys: [
			{ name: "record", range: "standard", units: "" },
			{ name: "swim", range: 1.5, units: "km" },
			{ name: "bike", range: 40, units: "km" },
			{ name: "run", range: 10, units: "km" }
		],
		main: "record",
	}
};

const result = [];

const sections = [
	'-19歳',
	'20-29歳',
	'30-39歳',
	'40-49歳',
	'50-59歳',
	'60-歳',
];

const generate_count = 120;

// 完走者
for (let i = 0; i < generate_count; i++) {
	/**
	 * 3σで
	 * Swim 30分±10分
	 * Bike 50分±25分
	 * Run  40分±15分
	 */

	const swim = Math.floor(gauss(30, 10 / 3).z1 * 60);
	const bike = Math.floor(gauss(50, 25 / 3).z1 * 60);
	const run = Math.floor(gauss(40, 15 / 3).z1 * 60);

	// 動作確認用のデータをいくつか追加しておく
	// 実際に使うときは、読み込み前にcourse.laps情報を書き換える

	const swim_1 = Math.floor(gauss(30, 10 / 3).z1 * 60);
	const swim_2 = Math.floor(gauss(30, 10 / 3).z1 * 60);
	const bike_1 = Math.floor(gauss(50, 25 / 3).z1 * 60);
	const bike_2 = Math.floor(gauss(50, 25 / 3).z1 * 60);
	const run_1 = Math.floor(gauss(40, 15 / 3).z1 * 60);
	const run_2 = Math.floor(gauss(40, 15 / 3).z1 * 60);

	const display_name = 'サン プル' + i;
	const section = sections[Math.floor(Math.random() * 6)];

	result.push({
		display_name,
		rank: "nazo",
		number: (i + 1000).toString(),
		section,
		stats: {
			swim: { time: swim },
			bike: { time: bike },
			run: { time: run },
			'swim-1': { time: swim_1 },
			'swim-2': { time: swim_2 },
			'bike-1': { time: bike_1 },
			'bike-2': { time: bike_2 },
			'run-1': { time: run_1 },
			'run-2': { time: run_2 },
		},
	});
}

// 25%程度のデータを消す
for (let i = 0; i < generate_count * 0.25; i++) {
	const x = Math.floor(Math.random() * generate_count);
	const d = result[x];

	const lap_keys = Object.keys(d.stats);
	const j = Math.floor(Math.random() * lap_keys.length);
	const k = lap_keys[j];

	delete d.stats[k];
}

// recordを計算する
result.forEach(d => {
	if (d.stats.swim && d.stats.bike && d.stats.run)
		d.stats.record = { time: d.stats.swim.time + d.stats.bike.time + d.stats.run.time };
});

// ソートしてランクをつける
result.sort((a, b) => a.stats.record - b.stats.record)
	.forEach((d, i) => d.rank = (i + 1).toString());

fs.writeFile('sample.json', JSON.stringify({ course, result }));