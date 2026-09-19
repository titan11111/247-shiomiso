# 247-shiomiso LEARNINGS

## 2026-09-19 フォルダ改名・ハーネス操作盤
- `247-day071` → `247-shiomiso`。エントリを `shiomiso_game.html` から `index.html` へ。
- SVG情景の下に背景canvasを置き、ハーネスの描画ループ判定を満たす。
- 次へ／早送り／ミュート／ポーズを操作盤へ。既読は旧キーを読み `tg.247.cleared` にも保存。
- タイトル中の「次へ」が `st.scene === null` のまま `advance()` すると `lines` で落ちる。`reading` ガードと、未読時は開始ボタンへ委譲。
- harness PASS: `docs/harness-reports/247-shiomiso-2026-09-19T07-15-11-557Z.md`。iPhoneシミュレータは未実施。
