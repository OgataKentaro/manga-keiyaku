# Handoff: マンガ契約 — 契約書を漫画化するツール

## Overview
「マンガ契約」は、難しい契約書の各条文を1ページ漫画（4コマ＋吹き出し）に変換して見せるツールです。ユーザーは目的→雛形→画風を選び、契約書をアップロードしてAI解析させ、生成された漫画の吹き出しを編集・保存します。本ハンドオフは、このデザインをClaude Codeで実コードベースに実装するための仕様書です。

**最重要要件：データは全てローカルに保存する（リモートバックエンド・DBサーバーは使わない）。** 後述の「Data Persistence（ローカル保存）」を必ず参照。

## About the Design Files
このバンドルの `design/` 内のファイルは **HTMLで作られたデザインリファレンス** です。最終的な見た目と挙動を示すプロトタイプであり、本番コードとしてそのままコピーするものではありません。タスクは、これらのHTMLデザインを **ターゲットのコードベースの環境（React / Vue / Svelte / Electron など）の既存パターン・ライブラリで作り直すこと** です。まだ環境がなければ、プロジェクトに最適なフレームワークを選んで実装してください（このアプリはローカル完結なので、Vite + React + IndexedDB、または Electron / Tauri のようなローカルデスクトップ構成が好相性）。

- `design/マンガ契約.dc.html` — 編集可能なデザインソース（独自のテンプレートランタイム上で動作）。**ロジック・スタイル・全コピー・データ構造の正典。** ここを読んで実装してください。
- `design/standalone-preview.html` — 全アセットを埋め込んだ自己完結プレビュー。ブラウザで直接開いて見た目・挙動を確認できます（編集用ではない）。
- `design/support.js`, `design/image-slot.js` — ランタイム／画像ドロップ部品。参考用。本番では各環境のファイル入力・画像保存に置き換える。

## Fidelity
**High-fidelity (hifi)。** 最終的な配色・タイポgrafィ・余白・角丸・影・インタラクションまで作り込まれています。UIは下記の正確な値でピクセル単位に再現してください（ただしスタイリングはターゲット環境の慣習に合わせて構造化してよい）。

---

## Screens / Views

アプリは単一の状態機械で4画面を切り替えます（`state.screen`: `top` | `wizard` | `edit` | `save`）。

### 1. TOP（プロジェクト一覧） — `screen: 'top'`
- **目的**: 保存済みプロジェクトの一覧・検索・新規作成。
- **レイアウト**: 上部に sticky ヘッダー（高さ約74px、`border-bottom:3px solid #201A17`）。本文は `max-width:1180px` 中央寄せ、`padding:34px 30px 80px`。
- **ヘッダー構成（左→右）**: ロゴ（42px角丸11pxのオレンジ箱に「約」、`transform:rotate(-4deg)`、`box-shadow:3px 3px 0 #201A17`）＋ブランド名「マンガ契約 / CONTRACT → COMICS」、伸縮スペーサー、検索ボックス（幅300px、角丸30px、`border:2.5px solid #201A17`、プレースホルダ「プロジェクトを検索…」）、「＋ 新規プロジェクト」ボタン（オレンジ、角丸30px、`box-shadow:3px 3px 0`）、ユーザーアバター（42px円、`#18A999`、頭文字M）。
- **タブ**: 「すべて / 進行中 / 完成」（`all` / `draft` / `done`）。選択中は `background:#201A17;color:#fff`。
- **見出し**: 「プロジェクト」（Reggae One, 34px）＋サブ「むずかしい契約書を、よみやすい1ページ漫画に。」
- **カードグリッド**: `grid-template-columns:repeat(auto-fill,minmax(270px,1fr)); gap:22px`。
  - 先頭は「新しく漫画化する」ダッシュ枠カード（`border:3px dashed #FF6B35`, min-height 286px, クリックでウィザードへ）。
  - プロジェクトカード: `border:3px solid #201A17; border-radius:18px; box-shadow:5px 5px 0 #201A17`。上部に高さ158pxのカバー（雛形ごとの背景色＋網点トーン＋シルエット＋吹き出し風ラベルにpage[0]の1コマ目テキスト＋雛形名バッジ）。下部に タイトル、ステータスバッジ（完成=`#18A999`/下書き=白）、「📄 Nページ · 更新日時」。

### 2. WIZARD（新規作成ウィザード） — `screen: 'wizard'`
sticky ヘッダーに「← もどる」と5ステップのステッパー（目的→雛形→タッチ→アップロード→AI解析）。本文 `max-width:1000px`。ステップは `state.wiz` の充足で算出（後述 State）。

- **Step 0 目的**: 「なんのために漫画化する？」 3カード（トラブル削減🛡️/成約率向上📈/社内リスクヘッジ🔐）。3列グリッド、選択中は `box-shadow:6px 6px 0 #FF6B35` ＋ `translate(-1px,-1px)`。各カードにアイコン箱（64px、目的別カラー）、タイトル、説明、「例：…」。
- **Step 1 雛形**: 「雛形をえらぶ」 3カード（業務委託契約書 / 秘密保持契約（NDA）/ 利用規約・プライバシーポリシー）。カバー150px＋網点＋シルエット＋1コマ目セリフのプレビュー吹き出し。目的に応じた先頭推薦に「おすすめ」バッジ（`#18A999`, `rotate(5deg)`）。
- **Step タッチ**: 「漫画のタッチをえらぶ」 6カード（少年漫画風🔥/少女漫画風✨/4コマ・ギャグ😆/ほのぼの🐥/劇画・リアル🎭/ビジネス図解📊）。各カードは画風プレビュー（背景・トーン・効果線・シルエット）。下に「このタッチで進む →」ボタン。
- **Step 2 アップロード**: 「あなたの契約書をアップロード」 ドロップゾーン（`border:3px dashed #FF6B35`, 角丸20px）。ファイル未選択時はアップロードアイコン＋案内、選択後は📄＋ファイル名＋「✓ 読み込み完了 · N条を検出」。下部に「雛形のまま進む」「AIで解析する →」。
- **Step 3 AI解析→対応表**: 解析中は🤖アイコン（`animation:ai-pulse 1.1s infinite`）＋進捗バー＋ローテーションするメッセージ（「条文を抽出しています…」「各条文の要点を要約中…」「漫画ページと対応づけています…」「セリフに流しこみ中…」）。完了後は条文→漫画ページの対応表（各行に条番号・タイトル・本文1行省略・→・ページサムネ・信頼度% バッジ）。下に「編集に進む ✏️」。

### 3. EDITOR（編集画面） — `screen: 'edit'`
全画面 `height:100vh; display:flex; flex-direction:column; overflow:hidden`。3カラム（左レール・中央キャンバス・右インスペクタ）。

- **ツールバー（高さ可変, `border-bottom:3px solid #201A17`）**: 「← 一覧」（＝保存して一覧へ）/ タイトル（クリックでinline編集）/ 雛形名バッジ / スペーサー / レイアウト切替セグメント（「契約書＋まんが」`doc` ⇄「1条を編集」`perClause`）/「📜 元条文」トグル /「🎨 画風名 ▼」ドロップダウン（6画風、選択中✓）/「保存」ボタン（`#18A999`）。
- **左レール（幅182px, 白, `border-right:3px solid #201A17`）**: 「ページ (N)」見出し＋ページサムネ縦並び。各サムネに条番号＋タイトル帯、横に▲▼で並べ替え。`perClause` モードでは選択中ページが `border:3px solid #FF6B35`。
- **中央キャンバス（`flex:1; overflow-y:auto; padding:30px`, 斜めストライプ＋ペーパー背景）**:
  - `doc` モード: タイトルカード＋各ページを縦に全表示。各ページは「条文カード（条番号・タイトル・本文）」＋オレンジの「▼ この条文をまんがで解説（クリックで編集）」ラベル＋漫画キャンバス。
  - `perClause` モード: 選択中1ページのみ表示。
  - **漫画キャンバス**: `width:min(100%,560px); aspect-ratio:560/392; background:#201A17`。中身は2×2のコマグリッド（`gap:4px`）。各コマ = 画風別背景＋トーン＋効果線＋人物シルエット（body/head）＋**画像ドロップスロット**（`<image-slot>` 相当、ユーザーが画像をはめ込める）＋コマ番号。グリッドの上に画風別の外枠（`border: frame solid #201A17`）。
  - **吹き出し（bubbles）**: キャンバス上に絶対配置。`%`座標（x,y,w）。ドラッグで移動、右下ハンドルでリサイズ、ダブルクリックでtextarea inline編集、選択中は右上に×削除。種別 `speech`（白・しっぽ付き・角丸22px・Yomogi）/`narration`（クリーム`#FFFDF6`・四角・Zen Maru Gothic）/`shout`（不定形角丸）。`box-shadow:3px 3px 0 rgba(32,26,23,.18)`、選択中は `outline:2px dashed #FF6B35`。
- **右インスペクタ（幅312px, 白, `border-left:3px solid #201A17`）**: 「📜 元の条文」（トグルで表示）/「💬 選択中の吹き出し」textarea＋「🤖 AIで言い換え再生成」ボタン＋「トーン：そのまま/カジュアル/強調/要点」/「＋ 吹き出しを追加」/「セリフのタイプ」セグメント（セリフ/ナレーション/叫び）。未選択時は案内文。

### 4. SAVE（保存完了） — `screen: 'save'`
中央寄せ。🎉円（120px, `#18A999`, `animation:bob 2s infinite`）＋「保存しました！」＋「『タイトル』をNページの漫画として保存しました。」＋ボタン「プロジェクト一覧へ」「編集に戻る」「⬇ PDFで書き出し」。

---

## Interactions & Behavior
- **画面遷移**: top → (新規) → wizard → (解析完了) → edit → (保存) → save → top。openProject(id) で既存→edit。
- **ウィザード進行**: `wiz.purpose`設定でstep1、`wiz.template`でstep2(タッチ)、`_styleDone`でstep3(アップロード)、`analyzing||analyzeDone`でstep4。
- **AI解析（モック）**: `setInterval` 280msで進捗を+8〜20%、4つのメッセージを順に表示、100%で450ms後に完了。**実装時はここを実LLM呼び出しに置換可（後述）。**
- **AI言い換え再生成（モック）**: 選択中吹き出しの `base` テキストから4バリアント（そのまま/カジュアル「カンタンに言うと…」/強調「ここ、すごく大事！」/要点「ポイントは1つ。」）を循環。`vi` インデックスで管理。**実装時は実LLM置換可。**
- **吹き出しドラッグ/リサイズ**: `mousedown`で `drag` 状態開始、`window` の `mousemove`/`mouseup` で更新。座標はキャンバス矩形比の%。move: x 0–92, y 0–90 にクランプ。resize: w 14–70%。
- **ページ並べ替え**: ▲▼ で隣と入れ替え、`pageIdx` も追従。
- **タイトル inline 編集**: クリックで input 表示、blur で確定。
- **トースト**: 操作後に下中央へ1.8秒（`pop-in` アニメ）。
- **アニメーション**: `pop-in`（scale .86→1, .25s）、`ai-pulse`（1.1s）、`spin`、`bob`（translateY ±6px, 2s）。

## State Management
ルート1コンポーネントの state（実装では store / context / signals に分割可）。

```
screen: 'top'|'wizard'|'edit'|'save'
topTab: 'all'|'draft'|'done'
projects: Project[]                       // 一覧（永続化対象）
wiz: { purpose, template, style, fileName, fileClauses, _styleDone }
analyzing, analyzeDone, progress, analyzeMsg   // 解析の一時状態
active: Project|null                      // 編集中の作業コピー（保存でprojectsへ反映）
activeId, pageIdx, selBubble, editingBubble
showOriginal: bool                        // 元条文パネル表示
layoutMode: 'doc'|'perClause'
drag: null | {mode,pageId,id,...}         // ドラッグ一時状態
toast: string|null
styleMenuOpen, editingTitle: bool
theme: 'pop'|'pastel'|'mono'              // 全体配色（プロップ）
```
保存時(`saveProject`)は `active` をディープコピーして `projects` に upsert、`updated:'たった今'`, `status:'done'`。新規は id 採番。

---

## Data Model

```ts
type TemplateId = 'gyomu' | 'nda' | 'riyou';
type Status = 'done' | 'draft';
type StyleId = 'shounen'|'shoujo'|'yonkoma'|'honobono'|'gekiga'|'zukai';
type BubbleKind = 'speech' | 'narration' | 'shout';

interface Bubble {
  id: string;
  text: string;      // 表示中テキスト
  base: string;      // 言い換えの元テキスト
  vi: number;        // 言い換えバリアントindex
  x: number; y: number; w: number;   // キャンバスに対する%（位置・幅）
  kind: BubbleKind;
}
interface Page {
  id: string;
  no: string;        // 例 "第1条"
  title: string;     // 例 "業務の内容"
  clauseText: string;// 元条文の本文
  bubbles: Bubble[]; // 既定は4コマ対応の4吹き出し（POS参照）
}
interface Project {
  id: string;
  title: string;
  template: TemplateId;
  status: Status;
  updated: string;   // 表示用の相対文字列。実装では ISO 日時を保存し表示で相対化推奨
  style: StyleId;
  pages: Page[];
  // 画像スロット: コマごとに slotId='slot-<pageId>-<komaIndex>'。画像データもローカル保存。
}
```

雛形のデフォルト条文・各コマのセリフ4本（narration/speech×3）は `design/マンガ契約.dc.html` の `this.TEMPLATES` と `this.POS` に全文あり。**実コピーはそこから転記してください**（業務委託=5条、NDA=4条、利用規約=4条）。

## Data Persistence（ローカル保存）★最重要

リモートDBは使わず、**全データをユーザーのローカルに保存**します。推奨実装：

1. **プロジェクト本体（JSON）** — `projects: Project[]` を保存。
   - Web/SPA: **IndexedDB**（推奨。容量が大きく画像も扱いやすい）。軽量なら localStorage キー `manga-keiyaku/projects` でも可。
   - Electron/Tauri/Node: ユーザーデータディレクトリに `projects.json`（例: `app.getPath('userData')/projects.json`、Tauri は `appDataDir()`）。
2. **コマ画像** — ドロップされた画像はキー `slot-<pageId>-<komaIndex>` で保存。
   - Web: IndexedDB に Blob で（Data URL より省メモリ）。
   - デスクトップ: `userData/images/<slotId>.<ext>` に書き出し、Project からはパス参照。
   - 現状の `image-slot.js` はエディタ環境専用のサイドカー保存なので、**ターゲット環境のファイル入力＋ローカル保存に置き換える**こと。
3. **保存タイミング** — `saveProject` 実行時に projects 全体を書き込み（即時 flush）。編集中の自動保存を足すなら debounce 推奨。
4. **読み込み** — 起動時にローカルから projects を読み、無ければ `design/マンガ契約.dc.html` の初期3プロジェクト（`mk(...)`）をシードとして投入。
5. **書き出し** — 「⬇ PDFで書き出し」は各ページの漫画キャンバスを印刷用レイアウトにして PDF 化（`window.print` + 印刷CSS、または html-to-canvas→PDF）。

> 既存ファイル `design/マンガ契約-print-...dc.html`（プロジェクト内）はPDF/印刷レイアウトの参考。

---

## Design Tokens

### Colors（theme: pop / 既定）
| 用途 | 変数 | 値 |
|---|---|---|
| 用紙背景 | `--paper` | `#FFF6EA` |
| インク（文字・線） | `--ink` / `--line` | `#201A17` |
| アクセント | `--accent` | `#FF6B35` |
| アクセント2 | `--accent2` | `#18A999` |
| パネル | `--panel` | `#ECE4D6` |
| トーン網点 | `--tone` | `#c9bba3` |
| 吹き出し | `--bubble` | `#ffffff` |

**theme: pastel** = paper `#FDF4FA`, ink `#3F3550`, accent `#C06BE6`, accent2 `#3FB8C9`, panel `#EFE6F4`, tone `#cdb8da`。
**theme: mono** = paper `#F4F3EF`, ink `#16140F`, accent `#16140F`, accent2 `#5b554a`, panel `#E4E1D8`, tone `#8c857a`。

雛形カバー色: 業務委託 `#FFE4C9`(tone `#e0b98a`) / NDA `#E3DAFB`(`#b3a3e6`) / 利用規約 `#CFEDE4`(`#8fcdbd`)。
目的アイコン色: トラブル `#FF6B35` / 成約 `#18A999` / 社内 `#7C5CFC`。

### Typography
| ロール | フォント | 用途 |
|---|---|---|
| 見出し/ロゴ | **Reggae One** (cursive) | 画面見出し、ブランド名、保存完了 |
| 本文/UI | **Zen Maru Gothic** (500/700/900) | ほぼ全てのUIテキスト |
| 手書き感セリフ | **Yomogi** (cursive) | 吹き出し、プレビュー吹き出し、補足 |
| （読込のみ） | Yusei Magic | 予備 |

Google Fonts: `Yomogi`, `Zen+Maru+Gothic:wght@500;700;900`, `Reggae+One`, `Yusei+Magic`。
代表サイズ: 画面見出し30–34px / セクション見出し26–28px / カードタイトル16–18px / 本文12.5–14px / 吹き出し14px(narration 12.5px) / バッジ10.5–11px。

### Radius / Border / Shadow
- 角丸: ボタン/ピル `30px`、カード `16–18px`、入力 `8–12px`、漫画キャンバス `6px`。
- 枠線: 主要要素 `3px solid #201A17`、サブ `2.5px`、極細 `2px`。手描き感のため**黒太枠が全体の基調**。
- 影（オフセット影／ドロップシャドウではなくズレ影）: カード `5px 5px 0 #201A17`、ボタン `3px 3px 0`、選択時 `6px 6px 0 #FF6B35`、吹き出し `3px 3px 0 rgba(32,26,23,.18)`。
- スクロールバー: 幅11px、つまみ `rgba(32,26,23,.28)` 角丸8px。

### Manga style 定義（styleDef）
各画風の panel背景 / トーン(色・サイズ・不透明度 or 'grid') / 効果線(speed/hatch/sparkle/none) / シルエット色 / 頭・胴の角丸 / 外枠太さ。全値は `design/マンガ契約.dc.html` の `styleDef()` / `toneFx()` / `komaScene()` にあり、そのまま移植してください。

---

## AI 連携について（任意）
現状の解析・言い換えは見た目だけのモックです。実機能にする場合：
- **条文抽出**: アップロードPDF/Word/テキストを各環境でパース（pdf.js / mammoth 等）→ 条ごとに分割。
- **要約→セリフ生成**: 各条文をLLMに渡し、narration1＋speech3（やさしい会話調）を生成して `Page.bubbles` を組み立て。
- **言い換え**: 選択吹き出しを「カジュアル/強調/要点」のトーン指定でLLM再生成。
- いずれも **APIキーはローカル保存**（ユーザー設定）、ネットワークはLLM呼び出しのみ。データ本体はローカルに留める。

## Assets
- 画像なし。アイコンは絵文字（🛡️📈🔐🤖🎉📜💬🎨など）と CSS 図形（シルエット・網点・効果線）で表現。
- ユーザー画像は各コマのドロップスロットにのみ入る（ローカル保存）。
- フォントは Google Fonts。

## Files（このバンドル）
- `design/マンガ契約.dc.html` — 正典。ロジック(`class Component`)・全テンプレート文言・スタイル・データ。
- `design/standalone-preview.html` — ブラウザで開いて挙動確認できる自己完結版。
- `design/support.js`, `design/image-slot.js` — ランタイム／画像スロット部品（参考）。

> README単体で実装可能なように書いていますが、配色・文言・画風の細部は必ず `design/マンガ契約.dc.html` の該当メソッドを参照してください。
