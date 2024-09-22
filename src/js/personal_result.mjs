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
	/** @type {Array<LapInfo>} */
	#laps;

	/**
	 * @param {Array<LapInfo>} laps 
	 * @param {Array<PersonResult>} _ 
	 * @param {Element} container 
	 */
	constructor(laps, _, container) {
		const row_class_name = 'template-personal_result';

		this.#row_templater = new BootstrapTemplate();
		this.#row_templater.init(container, row_class_name);

		this.#root_element = container.querySelector('.personal_result_root');
		this.container = container;
		this.#laps = laps;
	}

	clear() {
		Array.from(this.#root_element.children).forEach((elem, i) => {
			if (i >= 6) this.#root_element.removeChild(elem);
		})
	}

	/**
	 * 
	 * @param {PersonResult} athlete 
	 * @returns 
	 */
	update(main_key, athlete) {
		if (!athlete) return false;

		const label = {record: '総合'}

		this.clear();

		// dummy for adjust gap
		const dummy = document.createElement('div');
		this.#root_element.appendChild(dummy);

		this.#laps.forEach(({name, range, units}) => {
			const elem = this.#row_templater.generate('personal_result_row', {
				'.distance': range + units,
				'.finish': '123',
				'.ranking': '987432',
				'.section': '324',
			});
			elem.querySelector('img').src = `/assets/icon/${name}.png`;
			elem.querySelector('hr').classList.add(name);

			if (name === main_key) {
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