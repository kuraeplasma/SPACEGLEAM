'use strict';

/**
 * SPACE GLEAM サイト定期ヘルスモニター (強化版 v2)
 * Netlify Scheduled Function: 毎日 00:00 UTC (= 09:00 JST) に実行
 *
 * チェック項目:
 *  1. 全ページ HTTP 200 確認
 *  2. ナビゲーションリンク存在確認（リンク消失検知）
 *  3. ナビリンクの実際の疎通確認（リンク切れ検知）
 *  4. 主要セクション CSS クラスの存在確認（レイアウト崩れの指標）
 *  5. お問い合わせフォームのフィールド存在確認
 *  6. style.css / script.js の取得確認とファイルサイズ異常検知
 *  7. API エンドポイント疎通確認
 *  8. 異常検知時に contact@spacegleam.co.jp へ即時アラートメール送信
 */

const SITE_URL = 'https://spacegleam.co.jp';
const RESEND_API_URL = 'https://api.resend.com/emails';
const ALERT_EMAIL = 'contact@spacegleam.co.jp';
const FETCH_TIMEOUT_MS = 12000;

// ─────────────────────────────────────────────
// 1. ページ構造チェック定義
//    mustContain: HTMLに含まれるべきテキスト・クラス名
//    mustHaveLinks: 存在すべきhref（ナビリンク消失検知）
//    mustHaveClasses: 存在すべきCSSクラス（セクション消失・レイアウト崩れ指標）
// ─────────────────────────────────────────────
const PAGE_CHECKS = [
    {
        url: `${SITE_URL}/`,
        name: 'トップページ',
        mustContain: [
            'SPACE GLEAM',
            'nav-toggle',       // ハンバーガーボタン（スマホUI）
            'class="nav"',      // ナビゲーション本体
            'class="hero"',     // ヒーローセクション
            'class="footer"',   // フッター
            '</html>'
        ],
        // ナビゲーションに必ず存在すべきリンク（リンク消失検知）
        mustHaveLinks: [
            'services.html',    // サービスページへのリンク
            'pricing.html',     // 料金ページへのリンク
            'works.html',       // 実績ページへのリンク
            'faq.html',         // FAQへのリンク
            'contact.html',     // お問い合わせへのリンク
            'blog/'             // ブログへのリンク
        ],
        // 主要セクションのCSSクラス（レイアウト構造の確認）
        mustHaveClasses: [
            'header',
            'hero',
            'footer'
        ]
    },
    {
        url: `${SITE_URL}/services`,
        name: 'サービスページ',
        mustContain: ['SPACE GLEAM', 'nav-toggle', '</html>'],
        mustHaveLinks: ['contact.html'],
        mustHaveClasses: ['header', 'footer']
    },
    {
        url: `${SITE_URL}/pricing`,
        name: '料金ページ',
        mustContain: ['SPACE GLEAM', 'nav-toggle', '</html>'],
        mustHaveLinks: ['contact.html'],
        mustHaveClasses: ['header', 'footer']
    },
    {
        url: `${SITE_URL}/contact`,
        name: '問い合わせページ',
        mustContain: ['SPACE GLEAM', 'nav-toggle', '</html>'],
        // フォームフィールドの存在確認
        mustHaveClasses: ['header', 'footer'],
        // お問い合わせフォームの必須HTML要素
        mustHaveFormFields: [
            'type="text"',      // 名前入力
            'type="email"',     // メールアドレス入力
            '</textarea>',      // メッセージ入力
            'type="submit"'     // 送信ボタン
        ]
    },
    {
        url: `${SITE_URL}/works`,
        name: '実績ページ',
        mustContain: ['SPACE GLEAM', 'nav-toggle', '</html>'],
        mustHaveLinks: ['contact.html'],
        mustHaveClasses: ['header', 'footer']
    },
    {
        url: `${SITE_URL}/faq`,
        name: 'FAQページ',
        mustContain: ['SPACE GLEAM', 'nav-toggle', '</html>'],
        mustHaveClasses: ['header', 'footer']
    }
];

// ─────────────────────────────────────────────
// 2. ナビゲーションリンク疎通チェック
//    トップページのナビから飛べる全ページが実際に 200 を返すか
// ─────────────────────────────────────────────
const NAV_LINK_CHECKS = [
    { url: `${SITE_URL}/services`, name: 'サービスページ (/services)' },
    { url: `${SITE_URL}/pricing`,  name: '料金ページ (/pricing)' },
    { url: `${SITE_URL}/works`,    name: '実績ページ (/works)' },
    { url: `${SITE_URL}/faq`,      name: 'FAQページ (/faq)' },
    { url: `${SITE_URL}/contact`,  name: '問い合わせページ (/contact)' },
    { url: `${SITE_URL}/blog/`,    name: 'ブログ (/blog/)' },
    { url: `${SITE_URL}/company`,  name: '会社概要 (/company)' }
];

// ─────────────────────────────────────────────
// 3. 静的アセットチェック (ファイルサイズ異常も検知)
//    minBytes: この値より小さい場合はファイル破損と判定
// ─────────────────────────────────────────────
const ASSET_CHECKS = [
    { url: `${SITE_URL}/style.css`,  name: 'style.css',  minBytes: 50000 },  // 50KB未満は異常
    { url: `${SITE_URL}/script.js`,  name: 'script.js',  minBytes: 1000  }   //  1KB未満は異常
];

// ─────────────────────────────────────────────
// 4. API エンドポイントチェック
// ─────────────────────────────────────────────
const API_CHECKS = [
    {
        url: `${SITE_URL}/api/services`,
        name: 'Services API',
        method: 'GET',
        expectStatus: [200],
        mustContainJson: true
    },
    {
        url: `${SITE_URL}/api/diagnosis`,
        name: 'Diagnosis API',
        method: 'POST',
        body: JSON.stringify({ answers: {} }),
        expectStatus: [200, 400]
    },
    {
        url: `${SITE_URL}/api/lead`,
        name: 'Contact/Lead API（問い合わせ送信）',
        method: 'POST',
        body: JSON.stringify({ _healthcheck: true }),
        expectStatus: [200, 400]
    }
];

// ─────────────────────────────────────────────
// チェック実行関数
// ─────────────────────────────────────────────

async function checkPage(check) {
    const { url, name, mustContain = [], mustHaveLinks = [], mustHaveClasses = [], mustHaveFormFields = [] } = check;
    const errors = [];

    let html = '';
    try {
        const res = await fetch(url, {
            headers: { 'User-Agent': 'SPACE-GLEAM-HealthMonitor/2.0' },
            signal: AbortSignal.timeout(FETCH_TIMEOUT_MS)
        });
        if (!res.ok) {
            errors.push(`[${name}] HTTP ${res.status} エラー`);
            return errors;
        }
        html = await res.text();
    } catch (e) {
        errors.push(`[${name}] 接続タイムアウト → ${e.message}`);
        return errors;
    }

    // 必須テキスト確認
    for (const keyword of mustContain) {
        if (!html.includes(keyword)) {
            errors.push(`[${name}] 必須要素が消失 → "${keyword}"`);
        }
    }

    // ナビリンク存在確認（href="xxx" で検索）
    for (const link of mustHaveLinks) {
        if (!html.includes(`href="${link}"`) && !html.includes(`href='${link}'`)) {
            errors.push(`[${name}] ナビリンクが消失 → "${link}"`);
        }
    }

    // CSSクラス存在確認（class="xxx" または class="... xxx ..."）
    for (const cls of mustHaveClasses) {
        const pattern = new RegExp(`class="[^"]*\\b${cls}\\b[^"]*"`);
        if (!pattern.test(html)) {
            errors.push(`[${name}] セクションが消失（クラス消失） → .${cls}`);
        }
    }

    // フォームフィールド確認
    for (const field of mustHaveFormFields) {
        if (!html.includes(field)) {
            errors.push(`[${name}] フォーム要素が消失 → "${field}"`);
        }
    }

    return errors;
}

async function checkNavLink({ url, name }) {
    try {
        const res = await fetch(url, {
            method: 'HEAD',
            headers: { 'User-Agent': 'SPACE-GLEAM-HealthMonitor/2.0' },
            signal: AbortSignal.timeout(8000)
        });
        if (!res.ok) return [`[リンク切れ: ${name}] HTTP ${res.status}`];
        return [];
    } catch (e) {
        return [`[リンク切れ: ${name}] 接続失敗 → ${e.message}`];
    }
}

async function checkAsset({ url, name, minBytes }) {
    try {
        const res = await fetch(url, {
            headers: { 'User-Agent': 'SPACE-GLEAM-HealthMonitor/2.0' },
            signal: AbortSignal.timeout(10000)
        });
        if (!res.ok) return [`[アセット破損: ${name}] HTTP ${res.status}`];

        // ファイルサイズが異常に小さい場合はCSS/JSが壊れている可能性
        const text = await res.text();
        if (minBytes && text.length < minBytes) {
            return [`[アセット破損: ${name}] ファイルサイズ異常 (${text.length}バイト / 正常値: ${minBytes}バイト以上)`];
        }
        return [];
    } catch (e) {
        return [`[アセット: ${name}] 取得失敗 → ${e.message}`];
    }
}

async function checkApi({ url, name, method, body, expectStatus, mustContainJson }) {
    try {
        const options = {
            method: method || 'GET',
            headers: {
                'User-Agent': 'SPACE-GLEAM-HealthMonitor/2.0',
                'Content-Type': 'application/json'
            },
            signal: AbortSignal.timeout(FETCH_TIMEOUT_MS)
        };
        if (body) options.body = body;

        const res = await fetch(url, options);
        const allowed = expectStatus || [200];

        if (!allowed.includes(res.status)) {
            return [`[API停止: ${name}] HTTP ${res.status} (期待値: ${allowed.join('/')})`];
        }
        if (mustContainJson) {
            const data = await res.json().catch(() => null);
            if (!data) return [`[API: ${name}] JSONレスポンス異常`];
        }
        return [];
    } catch (e) {
        return [`[API停止: ${name}] 接続エラー → ${e.message}`];
    }
}

// ─────────────────────────────────────────────
// アラートメール送信
// ─────────────────────────────────────────────

async function sendAlert(failures, checkTime) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
        console.error('[HealthMonitor] RESEND_API_KEY未設定。エラー:', failures);
        return;
    }

    const errorList = failures.map((f, i) => `  ${i + 1}. ${f}`).join('\n');
    const subject = `【緊急アラート】spacegleam.co.jp でサイト異常を検知 (${failures.length}件)`;
    const text = `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SPACE GLEAM サイト自動ヘルスモニター v2
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

本番サイトで異常が検知されました。至急ご確認ください。

検知日時: ${checkTime}
対象サイト: ${SITE_URL}
エラー件数: ${failures.length} 件

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
検出されたエラー
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${errorList}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
推奨対応手順
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. ${SITE_URL} をPC・スマホ両方で確認
2. Netlify ダッシュボード (https://app.netlify.com) でデプロイ状況を確認
3. 問題があれば直前の正常デプロイへロールバック

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
※本メールは SPACE GLEAM 自動ヘルスモニター (Netlify Scheduled Function) より
  毎日 09:00 JST に自動実行されています。正常時はメール送信されません。`;

    try {
        const res = await fetch(RESEND_API_URL, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: process.env.MAIL_FROM || 'SPACE GLEAM Monitor <noreply@send.spacegleam.co.jp>',
                to: [ALERT_EMAIL],
                subject,
                text
            })
        });
        if (res.ok) {
            console.log(`[HealthMonitor] アラートメール送信完了 → ${ALERT_EMAIL}`);
        } else {
            console.error(`[HealthMonitor] メール送信失敗: HTTP ${res.status}`);
        }
    } catch (e) {
        console.error('[HealthMonitor] メール送信例外:', e);
    }
}

// ─────────────────────────────────────────────
// Netlify Scheduled Function エントリーポイント
// ─────────────────────────────────────────────

exports.handler = async function (event) {
    const checkTime = new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' });
    console.log(`[HealthMonitor v2] 定期サイトチェック開始: ${checkTime}`);

    const allErrors = [];

    // 1. ページ構造チェック（HTML要素・リンク消失・セクション消失）
    console.log('[HealthMonitor] ページ構造チェック...');
    for (const check of PAGE_CHECKS) {
        const errs = await checkPage(check);
        if (errs.length) console.warn(`  ${check.name}: ${errs.length}件のエラー`);
        allErrors.push(...errs);
    }

    // 2. ナビリンク疎通チェック（リンク切れ検知）
    console.log('[HealthMonitor] ナビリンク疎通チェック...');
    for (const check of NAV_LINK_CHECKS) {
        const errs = await checkNavLink(check);
        if (errs.length) console.warn(`  ${check.name}: リンク切れ`);
        allErrors.push(...errs);
    }

    // 3. 静的アセットチェック（CSS/JSサイズ異常）
    console.log('[HealthMonitor] アセットチェック...');
    for (const check of ASSET_CHECKS) {
        const errs = await checkAsset(check);
        if (errs.length) console.warn(`  ${check.name}: アセット異常`);
        allErrors.push(...errs);
    }

    // 4. API エンドポイントチェック（問い合わせ・診断）
    console.log('[HealthMonitor] APIチェック...');
    for (const check of API_CHECKS) {
        const errs = await checkApi(check);
        if (errs.length) console.warn(`  ${check.name}: API異常`);
        allErrors.push(...errs);
    }

    if (allErrors.length === 0) {
        console.log('[HealthMonitor] 全チェック正常。アラートなし。');
        return { statusCode: 200, body: 'All checks passed.' };
    }

    console.error(`[HealthMonitor] ${allErrors.length}件の異常を検知:`, allErrors);
    await sendAlert(allErrors, checkTime);

    return {
        statusCode: 200,
        body: JSON.stringify({ errors: allErrors.length, details: allErrors })
    };
};
