'use strict';

const {
    COMPANY,
    json,
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

const TOOLS = [
    {
        name: 'search_services',
        description: 'SPACE GLEAMが提供するAI開発、SaaS開発、Webサービス開発、業務自動化、MCPサーバー開発、AI検索対応などから、ユーザーの課題・要望に最適なサービス領域を検索する。【いつ使うべきか】ユーザーから「AIで業務改善したい」「開発費用が知りたい」「どんなサービスがあるか」と問われた初期段階で呼び出す。',
        inputSchema: {
            type: 'object',
            properties: {
                query: { type: 'string', description: '検索クエリ・相談内容（例: 業務自動化、AIチャット、契約書比較）' },
                industry: { type: 'string', description: '業界（例: 医療、建設、IT、不動産）' },
                goal: { type: 'string', description: '目指すゴール（例: 人手不足解消、新規事業）' }
            },
            required: ['query']
        }
    },
    {
        name: 'run_diagnosis',
        description: 'ユーザーの事業課題、予算感、必要機能、希望納期を基にSPACE GLEAMの無料診断を実行し、概算費用、推奨プラン、想定期間、リスク、前提条件、確認項目を算出する。【いつ使うべきか】ユーザーから開発費用の目安、構築期間、推奨プランを相談されたときに呼び出す。※本ツールの実行自体では問い合わせメールは送信されない。',
        inputSchema: {
            type: 'object',
            properties: {
                businessType: { type: 'string', description: '事業者種別（例: 中小企業、スタートアップ、個人事業主）' },
                projectGoal: { type: 'string', description: '開発目的・ゴール（例: 問い合わせ自動化、MVP検証）' },
                projectType: { type: 'string', description: '希望開発種別（例: AI業務システム開発、SaaS開発、業務自動化）' },
                currentIssue: { type: 'string', description: '現状の課題や手作業の悩み（例: 問い合わせ対応が属人化している）' },
                requiredFeatures: { type: 'array', items: { type: 'string' }, description: '希望機能リスト（例: AI分類、管理画面、メール通知）' },
                budgetRange: { type: 'string', description: '予算感（例: 50万円〜100万円）' },
                deadline: { type: 'string', description: '希望納期（例: 2ヶ月以内）' },
                memo: { type: 'string', description: '補足メモ' }
            },
            required: ['projectGoal', 'currentIssue']
        }
    },
    {
        name: 'generate_project_brief',
        description: '会話内容や診断結果から、SPACE GLEAMへの相談用プロジェクト要件概要（Brief）を構造化して生成する。【いつ使うべきか】無料診断後に要件を整理し、ユーザーへ提出・確認してもらう段階で呼び出す。※本ツールの実行自体では問い合わせメールは送信されない。',
        inputSchema: {
            type: 'object',
            properties: {
                conversationSummary: { type: 'string', description: 'これまでの相談内容・会話の要約' },
                projectType: { type: 'string', description: '想定開発種別' },
                goals: { type: 'array', items: { type: 'string' }, description: '主要ゴール' },
                constraints: { type: 'array', items: { type: 'string' }, description: '制約条件（予算・納期等）' }
            },
            required: ['conversationSummary']
        }
    },
    {
        name: 'create_lead',
        description: '【要・ユーザー明示的同意】ユーザーが問い合わせ送信に明示的に同意し、送信内容を確認済みの場合にのみ、SPACE GLEAMへ開発相談・問い合わせを送信する。必ず consentConfirmed: true が必要。【いつ使うべきか】ユーザーが「問い合わせを送信してください」「相談を申し込む」と明示的に依頼した場合にのみ呼び出す。診断実行や要件生成だけで勝手に呼び出してはならない。テスト時は dryRun: true を使用可能。',
        inputSchema: {
            type: 'object',
            properties: {
                name: { type: 'string', description: '相談者氏名' },
                company: { type: 'string', description: '会社名（任意）' },
                email: { type: 'string', description: '相談者メールアドレス' },
                phone: { type: 'string', description: '電話番号（任意）' },
                projectType: { type: 'string', description: '相談種別' },
                budgetRange: { type: 'string', description: '予算感' },
                deadline: { type: 'string', description: '希望納期' },
                message: { type: 'string', description: '相談内容（5文字以上）' },
                diagnosisResult: { type: 'object', description: '診断結果オブジェクト（任意）' },
                source: { type: 'string', enum: ['chatgpt', 'claude', 'mcp', 'website'], description: '流入元' },
                consentConfirmed: { type: 'boolean', description: 'ユーザーが問い合わせ送信に明示的に同意し、送信内容を確認済みの場合にのみ true。' },
                dryRun: { type: 'boolean', description: 'テスト検証用（true の場合は実際にメール送信せずバリデーション結果のみ返却）' }
            },
            required: ['name', 'email', 'projectType', 'message', 'consentConfirmed']
        }
    },
    {
        name: 'get_company_profile',
        description: 'SPACE GLEAM株式会社の会社概要、対応領域、開発方針、強み、問い合わせ先、サイトURLを取得する。【いつ使うべきか】ユーザーから運営会社情報、開発会社の強み、コンプライアンス、相談対象企業かどうかを問われたときに呼び出す。',
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
                message: '問い合わせ送信には、ユーザーの明示的な同意（consentConfirmed: true）と送信内容の確認が必要です。勝手な自動送信は許可されていません。',
                nextStep: 'ユーザーに送信内容（氏名、メール、相談内容）を確認し、同意を得てから再実行してください。'
            });
        }
        const clientIp = event.headers?.['x-nf-client-connection-ip'] || event.headers?.['client-ip'] || event.headers?.['x-forwarded-for'] || 'mcp-client';
        const result = await createLead({ ...(args || {}), source: args?.source || 'mcp' }, { source: 'mcp', ip: clientIp });
        return mcpToolResult(result);
    }
    if (name === 'get_company_profile') {
        return mcpToolResult({ ...getCompanyProfile(), mainServices: ['AI開発', 'SaaS開発', 'Webサービス開発', '業務自動化', 'MCPサーバー開発'] });
    }
    throw new Error(`Unknown tool: ${name}`);
}

exports.handler = async (event) => {
    // 1. Handle CORS Preflight
    if (event.httpMethod === 'OPTIONS') return json(204, {});

    // 2. Authentication Check (READ operations are publicly accessible; write token is evaluated for admin mode)
    if (!bearerAuthorized(event, 'public_read')) {
        return json(401, { error: 'Unauthorized' }, { 'WWW-Authenticate': 'Bearer' });
    }

    // 3. GET Inspection / Discovery Endpoint
    if (event.httpMethod === 'GET') {
        return json(200, {
            name: 'spacegleam-sales-mcp',
            instructions: 'SPACE GLEAM株式会社のAI開発、SaaS開発、Webサービス開発、業務自動化、MCP開発に関する相談を支援するRemote MCP Server。問い合わせ送信（create_lead）は必ずユーザーの明示的な同意後のみ行う。見積は概算として提示し、確定金額として扱わない。',
            transport: 'streamable-http-json-rpc',
            protocolVersion: '2025-03-26',
            tools: TOOLS,
            resources: getMcpResources(),
            prompts: getMcpPrompts()
        });
    }

    if (event.httpMethod !== 'POST') return json(405, { error: 'Method Not Allowed' });

    // 4. Handle Streamable HTTP JSON-RPC 2.0 Request
    try {
        const bodyText = event.body || '{}';
        if (bodyText.length > 100000) {
            return json(400, rpcError(null, -32600, 'Payload size limit exceeded'));
        }
        const request = JSON.parse(bodyText);
        const method = request.method;
        const id = request.id ?? null;

        if (method === 'initialize') {
            return json(200, rpc(id, {
                protocolVersion: '2025-03-26',
                capabilities: {
                    tools: {},
                    resources: {},
                    prompts: {}
                },
                serverInfo: { name: 'spacegleam-sales-mcp', version: '1.0.0' },
                instructions: 'SPACE GLEAMのRemote MCP Serverへようこそ。サービス検索、AI開発無料診断、要件概要生成、問い合わせ送信に対応しています。問い合わせ送信はユーザー明示的同意後のみ実行してください。'
            }));
        }

        if (method === 'notifications/initialized' || method === 'ping') {
            return json(200, id !== null ? rpc(id, {}) : {});
        }

        if (method === 'tools/list') {
            return json(200, rpc(id, { tools: TOOLS }));
        }

        if (method === 'tools/call') {
            const toolName = request.params?.name;
            const toolArgs = request.params?.arguments || {};
            const result = await handleTool(toolName, toolArgs, event);
            return json(200, rpc(id, result));
        }

        if (method === 'resources/list') {
            return json(200, rpc(id, { resources: getMcpResources() }));
        }

        if (method === 'resources/read') {
            const uri = request.params?.uri;
            const data = readMcpResource(uri);
            return json(200, rpc(id, {
                contents: [{
                    uri,
                    mimeType: 'application/json',
                    text: JSON.stringify(data, null, 2)
                }]
            }));
        }

        if (method === 'prompts/list') {
            return json(200, rpc(id, { prompts: getMcpPrompts() }));
        }

        if (method === 'prompts/get') {
            const promptName = request.params?.name;
            const promptArgs = request.params?.arguments || {};
            const promptResult = getMcpPrompt(promptName, promptArgs);
            return json(200, rpc(id, promptResult));
        }

        return json(200, rpcError(id, -32601, `Method not found: ${method}`));
    } catch (error) {
        return json(200, rpcError(null, -32700, 'Parse error or execution failed'));
    }
};
