# 名前の由来

トライアスリートを縮めて
トライ + Nest（巣）

ソロの人 → ソリストを転じて

# 使用素材
- Bootstrap
- IcoMoon - Free: https://icomoon.io/app/
  - qr-code, link, star
- SILHOUETTE ILLUST:  https://www.silhouette-illust.com/
  - 水泳、自転車競技、マラソン
- X
  - X公式ロゴ


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
- 代表ペースの軸を追加する
  - Swim: 40 sec/50m, 50 sec/50m, ...
  - Bike: 25 km/h, 30 km/h, ...
  - Run : 4 min/km, 5 min/km, ...
