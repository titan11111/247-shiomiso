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
- 宿の軒下看板に「潮見荘」（`#inn-sign`）
- 本文と絵: 物置の絵葉書の行では扉のクローズアップ（`sheddoor`+`doorcard`）。読む行では絵葉書本体。外したあとは空の扉
- 朝の桟橋では懐中電灯は消灯（`torch`）。照射ビーム（`flash`）は夜の桟橋（エンドC）のみ
- BGM（少し小さめ vol 0.22。次曲の canplay を待ってから約2秒クロスフェード。同じ曲は止めない。iOSは MediaElementSource の gain で音量）
  - `audio/coastal-midnight.m4a` 夜の海・最終便・夜の桟橋
  - `audio/paper-walls-and-moonlight.m4a` 宿・部屋・タイトル
  - `audio/where-the-land-ends.m4a` 岬・灯台・物置
  - `audio/where-water-meets-sky.m4a` 朝の桟橋・帰りの船・港町
  - シーン途中の切替: 到着（桟橋→部屋）、エンドC（宿↔桟橋）、真2（岬→宿の窓）

## 4. 未確定事項
なし（公開ブロッカーなし）
