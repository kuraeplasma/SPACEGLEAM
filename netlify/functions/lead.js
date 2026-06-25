'use strict';

const { json, createLead } = require('./_spacegleam-core');

exports.handler = async (event) => {
    if (event.httpMethod === 'OPTIONS') return json(204, {});
    if (event.httpMethod !== 'POST') return json(405, { success: false, message: 'Method Not Allowed' });

    try {
        const body = JSON.parse(event.body || '{}');
        const result = await createLead(body, {
            source: body.source || 'api',
            ip: event.headers['x-nf-client-connection-ip'] || event.headers['client-ip'] || event.headers['x-forwarded-for']
        });
        return json(result.status === 'success' ? 200 : 400, result);
    } catch (error) {
        return json(400, { status: 'error', message: 'JSONの形式を確認してください。', nextStep: '入力内容を修正' });
    }
};
