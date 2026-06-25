'use strict';

const { json, runDiagnosis } = require('./_spacegleam-core');

exports.handler = async (event) => {
    if (event.httpMethod === 'OPTIONS') return json(204, {});
    if (event.httpMethod !== 'POST') return json(405, { success: false, message: 'Method Not Allowed' });

    try {
        const body = JSON.parse(event.body || '{}');
        return json(200, runDiagnosis({ ...body, source: body.source || 'api' }));
    } catch (error) {
        return json(400, { success: false, message: 'JSONの形式を確認してください。' });
    }
};
