const axios = require("axios");


async function pingHealth({ backendUrl, deviceKey }){
    try {
        const url = `${backendUrl.replace(/\/$/, '')}/api/agents/health`;
        const res = await axios.post(url, { timestamp: new Date().toISOString() }, {
            headers: { Authorization: `Device ${deviceKey}`},
            timeout: 5000
        });
        return res.data;
    }catch(err) {
        return { error: err.message || 'ping failed' };
    }
}

module.exports = { pingHealth };

