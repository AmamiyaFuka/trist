//@ts-check
import BootstrapTemplate from "./bootstrap_template.mjs";

/**
 * 各種目別のスコア（偏差値）を表示します
 * @constructor
 * @extends {Summary}
 */
export default class LapScoreSummary {
	/** @type {Element} */
	container;

	/** @type {BootstrapTemplate} */
	#row_templater;
	/** @type {HTMLElement} */
	#root_element;
	/** @type {Element} */
	#insert_position;
	/** @type {Array<LapInfo>} */
	#laps;

	/** @type {Array<any>} */
	#athlete_data;

	/**
	 * 
	 * @param {Array<LapInfo>} laps 
	 * @param {Array<PersonResult>} athlete_data 
	 * @param {Element} container 
	 */
	constructor(laps, athlete_data, container) {
		const row_class_name = 'template-lap_score';
		const sub_class_name = 'template-lap_score_sub_1';

		const row = container.querySelector('.' + row_class_name);

		const sub_templater = new BootstrapTemplate();
		sub_templater.init(container, sub_class_name);

		laps.forEach(({ name: lap }) => {
			const item = sub_templater.generate('lap_score_sub');
			const kind = lap.split('-')[0];
			Array.from(item.querySelectorAll('.lap_kind')).forEach(x => x.classList.add(kind));
			Array.from(item.querySelectorAll('.lap_name')).forEach(x => x.classList.add(lap));

			item.querySelector('img').setAttribute('src', `/assets/icon/${kind}.png`);

			// GridLayoutのため、親子関係を崩すことができない。
			// テンプレート挿入時に1段上げないといけないので注意
			while (item.firstChild) row.appendChild(item.firstChild);
		});

		this.container = container;
		this.#laps = laps;
		this.#athlete_data = athlete_data;

		this.#root_element = container.querySelector('.lap_score_chart_root');
		this.#insert_position = container.querySelector('.lap_score_footer_start');

		this.#root_element.style.setProperty('--lap-count', laps.length);

		this.#row_templater = new BootstrapTemplate();
		this.#row_templater.init(container, row_class_name);
	}

	clear() {
		while (this.#root_element.firstElementChild !== this.#insert_position) 
			this.#root_element.removeChild(this.#root_element.firstElementChild);
	}

	update() {
		if (this.#athlete_data.length < 1) return false;

		this.clear();

		this.#athlete_data
			.forEach((athlete, i) => {
				const row = this.#row_templater.generate('lap_score_row', {
					'.name': athlete.display_name,
				});

				this.#laps.forEach(({ name: lap }) => {
					if (!athlete.stats) return;
					const v = athlete.stats[lap]?.score;
					/** @type {HTMLElement} */
					const elem = row.querySelector('.stack_bar.' + lap);

					// 幅の計算方法は styles.scss を参照のこと
					const score_to_width = dev => Math.round(dev * 20 / 7) + '%';
					if (v) {
						elem.textContent = Math.round(v).toString();
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

				while (row.firstElementChild) this.#root_element.insertBefore(row.firstElementChild, this.#insert_position);
			});

		return true;
	}
}