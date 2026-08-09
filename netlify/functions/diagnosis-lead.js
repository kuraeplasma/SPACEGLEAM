'use strict';

const { json, createLead } = require('./_spacegleam-core');

exports.handler = async (event) => {
    if (event.httpMethod === 'OPTIONS') return json(204, {});
    if (event.httpMethod !== 'POST') return json(405, { ok: false });

    try {
        const body = JSON.parse(event.body || '{}');
        const result = await createLead({
            name: body.name,
            company: body.company,
            email: body.email,
            projectType: body.patternName || body.pattern || 'AI開発診断',
            budgetRange: body.cost,
            deadline: body.period,
            message: `AI開発診断レポート希望\n診断タイプ: ${body.patternName || body.pattern || ''}\n回答: ${JSON.stringify(body.answersText || body.answers || [], null, 2)}\n資料URL: ${body.assetUrl || ''}`,
            diagnosisResult: {
                pattern: body.pattern,
                recommendedPlan: body.patternName,
                priceRange: body.cost,
                timeline: body.period,
                answers: body.answersText || body.answers
            },
            source: 'website-diagnosis'
        }, {
            source: 'website-diagnosis',
            ip: event.headers['x-nf-client-connection-ip'] || event.headers['client-ip'] || event.headers['x-forwarded-for']
        });
        return json(result.status === 'success' ? 200 : 400, { ok: result.status === 'success', attached: false, message: result.message });
    } catch (error) {
        return json(400, { ok: false, message: 'JSONの形式を確認してください。' });
    }
};
