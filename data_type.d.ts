interface PersonResult {
	rank: string;
	number: string;
	display_name: string;
	section: string;

	record_sec: number;
	swim_sec: number;
	bike_sec: number;
	run_sec: number;
}

interface Course {
	name: string;
	short_name: string;
	starttime: number;
	weather: string;
	distance: {
		swim: number;
		bike: number;
		run: number;
	};
	locale: string;
	category: 'standard' | 'super_sprint' | 'sprint' | 'middle' | 'long' | 'other';
	url: string?;
}

interface Race {
	course: Course;
	result: Array<PersonResult>;
}

interface RaceListItem {
	race: string; // 該当するレースリザルトファイルの拡張子を除いたファイル名部分
	label: string;
}