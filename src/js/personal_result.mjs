//@ts-check
import BootstrapTemplate from './bootstrap_template.mjs';
import DataManager from './data_manager.mjs';
import Utils from './utils.mjs';

/**
 * @constructor
 */
export default class PersonalResult {
	/** @type {Element} */
	container;

	/** @type {HTMLElement} */
	#root_element;
	/** @type {BootstrapTemplate} */
	#row_templater;
	/** @type {DataManager} */
	#data;
	/** @type {{keys:Array<LapInfo>, main:string?}} */
	#laps;

	/**
	 * @param {DataManagerTri} data
	 * @param {Element} container 
	 */
	constructor(data, container) {
		const row_class_name = 'template-personal_result';

		this.#row_templater = new BootstrapTemplate();
		this.#row_templater.init(container, row_class_name);

		this.#root_element = container.querySelector('.personal_result_root');
		this.#data = data;
		this.#laps = data.getLaps();

		// コピー部分用にコンテナ直下の構造を変える
		const div = document.createElement('div');
		container.parentElement.insertBefore(div, this.container);
		div.appendChild(this.container);
		div.appendChild(this.container.querySelector('.copy'));

		this.container = div;
	}

	clear() {
		Array.from(this.#root_element.children).forEach((elem, i) => {
			if (i >= 6) this.#root_element.removeChild(elem);
		})
	}

	update() {
		if (this.#data.athlete_data.length !== 1) return false;

		const label = { record: '総合' }

		this.clear();

		const r = this.#data.athlete_data[0];
		this.#root_element.querySelector('.section').textContent = r.section;
		this.#root_element.style.setProperty('--section-display', r.section ? 'block' : 'none');

		// dummy for adjust gap
		const dummy = document.createElement('div');
		this.#root_element.appendChild(dummy);

		const main_key = this.#laps.main;

		const _str = number => {
			const h = number % 100;
			if (h >= 10 && h <= 20) return 'th';

			const t = number % 10;
			switch (t) {
				case NaN:
				case Infinity:
				case -Infinity:
				case 0:
					return '';
				case 1:
					return 'st';
				case 2:
					return 'nd';
				case 3:
					return 'rd';
				default:
					return 'th';
			}
		};

		this.#laps.keys.forEach(({ name, range, units }) => {
			const kind = name.split('-')[0];
			const ranking_all = this.#data.calculateRanking(r, kind, 'all').ranking;
			const ranking_section = this.#data.calculateRanking(r, kind, 'section').ranking;

			const time = Utils.sec_to_hhmmss_non_zero(r.stats?.[name]?.time);
			const elem = this.#row_templater.generate('personal_result_row', time ? {
				'.distance': range + units,
				'.finish': time,
				'.ranking .value': ranking_all.toString(),
				'.ranking .ord': _str(ranking_all),
				'.section .value': ranking_section.toString(),
				'.section .ord': _str(ranking_section),
			} : { '.distance': range + units });
			elem.querySelector('hr').classList.add(kind);

			if (name === main_key) {
				elem.querySelector('.kind').textContent = label[kind] ?? kind;
				elem.querySelector('.distance').textContent = '';
				while (elem.firstElementChild) this.#root_element.appendChild(elem.firstElementChild);
			} else {
				elem.querySelector('img').src = `/assets/icon/${kind}.png`;
				while (elem.firstElementChild) this.#root_element.insertBefore(elem.firstElementChild, dummy);
			}
		});

		return true;
	}
}