export default class ColorPallets {
	#pallets = [
		'#36a2eb',
		'#ff6384',
		'#4bc0c0',
		'#ff9f40',
		'#9966ff',
		'#ffcd56',
		'#c9cbcf',
	];
	#index = 0;
	constructor() { };

	new() {
		return this.#pallets[this.#index = (this.#index + 1) % this.#pallets.length];
	};

	all() {
		return this.#pallets;
	};

	indexOf(i) {
		return this.#pallets[i % this.#pallets.length];
	};

	swim(alpha) { return `hsla(198, 82%, 75%, ${alpha ?? '0'})`; };
	bike(alpha) { return `hsla(0, 69%, 100%, ${alpha ?? '0'})`; };
	run(alpha) { return `hsla(134, 46%, 80%, ${alpha ?? '0'})`; };
	record(alpha) { return `hsla(43, 41%, 100%, ${alpha ?? '0'})`; };
};