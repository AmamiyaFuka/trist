/** */
export default class BootstrapTemplate {
	/** @type {Object.<string, HTMLElement>} */
	#templates = {};

	constructor() { };

	/**
	 * Documentからテンプレート要素を抽出し、後処理としてDocumentから取り除きます
	 * テンプレートは class に "template" が指定されています
	 * このメソッドは、documentがloadされた直後に実行されることを期待しています
	 * @param {Document|HTMLElement} document 
	 */
	init(document) {
		// テンプレート内にテンプレートが含まる構造がありえるので
		// 最も子となる要素から再帰的に登録する
		const template_element_list = Array.from(document.querySelectorAll('.template'));
		template_element_list.forEach(template_element => {
			this.init(template_element);

			template_element.classList.remove('template');
			const id = template_element.getAttribute('id');
			if (!id || id in this.#templates) return;
			const elem = template_element.cloneNode(true);
			elem.removeAttribute('id');
			this.#templates[id] = elem;

			template_element.parentElement.removeChild(template_element);
		});
	};

	/**
	 * テンプレートから、HTMLElementを作成します
	 * @param {string} template_id テンプレートのID 
	 * @param {Object.<string, string>} texts テンプレートから作られたElemenに設定したい、queryとテキストをペアにしたObject
	 * @returns {HTMLElement}
	 */
	generate(template_id, texts) {
		if (!(template_id in this.#templates)) throw `Not found template id: ${template_id}`;

		/** @type {HTMLElement} */
		const elem = this.#templates[template_id].cloneNode(true);

		if (texts) {
			Object.entries(texts)
				.forEach(([query, text]) => {
					const node = elem.querySelector(query);
					if (!node) {
						console.warn(`Not match ${query}`);
						return;
					}

					node.textContent = text;
				});
		}

		return elem;
	};
};