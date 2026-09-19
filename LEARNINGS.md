# 247-shiomiso LEARNINGS

## 2026-09-19 フォルダ改名・ハーネス操作盤
- `247-day071` → `247-shiomiso`。エントリを `shiomiso_game.html` から `index.html` へ。
- SVG情景の下に背景canvasを置き、ハーネスの描画ループ判定を満たす。
- 次へ／早送り／ミュート／ポーズを操作盤へ。既読は旧キーを読み `tg.247.cleared` にも保存。
- タイトル中の「次へ」が `st.scene === null` のまま `advance()` すると `lines` で落ちる。`reading` ガードと、未読時は開始ボタンへ委譲。
- harness PASS: `docs/harness-reports/247-shiomiso-2026-09-19T07-15-11-557Z.md`。iPhoneシミュレータは未実施。

## 2026-09-19 公開（GitHub Pages）
- URL: https://titan11111.github.io/247-shiomiso/ （HTTP 200・Pages status=built を実測）
- publish.sh が OGP タグを index.html へ挿入したため、**公開実体で harness を取り直した**: `docs/harness-reports/247-shiomiso-2026-09-19T07-20-31-733Z.md` → 14項目すべて PASS
- 学び: publish.sh の OGP 挿入は harness の後に走る。公開後の実体で1回取り直さないと、証跡が公開物と一致しない
- 未検証: iPhone実機（harness は Playwright/WebKit 390px のみ）
