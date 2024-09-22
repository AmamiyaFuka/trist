import BootstrapTemplate from "./bootstrap_template.mjs";
import Utils from './utils.mjs';

/**
 * @constructor
 * @extends {Summary}
 */
export default class PersonalResult {
	/** @type {Element} */
	container;

	/** @type {HTMLElement} */
	#root_element;
	/** @type {BootstrapTemplate} */
	#row_templater;
	/** @type {Array<PersonalResult} */
	#athletes;
	/** @type {Array<LapInfo>} */
	#laps;

	/**
	 * @param {Array<LapInfo>} laps 
	 * @param {Array<PersonResult>} athletes 
	 * @param {Element} container 
	 */
	constructor(laps, athletes, container) {
		const row_class_name = 'template-personal_result';

		this.#row_templater = new BootstrapTemplate();
		this.#row_templater.init(container, row_class_name);

		this.#root_element = container.querySelector('.personal_result_root');
		this.container = container;
		this.#laps = laps;
		this.#athletes = athletes;

		// コピー部分用にコンテナ直下の構造を変える
		const div = document.createElement('div');
		this.container.parentElement.insertBefore(div, this.container);
		div.appendChild(this.container);
		div.appendChild(this.container.querySelector('.copy'));
	}

	clear() {
		Array.from(this.#root_element.children).forEach((elem, i) => {
			if (i >= 6) this.#root_element.removeChild(elem);
		})
	}

	update() {
		if (this.#athletes.length !== 1) return false;


		const label = {record: '総合'}

		this.clear();

		const r = this.#athletes[0];
		this.#root_element.querySelector('.section').textContent = r.section;
		this.#root_element.style.setProperty('--section-display', r.section ? 'block' : 'none');

		// dummy for adjust gap
		const dummy = document.createElement('div');
		this.#root_element.appendChild(dummy);

		this.#laps.forEach(({name, range, units}, i) => {
			const elem = this.#row_templater.generate('personal_result_row', {
				'.distance': range + units,
				'.finish': Utils.sec_to_hhmmss_non_zero(r.stats?.[name]?.time),
				'.ranking': r.stats?.[name]?.ranking,
				'.section': r.stats?.[name]?.ranking_section,
			});
			elem.querySelector('img').src = `/assets/icon/${name}.png`;
			elem.querySelector('hr').classList.add(name);

			if (i === 0) {
				elem.querySelector('.kind').textContent = label[name] ?? name;
				elem.querySelector('.distance').textContent = '';
				while(elem.firstElementChild) this.#root_element.appendChild(elem.firstElementChild);
			} else {
				while(elem.firstElementChild) this.#root_element.insertBefore(elem.firstElementChild, dummy);
			}
		});

		return true;
	}
}