const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// ENV VARIABLE
const LINK_TOKEN_SECRET = process.env.LINK_TOKEN_SECRET || (process.env.JWT_SECRET || 'changeme') + '_link';
const LINK_TOKEN_EXPIRES = process.env.LINK_TOKEN_EXPIRES || '3m'; 

function signLinkToken(payload, jti) {
    return jwt.sign(payload, LINK_TOKEN_SECRET, { expiresIn: LINK_TOKEN_EXPIRES, jwtid: jti });
}

function verifyLinkToken(token){
    return jwt.verify(token, LINK_TOKEN_SECRET);
}

function generateJti() {
    return crypto.randomBytes(16).toString('hex');
}


function generateDeviceKey() {
    // return a safe random device key for agent storage (plain)
    return 'EC-DEV-' + crypto.randomBytes(32).toString('hex'); // 64 hex chars + prefix
}
  
function hashDeviceKey(deviceKey) {
    return crypto.createHash('sha256').update(deviceKey).digest('hex');
}
module.exports = {
    signLinkToken,
    verifyLinkToken,
    generateJti,
    generateDeviceKey,
    hashDeviceKey
}