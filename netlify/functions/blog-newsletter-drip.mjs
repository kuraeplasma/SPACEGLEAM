import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { getStore } from '@netlify/blobs';

const RESEND_API_URL = 'https://api.resend.com';
const FROM_EMAIL = process.env.MAIL_FROM || 'SPACE GLEAM <noreply@send.spacegleam.co.jp>';
const BLOG_SEGMENT_ID = process.env.RESEND_BLOG_SEGMENT_ID || '';
const BLOG_SEGMENT_NAME = process.env.RESEND_BLOG_SEGMENT_NAME || 'SPACE GLEAM Blog Subscribers';
const STORE_NAME = 'spacegleam-blog-newsletter';
const STATE_KEY = 'drip-state';
const INTERVAL_MS = 48 * 60 * 60 * 1000;

function clean(value, maxLength) {
    return String(value || '').replace(/\0/g, '').trim().slice(0, maxLength);
}

function escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, (char) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[char]));
}

async function resendGet(route, apiKey) {
    return fetch(`${RESEND_API_URL}${route}`, {
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' }
    });
}

async function resendPost(route, payload, apiKey) {
    return fetch(`${RESEND_API_URL}${route}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
}

async function getBlogSegmentId(apiKey) {
    if (BLOG_SEGMENT_ID) return BLOG_SEGMENT_ID;
    const response = await resendGet('/segments', apiKey);
    const result = await response.json().catch(() => null);
    if (!response.ok || result?.error) {
        throw new Error(result?.message || result?.error?.message || 'Failed to list newsletter segments');
    }
    return (result?.data || []).find((segment) => segment.name === BLOG_SEGMENT_NAME)?.id || '';
}

function postsFilePath() {
    const candidates = [
        path.join(process.cwd(), 'blog', 'posts.js'),
        path.join(path.dirname(new URL(import.meta.url).pathname), '..', '..', 'blog', 'posts.js')
    ];
    return candidates.find((candidate) => fs.existsSync(candidate)) || '';
}

function loadPublishedPosts() {
    const filePath = postsFilePath();
    if (!filePath) throw new Error('Bundled blog/posts.js was not found');

    const sandbox = { window: {} };
    vm.runInNewContext(fs.readFileSync(filePath, 'utf8'), sandbox, { timeout: 1000 });
    const now = Date.now();
    return (Array.isArray(sandbox.window.SPACEGLEAM_BLOG_POSTS) ? sandbox.window.SPACEGLEAM_BLOG_POSTS : [])
        .filter((post) => post?.status === 'published'
            && clean(post.slug, 100)
            && clean(post.title, 200)
            && clean(post.url, 500)
            && new Date(post.publishAt || post.date).getTime() <= now)
        .sort((a, b) => new Date(a.publishAt || a.date) - new Date(b.publishAt || b.date));
}

function emailHtml(post) {
    const title = escapeHtml(post.title);
    const excerpt = escapeHtml(post.excerpt || post.description || 'SPACE GLEAMの実践知をお届けします。');
    const category = escapeHtml(post.category || 'Blog');
    const url = escapeHtml(post.url);
    return `<!doctype html><html lang="ja"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f6f7;font-family:'Noto Sans JP','Hiragino Sans','Yu Gothic','Meiryo',Arial,sans-serif;color:#111;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f6f7;padding:32px 14px;"><tr><td align="center">
<table width="640" cellpadding="0" cellspacing="0" style="max-width:640px;width:100%;background:#fff;border-radius:14px;overflow:hidden;border:1px solid #e5e7eb;">
<tr><td style="padding:38px 42px;"><p style="margin:0 0 26px;font-size:13px;letter-spacing:.08em;color:#6b7280;font-weight:800;">SPACE GLEAM 実践知セレクション</p>
<p style="margin:0 0 12px;font-size:12px;letter-spacing:.14em;color:#8a9099;">${category}</p>
<h1 style="margin:0;font-size:28px;line-height:1.45;color:#111;">${title}</h1>
<p style="margin:26px 0 0;color:#333941;line-height:1.95;font-size:16px;">${excerpt}</p>
<a href="${url}" style="display:inline-block;margin-top:30px;padding:15px 22px;background:#111;color:#fff;text-decoration:none;border-radius:8px;font-weight:800;">記事を読む →</a></td></tr>
<tr><td style="padding:20px 42px;background:#f8f8f8;color:#747b82;font-size:12px;line-height:1.7;">SPACE GLEAM Blog<br><a href="{{{RESEND_UNSUBSCRIBE_URL}}}" style="color:#747b82;">配信停止はこちら</a></td></tr>
</table></td></tr></table></body></html>`;
}

function emailText(post) {
    return `SPACE GLEAM 実践知セレクション\n\n${post.title}\n\n${post.excerpt || post.description || ''}\n\n記事を読む\n${post.url}\n\n配信停止: {{{RESEND_UNSUBSCRIBE_URL}}}`;
}

export { loadPublishedPosts, emailHtml, emailText };

export default async () => {
    const apiKey = clean(process.env.RESEND_API_KEY, 240);
    if (!apiKey) {
        console.error('[NewsletterDrip] RESEND_API_KEY is not set');
        return new Response('missing configuration', { status: 500 });
    }

    const store = getStore({ name: STORE_NAME, consistency: 'strong' });
    const current = await store.getWithMetadata(STATE_KEY, { type: 'json' });
    const state = current?.data || {};
    const lastSentAt = Date.parse(state.lastSentAt || '');
    if (Number.isFinite(lastSentAt) && Date.now() - lastSentAt < INTERVAL_MS) {
        return new Response('not due', { status: 200 });
    }

    const segmentId = await getBlogSegmentId(apiKey);
    if (!segmentId) {
        console.log('[NewsletterDrip] No subscriber segment yet');
        return new Response('no subscriber segment', { status: 200 });
    }

    const sentSlugs = new Set(Array.isArray(state.sentSlugs) ? state.sentSlugs : []);
    const post = loadPublishedPosts().find((candidate) => !sentSlugs.has(candidate.slug));
    if (!post) {
        console.log('[NewsletterDrip] All published archive posts have been sent');
        return new Response('archive complete', { status: 200 });
    }

    const response = await resendPost('/broadcasts', {
        segmentId,
        from: FROM_EMAIL,
        subject: `【SPACE GLEAM 実践知】${clean(post.title, 180)}`,
        html: emailHtml(post),
        text: emailText(post),
        name: `archive-${clean(post.slug, 100)}-${Date.now()}`,
        send: true
    }, apiKey);
    const result = await response.json().catch(() => null);
    if (!response.ok || result?.error) {
        throw new Error(result?.message || result?.error?.message || 'Failed to send newsletter broadcast');
    }

    sentSlugs.add(post.slug);
    await store.setJSON(STATE_KEY, {
        lastSentAt: new Date().toISOString(),
        lastSlug: post.slug,
        lastBroadcastId: result?.id || '',
        sentSlugs: [...sentSlugs]
    });
    console.log('[NewsletterDrip] Sent archive post', post.slug, result?.id || '');
    return new Response('sent', { status: 200 });
};
