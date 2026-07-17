import crypto from 'node:crypto';
import { getStore } from '@netlify/blobs';

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

function json(status, body, extraHeaders = {}) {
    return new Response(status === 204 ? null : JSON.stringify(body), {
        status,
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'X-Content-Type-Options': 'nosniff',
            ...extraHeaders
        }
    });
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

function clientFingerprint(request, slug, sessionId) {
    const userAgent = String(request.headers.get('user-agent') || '').slice(0, 300);
    const ip = String(
        request.headers.get('x-nf-client-connection-ip')
        || request.headers.get('client-ip')
        || request.headers.get('x-forwarded-for')
        || ''
    ).split(',')[0].trim();
    const salt = Netlify.env.get('BLOG_VIEW_SALT')
        || Netlify.env.get('SITE_ID')
        || Netlify.env.get('NETLIFY_SITE_ID')
        || 'spacegleam-blog-view-v1';

    return crypto
        .createHmac('sha256', salt)
        .update(`${japanDate()}|${slug}|${sessionId}|${ip}|${userAgent}`)
        .digest('hex');
}

async function handleGet(request) {
    const slugs = parseSlugs(new URL(request.url).searchParams.get('slugs'));
    if (!slugs.length) {
        return json(200, { counts: {}, countingMethod: 'deduplicated-session-views' }, {
            'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=3600'
        });
    }

    const store = getStoreClient();
    const pairs = await Promise.all(slugs.map(async (slug) => [slug, await readCount(store, slug)]));
    return json(200, {
        counts: Object.fromEntries(pairs),
        countingMethod: 'deduplicated-session-views'
    }, {
        'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=3600'
    });
}

async function handlePost(request) {
    const origin = String(request.headers.get('origin') || '');
    const referrer = String(request.headers.get('referer') || '');
    const userAgent = String(request.headers.get('user-agent') || '');

    if (!isAllowedOrigin(origin)) {
        return json(403, { error: 'forbidden_origin' }, { 'Cache-Control': 'no-store' });
    }
    if (BOT_PATTERN.test(userAgent)) {
        return json(200, { counted: false, reason: 'automated_client' }, { 'Cache-Control': 'no-store' });
    }

    let body;
    try {
        body = await request.json();
    } catch (_) {
        return json(400, { error: 'invalid_json' }, { 'Cache-Control': 'no-store' });
    }

    const slug = String(body?.slug || '').trim();
    const sessionId = String(body?.sessionId || '').trim();
    if (!SLUG_PATTERN.test(slug) || !ALLOWED_SLUGS.has(slug) || !SESSION_PATTERN.test(sessionId)) {
        return json(400, { error: 'invalid_view' }, { 'Cache-Control': 'no-store' });
    }
    if (!isArticleReferrer(referrer, slug)) {
        return json(403, { error: 'invalid_referrer' }, { 'Cache-Control': 'no-store' });
    }

    const store = getStoreClient();
    const fingerprint = clientFingerprint(request, slug, sessionId);
    const seenKey = `${SEEN_PREFIX}${japanDate()}/${slug}/${fingerprint}`;
    const seen = await store.setJSON(seenKey, { recordedAt: new Date().toISOString() }, { onlyIfNew: true });

    if (!seen.modified) {
        return json(200, {
            counted: false,
            count: await readCount(store, slug),
            reason: 'already_counted'
        }, { 'Cache-Control': 'no-store' });
    }

    try {
        const count = await incrementCount(store, slug);
        return json(200, { counted: true, count }, { 'Cache-Control': 'no-store' });
    } catch (error) {
        await store.delete(seenKey).catch(() => {});
        throw error;
    }
}

export default async function handler(request) {
    if (request.method === 'OPTIONS') {
        return json(204, null, {
            'Access-Control-Allow-Origin': PRODUCTION_ORIGIN,
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Cache-Control': 'no-store'
        });
    }

    try {
        if (request.method === 'GET') return await handleGet(request);
        if (request.method === 'POST') return await handlePost(request);
        return json(405, { error: 'method_not_allowed' }, {
            Allow: 'GET, POST, OPTIONS',
            'Cache-Control': 'no-store'
        });
    } catch (error) {
        console.error('blog_views_error', {
            message: error?.message || 'unknown',
            method: request.method
        });
        return json(503, { error: 'view_count_unavailable' }, {
            'Cache-Control': 'no-store',
            'Retry-After': '30'
        });
    }
}

export const config = {
    path: '/api/blog-views',
    rateLimit: {
        windowLimit: 60,
        windowSize: 60,
        aggregateBy: ['ip', 'domain']
    }
};

export const testExports = {
    incrementCount,
    isAllowedOrigin,
    isArticleReferrer,
    parseSlugs,
    positiveInteger
};
