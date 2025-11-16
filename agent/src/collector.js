const { pingHealth } = require('./health_ping')

setInterval(() => {
    pingHealth({ backendUrl: process.env.BACKEND_URL || 'http://localhost:3000', deviceKey })
    .then(r => { })
    .catch(() => {});
}, 30000);