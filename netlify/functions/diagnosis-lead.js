'use strict';

/**
 * AI開発診断のリード受信:
 *  ① 入力者へ「診断結果＋提案資料(PDF)」を送付（PDFはメールに添付）
 *  ② 社内へリード通知（誰がどの診断をしたか）
 * 既存 contact.js と同じ Resend 基盤を流用。
 */
const RESEND_API_URL = 'https://api.resend.com/emails';
const TO_EMAIL = process.env.CONTACT_NOTIFY_EMAIL || 'contact@spacegleam.co.jp';
const FROM_EMAIL = process.env.MAIL_FROM || 'noreply@send.spacegleam.co.jp';
const SITE_URL = 'https://spacegleam.co.jp';
const BRAND = '#2f7d4f';
const BASIC_EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function json(statusCode, body) {
    return {
        statusCode,
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'POST, OPTIONS'
        },
        body: JSON.stringify(body)
    };
}

function clean(value, maxLength) {
    return String(value || '').replace(/\0/g, '').replace(/\r\n/g, '\n').trim().slice(0, maxLength);
}

function escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

async function sendEmail(apiKey, payload) {
    const res = await fetch(RESEND_API_URL, {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    if (!res.ok) {
        let detail = '';
        try { detail = await res.text(); } catch (e) {}
        console.error('[diagnosis-lead] resend error', res.status, detail);
    }
    return res.ok;
}

/** assetUrl のPDFを取得して Base64 添付オブジェクトにする（失敗時は null） */
async function fetchPdfAttachment(assetUrl, filename) {
    if (!assetUrl) return null;
    try {
        const r = await fetch(assetUrl);
        if (!r.ok) { console.error('[diagnosis-lead] pdf fetch status', r.status, assetUrl); return null; }
        const buf = Buffer.from(await r.arrayBuffer());
        if (!buf.length || buf.length > 18 * 1024 * 1024) return null; // 18MB上限
        return { filename: filename, content: buf.toString('base64') };
    } catch (e) {
        console.error('[diagnosis-lead] pdf fetch error', e);
        return null;
    }
}

/** 共通メールレイアウト（メールクライアント互換のためインラインstyle＋table） */
function emailShell(title, innerHtml) {
    return [
        `<div style="margin:0;padding:24px 0;background:#f4f5f4;font-family:'Hiragino Sans','Noto Sans JP',Meiryo,Arial,sans-serif;">`,
        `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #ececec;">`,
        `<tr><td style="background:#111111;padding:22px 28px;">`,
        `<div style="color:#ffffff;font-size:18px;font-weight:800;letter-spacing:.06em;">SPACE GLEAM</div>`,
        `<div style="color:#9fd8b6;font-size:12px;font-weight:700;margin-top:4px;letter-spacing:.04em;">${escapeHtml(title)}</div>`,
        `</td></tr>`,
        `<tr><td style="padding:28px;color:#1a1a1a;font-size:14px;line-height:1.9;">${innerHtml}</td></tr>`,
        `<tr><td style="padding:18px 28px;background:#fafafa;border-top:1px solid #eee;color:#999;font-size:11px;line-height:1.7;">`,
        `SPACE GLEAM株式会社　<a href="${SITE_URL}" style="color:${BRAND};text-decoration:none;">${SITE_URL}</a><br>`,
        `本メールは診断フォームの送信に基づき自動送信しています。`,
        `</td></tr>`,
        `</table></div>`
    ].join('');
}

function metricRow(label, value) {
    if (!value) return '';
    return `<tr>` +
        `<td style="padding:10px 14px;background:#f6f8f7;border:1px solid #eceeed;font-size:12px;color:#555;font-weight:700;width:120px;">${escapeHtml(label)}</td>` +
        `<td style="padding:10px 14px;border:1px solid #eceeed;font-size:14px;color:#111;font-weight:800;">${escapeHtml(value)}</td>` +
        `</tr>`;
}

exports.handler = async (event) => {
    if (event.httpMethod === 'OPTIONS') return json(204, {});
    if (event.httpMethod !== 'POST') return json(405, { error: 'method_not_allowed' });

    let body;
    try { body = JSON.parse(event.body || '{}'); } catch (e) { return json(400, { error: 'invalid_json' }); }

    const email = clean(body.email, 180);
    if (!BASIC_EMAIL_RE.test(email)) return json(400, { error: 'invalid_email' });

    const patternName = clean(body.patternName, 80) || 'AI開発診断';
    const cost = clean(body.cost, 60);
    const period = clean(body.period, 80);
    const company = clean(body.company, 120);
    const name = clean(body.name, 80);
    const assetUrl = clean(body.assetUrl, 400);

    const apiKey = clean(process.env.RESEND_API_KEY, 240);
    if (!apiKey) {
        // キー未設定でもフロントはDLできる。社内取りこぼし防止のためログだけ残す。
        console.log('[diagnosis-lead] no RESEND_API_KEY. lead=', JSON.stringify({ email, patternName, company, name }));
        return json(200, { ok: false, reason: 'mail_disabled' });
    }

    // 提案資料(PDF)を取得して添付化
    const pdfFilename = `SPACE GLEAM_AI開発計画書_${patternName}.pdf`;
    const attachment = await fetchPdfAttachment(assetUrl, pdfFilename);

    // ① 入力者向け（PDF添付）
    const userInner = [
        `<p style="margin:0 0 14px;">${escapeHtml(name || 'ご担当者')} 様</p>`,
        `<p style="margin:0 0 16px;">この度はAI開発診断をご利用いただきありがとうございます。<br>診断結果と、ご担当者さま向けの<strong>AI開発計画書（PDF）を本メールに添付</strong>してお送りします。</p>`,
        `<table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0 0 18px;">`,
        metricRow('診断タイプ', patternName),
        metricRow('概算費用', cost),
        metricRow('想定期間', period),
        `</table>`,
        attachment
            ? `<p style="margin:0 0 16px;padding:12px 14px;background:#eef5f0;border:1px solid #d9e9df;border-radius:10px;font-size:13px;color:#2f7d4f;font-weight:700;">📎 提案資料（PDF）を本メールに添付しています。ご確認ください。</p>`
            : (assetUrl ? `<p style="margin:0 0 16px;"><a href="${escapeHtml(assetUrl)}" style="color:${BRAND};font-weight:700;">▶ 提案資料（PDF）をダウンロード</a></p>` : ''),
        `<p style="margin:0 0 8px;">具体的な進め方・お見積りは、無料相談（オンライン30分）で承ります。</p>`,
        `<p style="margin:0 0 20px;"><a href="${SITE_URL}/#contact" style="display:inline-block;background:#111;color:#fff;text-decoration:none;font-weight:800;font-size:14px;padding:13px 26px;border-radius:10px;">無料相談を予約する　→</a></p>`,
        `<p style="margin:0;color:#888;font-size:12px;">※ 記載の費用・期間は概算です。要件により変動します。`
    ].join('');

    // ② 社内通知
    const adminInner = [
        `<p style="margin:0 0 14px;font-size:15px;font-weight:800;">AI開発診断 新規リード</p>`,
        `<table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0 0 14px;">`,
        metricRow('診断タイプ', patternName),
        metricRow('概算費用', cost),
        metricRow('想定期間', period),
        metricRow('会社名', company || '-'),
        metricRow('お名前', name || '-'),
        `<tr><td style="padding:10px 14px;background:#f6f8f7;border:1px solid #eceeed;font-size:12px;color:#555;font-weight:700;">メール</td>` +
        `<td style="padding:10px 14px;border:1px solid #eceeed;font-size:14px;"><a href="mailto:${escapeHtml(email)}" style="color:${BRAND};">${escapeHtml(email)}</a></td></tr>`,
        `</table>`,
        `<p style="margin:0 0 6px;font-size:12px;color:#555;font-weight:700;">回答内容</p>`,
        `<pre style="margin:0 0 12px;padding:12px;background:#f4f4f4;border-radius:8px;font-size:11px;color:#333;white-space:pre-wrap;word-break:break-all;">${escapeHtml(JSON.stringify(body.answers || {}, null, 2))}</pre>`,
        `<p style="margin:0;font-size:12px;color:#555;">資料URL：<a href="${escapeHtml(assetUrl)}" style="color:${BRAND};">${escapeHtml(assetUrl)}</a>　${attachment ? '（このリードへ送信したメールにもPDFを添付済み）' : '（PDF取得に失敗：添付なし）'}</p>`
    ].join('');

    try {
        const userPayload = {
            from: FROM_EMAIL, to: [email], reply_to: TO_EMAIL,
            subject: `【SPACE GLEAM】AI開発診断レポート（${patternName}）`,
            html: emailShell('AI開発診断 結果レポート', userInner)
        };
        if (attachment) userPayload.attachments = [attachment];

        const userOk = await sendEmail(apiKey, userPayload);

        await sendEmail(apiKey, {
            from: FROM_EMAIL, to: [TO_EMAIL], reply_to: email,
            subject: `【リード】AI開発診断: ${patternName} / ${company || name || email}`,
            html: emailShell('新規リード通知', adminInner)
        });

        return json(200, { ok: userOk, attached: !!attachment });
    } catch (e) {
        console.error('[diagnosis-lead] send error', e);
        return json(200, { ok: false, reason: 'send_error' });
    }
};
