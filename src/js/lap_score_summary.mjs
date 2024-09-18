import BootstrapTemplate from "./bootstrap_template.mjs";

export default class LapScoreSummary {
	/** @type {Element} */
	container;

	/** @type {BootstrapTemplate} */
	#row_templater;
	/** @type {Element} */
	#root_element;
	/** @type {Element} */
	#insert_position;
	/** @type {Array<string>} */
	#laps;

	/** @type {Array<any>} */
	#member_data;

	constructor(laps, member_data, container) {
		const row_class_name = 'template-lap_score';
		const sub_class_name = 'template-lap_score_sub_1';

		const row = container.querySelector('.' + row_class_name);

		const sub_templater = new BootstrapTemplate();
		sub_templater.init(container, sub_class_name);

		laps.forEach(lap => {
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
		this.#member_data = member_data;

		this.#root_element = container.querySelector('.lap_score_chart_root');
		this.#insert_position = container.querySelector('.lap_score_footer_start');

		this.#row_templater = new BootstrapTemplate();
		this.#row_templater.init(container, row_class_name);
	}

	clear() {
		while (this.#root_element.firstElementChild !== this.#insert_position) this.#root_element.removeChild(this.#root_element.firstElementChild);
	}

	update() {
		if (this.#member_data.length < 1) return false;

		this.clear();

		this.#member_data
			.forEach((member, i) => {
				const row = this.#row_templater.generate('lap_score_row', {
					'.name': member.display_name,
				});

				this.#laps.forEach(lap => {
					if (!member.stats) return;
					const v = member.stats[lap]?.score;
					const elem = row.querySelector('.stack_bar.' + lap);

					// 幅の計算方法は styles.scss を参照のこと
					const score_to_width = dev => Math.round(dev * 20 / 7) + '%';
					if (v) {
						elem.textContent = Math.round(v);
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