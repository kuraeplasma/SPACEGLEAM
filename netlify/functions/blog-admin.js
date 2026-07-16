'use strict';

const ADMIN_USER = process.env.BLOG_ADMIN_USER || 'kurae';
const ADMIN_PASSWORD = process.env.BLOG_ADMIN_PASSWORD || '';
const { handler: notifyHandler } = require('./blog-publish-notify');

function unauthorized() {
    return {
        statusCode: 401,
        headers: {
            'WWW-Authenticate': 'Basic realm="SPACE GLEAM Blog Admin"',
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'no-store'
        },
        body: 'Authentication required'
    };
}

function decodeBasicAuth(header) {
    const match = String(header || '').match(/^Basic\s+(.+)$/i);
    if (!match) return null;

    try {
        const decoded = Buffer.from(match[1], 'base64').toString('utf8');
        const separator = decoded.indexOf(':');
        if (separator < 0) return null;
        return {
            user: decoded.slice(0, separator),
            password: decoded.slice(separator + 1)
        };
    } catch (_) {
        return null;
    }
}

function timingSafeEqualString(left, right) {
    const leftBuffer = Buffer.from(String(left || ''), 'utf8');
    const rightBuffer = Buffer.from(String(right || ''), 'utf8');
    if (leftBuffer.length !== rightBuffer.length) return false;
    return require('crypto').timingSafeEqual(leftBuffer, rightBuffer);
}

function isAuthorized(event) {
    if (!ADMIN_PASSWORD) return false;
    const headers = event.headers || {};
    const credentials = decodeBasicAuth(headers.authorization || headers.Authorization);
    if (!credentials) return false;
    return timingSafeEqualString(credentials.user, ADMIN_USER)
        && timingSafeEqualString(credentials.password, ADMIN_PASSWORD);
}

function page() {
    return `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="robots" content="noindex,nofollow">
    <title>Blog Admin | SPACE GLEAM</title>
    <link rel="icon" href="https://spacegleam.co.jp/favicon.png">
    <link rel="stylesheet" href="https://spacegleam.co.jp/style.css?v=blog-editor-20260602-admin">
    <style>
        :root {
            --admin-bg: #f5f3ef;
            --admin-ink: #111111;
            --admin-muted: #62615d;
            --admin-line: rgba(17, 17, 17, 0.10);
            --admin-panel: rgba(255, 255, 255, 0.88);
            --admin-panel-solid: #ffffff;
            --admin-radius: 8px;
        }

        body.blog-admin-body {
            min-height: 100vh;
            color: var(--admin-ink);
            background:
                radial-gradient(circle at 12% 8%, rgba(255,255,255,0.92), transparent 34%),
                radial-gradient(circle at 82% 0%, rgba(225,218,205,0.75), transparent 32%),
                linear-gradient(180deg, #faf8f3 0%, var(--admin-bg) 48%, #efebe4 100%);
        }

        .blog-admin-body .header {
            background: rgba(250, 248, 243, 0.82);
            border-bottom: 1px solid var(--admin-line);
            backdrop-filter: blur(18px);
        }

        .blog-admin-main {
            padding: 118px 0 80px;
        }

        .blog-admin-shell {
            display: grid;
            gap: 26px;
        }

        .blog-admin-hero {
            display: grid;
            grid-template-columns: minmax(0, 1fr) auto;
            gap: 24px;
            align-items: end;
            padding: 32px;
            background: rgba(255,255,255,0.58);
            border: 1px solid var(--admin-line);
            border-radius: var(--admin-radius);
            box-shadow: 0 22px 70px rgba(17,17,17,0.08);
        }

        .blog-admin-kicker {
            display: inline-flex;
            width: fit-content;
            align-items: center;
            gap: 8px;
            margin: 0 0 14px;
            padding: 6px 10px;
            color: #2d2b27;
            background: #ffffff;
            border: 1px solid var(--admin-line);
            border-radius: 999px;
            font-size: 0.78rem;
            font-weight: 800;
            letter-spacing: 0.08em;
            text-transform: uppercase;
        }

        .blog-admin-kicker::before {
            content: "";
            width: 8px;
            height: 8px;
            background: #32c36c;
            border-radius: 999px;
            box-shadow: 0 0 0 5px rgba(50,195,108,0.14);
        }

        .blog-admin-title {
            max-width: 760px;
            margin: 0;
            color: var(--admin-ink);
            font-size: clamp(2.2rem, 5vw, 4.7rem);
            line-height: 0.96;
            letter-spacing: 0;
        }

        .blog-admin-lead {
            max-width: 690px;
            margin: 18px 0 0;
            color: var(--admin-muted);
            font-size: 1rem;
            line-height: 1.85;
        }

        .blog-admin-quick {
            display: grid;
            grid-template-columns: repeat(2, minmax(150px, 1fr));
            gap: 10px;
            min-width: 330px;
        }

        .blog-admin-stat {
            padding: 18px;
            background: #111111;
            color: #ffffff;
            border-radius: var(--admin-radius);
        }

        .blog-admin-stat:nth-child(2) {
            background: #ffffff;
            color: var(--admin-ink);
            border: 1px solid var(--admin-line);
        }

        .blog-admin-stat span {
            display: block;
            margin-bottom: 14px;
            color: currentColor;
            opacity: 0.68;
            font-size: 0.76rem;
            font-weight: 800;
            letter-spacing: 0.08em;
            text-transform: uppercase;
        }

        .blog-admin-stat strong {
            display: block;
            font-size: 1.2rem;
            line-height: 1.35;
            letter-spacing: 0;
        }

        .blog-admin-guide {
            max-width: none;
            margin: 0;
            padding: 0;
        }

        .blog-admin-guide h2 {
            margin: 0 0 14px;
            font-size: 1rem;
            letter-spacing: 0;
        }

        .blog-admin-guide ol {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 10px;
            padding: 0;
            list-style: none;
            counter-reset: admin-step;
        }

        .blog-admin-guide li {
            counter-increment: admin-step;
            min-height: 122px;
            padding: 18px;
            color: #4f4d48;
            background: var(--admin-panel);
            border: 1px solid var(--admin-line);
            border-radius: var(--admin-radius);
            line-height: 1.75;
        }

        .blog-admin-guide li::before {
            content: counter(admin-step, decimal-leading-zero);
            display: block;
            margin-bottom: 14px;
            color: #111111;
            font-size: 0.72rem;
            font-weight: 900;
            letter-spacing: 0.12em;
        }

        .blog-admin-body .blog-editor-layout {
            grid-template-columns: minmax(430px, 0.86fr) minmax(0, 1.14fr);
            gap: 18px;
            align-items: start;
        }

        .blog-admin-body .blog-editor-form,
        .blog-admin-body .blog-editor-output {
            padding: 20px;
            background: var(--admin-panel-solid);
            border: 1px solid var(--admin-line);
            border-radius: var(--admin-radius);
            box-shadow: 0 18px 52px rgba(17,17,17,0.06);
        }

        .blog-editor-section-title {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            margin: 0 0 4px;
            padding-bottom: 14px;
            border-bottom: 1px solid var(--admin-line);
        }

        .blog-editor-section-title h2 {
            margin: 0;
            font-size: 1.1rem;
            letter-spacing: 0;
        }

        .blog-editor-section-title span {
            color: var(--admin-muted);
            font-size: 0.78rem;
            font-weight: 800;
            letter-spacing: 0.08em;
            text-transform: uppercase;
        }

        .blog-admin-body .blog-editor-form label,
        .blog-admin-body .blog-editor-output label,
        .blog-admin-body .blog-editor-image-field {
            color: #24231f;
            font-size: 0.82rem;
            letter-spacing: 0.02em;
        }

        .blog-admin-body .blog-editor-form input,
        .blog-admin-body .blog-editor-form select,
        .blog-admin-body .blog-editor-form textarea,
        .blog-admin-body .blog-editor-output textarea {
            min-height: 48px;
            background: #f7f5f0;
            border: 1px solid rgba(17,17,17,0.09);
            border-radius: var(--admin-radius);
            transition: border-color 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
        }

        .blog-admin-body .blog-editor-form input:focus,
        .blog-admin-body .blog-editor-form select:focus,
        .blog-admin-body .blog-editor-form textarea:focus,
        .blog-admin-body .blog-editor-output textarea:focus {
            background: #ffffff;
            border-color: rgba(17,17,17,0.34);
            box-shadow: 0 0 0 4px rgba(17,17,17,0.06);
        }

        .blog-admin-body .blog-editor-drafts {
            padding: 14px;
            background: #f7f5f0;
            border: 1px solid var(--admin-line);
            border-radius: var(--admin-radius);
        }

        .blog-admin-body .blog-editor-draft-actions button,
        .blog-admin-body .blog-editor-slug-row button,
        .blog-admin-body .blog-editor-actions button,
        .blog-admin-body .blog-editor-image-clear {
            border-radius: var(--admin-radius);
            background: #ffffff;
            transition: transform 0.18s ease, border-color 0.18s ease;
        }

        .blog-admin-body button:hover {
            transform: translateY(-1px);
        }

        .blog-admin-body .blog-editor-image-dropzone {
            min-height: 116px;
            background:
                linear-gradient(135deg, rgba(255,255,255,0.72), transparent 44%),
                #f0ede6;
            border-radius: var(--admin-radius);
        }

        .blog-admin-body .blog-editor-image-preview {
            min-height: 220px;
            border-radius: var(--admin-radius);
        }

        .blog-admin-body .blog-editor-submit,
        .blog-admin-body .blog-editor-publish-panel button,
        .blog-admin-body .blog-editor-notify button {
            width: 100%;
            justify-content: center;
            min-height: 52px;
            border-radius: var(--admin-radius);
        }

        .blog-admin-body .blog-editor-publish-panel,
        .blog-admin-body .blog-editor-notify,
        .blog-admin-body .blog-editor-manual-output {
            border-radius: var(--admin-radius);
            border-color: var(--admin-line);
        }

        .blog-admin-body .blog-editor-publish-panel {
            background:
                linear-gradient(135deg, rgba(255,255,255,0.88), transparent 44%),
                #111111;
            color: #ffffff;
        }

        .blog-admin-body .blog-editor-publish-panel h2,
        .blog-admin-body .blog-editor-publish-panel p,
        .blog-admin-body .blog-editor-publish-panel p[data-state="success"],
        .blog-admin-body .blog-editor-publish-panel p[data-state="error"] {
            color: #ffffff;
        }

        .blog-admin-body .blog-editor-publish-panel p {
            opacity: 0.74;
        }

        .blog-admin-body .blog-editor-publish-panel button {
            color: #111111;
            background: #ffffff;
        }

        @media (max-width: 1080px) {
            .blog-admin-hero,
            .blog-admin-body .blog-editor-layout {
                grid-template-columns: 1fr;
            }

            .blog-admin-quick {
                min-width: 0;
            }

            .blog-admin-guide ol {
                grid-template-columns: repeat(2, minmax(0, 1fr));
            }
        }

        @media (max-width: 640px) {
            .blog-admin-main {
                padding-top: 92px;
            }

            .blog-admin-hero,
            .blog-admin-body .blog-editor-form,
            .blog-admin-body .blog-editor-output {
                padding: 18px;
            }

            .blog-admin-guide ol,
            .blog-admin-quick {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body class="blog-page-body blog-admin-body">
    <header class="header">
        <div class="container header-inner">
                <a href="https://spacegleam.co.jp/" class="brand" aria-label="SPACE GLEAM ホーム">
                <span class="brand-name">SPACE GLEAM</span>
            </a>
            <nav class="nav" aria-label="ブログ管理">
                <a href="https://spacegleam.co.jp/blog/">Blog</a>
                <a href="https://spacegleam.co.jp/">Home</a>
            </nav>
            <div class="header-ctas">
                <a href="https://spacegleam.co.jp/#contact" class="header-cta">AI活用案を無料で聞く<span class="arrow">→</span></a>
            </div>
        </div>
    </header>

    <main class="blog-main blog-admin-main">
        <div class="container blog-admin-shell">
            <section class="blog-admin-hero">
                <div>
                    <p class="blog-admin-kicker">Blog Admin Console</p>
                    <h1 class="blog-admin-title">記事を整え、公開準備まで一気に。</h1>
                    <p class="blog-admin-lead">下書き、OGP画像、公開用HTML、購読者向け通知を一画面で管理できます。生成した内容はCodexに渡しやすい形でまとめます。</p>
                </div>
                <div class="blog-admin-quick" aria-label="管理画面の状態">
                    <div class="blog-admin-stat">
                        <span>Mode</span>
                        <strong>Draft first</strong>
                    </div>
                    <div class="blog-admin-stat">
                        <span>Output</span>
                        <strong>HTML / posts.js / Mail JSON</strong>
                    </div>
                </div>
            </section>
            <section class="blog-admin-guide">
                <p class="blog-eyebrow">Blog Admin</p>
                <h2>公開フロー</h2>
                <ol>
                    <li>記事を書いて、下書き保存します。</li>
                    <li>公開する時は「公開準備をまとめてコピー」を押します。</li>
                    <li>コピーした内容をCodexに貼って「この記事を本番公開して」と依頼します。</li>
                    <li>公開後に「公開通知メールを配信する」で購読者へ通知します。</li>
                </ol>
            </section>

            <section class="blog-editor-layout">
                <form class="blog-editor-form" data-blog-editor>
                    <div class="blog-editor-section-title">
                        <h2>編集</h2>
                        <span>Compose</span>
                    </div>
                    <div class="blog-editor-drafts">
                        <label>下書き<select data-draft-list><option value="">新規作成</option></select></label>
                        <div class="blog-editor-draft-actions">
                            <button type="button" data-save-draft>下書き保存</button>
                            <button type="button" data-delete-draft>削除</button>
                        </div>
                        <p class="blog-editor-draft-note">下書きはこの端末のブラウザ内に保存されます。一覧から選ぶと再編集できます。</p>
                        <p class="blog-editor-draft-status" data-draft-status aria-live="polite"></p>
                    </div>
                    <label>状態
                        <select name="status">
                            <option value="draft">下書き</option>
                            <option value="scheduled">予約投稿</option>
                            <option value="published">公開済み</option>
                        </select>
                    </label>
                    <label>タイトル<input name="title" type="text" value="AI時代のMVP開発で最初に決めること" required></label>
                    <label>スラッグ
                        <div class="blog-editor-slug-row">
                            <input name="slug" type="text" value="ai-mvp-first-decisions" required>
                            <button type="button" data-slug-from-title>タイトルから生成</button>
                            <button type="button" data-slug-random>ランダム生成</button>
                        </div>
                    </label>
                    <label>カテゴリ
                        <select name="category">
                            <option>Development</option>
                            <option>AI</option>
                            <option>SaaS</option>
                            <option>Business</option>
                            <option>Product</option>
                        </select>
                    </label>
                    <label>公開日<input name="date" type="date" required></label>
                    <label>予約公開日時<input name="publishAt" type="datetime-local" required></label>
                    <div class="blog-editor-image-field">
                        <span>画像</span>
                        <button class="blog-editor-image-dropzone" type="button" data-image-dropzone>
                            画像をここに貼り付け、またはクリックして選択
                        </button>
                        <input name="imageFile" type="file" accept="image/*" data-image-file hidden>
                        <button class="blog-editor-image-clear" type="button" data-clear-image>画像を削除</button>
                    </div>
                    <div class="blog-editor-image-preview" data-image-preview aria-hidden="true"></div>
                    <label>概要<textarea name="description" rows="3" required>AIを使ってMVP開発を始める前に決めるべき、検証仮説、初期機能、運用設計の考え方を整理します。</textarea></label>
                    <label>本文<textarea name="body" rows="12" required>AIを使うと、MVPの初期実装はかなり速くなります。

ただし、最初に決めるべきことは技術選定ではありません。誰のどんな課題を、どの順番で検証するかです。

## 最初に決めること

最初に決めるべきなのは、成功条件、初期ユーザー、検証する業務フローです。

## 作りすぎない設計

AIで開発速度が上がるほど、作りすぎのリスクも上がります。最初は検証に必要な機能だけに絞ることが重要です。

## 運用まで含めて考える

MVPは公開して終わりではありません。問い合わせ、ログ、改善要望を受け取る仕組みまで設計しておくと、次の改善が速くなります。</textarea></label>
                    <button class="header-cta blog-editor-submit" type="submit">プレビュー更新<span class="arrow">→</span></button>
                </form>

                <div class="blog-editor-output">
                    <div class="blog-editor-section-title">
                        <h2>出力</h2>
                        <span>Publish</span>
                    </div>
                    <div class="blog-editor-publish-panel">
                        <h2>公開準備</h2>
                        <p>記事を書き終えたら、このボタンで公開に必要な内容をまとめてコピーします。</p>
                        <button type="button" data-copy-publish-package>公開準備をまとめてコピー</button>
                        <p data-publish-status aria-live="polite"></p>
                    </div>
                    <div class="blog-editor-notify">
                        <h2>メール通知</h2>
                        <p>本番公開が終わったあとに押すだけで、購読者へ記事URLを送ります。</p>
                        <button type="button" data-send-notify>公開通知メールを配信する</button>
                        <p data-notify-status aria-live="polite"></p>
                    </div>
                    <details class="blog-editor-manual-output">
                        <summary>手動出力を開く</summary>
                        <div class="blog-editor-help">
                            <p><strong>posts.js用</strong> ブログ一覧に表示するためのデータです。</p>
                            <p><strong>記事HTML</strong> 記事ページそのものです。スラッグ名のフォルダに保存します。</p>
                            <p><strong>配信用JSON</strong> 公開後にメール通知へ渡すタイトル・URL情報です。</p>
                        </div>
                        <div class="blog-editor-actions">
                            <button type="button" data-copy-post>posts.js用をコピー</button>
                            <button type="button" data-copy-html>記事HTMLをコピー</button>
                            <button type="button" data-copy-notify>配信用JSONをコピー</button>
                        </div>
                        <label>posts.js 追記用<textarea data-post-output rows="12" readonly></textarea></label>
                        <label>記事HTML<textarea data-html-output rows="18" readonly></textarea></label>
                        <label>公開後メール配信用JSON<textarea data-notify-output rows="8" readonly></textarea></label>
                    </details>
                </div>
            </section>
        </div>
    </main>

    <script src="https://spacegleam.co.jp/blog/editor.js?v=20260606-header-template"></script>
</body>
</html>`;
}

exports.handler = async (event) => {
    if (!isAuthorized(event)) return unauthorized();

    if (event.httpMethod === 'POST') {
        return notifyHandler({
            ...event,
            httpMethod: 'POST',
            headers: {
                ...event.headers,
                authorization: `Bearer ${process.env.BLOG_NOTIFY_SECRET || ''}`
            }
        });
    }

    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'no-store'
        },
        body: page()
    };
};
