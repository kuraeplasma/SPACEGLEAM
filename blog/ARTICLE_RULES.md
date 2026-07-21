# ブログ記事の掲載ルール

## 一覧用画像

- 新しい記事を作成するたびに、`/blog/` の記事一覧で使用する画像を必ず `blog/assets/blog-list/` に格納する。
- ファイル名は記事スラッグと同じ名前にする。WebPを推奨し、元画像がPNGの場合はPNGのままでもよい。
- 原則として横1200px以上の高画質画像を使用し、600×315pxの縮小画像は使用しない。
- `blog/posts.js` の `thumbnail` には実際に保存した `/blog/assets/blog-list/<記事スラッグ>.<拡張子>` を指定する。
- 一覧用画像以外のOGP画像、記事本文画像、診断画像は `blog/assets/blog-list/` に入れない。
- 公開前に、一覧ページと画像URLの両方が正常に表示されることを確認する。

### 例

記事スラッグが `example-ai-article` の場合：

```text
保存先: blog/assets/blog-list/example-ai-article.webp
推奨サイズ: 1200×630px以上
thumbnail: '/blog/assets/blog-list/example-ai-article.webp'
```
