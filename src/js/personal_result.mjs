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

	/** @type {Object.<string, string>} */
	#label = {
		record: '総合',
		swim: 'スイム',
		bike: 'バイク',
		run: 'ラン'
	};

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
		container.parentElement.insertBefore(div, container);
		div.appendChild(container);
		div.appendChild(container.querySelector('.copy'));

		this.container = div;
	}

	clear() {
		Array.from(this.#root_element.children).forEach((elem, i) => {
			if (i >= 6) this.#root_element.removeChild(elem);
		})
	}

	update() {
		if (this.#data.athlete_data.length !== 1) return false;

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

		const stats = this.#laps.keys.map(({ name, range, units }) => {
			const kind = name.split('-')[0];
			const ranking_all = this.#data.calculateRanking(r, kind, 'all').ranking;
			const ranking_section = this.#data.calculateRanking(r, kind, 'section').ranking;

			const time = Utils.sec_to_hhmmss_non_zero(r.stats?.[name]?.time);

			return {
				name,
				kind,
				label: this.#label[kind] ?? kind,
				distance: range + units,
				finish: time,
				ranking_all,
				ranking_section,
			};
		});

		stats.forEach(({ name, kind, label, distance, finish, ranking_all, ranking_section }, i) => {
			const elem = this.#row_templater.generate('personal_result_row', finish ? {
				'.distance': distance,
				'.finish': finish,
				'.ranking .value': ranking_all.toString(),
				'.ranking .ord': _str(ranking_all),
				'.section .value': ranking_section.toString(),
				'.section .ord': _str(ranking_section),
			} : { '.distance': distance });
			elem.querySelector('hr').classList.add(kind);

			if (name === main_key) {
				elem.querySelector('.kind').textContent = label;
				elem.querySelector('.distance').textContent = '';
				while (elem.firstElementChild) this.#root_element.appendChild(elem.firstElementChild);
			} else {
				elem.querySelector('img').src = `/assets/icon/${kind}.png`;
				while (elem.firstElementChild) this.#root_element.insertBefore(elem.firstElementChild, dummy);
			}
		});

		this.container.querySelector('.copy-text')?.addEventListener('click', event => {
			event.preventDefault();

			const text = stats
				.sort((a, b) => a.name === main_key ? 1 : b.name === main_key ? -1 : 0)
				.filter(({ finish }) => finish)
				.map(({ name, label, ranking_all, finish }, i) => {
					if (name === main_key) return label + '順位 ' + ranking_all + '位';
					return finish ? label + ' ' + finish : null;
				}).filter(x => x).join(', ');

			Utils.copyText(text);
		});

		this.container.querySelector('.copy-panel')?.addEventListener('click', event => {
			event.preventDefault();
			const c_rect = this.container.getBoundingClientRect();
			const { height } = this.container.querySelector('.copy').getBoundingClientRect();
			domtoimage.toPng(this.container, { height: c_rect.height - height })
				.then(uri => {
					const bytes = atob(uri.split(',')[1]);
					const mime = uri.split(';')[0].split(':')[1];
					const buffer = new ArrayBuffer(bytes.length);
					const array = new Uint8Array(buffer);
					for (let i = 0; i < bytes.length; i++) array[i] = bytes.charCodeAt(i);
					const blob = new Blob([buffer], { type: mime });
					Utils.copyImage(blob);
				});
		});

		return true;
	}
}