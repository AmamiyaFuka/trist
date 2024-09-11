const get = id => {
	return (async () => ({
		"name": "第14回館山わかしおトライアスロン大会（オリンピックディスタンス）",
		"starttime": 1685231100000,
		"weather": "",
		"distance": {
			"swim": 1.5,
			"bike": 40,
			"run": 10
		},
		"locale": "日本, 千葉県",
		"category": "standard",
		"url": "https://www.tate-tra.com/",
	}))();
};

export default {
	get,
};
