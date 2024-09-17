//@ts-check
export default class QueryManager {
	/** @type {History} */
	#history;

	/** @type {Location} */
	#location;

	/** @param {Window} window */
	constructor(window) {
		this.#history = window.history;
		this.#location = window.location;
	}

	/**
	 * 現在の search 文字列を query object として取得します
	 * @returns {Object.<string, Array<string>|string|undefined>}
	 */
	getQueryParameter() {
		const query = location.search.substring(1).split('&');
		return Object.fromEntries(query.map(q => {
			const [k, v] = q.split('=');
			const qv = v?.split(',')?.map(x => decodeURIComponent(x));
			return [decodeURIComponent(k), qv?.length === 1 ? qv[0] : qv];
		}));
	}

	/**
	 * 現在の search 文字列に query object を設定します
	 * @param {Object.<string, Array<string>|string|undefined|null>} args
	 * @returns {string} query string (starts with '?')
	 */
	setQueryParameter(args) {
		const query = '?' + Object.entries(args).map(([k, v]) => {
			if (v) {
				return `${encodeURIComponent(k)}=${(v instanceof Array) ? v.map(x => encodeURIComponent(x)).join(',') : encodeURIComponent(v)}`
			} else {
				return encodeURIComponent(k);
			}
		}).join('&');

		history.replaceState(null, '', query);

		return query;
	}
};