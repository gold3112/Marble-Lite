# ML - Minimal Template Overlay

最小限の機能でwplace.liveにテンプレート画像をオーバーレイ表示するUserscript。

## TamperMonkeyがある場合の導入方法
下のリンクをクリックしてください。
[ワンクリックインストール](https://raw.githubusercontent.com/gold3112/Marble-Lite/main/dist/ml-optimized.user.js)

## 機能

- 画像ファイルを読み込み
- タイル座標とピクセル座標を指定
- マップ上にテンプレートをオーバーレイ表示

## セットアップ

```bash
npm install
npm run build
```

`dist/ml.user.js` が生成されます。

## 使い方

1. Userscriptマネージャーに `dist/ml.user.js` をインストール
2. wplace.liveを開く
3. 右下のパネルから画像を読み込み
4. 座標を入力（またはファイル名から自動パース: `tX-tY-pX-pY-...png`）
5. ONボタンでオーバーレイ表示
