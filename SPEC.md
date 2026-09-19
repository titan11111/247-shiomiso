# 潮見荘 — 仕様

## 0. ドキュメント情報
- 対象: 247-shiomiso / 更新日: 2026-09-19 / ステータス: 公開

## 1. ゲーム概要
五年前に島から戻らなかった妹を追う、選択型ノベル。エンドA/B/Cと真エンドD。

## 2. 対象環境
GitHub Pages / iPhone Safari / 静的HTML。外部CDNなし。

## 3. 操作 / 設定UI
- 入力: 次へ／早送り、本文タップ、Enter/Space
- Pointer Events + `setPointerCapture`
- ポーズ: Ⅱ / P / Escape / タブ非表示
- ミュート: `tg.247.mute` ／ 既読: `tg.247.cleared`（旧 `shiomiso-cleared` を読み替え）
- 画面: 上75% `#game-stage` / 下25% `#control-deck`
- 背景canvasをRAF描画し、SVG情景を重ねる

## 4. 未確定事項
なし（公開ブロッカーなし）
