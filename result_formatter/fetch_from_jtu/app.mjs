import express from 'express';
const app = express();

app.use('/', express.static('./html'));

app.get('/jtu', (req, res) => {
	// レース一覧取得
	console.log('start to get race list');

	// https://results.jtu.or.jp/api/events/search?cond%5Bevent_name%5D=&range%5Bfrom%5D=0&range%5Bcount%5D=50
	fetch(`https://results.jtu.or.jp/api/events/search?cond%5Bevent_name%5D=&range%5Bfrom%5D=0&range%5Bcount%5D=20`)
		.then(res => res.json())
		.then(json => res.json(json));
});

app.get('/jtu/:race_id', (req, res) => {
	// リザルト取得
	console.log(`start to get race result: ${req.params.race_id}`);

	fetch(`https://results.jtu.or.jp/api/programs/${req.params.race_id}/result_tables`)
		.then(res => res.json())
		.then(json => json.res.body[0].result_table_id)
		.then(result_table_id => fetch('https://results.jtu.or.jp/api/results?cond%5Bresult_table_id%5D=' + result_table_id))
		.then(res => res.json())
		.then(json => res.json(json));
});

app.listen(3000);

console.log("Access to http://localhost:3000");
