//@ts-check
export default {
	/**
	 * 秒数をHH:mm:ss表記にする
	 * 3200 -> 00:53:20
	 * @param {number} sec 
	 * @returns {string}
	 */
	sec_to_hhmmss: sec => {
		const h = Math.floor(sec / 3600);
		const m = Math.floor((sec - h * 3600) / 60);
		const s = sec % 60;
		return [h, m, s].map(x => ('00' + x).slice(-2)).join(':');
	},

	/**
	 * 秒数を、符号付のm:ss表記にする
	 * @param {number} sec 
	 * @returns {string}
	 */
	sec_to_mss_with_sign: sec => {
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