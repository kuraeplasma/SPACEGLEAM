#!/usr/bin/env python3
"""
SPACE GLEAM ブログ量産スキル: 記事JSON -> frontmatter付きMarkdown（1記事1ファイル）

各記事を「title / slug / description（概要）」のfrontmatterと本文Markdownからなる
.md ファイルとして書き出す。自社サイトへのデプロイにそのまま流せる形。

使い方:
    python3 scripts/build_markdown.py --input posts.json --outdir ./articles

入力JSONスキーマ:
{
  "posts": [
    {
      "title": "記事タイトル",
      "slug": "url-slug",
      "description": "記事の概要（メタディスクリプション兼用・120字程度）",
      "content_md": "## 見出し\n\n本文。要点は **太字** にしてメリハリをつける。\n"
    }
  ]
}

備考:
- frontmatterのキー名は title / slug / description をデフォルトとする。
  実サイトのデプロイが別キー名（例: meta-description）を要求する場合は
  FRONTMATTER_KEYS を書き換えるだけで全記事に反映できる。
- カテゴリ等を追加したい場合は extra フィールドを posts の各要素に持たせ、
  下の build_frontmatter で出力すればよい。
"""

import argparse
import json
import os
import re
import sys

# frontmatterのキー名。デプロイ側の仕様に合わせてここを変えるだけで全記事に反映される。
FRONTMATTER_KEYS = {
    "title": "title",
    "slug": "slug",
    "description": "description",
}


def yaml_quote(value: str) -> str:
    """YAML値を二重引用符で安全に囲む。"""
    if value is None:
        value = ""
    value = str(value).replace("\\", "\\\\").replace('"', '\\"')
    # 改行は空白に畳む（frontmatterの値は1行に）
    value = value.replace("\n", " ").replace("\r", " ").strip()
    return f'"{value}"'


def build_frontmatter(post: dict) -> str:
    lines = ["---"]
    lines.append(f'{FRONTMATTER_KEYS["title"]}: {yaml_quote(post.get("title", ""))}')
    lines.append(f'{FRONTMATTER_KEYS["slug"]}: {yaml_quote(post.get("slug", ""))}')
    lines.append(f'{FRONTMATTER_KEYS["description"]}: {yaml_quote(post.get("description", ""))}')
    lines.append("---")
    return "\n".join(lines)


def safe_filename(slug: str, index: int) -> str:
    slug = (slug or "").strip()
    if not re.fullmatch(r"[A-Za-z0-9\-]+", slug):
        # スラッグが英数字ハイフン以外を含む/空の場合の保険
        slug = f"post-{index:03d}"
    return f"{slug}.md"


def main():
    parser = argparse.ArgumentParser(
        description="記事JSON -> frontmatter付きMarkdown（1記事1ファイル）"
    )
    parser.add_argument("--input", "-i", required=True, help="入力JSONファイルのパス")
    parser.add_argument("--outdir", "-o", default="./articles", help="出力ディレクトリ")
    args = parser.parse_args()

    try:
        with open(args.input, "r", encoding="utf-8") as f:
            data = json.load(f)
    except FileNotFoundError:
        print(f"エラー: 入力ファイルが見つかりません: {args.input}", file=sys.stderr)
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"エラー: JSONの解析に失敗しました: {e}", file=sys.stderr)
        sys.exit(1)

    posts = data.get("posts", [])
    if not posts:
        print("エラー: posts が空です。最低1記事が必要です。", file=sys.stderr)
        sys.exit(1)

    # スラッグ重複チェック
    seen = {}
    for i, p in enumerate(posts):
        s = (p.get("slug") or "").strip()
        if s and s in seen:
            print(f"エラー: スラッグが重複: '{s}' (記事 {seen[s]+1} と {i+1})", file=sys.stderr)
            sys.exit(1)
        if s:
            seen[s] = i

    os.makedirs(args.outdir, exist_ok=True)

    written = []
    for idx, post in enumerate(posts):
        fm = build_frontmatter(post)
        body = (post.get("content_md", "") or "").strip()
        content = f"{fm}\n\n{body}\n"
        fname = safe_filename(post.get("slug", ""), idx)
        path = os.path.join(args.outdir, fname)
        with open(path, "w", encoding="utf-8") as f:
            f.write(content)
        written.append(fname)

    print(f"完了: {len(written)}記事を {args.outdir} に書き出しました。")
    for name in written:
        print(f"  - {name}")


if __name__ == "__main__":
    main()
