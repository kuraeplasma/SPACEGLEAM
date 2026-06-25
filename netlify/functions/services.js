'use strict';

const { json, getServices, logEvent } = require('./_spacegleam-core');

exports.handler = async (event) => {
    if (event.httpMethod === 'OPTIONS') return json(204, {});
    if (event.httpMethod !== 'GET') return json(405, { success: false, message: 'Method Not Allowed' });
    logEvent('get_services', 'success', { source: 'api' });
    return json(200, getServices());
};
