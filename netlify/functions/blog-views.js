'use strict';

const crypto = require('crypto');
const { getStore } = require('@netlify/blobs');

const STORE_NAME = 'spacegleam-blog-views';
const COUNTER_PREFIX = 'count/';
const SEEN_PREFIX = 'seen/';
const MAX_SLUGS = 60;
const MAX_INCREMENT_RETRIES = 12;
const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{0,79}$/;
const SESSION_PATTERN = /^[a-zA-Z0-9_-]{16,96}$/;
const BOT_PATTERN = /bot|crawler|spider|slurp|bingpreview|headless|lighthouse|pagespeed|monitoring|uptime/i;
const PRODUCTION_ORIGIN = 'https://spacegleam.co.jp';
const ALLOWED_SLUGS = new Set([
    'human-review-ai-workflow',
    'website-ai-sales-mcp',
    'ai-search-ready-corporate-website',
    'ai-poc-to-production',
    'rag-data-preparation',
    'after-ai-development-diagnosis',
    'ai-automation-first-process',
    'ai-adoption-failed-fix',
    'custom-crm-sfa-versus-saas',
    'ai-development-security-guide',
    'ai-product-mvp-value',
    'how-to-write-ai-rfp',
    'ai-era-business-judgment',
    'ai-small-team-productivity',
    'free-ai-development-diagnosis',
    'why-custom-business-systems-are-growing',
    'why-business-systems-fail-and-how-ai-solves-it',
    'is-ai-generated-software-secure',
    'ai-adoption-gap',
    'will-todays-ai-companies-survive',
    'diffsense-three-days',
    'ai-development-outsourcing',
    'ai-development-real-bottleneck',
    'no-more-throwaway-mvp',
    'ai-mvp-first-decisions',
    'why-space-gleam-builds-own-services'
]);

function response(statusCode, body, extraHeaders = {}) {
    return {
        statusCode,
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'X-Content-Type-Options': 'nosniff',
            ...extraHeaders
        },
        body: JSON.stringify(body)
    };
}

function isAllowedOrigin(origin) {
    if (origin === PRODUCTION_ORIGIN) return true;
    return /^http:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?$/.test(origin);
}

function isArticleReferrer(referrer, slug) {
    try {
        const url = new URL(referrer);
        const localHost = /^(?:localhost|127\.0\.0\.1)$/.test(url.hostname);
        if (url.origin !== PRODUCTION_ORIGIN && !localHost) return false;
        return url.pathname === `/blog/${slug}/`
            || url.pathname === `/blog/${slug}/index.html`;
    } catch (_) {
        return false;
    }
}

function japanDate() {
    return new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Tokyo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).format(new Date());
}

function positiveInteger(value) {
    const number = Number(value);
    return Number.isSafeInteger(number) && number > 0 ? number : 0;
}

function parseSlugs(value) {
    return [...new Set(String(value || '')
        .split(',')
        .map((slug) => slug.trim())
        .filter((slug) => SLUG_PATTERN.test(slug) && ALLOWED_SLUGS.has(slug)))]
        .slice(0, MAX_SLUGS);
}

function getStoreClient() {
    return getStore({ name: STORE_NAME, consistency: 'strong' });
}

async function readCount(store, slug) {
    const data = await store.get(`${COUNTER_PREFIX}${slug}`, { type: 'json' });
    return positiveInteger(data?.count);
}

async function incrementCount(store, slug) {
    const key = `${COUNTER_PREFIX}${slug}`;

    for (let attempt = 0; attempt < MAX_INCREMENT_RETRIES; attempt += 1) {
        const current = await store.getWithMetadata(key, { type: 'json' });
        const count = positiveInteger(current?.data?.count);
        const options = current?.etag
            ? { onlyIfMatch: current.etag }
            : { onlyIfNew: true };
        const result = await store.setJSON(key, {
            count: count + 1,
            updatedAt: new Date().toISOString()
        }, options);

        if (result.modified) return count + 1;
        await new Promise((resolve) => setTimeout(resolve, crypto.randomInt(20, 101)));
    }

    throw new Error('counter_update_conflict');
}

function clientFingerprint(event, slug, sessionId) {
    const headers = event.headers || {};
    const userAgent = String(headers['user-agent'] || headers['User-Agent'] || '').slice(0, 300);
    const ip = String(
        headers['x-nf-client-connection-ip']
        || headers['client-ip']
        || headers['x-forwarded-for']
        || ''
    ).split(',')[0].trim();
    const salt = process.env.BLOG_VIEW_SALT
        || process.env.SITE_ID
        || process.env.NETLIFY_SITE_ID
        || 'spacegleam-blog-view-v1';

    return crypto
        .createHmac('sha256', salt)
        .update(`${japanDate()}|${slug}|${sessionId}|${ip}|${userAgent}`)
        .digest('hex');
}

async function handleGet(event) {
    const slugs = parseSlugs(event.queryStringParameters?.slugs);
    if (!slugs.length) {
        return response(200, { counts: {}, countingMethod: 'deduplicated-session-views' }, {
            'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=3600'
        });
    }

    const store = getStoreClient();
    const pairs = await Promise.all(slugs.map(async (slug) => [slug, await readCount(store, slug)]));
    return response(200, {
        counts: Object.fromEntries(pairs),
        countingMethod: 'deduplicated-session-views'
    }, {
        'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=3600'
    });
}

async function handlePost(event) {
    const headers = event.headers || {};
    const origin = String(headers.origin || headers.Origin || '');
    const referrer = String(headers.referer || headers.Referer || '');
    const userAgent = String(headers['user-agent'] || headers['User-Agent'] || '');

    if (!isAllowedOrigin(origin)) {
        return response(403, { error: 'forbidden_origin' }, { 'Cache-Control': 'no-store' });
    }
    if (BOT_PATTERN.test(userAgent)) {
        return response(200, { counted: false, reason: 'automated_client' }, { 'Cache-Control': 'no-store' });
    }

    let body;
    try {
        body = JSON.parse(event.body || '{}');
    } catch (_) {
        return response(400, { error: 'invalid_json' }, { 'Cache-Control': 'no-store' });
    }

    const slug = String(body.slug || '').trim();
    const sessionId = String(body.sessionId || '').trim();
    if (!SLUG_PATTERN.test(slug) || !ALLOWED_SLUGS.has(slug) || !SESSION_PATTERN.test(sessionId)) {
        return response(400, { error: 'invalid_view' }, { 'Cache-Control': 'no-store' });
    }
    if (!isArticleReferrer(referrer, slug)) {
        return response(403, { error: 'invalid_referrer' }, { 'Cache-Control': 'no-store' });
    }

    const store = getStoreClient();
    const fingerprint = clientFingerprint(event, slug, sessionId);
    const seenKey = `${SEEN_PREFIX}${japanDate()}/${slug}/${fingerprint}`;
    const seen = await store.setJSON(seenKey, { recordedAt: new Date().toISOString() }, { onlyIfNew: true });

    if (!seen.modified) {
        return response(200, {
            counted: false,
            count: await readCount(store, slug),
            reason: 'already_counted'
        }, { 'Cache-Control': 'no-store' });
    }

    try {
        const count = await incrementCount(store, slug);
        return response(200, { counted: true, count }, { 'Cache-Control': 'no-store' });
    } catch (error) {
        await store.delete(seenKey).catch(() => {});
        throw error;
    }
}

exports.handler = async (event) => {
    if (event.httpMethod === 'OPTIONS') {
        return response(204, {}, {
            'Access-Control-Allow-Origin': PRODUCTION_ORIGIN,
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Cache-Control': 'no-store'
        });
    }

    try {
        if (event.httpMethod === 'GET') return await handleGet(event);
        if (event.httpMethod === 'POST') return await handlePost(event);
        return response(405, { error: 'method_not_allowed' }, {
            Allow: 'GET, POST, OPTIONS',
            'Cache-Control': 'no-store'
        });
    } catch (error) {
        console.error('blog_views_error', {
            message: error?.message || 'unknown',
            method: event.httpMethod
        });
        return response(503, { error: 'view_count_unavailable' }, {
            'Cache-Control': 'no-store',
            'Retry-After': '30'
        });
    }
};

exports.config = {
    path: '/api/blog-views',
    rateLimit: {
        windowLimit: 60,
        windowSize: 60,
        aggregateBy: ['ip', 'domain']
    }
};

exports._test = {
    incrementCount,
    isAllowedOrigin,
    isArticleReferrer,
    parseSlugs,
    positiveInteger
};
