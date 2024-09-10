/**
 * 
 * data: [],
 * 	data.
 * target: filted data,
 * chart: chart object
 * kind: record, swim, bike, run
 * race_file: 'json file url',
 * member_ids: focus bib number(s)
 */
const g = {
	kind: 'record',
	race_file: 'assets/sample.json',
	member_ids: [],
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
	if (r.race) g.race_file = `assets/${r.race}.json`;
	if (r.members) g.member_ids = r.members.split(',');
}

/**
 * 秒数をHH:mm:ss表記にする
 * 3200 -> 00:53:20
 */
const sec_to_hhmmss = sec => {
	const h = Math.floor(sec / 3600);
	const m = Math.floor((sec - h * 3600) / 60);
	const s = sec % 60;
	return [h, m, s].map(x => ('00' + x).slice(-2)).join(':');
};

const clear = () => {
	if (g.chart) {
		g.chart.destroy();
		g.chart = null;
	}

	document.querySelector('#compare_record').textContent = '';
};

const record_rows = () => {
	if (g.member_ids.length === 0) return;

	const tbody = document.querySelector('#compare_record');
	const root = g.data.find(x => x.number === g.member_ids[0]);

	g.member_ids.forEach(id => {
		const d = g.data.find(x => x.number === id);

		const tr = document.createElement('tr');

		const name_cell = document.createElement('th');
		name_cell.textContent = d.display_name;
		tr.appendChild(name_cell);

		['swim', 'bike', 'run', 'record'].forEach(k => {
			const td_value = document.createElement('td');
			const td_delta = document.createElement('td');

			td_value.textContent = sec_to_hhmmss(d[k + '_sec']);
			const delta = d[k + '_sec'] - root[k + '_sec'];
			td_delta.classList.add(delta > 0 ? 'positive' : delta < 0 ? 'negative' : 'zero');
			const dv = Math.abs(delta);
			td_delta.textContent = sec_to_hhmmss(dv);

			tr.appendChild(td_value);
			tr.appendChild(td_delta);
		});

		tbody.appendChild(tr);
	});
}

const draw = () => {
	clear();

	const key_sec = g.kind + '_sec';

	const time_step_sec = 600;

	const valid_sec = g.target.map(x => x[key_sec]).filter(x => x);
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
		}, ...g.member_ids.map((id, i) => {
			const d = g.data.find(data => data.number === id);
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
			};
		})],
	};

	g.chart = new Chart(g.context, {
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
							const time = sec_to_hhmmss(d[g.kind + '_sec']);
							return `${d.display_name} ${time}, ${items.raw.y}位, 上位${(items.raw.y / g.target.length * 100).toString().substring(0, 4)}%, スコア ${items.raw.score.toString().substring(0, 2)}`
						},
					}
				},

				legend: {
					display: false,
				},
			},
			responsive: true,
		}
	});

	record_rows();
};

window.addEventListener('load', () => {
	g.context = document.querySelector('#chart');

	{
		const button_group = document.querySelector('#buttons');
		[
			{ id: 'record', label: '総合' },
			{ id: 'swim', label: 'スイム' },
			{ id: 'bike', label: 'バイク' },
			{ id: 'run', label: 'ラン' }
		].forEach(({ id, label }) => {
			const button = document.createElement('button');
			button.id = id;
			button.textContent = label;

			button.addEventListener('click', () => {
				g.kind = id;
				draw();
			});
			button_group.appendChild(button);
		});
	}

	{

		const section_all = document.querySelector('#section_all');
		const section = document.querySelector('#section');

		const update_data_filter = () => {
			if (section_all.checked) g.target = g.data;
			else {
				const values = Array.from(section.querySelectorAll('option')).filter(x => x.selected).map(x => x.value);
				g.target = g.data.filter(k => values.includes(k.section));
			}
			draw();
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
			// jsonの内、dataを除外して g.course に格納する
			g.course = json.course;
			g.target = g.data = json.result;
			document.querySelector('#course_name').textContent = g.course.name;
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
		.then(() => draw());
}, { once: true });
