//@ts-check
export default {
	/**
	 * 秒数をHH:mm:ss表記にする
	 * 3200 -> 00:53:20
	 * @param {number} sec 
	 * @returns {string}
	 */
	sec_to_hhmmss: (sec) => {
		if (isNaN(sec)) return '';

		const h = Math.floor(sec / 3600);
		const m = Math.floor((sec - h * 3600) / 60);
		const s = sec % 60;
		return [h, m, s].map(x => ('00' + x).slice(-2)).join(':');
	},

	/**
	 * 秒数をHH:mm:ss表記にする
	 * なるべく先頭のゼロ省略をする
	 * 3200 -> 53:20, 63 -> 1:03, 3601 -> 1:00:01
	 * @param {number} sec 
	 * @returns {string}
	 */
	sec_to_hhmmss_non_zero: sec => {
		if (isNaN(sec)) return '';

		const h = Math.floor(sec / 3600);
		const m = Math.floor((sec - h * 3600) / 60);
		const s = sec % 60;

		if (h === 0) {
			if (m === 0) return s.toString();
			else return m.toString() + ':' + ('00' + s).slice(-2);
		}
		
		return h.toString() + ':' + [m, s].map(x => ('00' + x).slice(-2)).join(':');
	},

	/**
	 * 秒数を、符号付のm:ss表記にする
	 * @param {number} sec 
	 * @returns {string}
	 */
	sec_to_mss_with_sign: (sec) => {
		if (isNaN(sec)) return '';

		let sign = '±';
		if (sec < 0) {
			sign = '-';
			sec = -sec;
		} else if (sec > 0) {
			sign = '+';
		}

		const m = Math.floor(sec / 60);
		const s = sec % 60;

		return `${sign}${m}:${('00' + s).slice(-2)}`;
	},
}