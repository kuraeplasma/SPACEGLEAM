'use strict';

const crypto = require('crypto');
const { McpServer, createMcpHandler } = require('@modelcontextprotocol/server');
const z = require('zod/v4');
const {
    clean,
    runDiagnosis,
    searchServices,
    generateProjectBrief,
    getCompanyProfile,
    createLead,
    bearerAuthorized,
    mcpToolResult,
    getMcpResources,
    readMcpResource,
    getMcpPrompts,
    getMcpPrompt
} = require('./_spacegleam-core');

const SERVER_NAME = 'spacegleam-sales-mcp';
const SERVER_VERSION = '2.0.0';
const MODERN_PROTOCOL_VERSION = '2026-07-28';
const LEGACY_PROTOCOL_VERSION = '2025-03-26';
const SUPPORTED_PROTOCOL_VERSIONS = [MODERN_PROTOCOL_VERSION, '2025-11-25', '2025-06-18', LEGACY_PROTOCOL_VERSION];
const MAX_BODY_BYTES = 100000;
const LIST_CACHE_MS = 5 * 60 * 1000;
const RESOURCE_CACHE_MS = 60 * 1000;
const REQUEST_LIMIT = 120;
const REQUEST_WINDOW_MS = 10 * 60 * 1000;
const REQUEST_COUNTS = new Map();
const SERVER_INSTRUCTIONS = 'SPACE GLEAM株式会社の公開情報、サービス検索、AI開発無料診断、要件概要生成を提供します。見積は概算です。問い合わせ送信は、認証済みクライアントがユーザーの明示的同意を確認した場合に限ります。';

const fixedWebResources = [
    {
        uri: 'https://spacegleam.co.jp/blog/',
        name: 'SPACE GLEAM ブログ・お知らせ',
        description: 'SPACE GLEAMの公開ブログ記事とお知らせ一覧。Webサイトと同じ公開情報を取得します。',
        mimeType: 'text/html'
    },
    {
        uri: 'https://spacegleam.co.jp/faq',
        name: 'SPACE GLEAM よくある質問',
        description: '開発内容、費用、期間、運用、MCP対応などに関する公開FAQ。',
        mimeType: 'text/html'
    },
    {
        uri: 'https://spacegleam.co.jp/contact',
        name: 'SPACE GLEAM 問い合わせ方法',
        description: 'SPACE GLEAMへの公開問い合わせ方法と相談フォーム。',
        mimeType: 'text/html'
    }
];

const text = (max, description) => z.string().trim().min(1).max(max).describe(description);
const optionalText = (max, description) => z.string().trim().max(max).optional().describe(description);

const TOOL_DEFINITIONS = [
    {
        name: 'search_services',
        description: '相談内容、業界、目的に合うSPACE GLEAMの公開サービスを検索し、候補・料金目安・期間目安を返します。サービス選定や相談の初期段階で使用してください。問い合わせ送信は行いません。',
        inputSchema: z.object({
            query: text(500, '検索したい課題・要望（例: 問い合わせ対応をAIで効率化したい）'),
            industry: optionalText(120, '業界（例: 医療、建設、IT、不動産）'),
            goal: optionalText(300, '達成したい目的（例: 人手不足の解消、新規事業の検証）')
        }).strict(),
        annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
        handler: async (args) => mcpToolResult(searchServices({ ...args, source: 'mcp' }))
    },
    {
        name: 'run_diagnosis',
        description: '事業課題、目的、必要機能、予算、納期から、概算費用・推奨プラン・期間・リスク・前提条件・確認事項を返す無料診断です。結果は正式見積ではなく、問い合わせ送信も行いません。',
        inputSchema: z.object({
            businessType: optionalText(120, '事業者種別（例: 中小企業、スタートアップ、個人事業主）'),
            projectGoal: text(500, '開発目的・達成したいゴール'),
            projectType: optionalText(160, '希望する開発種別'),
            currentIssue: text(1000, '現状の課題や手作業の悩み'),
            requiredFeatures: z.array(text(120, '希望機能')).max(30).optional().describe('希望機能の一覧'),
            budgetRange: optionalText(120, '予算感（例: 50万円〜100万円）'),
            deadline: optionalText(120, '希望納期（例: 2ヶ月以内）'),
            memo: optionalText(1000, '補足情報')
        }).strict(),
        annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
        handler: async (args) => mcpToolResult(runDiagnosis({ ...args, source: 'mcp' }))
    },
    {
        name: 'generate_project_brief',
        description: '会話の要約から、SPACE GLEAMへの相談に使える目的・初期スコープ・前提条件・未確定事項を構造化します。診断後の要件整理に使用してください。問い合わせ送信は行いません。',
        inputSchema: z.object({
            conversationSummary: text(3000, 'これまでの相談内容・会話の要約'),
            projectType: optionalText(160, '想定する開発種別'),
            goals: z.array(text(200, '主要ゴール')).max(20).optional().describe('主要ゴールの一覧'),
            constraints: z.array(text(200, '制約条件')).max(20).optional().describe('予算・納期・技術などの制約条件')
        }).strict(),
        annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
        handler: async (args) => mcpToolResult(generateProjectBrief(args))
    },
    {
        name: 'create_lead',
        description: '認証済みクライアントからSPACE GLEAMへ開発相談を送信します。ユーザーが送信内容を確認して明示的に依頼した場合だけ使用し、consentConfirmedをtrueにしてください。dryRunでは検証のみ行い送信しません。',
        inputSchema: z.object({
            name: text(80, '相談者氏名'),
            company: optionalText(120, '会社名'),
            email: z.string().trim().email().max(160).describe('返信先メールアドレス'),
            phone: optionalText(60, '電話番号'),
            projectType: text(120, '相談種別'),
            budgetRange: optionalText(80, '予算感'),
            deadline: optionalText(80, '希望納期'),
            message: z.string().trim().min(5).max(3000).describe('相談内容（5〜3000文字）'),
            diagnosisResult: z.record(z.string(), z.unknown()).optional().describe('診断結果'),
            source: z.enum(['chatgpt', 'claude', 'mcp', 'website']).optional().describe('流入元'),
            consentConfirmed: z.literal(true).describe('ユーザーが送信内容を確認し、送信に明示的に同意した場合のみtrue'),
            dryRun: z.boolean().optional().describe('trueの場合は入力検証のみ行い、メールを送信しない')
        }).strict(),
        annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
        handler: null
    },
    {
        name: 'get_company_profile',
        description: 'SPACE GLEAM株式会社の公開会社概要、強み、対応領域、問い合わせ先、WebサイトURLを取得します。会社の適合性や連絡方法を確認するときに使用してください。',
        inputSchema: z.object({}).strict(),
        annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
        handler: async () => mcpToolResult({
            ...getCompanyProfile(),
            mainServices: ['AI開発', 'SaaS開発', 'Webサービス開発', '業務自動化', 'MCPサーバー開発']
        })
    }
];

function allResources() {
    return [...getMcpResources(), ...fixedWebResources];
}

function configuredOrigins() {
    const raw = process.env.MCP_ALLOWED_ORIGINS || process.env.ALLOWED_ORIGIN || 'https://spacegleam.co.jp';
    return raw.split(',').map((value) => value.trim()).filter(Boolean);
}

function header(event, name) {
    const headers = event.headers || {};
    return headers[name.toLowerCase()] || headers[name] || headers[Object.keys(headers).find((key) => key.toLowerCase() === name.toLowerCase())];
}

function corsHeaders(event) {
    const origin = header(event, 'origin');
    const allowed = configuredOrigins();
    const responseOrigin = origin && allowed.includes(origin) ? origin : allowed[0];
    return {
        ...(responseOrigin ? { 'Access-Control-Allow-Origin': responseOrigin } : {}),
        'Access-Control-Allow-Headers': 'Accept, Content-Type, Authorization, MCP-Protocol-Version, Mcp-Method, Mcp-Name, Mcp-Session-Id, Last-Event-ID',
        'Access-Control-Expose-Headers': 'MCP-Protocol-Version, Mcp-Session-Id',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Max-Age': '86400',
        'Vary': 'Origin',
        'X-Content-Type-Options': 'nosniff'
    };
}

function netlifyJson(event, statusCode, body, extraHeaders = {}) {
    return {
        statusCode,
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'no-store',
            ...corsHeaders(event),
            ...extraHeaders
        },
        body: body === undefined ? '' : JSON.stringify(body)
    };
}

function rpcError(id, code, message, data) {
    return { jsonrpc: '2.0', id, error: { code, message, ...(data === undefined ? {} : { data }) } };
}

function originAllowed(event) {
    const origin = header(event, 'origin');
    return !origin || configuredOrigins().includes(origin);
}

function clientIp(event) {
    return String(header(event, 'x-nf-client-connection-ip') || header(event, 'client-ip') || header(event, 'x-forwarded-for') || 'anonymous').split(',')[0].trim();
}

function withinRequestLimit(event) {
    const now = Date.now();
    const key = crypto.createHash('sha256').update(clientIp(event)).digest('hex');
    let record = REQUEST_COUNTS.get(key);
    if (!record || record.resetAt <= now) record = { count: 0, resetAt: now + REQUEST_WINDOW_MS };
    record.count += 1;
    REQUEST_COUNTS.set(key, record);
    if (REQUEST_COUNTS.size > 5000) {
        for (const [storedKey, stored] of REQUEST_COUNTS) {
            if (stored.resetAt <= now) REQUEST_COUNTS.delete(storedKey);
        }
    }
    return record.count <= REQUEST_LIMIT;
}

function isWriteAuthorized(event) {
    return Boolean(clean(process.env.MCP_AUTH_TOKEN, 240)) && bearerAuthorized(event, 'write');
}

function toolError(message) {
    return {
        content: [{ type: 'text', text: message }],
        structuredContent: { status: 'error', message },
        isError: true
    };
}

async function fetchFixedResource(resource) {
    const response = await fetch(resource.uri, {
        headers: { Accept: resource.mimeType },
        signal: AbortSignal.timeout(8000),
        redirect: 'error'
    });
    if (!response.ok) throw new Error('Public resource is temporarily unavailable');
    const body = await response.text();
    if (Buffer.byteLength(body, 'utf8') > 500000) throw new Error('Public resource exceeds the response size limit');
    return { contents: [{ uri: resource.uri, mimeType: resource.mimeType, text: body }] };
}

function buildServer(event) {
    const server = new McpServer(
        { name: SERVER_NAME, version: SERVER_VERSION, description: SERVER_INSTRUCTIONS },
        {
            instructions: SERVER_INSTRUCTIONS,
            supportedProtocolVersions: SUPPORTED_PROTOCOL_VERSIONS,
            cacheHints: {
                'server/discover': { ttlMs: LIST_CACHE_MS, cacheScope: 'public' },
                'tools/list': { ttlMs: LIST_CACHE_MS, cacheScope: 'public' },
                'resources/list': { ttlMs: LIST_CACHE_MS, cacheScope: 'public' },
                'prompts/list': { ttlMs: LIST_CACHE_MS, cacheScope: 'public' },
                'resources/read': { ttlMs: RESOURCE_CACHE_MS, cacheScope: 'public' }
            }
        }
    );

    for (const tool of TOOL_DEFINITIONS) {
        const handler = tool.name === 'create_lead'
            ? async (args) => {
                if (!isWriteAuthorized(event)) return toolError('create_lead requires a configured MCP_AUTH_TOKEN and a valid Authorization: Bearer token.');
                const result = await createLead({ ...args, source: args.source || 'mcp' }, { source: 'mcp', ip: clientIp(event) });
                const response = mcpToolResult(result);
                if (result.status === 'error') response.isError = true;
                return response;
            }
            : tool.handler;
        server.registerTool(tool.name, {
            description: tool.description,
            inputSchema: tool.inputSchema,
            annotations: tool.annotations
        }, handler);
    }

    for (const resource of getMcpResources()) {
        server.registerResource(resource.name, resource.uri, {
            description: resource.description,
            mimeType: resource.mimeType,
            cacheHint: { ttlMs: LIST_CACHE_MS, cacheScope: 'public' }
        }, async (uri) => ({
            contents: [{ uri: uri.href, mimeType: resource.mimeType, text: JSON.stringify(readMcpResource(uri.href), null, 2) }]
        }));
    }

    for (const resource of fixedWebResources) {
        server.registerResource(resource.name, resource.uri, {
            description: resource.description,
            mimeType: resource.mimeType,
            cacheHint: { ttlMs: RESOURCE_CACHE_MS, cacheScope: 'public' }
        }, async () => fetchFixedResource(resource));
    }

    for (const prompt of getMcpPrompts()) {
        const schema = prompt.name === 'ai-development-diagnosis'
            ? z.object({ currentIssue: text(400, '現在の課題や手作業の悩み'), budgetRange: optionalText(100, '予算感') }).strict()
            : z.object({ conversationSummary: text(1000, 'これまでの相談・会話要約') }).strict();
        server.registerPrompt(prompt.name, { description: prompt.description, argsSchema: schema }, async (args) => getMcpPrompt(prompt.name, args));
    }

    return server;
}

function bodyText(event) {
    if (!event.body) return '';
    return event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString('utf8') : event.body;
}

function requestUrl(event) {
    return event.rawUrl || `https://${header(event, 'host') || 'spacegleam.co.jp'}${event.path || '/api/mcp'}`;
}

function toWebRequest(event, rawBody) {
    const headers = new Headers();
    for (const [name, value] of Object.entries(event.headers || {})) {
        if (value !== undefined && value !== null) headers.set(name, String(value));
    }
    return new Request(requestUrl(event), {
        method: event.httpMethod,
        headers,
        ...(event.httpMethod === 'GET' || event.httpMethod === 'HEAD' ? {} : { body: rawBody })
    });
}

async function fromWebResponse(event, response) {
    const headers = {};
    response.headers.forEach((value, name) => { headers[name] = value; });
    const responseBody = response.body ? await response.text() : '';
    return { statusCode: response.status, headers: { ...headers, ...corsHeaders(event), 'Cache-Control': 'no-store' }, body: responseBody };
}

function publicToolDefinitions() {
    return TOOL_DEFINITIONS.map((tool) => ({
        name: tool.name,
        description: tool.description,
        inputSchema: z.toJSONSchema(tool.inputSchema, { target: 'draft-2020-12' }),
        annotations: tool.annotations
    }));
}

exports.handler = async (event) => {
    if (!originAllowed(event)) return netlifyJson(event, 403, rpcError(null, -32000, 'Forbidden: invalid Origin'));
    if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: corsHeaders(event), body: '' };

    if (event.httpMethod === 'GET') {
        return netlifyJson(event, 200, {
            name: SERVER_NAME,
            version: SERVER_VERSION,
            instructions: SERVER_INSTRUCTIONS,
            transport: 'streamable-http',
            protocolVersions: SUPPORTED_PROTOCOL_VERSIONS,
            modernProtocolVersion: MODERN_PROTOCOL_VERSION,
            legacyProtocolVersion: LEGACY_PROTOCOL_VERSION,
            stateless: true,
            endpoint: 'https://spacegleam.co.jp/api/mcp',
            sdk: '@modelcontextprotocol/server@2.0.0',
            tools: publicToolDefinitions(),
            resources: allResources(),
            prompts: getMcpPrompts()
        });
    }

    if (event.httpMethod !== 'POST') return netlifyJson(event, 405, rpcError(null, -32600, 'Method Not Allowed'), { Allow: 'GET, POST, OPTIONS' });
    if (!withinRequestLimit(event)) return netlifyJson(event, 429, rpcError(null, -32000, 'Too many requests'), { 'Retry-After': '600' });

    const rawBody = bodyText(event);
    if (Buffer.byteLength(rawBody, 'utf8') > MAX_BODY_BYTES) return netlifyJson(event, 413, rpcError(null, -32600, 'Payload size limit exceeded'));

    let parsedBody;
    try {
        parsedBody = JSON.parse(rawBody);
    } catch {
        return netlifyJson(event, 400, rpcError(null, -32700, 'Parse error'));
    }

    const envelopeVersion = parsedBody?.params?._meta?.['io.modelcontextprotocol/protocolVersion'];
    if (envelopeVersion === MODERN_PROTOCOL_VERSION && !header(event, 'mcp-protocol-version')) {
        return netlifyJson(event, 400, rpcError(parsedBody?.id ?? null, -32020, 'HeaderMismatch', { header: 'MCP-Protocol-Version', reason: 'missing' }));
    }

    try {
        const handler = createMcpHandler(() => buildServer(event), {
            legacy: 'stateless',
            onerror: (error) => console.error(JSON.stringify({
                timestamp: new Date().toISOString(), source: 'mcp', status: 'error', message: clean(error?.message || 'MCP handler error', 240)
            }))
        });
        const response = await handler.fetch(toWebRequest(event, rawBody), { parsedBody });
        return await fromWebResponse(event, response);
    } catch {
        return netlifyJson(event, 500, rpcError(parsedBody?.id ?? null, -32603, 'Internal error'));
    }
};
