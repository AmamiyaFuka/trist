import PersonResult from './personal_result.mjs';
import BootstrapTemplate from './bootstrap_template.mjs';
import data from '../assets/result/sample.json' with {type: 'json'};
import DataManager from './data_manager.mjs';

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

		const data_manager = new DataManager(data.course.laps);
		data_manager.setData(data.result);
		data_manager.addAthlete(data.result[1]);

		const s = new PersonResult(data_manager, x);
		s.addEventListener('copy', event => {
			console.log(event.detail.success ? event.detail.text : event.detail.message);
		});
		s.update();

		const button = document.createElement('button');
		button.textContent = 'Random';
		button.addEventListener('click', () => {
			const n = Math.floor(Math.random() * data.result.length);
			data_manager.setAthletes([data.result[n]]);
			s.update();
		});

		document.body.appendChild(button);
	}


}, { once: true });