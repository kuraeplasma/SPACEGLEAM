'use strict';

/**
 * SPACE GLEAM サイト定期ヘルスモニター
 * Netlify Scheduled Function: 毎日 00:00 UTC (= 09:00 JST) に実行
 *
 * チェック項目:
 *  1. トップページ・各ページ HTTP 200 確認
 *  2. 必須 HTML 要素の存在確認 (nav-toggle, h1, フッター, 問い合わせフォーム等)
 *  3. style.css / script.js などの主要アセット取得確認
 *  4. 問い合わせ API (/api/lead) の疎通確認
 *  5. 診断 API (/api/diagnosis) の疎通確認
 *  6. サービス API (/api/services) のレスポンス確認
 *  7. 異常検知時に contact@spacegleam.co.jp へ即時アラートメール送信
 */

const SITE_URL = 'https://spacegleam.co.jp';
const RESEND_API_URL = 'https://api.resend.com/emails';
const ALERT_EMAIL = 'contact@spacegleam.co.jp';
const FETCH_TIMEOUT_MS = 12000;

// ─────────────────────────────────────────────
// チェック定義
// ─────────────────────────────────────────────

/** HTMLページチェック: 取得して必須要素の存在を確認 */
const PAGE_CHECKS = [
    {
        url: `${SITE_URL}/`,
        name: 'トップページ',
        mustContain: [
            'SPACE GLEAM',          // 会社名
            'nav-toggle',           // ハンバーガーボタン (スマホUI必須)
            'AI開発',               // 主要サービス文言
            'nav',                  // ナビゲーション
            'footer',               // フッター
            '</html>'               // HTML正常終端
        ]
    },
    {
        url: `${SITE_URL}/services`,
        name: 'サービスページ',
        mustContain: ['SPACE GLEAM', 'nav-toggle', '</html>']
    },
    {
        url: `${SITE_URL}/pricing`,
        name: '料金ページ',
        mustContain: ['SPACE GLEAM', 'nav-toggle', '</html>']
    },
    {
        url: `${SITE_URL}/contact`,
        name: '問い合わせページ',
        mustContain: [
            'SPACE GLEAM',
            'nav-toggle',
            'form',                 // お問い合わせフォーム
            '</html>'
        ]
    },
    {
        url: `${SITE_URL}/works`,
        name: '実績ページ',
        mustContain: ['SPACE GLEAM', 'nav-toggle', '</html>']
    }
];

/** 静的アセットチェック: HTTP 200 が返れば OK */
const ASSET_CHECKS = [
    { url: `${SITE_URL}/style.css`, name: 'style.css' },
    { url: `${SITE_URL}/script.js`, name: 'script.js' }
];

/**
 * API エンドポイントチェック
 * - method: POST はダミーデータで疎通確認（実際のリードは作成しない）
 * - expectStatus: このステータスコードなら正常とみなす
 *   (バリデーションエラー 400 は "APIは生きているが入力不正" なので正常と判定)
 */
const API_CHECKS = [
    {
        url: `${SITE_URL}/api/services`,
        name: 'Services API (GET)',
        method: 'GET',
        expectStatus: [200],
        mustContainJson: true,
        description: 'サービス一覧を返すAPI'
    },
    {
        url: `${SITE_URL}/api/diagnosis`,
        name: 'Diagnosis API (POST)',
        method: 'POST',
        body: JSON.stringify({ answers: {} }),
        // バリデーションエラー(400)でもAPIが稼働中なら正常
        expectStatus: [200, 400],
        description: '無料診断API'
    },
    {
        url: `${SITE_URL}/api/lead`,
        name: 'Contact/Lead API (POST)',
        method: 'POST',
        body: JSON.stringify({ _healthcheck: true }),
        // バリデーションエラー(400)でもAPIが稼働中なら正常
        // 200は実際の送信成功なので起きない想定だが念のため含む
        expectStatus: [200, 400],
        description: '問い合わせ送信API'
    }
];

// ─────────────────────────────────────────────
// チェック実行関数
// ─────────────────────────────────────────────

async function checkPage({ url, name, mustContain }) {
    const errors = [];
    try {
        const res = await fetch(url, {
            headers: { 'User-Agent': 'SPACE-GLEAM-HealthMonitor/1.0' },
            signal: AbortSignal.timeout(FETCH_TIMEOUT_MS)
        });
        if (!res.ok) {
            errors.push(`[${name}] HTTP ${res.status} エラー (${url})`);
            return errors;
        }
        const html = await res.text();
        for (const keyword of mustContain) {
            if (!html.includes(keyword)) {
                errors.push(`[${name}] 必須要素が見つかりません → "${keyword}"`);
            }
        }
    } catch (e) {
        errors.push(`[${name}] 接続タイムアウト or 接続エラー → ${e.message}`);
    }
    return errors;
}

async function checkAsset({ url, name }) {
    try {
        const res = await fetch(url, {
            method: 'HEAD',
            headers: { 'User-Agent': 'SPACE-GLEAM-HealthMonitor/1.0' },
            signal: AbortSignal.timeout(8000)
        });
        if (!res.ok) return [`[アセット: ${name}] HTTP ${res.status} エラー (${url})`];
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
                'User-Agent': 'SPACE-GLEAM-HealthMonitor/1.0',
                'Content-Type': 'application/json'
            },
            signal: AbortSignal.timeout(FETCH_TIMEOUT_MS)
        };
        if (body) options.body = body;

        const res = await fetch(url, options);
        const allowed = expectStatus || [200];

        if (!allowed.includes(res.status)) {
            return [`[API: ${name}] 予期しない HTTP ${res.status} (期待値: ${allowed.join('/')})`];
        }

        if (mustContainJson) {
            const data = await res.json().catch(() => null);
            if (!data) return [`[API: ${name}] JSONレスポンスが不正またはパース失敗`];
        }
        return [];
    } catch (e) {
        return [`[API: ${name}] 接続エラー → ${e.message}`];
    }
}

// ─────────────────────────────────────────────
// アラートメール送信
// ─────────────────────────────────────────────

async function sendAlert(failures, checkTime) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
        console.error('[HealthMonitor] RESEND_API_KEY未設定。エラー詳細:', failures);
        return;
    }

    const errorList = failures.map((f, i) => `  ${i + 1}. ${f}`).join('\n');
    const subject = `【緊急アラート】spacegleam.co.jp でサイト異常を検知 (${failures.length}件)`;
    const text = `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SPACE GLEAM サイト自動ヘルスモニター
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
    console.log(`[HealthMonitor] 定期サイトチェック開始: ${checkTime}`);

    const allErrors = [];

    // 1. ページ構造チェック (HTML要素・ナビ・フォーム等)
    console.log('[HealthMonitor] ページチェック実行中...');
    for (const check of PAGE_CHECKS) {
        const errs = await checkPage(check);
        allErrors.push(...errs);
    }

    // 2. 静的アセットチェック (CSS・JS)
    console.log('[HealthMonitor] アセットチェック実行中...');
    for (const check of ASSET_CHECKS) {
        const errs = await checkAsset(check);
        allErrors.push(...errs);
    }

    // 3. API エンドポイントチェック (問い合わせ・診断・サービス)
    console.log('[HealthMonitor] APIチェック実行中...');
    for (const check of API_CHECKS) {
        const errs = await checkApi(check);
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
