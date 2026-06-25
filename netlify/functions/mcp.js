'use strict';

const {
    COMPANY,
    json,
    runDiagnosis,
    searchServices,
    generateProjectBrief,
    createLead,
    bearerAuthorized,
    mcpToolResult
} = require('./_spacegleam-core');

const TOOLS = [
    {
        name: 'search_services',
        description: 'ユーザーの相談内容から、SPACE GLEAMの該当サービスを検索する。',
        inputSchema: { type: 'object', properties: { query: { type: 'string' }, industry: { type: 'string' }, goal: { type: 'string' } }, required: ['query'] }
    },
    {
        name: 'run_diagnosis',
        description: '既存の無料診断APIを呼び出し、相談内容に対する概算見積・推奨プラン・開発期間を返す。見積は概算であり確定金額ではない。',
        inputSchema: { type: 'object', properties: { businessType: { type: 'string' }, projectGoal: { type: 'string' }, projectType: { type: 'string' }, currentIssue: { type: 'string' }, requiredFeatures: { type: 'array', items: { type: 'string' } }, budgetRange: { type: 'string' }, deadline: { type: 'string' }, memo: { type: 'string' } }, required: ['projectGoal', 'currentIssue'] }
    },
    {
        name: 'generate_project_brief',
        description: 'ユーザーとの会話内容から、開発相談用の要件メモを生成する。',
        inputSchema: { type: 'object', properties: { conversationSummary: { type: 'string' }, projectType: { type: 'string' }, goals: { type: 'array', items: { type: 'string' } }, constraints: { type: 'array', items: { type: 'string' } } }, required: ['conversationSummary'] }
    },
    {
        name: 'create_lead',
        description: 'ユーザーが明示的に送信を希望し、送信内容を確認した場合のみ、整理した相談内容をSPACE GLEAMへ問い合わせとして送信する。送信前にユーザー確認が必要。',
        inputSchema: { type: 'object', properties: { name: { type: 'string' }, company: { type: 'string' }, email: { type: 'string' }, phone: { type: 'string' }, projectType: { type: 'string' }, budgetRange: { type: 'string' }, deadline: { type: 'string' }, message: { type: 'string' }, diagnosisResult: { type: 'object' }, source: { type: 'string', enum: ['chatgpt', 'claude', 'mcp', 'website'] }, consentConfirmed: { type: 'boolean', description: 'ユーザーが問い合わせ送信に明示的に同意し、送信内容を確認済みの場合のみtrue。' } }, required: ['name', 'email', 'projectType', 'message', 'source', 'consentConfirmed'] }
    },
    {
        name: 'get_company_profile',
        description: 'SPACE GLEAM株式会社の会社概要、対応領域、問い合わせ先、サイトURLを返す。',
        inputSchema: { type: 'object', properties: {} }
    }
];

function rpc(id, result) {
    return { jsonrpc: '2.0', id, result };
}

function rpcError(id, code, message) {
    return { jsonrpc: '2.0', id, error: { code, message } };
}

async function handleTool(name, args, event) {
    if (name === 'search_services') return mcpToolResult(searchServices({ ...args, source: 'mcp' }));
    if (name === 'run_diagnosis') return mcpToolResult(runDiagnosis({ ...args, source: 'mcp' }));
    if (name === 'generate_project_brief') return mcpToolResult(generateProjectBrief(args || {}));
    if (name === 'create_lead') {
        if (args?.consentConfirmed !== true) {
            return mcpToolResult({
                status: 'error',
                message: '問い合わせ送信には、ユーザーの明示的な同意と送信内容の確認が必要です。',
                nextStep: '送信内容をユーザーに確認し、同意を得てから再実行してください。'
            });
        }
        const result = await createLead({ ...(args || {}), source: args?.source || 'mcp' }, {
            source: 'mcp',
            ip: event.headers['x-nf-client-connection-ip'] || event.headers['client-ip'] || event.headers['x-forwarded-for']
        });
        return mcpToolResult(result);
    }
    if (name === 'get_company_profile') {
        return mcpToolResult({ ...COMPANY, mainServices: ['AI開発', 'SaaS開発', 'Webサービス開発', '業務自動化', 'MCPサーバー開発'] });
    }
    throw new Error(`Unknown tool: ${name}`);
}

exports.handler = async (event) => {
    if (event.httpMethod === 'OPTIONS') return json(204, {});
    if (!bearerAuthorized(event)) return json(401, { error: 'Unauthorized' }, { 'WWW-Authenticate': 'Bearer' });
    if (event.httpMethod === 'GET') {
        return json(200, {
            name: 'spacegleam-sales-mcp',
            instructions: 'SPACE GLEAM株式会社のAI開発、SaaS開発、Webサービス開発、業務自動化、MCP開発に関する相談を支援する。問い合わせ送信は必ずユーザーの明示的な同意後に行う。見積は概算として提示し、確定金額として扱わない。OpenAI APIやClaude APIを自社側で必須利用しない。',
            transport: 'streamable-http-json-rpc',
            tools: TOOLS
        });
    }
    if (event.httpMethod !== 'POST') return json(405, { error: 'Method Not Allowed' });

    try {
        const request = JSON.parse(event.body || '{}');
        const method = request.method;
        if (method === 'initialize') {
            return json(200, rpc(request.id, {
                protocolVersion: '2025-03-26',
                capabilities: { tools: {} },
                serverInfo: { name: 'spacegleam-sales-mcp', version: '0.1.0' },
                instructions: '問い合わせ送信はユーザーの明示的同意後のみ。見積は概算です。'
            }));
        }
        if (method === 'tools/list') {
            return json(200, rpc(request.id, { tools: TOOLS }));
        }
        if (method === 'tools/call') {
            const result = await handleTool(request.params?.name, request.params?.arguments || {}, event);
            return json(200, rpc(request.id, result));
        }
        return json(200, rpcError(request.id, -32601, 'Method not found'));
    } catch (error) {
        return json(200, rpcError(null, -32700, 'Parse error or tool execution failed'));
    }
};
