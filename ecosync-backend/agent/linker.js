const os = require("os");
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const readline = require('readline');

const BACKEND = process.env.BACKEND_URL || 'http://localhost:7000';
const CONFIG_PATH = path.join(os.homedir(), '.ecosync', 'config.json');

function prompt(q) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    return new Promise(resolve => r.question(q, ans => { rl.close(); resolve(ans); }));
}

async function run() {
    console.log('EcoSync Agent - Device Linker');
    console.log('Paste the link token (or scan the QR and code token) .It expires quickly');
    const linkToken = await prompt(' linkToken: ');
    if(!linkToken) {console.log('token required'); process.exit(1); }

    // optinal device info
    const name = await prompt(' device name (optional): ');
    const osInfo = process.platform;
    const specs = { hostname: os.hostname() };

    try {
        const resp = await axios.post(`${BACKEND.replace(/\/$/, '')}/api/devices/link-complete`, {
            linkToken, 
            deviceInfo: { name: name || undefined, os: osInfo, specs }
        }, { timeout: 15000 });

        if(!resp.data || !resp.data.success) {
            console.error('link failed', resp.data);
            process.exit(1);
        }

        const { deviceId, deviceKey} = resp.data.data;
        // store locally
    const dir = path.dirname(CONFIG_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
    const config = { deviceId, deviceKey, createdAt: new Date().toISOString() };
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), { mode: 0o600 });
    console.log('Linked successfully. Saved config to', CONFIG_PATH);
    console.log('Keep your deviceKey safe. It authenticates this agent permanently until revoked.');
  } catch (err) {
    console.error('link error', err.response ? err.response.data : err.message);
    process.exit(1);
  }
}

if (require.main === module) run();