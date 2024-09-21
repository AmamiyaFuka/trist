import BootstrapTemplate from "./bootstrap_template.mjs";
import Utils from './utils.mjs';

/**
 * 各種目別のタイムを積み上げ棒グラフで表示します
 * @constructor
 * @extends {Summary}
 */
export default class LapTimeSummary {
	/** @type {Element} */
	container;

	/** @type {BootstrapTemplate} */
	#row_templater;
	/** @type {HTMLElement} */
	#root_element;
	/** @type {Array<LapInfo>} */
	#laps;

	/** @type {Array<PersonResult>} */
	#athlete_data;

	/**
	 * 
	 * @param {Array<LapInfo>} laps 
	 * @param {Array<PersonResult>} athlete_data 
	 * @param {Element} container 
	 */
	constructor(laps, athlete_data, container) {
		const row_class_name = 'template-lap_time_row';


		// 複雑な構成ではないので、テンプレートを自力で作る
		const template_element = container.querySelector('#lap_time_row');
		template_element.textContent = '';
		[
			'name',
			...laps.map(({ name: lap }) => ['time', lap, lap.split('-')[0]].join(',')),
			'dummy'
		].join('/time_bar/').split('/').forEach(class_names => {
			const div = document.createElement('div');
			class_names.split(',').forEach(name => div.classList.add(name));
			template_element.appendChild(div)
		});

		laps.forEach(({ name: lap }, i) => {
			const kind = lap.split('-')[0];
			const div = document.createElement('div');
			div.classList.add('stack_bar');
			div.classList.add(lap);
			div.classList.add(kind);
			div.classList.add('c' + i);

			const img = document.createElement('img');
			img.setAttribute('src', `/assets/icon/${kind}.png`);
			div.appendChild(img);

			template_element.appendChild(div);
		});
		// テンプレート作成ここまで

		this.#root_element = container.querySelector('.lap_time_chart');
		this.#root_element.style.setProperty('--lap-count', laps.length);

		this.container = container;
		this.#laps = laps;
		this.#athlete_data = athlete_data;
		this.#row_templater = new BootstrapTemplate();
		this.#row_templater.init(container, row_class_name);
	}

	clear() {
		this.#root_element.textContent = '';
	}

	update() {
		if (this.#athlete_data.length < 1) return false;

		this.clear();

		// エラー時にレイアウトが著しく狂わないようにしておく
		this.#root_element.style.gridTemplateColumns = ['auto',
			...this.#laps.map(() => '1fr'),
			'0.5fr'
		].join(' 1px ');

		// 比較値
		const current_time = {};

		this.#athlete_data
			.forEach((athlete, i) => {
				const row = this.#row_templater.generate('lap_time_row', {
					'.name': athlete.display_name,
				});

				this.#laps.forEach(({ name: lap }) => {
					const v = athlete.stats?.[lap]?.time;

					if (v) {
						// 比較値が含まれている場合は、差分表示。いない場合は絶対値表示
						const time = current_time[lap] ? Utils.sec_to_mss_with_sign(v - current_time[lap]) : Utils.sec_to_hhmmss(v);
						// 比較値が含まれていない場合はセットする
						current_time[lap] ||= v;

						row.querySelector('.time.' + lap).textContent = time;
						row.querySelector('.stack_bar.' + lap).style.width = Math.round(v * 100 / current_time[lap]) + '%';
					} else {
						row.querySelector('.stack_bar.' + lap).style.color = 'gray';
					}
				})

				while (row.firstElementChild) this.#root_element.appendChild(row.firstElementChild);
			});


		// データ欠落時の代替タイム
		const base_time = ((() => {
			let sum = 0;
			let count = 0;
			this.#athlete_data.forEach(athlete => {
				this.#laps
					.filter(lap => athlete.stats[lap]?.time)
					.forEach(lap => {
						sum += athlete.stats[lap].time;
						count++;
					});
			})
			return sum / count;
		}))();
		// current_time のうち一番小さい数値（または代替タイム）を 1fr にする
		const base_width = Math.min(...Object.values(current_time).filter(x => x).concat(base_time));

		this.#root_element.style.gridTemplateColumns = ['auto',
			...this.#laps.map(lap => (current_time[lap] || base_time) / base_width + 'fr'),
			'0.5fr'
		].join(' 1px ');

		return true;
	}
}