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

## 2026-09-19 旧URLの404を修復
- 症状: `https://titan11111.github.io/247-shiomiso/shiomiso_game.html` が **404**。本体（`/247-shiomiso/`）は 200 で生きていた
- 原因: エントリを `shiomiso_game.html` → `index.html` へ改名したため、**改名前に配ったリンクだけが死んだ**。リポジトリもPagesも正常
- 対処: `shiomiso_game.html` を index.html へのリダイレクト専用ページとして復活（meta refresh ＋ `location.replace()` の二段。`?query`・`#hash` も引き継ぐ）
- 検証: 旧URL **404 → 200** を Pages ビルド完了後に実測。本体URLも 200 のまま
- 学び: **エントリ名を変えたら旧名をリダイレクトとして残す**。フォルダ改名と違い「本体は200」なので気づけない
- 検出: `_tools/check-legacy-entry.sh` で機械検出できるようにした（245で同じ事故が出たのを機に新設）
