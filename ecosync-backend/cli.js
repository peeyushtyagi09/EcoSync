const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const CONFIG_PATH = path.join(os.homedir(), '.ecosync', 'config.json');

if(!fs.existsSync(CONFIG_PATH)){
    console.error('Config not found. Run device linking to get deviceKey first.');
    process.exit(1);
}

console.log('Starting collector. To stop: ctrl+c');
const child = spawn('node', ['src/sollector.js'], {stdio: 'inherit'});
child.on('exit', code => process.exit(code));