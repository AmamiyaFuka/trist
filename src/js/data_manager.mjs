//@ts-check

/** @typedef {'record'|'swim'|'bike'|'run'} Lap */

/**
 * @typedef TimeStats
 * @property {number} time
 * @property {number?} ranking
 * @property {number?} score
 * @property {number?} percentile
 */

/**
 * @typedef PersonData
 * @property {string} rank
 * @property {string} number
 * @property {string} display_name
 * @property {string?} section
 * @property {Object.<string, TimeStats>} stats
 */

/** 
 * @typedef DataStats
 * @property {number} count
 * @property {Array<number>} sorted_times
 * @property {Array<{time: number, count: number}>} density
 * @property {{min: number, max: number}} time
 * @property {number} average 平均
 * @property {number} variance 分散
 * @property {number} stdev 標準偏差
 */

/**
 * @typedef ChartDataItem
 * @property {Array<{time: number, count: number}>} data
 * @property {DataStats} stats
 */


export default class DataManagerTri {
	/** @type {Array<PersonData>} */
	#data = [];

	/** @type {Array<PersonData>} */
	member_data = [];

	/** @type {Object.<string, ChartDataItem>} */
	time_ranking_data = {};

	/** @type {Array<LapInfo>} */
	#laps = [];

	/** @type {Array<string>} */
	sections = [];

	/**
	 * @param {Array<LapInfo>} laps
	 */
	constructor(laps) {
		this.#laps = laps;

		// time_ranking_data はすぐに参照できるように初期化する
		this.time_ranking_data = Object.fromEntries(laps.map(({name: lap}) => [lap, {
			data: [],
			stats: {
				count: 0,
				sorted_times: [],
				density: [],
				time: { min: NaN, max: NaN },
				average: NaN,
				variance: NaN,
				stdev: NaN,
			}
		}]));
	}

	/**
	 * 母集団を設定します
	 * データの複製は作られないため、データがクラス外で変更された場合、予期しない結果を引き起こします
	 * @param {Array<PersonData>} data 
	 * @returns {DataManagerTri}
	 */
	setData(data) {
		this.#data = data;
		this.setFilter(() => true);

		this.sections = data.map(d => d.section).filter((x, i, a) => a.indexOf(x) === i).filter(x => x != null);
		return this;
	}

	/**
	 * 母集団のうち、対象とするフィルターを設定します
	 * @param {(PersonResultTri) => boolean} predicate 
	 * @returns {DataManagerTri}
	 */
	setFilter(predicate) {
		const filtered = this.#data.filter(predicate);

		this.#laps.forEach(({name: lap}) => {
			const sorted_times = filtered.map(d => d.stats[lap]?.time).filter(x => x).sort((a, b) => a - b);

			this.time_ranking_data[lap].data.splice(0, Infinity,
				...sorted_times.map((time, i) => ({ time, count: i })))

			if (sorted_times.length == 0) {
				this.time_ranking_data[lap].stats = {
					count: 0,
					sorted_times,
					density: [],
					time: { min: NaN, max: NaN },
					average: NaN,
					variance: NaN,
					stdev: NaN,
				};
			} else if (sorted_times.length == 1) {
				const t = sorted_times[0];
				this.time_ranking_data[lap].stats = {
					count: 1,
					sorted_times,
					density: [{ time: t, count: 1 }],
					time: { min: t, max: t },
					average: t,
					variance: 0,
					stdev: 0,
				};
			} else {
				const min = sorted_times[0];
				const max = sorted_times[sorted_times.length - 1];

				// 平均
				const average = sorted_times.reduce((a, b) => a + b / sorted_times.length, 0);
				// 分散
				const variance = sorted_times.reduce((a, b) => a + Math.pow(b - average, 2) / sorted_times.length, 0);
				// 標準偏差
				const stdev = Math.sqrt(variance);

				// 密度分布を求める
				// 最大でも80サンプリングに収める
				const density_sampling = Math.min(80, sorted_times.length);
				const density_step = Math.floor((max - min) / density_sampling)

				const density = Array(density_sampling).fill(0)
					.map((_, i) => {
						const time = i * density_step + min;
						const time_min = time - 0.5 * density_step;
						const time_max = time + 0.5 * density_step;

						const count = sorted_times.slice(sorted_times.findIndex(t => t >= time_min)).findIndex(t => t > time_max);

						return { time, count };
					});

				this.time_ranking_data[lap].stats = {
					count: sorted_times.length,
					sorted_times,
					density,
					time: { min, max },
					average,
					variance,
					stdev,
				};
			}
		});

		this.member_data.forEach(d => this.#calculateMemberStats(d));
		return this;
	}

	/**
	 * メンバーをセットします
	 * @param {Array<PersonData>} members 
	 * @returns {DataManagerTri}
	 */
	setMembers(members) {
		members.forEach(d => this.#calculateMemberStats(d));
		this.member_data.splice(0, Infinity, ...members);
		return this;
	}

	/**
	 * メンバーを追加します
	 * updateを呼ばなくても、statsが更新されます
	 * @param {PersonData} member
	 * @returns {DataManagerTri}
	 */
	addMember(member) {
		this.member_data.push(this.#calculateMemberStats(member));
		return this;
	}

	/**
	 * メンバーを除去します	 * 
	 * @param {PersonData} member
	 * @returns {DataManagerTri}
	 */
	removeMember(member) {
		const i = this.member_data.findIndex(d => d == member);
		this.member_data.splice(i, 1);
		return this;
	}

	/**
	 * 条件に一致するデータを検索します
	 * @param {(value: PersonData, index: number, array: Array<PersonData>) => boolean} predicate
	 * @returns {Array<PersonData>}
	 */
	getResults(predicate) { return this.#data.filter(predicate); }

	/**
	 * メンバーの stats を計算します
	 * @param {PersonData} member 
	 * @returns {PersonData}
	 */
	#calculateMemberStats(member) {
		this.#laps.forEach(({name: lap}) => {
			// ループの外で十分なはずなのに、ここにいれないとlint errorになる。きもちわるい
			if (!(member.stats)) member.stats = {};

			const { data, stats } = this.time_ranking_data[lap];

			const member_lap_time = member?.stats?.[lap]?.time;
			const ranking = data.findIndex(({ time }) => time >= member_lap_time) + 1;
			const percentile = ranking / stats.count;
			const score = (stats.average - member_lap_time) / stats.stdev * 10 + 50;

			member.stats[lap] = {
				time: member_lap_time,
				ranking, percentile, score,
			};
		})

		return member;
	}
};
