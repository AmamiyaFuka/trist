# トリスト / Trist

トライアスロンのリザルトをヴィジュアル化します
メンバー間のランキングなどを表示できます

# リザルト追加方法

src/assets/ に整形したjsonファイルを配置します
data_type.d.tsが型定義になります
それだけで、URLにrace=ほげほげを指定すれば見れますが、 src/assets/list.json に追加するとメニューから選ぶことが出来ます

# For developer

このページは下記のテンプレートを使っています。
[Start Bootstrap - Full Width Pics](https://startbootstrap.com/template/full-width-pics/)

#### npm Scripts

* `npm run build` builds the project * this builds assets, HTML, JS, and CSS into `dist`
* `npm run build:assets` copies the files in the `src/assets/` directory into `dist`
* `npm run build:pug` compiles the Pug located in the `src/pug/` directory into `dist`
* `npm run build:scripts` brings the `src/js/scripts.js` file into `dist`
* `npm run build:scss` compiles the SCSS files located in the `src/scss/` directory into `dist`
* `npm run clean` deletes the `dist` directory to prepare for rebuilding the project
* `npm run start:debug` runs the project in debug mode
* `npm start` or `npm run start` runs the project, launches a live preview in your default browser, and watches for changes made to files in `src`

You must have npm installed in order to use this build environment.

