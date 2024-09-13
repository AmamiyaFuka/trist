const fs = require('fs');
const upath = require('upath');

module.exports = function generateListFile() {
	const data_path = upath.resolve(upath.dirname(__filename), '../src/assets/result');
	const dst_file = upath.resolve(upath.dirname(__filename), '../src/assets', 'list.json');

	const list = [];
	fs.readdirSync(data_path, { withFileTypes: true }).forEach(dirent => {
		if (!dirent.isFile()) return;
		if (!dirent.name.endsWith('.json')) return;

		const course = JSON.parse(fs.readFileSync(upath.resolve(data_path, dirent.name)).toString()).course;
		if (!course.short_name) return;
		list.push({
			race: dirent.name.slice(0, -5),
			label: course.short_name,
			course,
		});
	});

	list.sort((a, b) => {
		const dt = b.course.starttime - a.course.starttime;
		if (dt !== 0) return dt;

		return a.course.short_name < b.course.short_name ? 1 :
			a.course.short_name > b.course.short_name ? -1 : 0;
	});

	fs.writeFileSync(dst_file, JSON.stringify(list));
};