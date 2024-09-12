# 名前の由来

トライアスリートを縮めて
トライ + Nest（巣）

ソロの人 → ソリストを転じて

# 使用素材
- IcoMoon - Free: https://icomoon.io/app/
  - cog, eye-blocked, eye, menu, user-minus, user-plus
- SILHOUETTE ILLUST:  https://www.silhouette-illust.com/
  - 水泳、自転車競技、マラソン
- X
  - X公式ロゴ

# SNS
Xシェア用リンク 
https://x.com/intent/tweet?text=表示するテキスト&url=ページのURL

# SVGを利用するとき
svg
    use(xlink:href=hogehoge)

で読み込む
読み込まれる側のルートにIDを振っておく。useのxlinkさきにもIDを指定する

動的に作成した use(xlink:href) はデータが読み込まれない
あらかじめ display:none としてページに読み込んでキャッシュしておくことで表示可能

# 目指すところ
- トライアスリートじゃない人とも、会話が盛り上がる


# ToDo
メンバー追加直後に、スコアサマリーに新メンバーが反映されない。 stats データが更新される前に描画処理が呼び出されてる
イベント登録を整理しないと、まずそう
