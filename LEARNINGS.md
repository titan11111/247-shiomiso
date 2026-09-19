# 247-shiomiso LEARNINGS

## 2026-09-19 文と絵に合わせて曲を増やす
- 4曲は「シーン単位」だけだと窓の海や絵葉書で止まっていた。向き先が2行以上続くところだけ `bgmCue` を足した（1行切替はフェードに負ける）
- 追加: プロローグ手紙、夜の窓、岬の絵葉書、エンドBの絵葉書、真1の光の道、真2の漁船、真3の手紙と夜絵、真4の絵葉書の海
- 窓から海を見る夜（c2a）は部屋絵のまま Coastal。同じ曲への戻りは currentTime 継続
- harness: `docs/harness-reports/247-shiomiso-2026-09-19T12-41-31-510Z.md` → PASS。通しで聴いた切替感は未検証

## 2026-09-19 iOS実装と公開
- 本文と選択肢を pointerdown（bindTap）へ。最初のタップ／キーで Audio unlock。復帰時は AC.resume、ポーズ解除のジェスチャでBGM再開
- `playsinline`、select/drag 抑止、`touch-action: none`（本文は pan-y）、打感 scale(0.92)
- 証跡: `docs/harness-reports/247-shiomiso-2026-09-19T12-10-44-614Z.md` → PASS。シミュレータは起動したが `openurl` が timeout（Safariは白画面）。実機の見た目・音は未検証

## 2026-09-19 場面BGMとクロスフェード
- 4曲を場面に割当。夜海=Coastal Midnight／宿=Paper Walls／岬=Land Ends／朝と水平線=Water Meets Sky
- 切替は次曲が canplay してから約2秒クロスフェード。同一曲は currentTime を保ったまま重ねる。ポーズ・ミュートはフェード後、読み込み完了してから pause
- 到着・エンドC・真2は行キューで曲を変える。読むタップの中で次曲だけ play（4本同時 preload はしない）
- 元MP3は192kbpsで17MBあったので AAC 80kbps m4a へ（公開実体 9MB）。元ファイルはフォルダから削除
- 音量 0.22。iOSは element.volume を無視するので AudioContext の gain に載せた。文字送りSEは 0.055
- harness: 起動時 preload=auto だと4本の GET が途中 abort して requestfailed。`preload=none`＋必要曲だけ、タイトルではまだ取らない
- 証跡: `docs/harness-reports/247-shiomiso-2026-09-19T12-08-11-777Z.md` → PASS（通信量 1.77MB＝開始直後の1曲分）。iPhone実機の聞こえは未検証

## 2026-09-19 「灯りは待つ人が持つ」を台詞から外す
- 桟橋の朝は、持ち方・朝だと気づく間・無言の差し出しで渡す。格言と「大事にします」「私が待ちます」を削った
- 受け取りは傷と空の手。拒否は「ここが空になると困る」。テーマは選択とエンド側に残す
- 未検証: 通しプレイでの感情の着地（機械チェック対象外）

## 2026-09-19 本文と景色の対応
- 指摘: 「文字に景色を近づける」はレイアウトではなく、文が言っているものが見えていないこと
- 物置の絵葉書の行で、遠い灯台のまま小さな小屋だった。扉のクローズアップ＋画鋲の絵葉書に差し替え。読む行は絵葉書本体、外したあとは空の扉
- 手紙を持っている最後の行で letter を消していたのも戻した
- harness: `docs/harness-reports/247-shiomiso-2026-09-19T11-55-37-647Z.md` → PASS

## 2026-09-19 文字送りに紙音
- 1字表示のたびに短いノイズ＋高音をWebAudioで重ねる。句読点・空白は鳴らさない。1字おきにしてbuzz化を避けた
- ミュート・早送り・`prefers-reduced-motion` では鳴らさない
- 実測: 文字送り中に AudioBufferSource が増える（10発／15字）。ミュート後は増えない
- harness: `docs/harness-reports/247-shiomiso-2026-09-19T11-50-51-266Z.md` → PASS
- 未検証: iPhone実機の聞こえ方

## 2026-09-19 宿の軒に「潮見荘」看板
- 宿SVGの軒下へ木の看板を追加。金の明朝で「潮見荘」
- 縦のタイトルは家が中央に来るよう `xMinYMid` に寄せ、看板と見出しが重ならないよう見出し側を外した
- harness: `docs/harness-reports/247-shiomiso-2026-09-19T11-48-50-897Z.md` → PASS
- 未検証: iPhone実機

## 2026-09-19 タイトルUIを帳場の夜へ
- 指摘: タイトルが黄色い角丸ボタンの事務画面で、物語の空気と合っていない
- 対処: 塗りボタンをやめて金の細線。既読は「― 未読」表ではなく四つの灯り。タイトルを情景の上に重ね、操作盤も同系の輪郭へ
- 横画面はコピー左・操作右。夜の色を `data-theme="dark"` で固定（OSのライト設定で看板が消えるのを防ぐ）
- 開始は pointerdown。操作盤の「次へ」は `click()` 経由だと発火しないので、直接 `go("prologue")` へ
- harness: `docs/harness-reports/247-shiomiso-2026-09-19T11-44-24-757Z.md` → PASS
- 未検証: iPhone実機

## 2026-09-19 朝の桟橋で懐中電灯を照らさない
- 指摘: 翌朝シーンで女将が懐中電灯を点けているのが不自然
- 対処: 朝は消灯の実体（`torch`）だけを持たせ、照射ビーム（`flash`）は夜の桟橋（エンドC）に限定。本文も「スイッチを切る」から「消えたまま差し出す」へ
- 残したもの: 五年間の癖・灯りの受け渡し・エンドCの夜待ちは変えていない
- harness: `docs/harness-reports/247-shiomiso-2026-09-19T11-33-15-412Z.md` → 14項目 PASS
- 目視: 朝は `flashShow=false` / 消灯の `torch` のみ。夜のエンドCはビームあり。iPhone実機は未実施

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

### 【訂正】上の「404だった」は誤り（2026-09-19 同日中に判明）
- gitで裏を取った結果、`shiomiso_game.html` は**このリポジトリで一度も公開されていなかった**（`git cat-file -e <修復コミット>^:shiomiso_game.html` → 不在）。
  改名はローカルフォルダ内で完結しており、リポジトリは改名**後**に作成されている
- つまり `…/247-shiomiso/shiomiso_game.html` というURLは**元から存在しない**。「配ったリンクが死んだ」という上の記述は**誤り**
- 置いたリダイレクトは**害はないが、壊れていたものを直したわけではない**（将来その名前で来た人を受けるだけの保険）
- 誤認の原因: LEARNINGS.md の本文を証拠として扱ったこと。**本文は作業メモであって証拠ではない。証拠はgit履歴**
- 検出器も v2 で「git履歴に存在 かつ HEADに不在」判定へ作り直した（`_tools/check-legacy-entry.sh`）
