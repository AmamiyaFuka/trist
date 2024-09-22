import PersonResult from './personal_result.mjs';
import BootstrapTemplate from './bootstrap_template.mjs';
import data from '../assets/result/sample.json' with {type:'json'};

window.addEventListener('load', () => {
	// 動作確認用にとりあえず5つくらいパネルを作っておく
	const templater = new BootstrapTemplate();
	templater.init(document.body, 'template_panel');

	const view = document.querySelector('#view');
	const test_views = [];
	for (let i = 0; i < 6; i++) {
		const panel = templater.generate('test');
		view.appendChild(panel);
		test_views.push(panel);
	}

	let test_view_index = 0;
	{
		// 一つ目、オーソドックスなもの。見本と同じデータ
		const x = test_views[test_view_index++];

		const s = new PersonResult(data.course.laps.keys, null ,x);
		s.update(data.course.laps.main, data.result[0]);
	}


}, { once: true });