interface PersonResult {
	rank: string;
	number: string;
	display_name: string;
	section: string;

	stats: Object.<string, {time: number}>;
}

interface LapInfo {
	name: string,
	range: any,
	units: string,
};

interface Course {
	name: string;
	short_name: string;
	starttime: number;
	weather: string;
	distance?: {
		swim: number;
		bike: number;
		run: number;
	};
	locale: string;
	category: string;
	url: string?;
	laps?: {
		keys: Array<LapInfo>;
		main: string;
	};
}

interface Race {
	course: Course;
	result: Array<PersonResult>;
}

interface RaceListItem {
	race: string; // 該当するレースリザルトファイルの拡張子を除いたファイル名部分
	label: string;
}