---
name: spacegleam-blog
description: SPACE GLEAM株式会社（spacegleam.co.jp）のコーポレートブログ「実践知」の記事を量産するスキル。AI・SaaS・受託開発・事業づくり・自社プロダクト（DIFFsense / MERKI / XDraft / さて。）に関する実践知ブログ記事を、ブランドトーンを厳守して大量に執筆し、frontmatter付きMarkdown（1記事1ファイル）として自社サイトのデプロイ用に出力する。ユーザー（社長）が「SPACE GLEAMのブログ」「実践知」「コーポレートブログ」「ブログ量産」「ブログ記事作成」「記事のネタ出し」「SEO記事」「ブログ書いて」などに言及したら、明示的に「スキルを使って」と言われなくても必ずこのスキルを使う。テーマ・キーワードのリストや本数指定があれば即座に起動する。
---

# SPACE GLEAM ブログ量産スキル

SPACE GLEAMのコーポレートブログ「実践知」（`spacegleam.co.jp/blog/`）向けに、ブランドトーンを守ったSEO記事を量産し、frontmatter付きMarkdown（1記事1ファイル）として納品する。自社サイトのデプロイにそのまま流せる形が成果物。

**記事の狙いは受注（無料相談・問い合わせ）につなげること。** ただの考察ブログにしない。各記事は、自社プロダクト（DIFFsense等）の開発・運営の実体験を一次情報として語り、それが開発力の証明になり、自然に相談導線へつながる構造にする（詳細は references の「記事の目的／記事の役割」）。

## 呼称

ユーザーは「社長」と呼ぶ。

## このスキルの使い方（全体フロー）

1. **入力を受け取る** — 「テーマ／キーワードのリスト」と「本数」を受け取る。「ネタを出して」と言われたら、まず下記「テーマ生成」で案を提示し、承認を得てから執筆へ。
2. **ブランド規約を読み込む** — 執筆前に必ず `references/brand-voice.md`（トーン・太字ルール・NG表現）と `references/article-blueprint.md`（構成・SEO・出力形式・カテゴリ）を読む。**「MVP」という語はブログ本文で一切使わない**という最重要ルールを必ず守る。
3. **各記事を執筆** — 1テーマ＝1記事。実体験ベースのストーリー型で、1記事1,800〜3,000字程度。本文はMarkdown。**要点だけを太字（`**...**`）にしてメリハリをつける**（読みやすさのため必須。多用しない）。
4. **記事データを構造化** — 全記事を1つのJSON（下記スキーマ）にまとめる。
5. **Markdownに変換** — `scripts/build_markdown.py` にJSONを渡して、記事ごとの `.md` ファイルを生成する。
6. **納品** — 生成した `.md` 群を `present_files` で提示する。本文プレビューを数本ぶん会話にも出して品質確認を促す。

出力形式の指定が無ければ **frontmatter付きMarkdown（1記事1ファイル）をデフォルト** とする。

## テーマ生成（ネタ出しを頼まれた場合）

`references/article-blueprint.md` の「テーマの軸」を参照し、既存記事と重複しない切り口で案を出す。各案に「想定検索意図」「主要キーワード」「カテゴリ（AI/SaaS/Development/Business/Product）」「誘導先プロダクト or 相談導線」をセットで提示。承認されたものだけ執筆に回す。

## 記事データのJSONスキーマ

`scripts/build_markdown.py` に渡すJSONは以下の形式：

```json
{
  "posts": [
    {
      "title": "記事タイトル",
      "slug": "url-slug-in-english",
      "description": "記事の概要（120字程度・メタディスクリプション兼用）",
      "content_md": "## 見出し\n\n本文。要点は **太字** にする。\n"
    }
  ]
}
```

- `title` / `slug` / `description` がfrontmatter（社長の言う「タイトル・スラッグ・概要」）に、`content_md` が本文になる。
- `slug` は英数字とハイフンのみ。日本語タイトルから内容を表す短い英語スラッグを作る。
- `content_md` は素のMarkdown。見出しは `##` / `###`（`#` は使わない＝タイトルはfrontmatter側）。要点は `**...**` で太字。

## Markdown生成コマンド

```bash
cd /home/claude/spacegleam-blog
python3 scripts/build_markdown.py --input posts.json --outdir ./articles
```

`./articles/` に `{slug}.md` が記事数ぶん生成される。各ファイルは frontmatter（title/slug/description）＋本文Markdown。

frontmatterのキー名はデフォルトで `title` / `slug` / `description`。デプロイ側が別のキー名（例: `meta-description`）を要求する場合は `scripts/build_markdown.py` の `FRONTMATTER_KEYS` を書き換えれば全記事に反映される。

## 品質チェック（納品前に必ず確認）

- [ ] **この記事は読者が発注したくなる理由を1つ以上作れているか**（考察で終わっていないか）
- [ ] **自社プロダクトの開発・運営の実体験が一次情報として入っているか**
- [ ] 「MVP」「お試し」「最小限」を本文・タイトル・概要・CTAで使っていないか（最重要）
- [ ] 要点の太字が各段落に適度に入り、かつ多用していないか（メリハリ）
- [ ] 一文が短く、改行で余白が作られているか（実践知のスタイル）
- [ ] 主要キーワードがタイトル・冒頭・見出しに自然に入っているか
- [ ] 自社プロダクトまたは相談導線へのCTAが各記事に1つ以上、自然に入っているか
- [ ] 誇大表現・事実誤認・実績や声の捏造がないか
- [ ] スラッグが記事ごとにユニークか（英数字・ハイフンのみ）
- [ ] 既存記事とテーマが重複していないか

## 参照ファイル

- `references/brand-voice.md` — ブランドの核・トーン・太字ルール・NG表現（**執筆前に必読**）
- `references/article-blueprint.md` — 記事構成・SEO・出力形式・CTA・カテゴリ・テーマの軸
- `scripts/build_markdown.py` — 記事JSON → frontmatter付きMarkdown（1記事1ファイル）生成
