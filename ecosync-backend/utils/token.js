const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const RefreshToken = require('../models/RefreshToken');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES = process.env.JWT_EXPIRES_IN || '15m';
const REFRESH_TOKEN_EXPIRES_DAYS = parseInt(process.env.REFRESH_TOKEN_EXPIRES_DAYS || process.env.REFRESH_TOKEN_EXPIRES || '30', 10);

function signAccessToken(payload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

function verifyAccessToken(token) {
    return jwt.verify(token, JWT_SECRET)
}

function generateRefreshTokenString() {
    return crypto.randomBytes(64).toString('hex');
}

function hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
}

async function createRefreshTokenForUser(userId, ip){
    const token = generateRefreshTokenString();
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 *60 * 1000);

    const doc = await RefreshToken.create({
        userId, 
        tokenHash, 
        expiresAt, 
        createdByIp: ip
    });

    return { token, doc };
}

async function rotateRefreshToken(oldToken, userId, ip){
    const oldHash = hashToken(oldToken);
    const existing = await RefreshToken.findOne({ tokenHash: oldHash, userId });

    if(!existing || !existing.isActive()){
        throw new Error('Invalid refresh token');
    }

    // revoke old and create new
    existing.revokedAt = new Date();
    existing.revokedByIp = ip;

    const { token: newToken, doc: newDoc } = await createRefreshTokenForUser(userId, ip);
    existing.replacedByTokenHash = hashToken(newToken);
  
    await existing.save();
    return { newToken, newDoc };
  }
  
  async function revokeRefreshToken(token) {
    const hash = hashToken(token);
    const doc = await RefreshToken.findOne({ tokenHash: hash });
    if (!doc) return false;
    doc.revokedAt = new Date();
    await doc.save();
    return true;
  }
  
  module.exports = {
    signAccessToken,
    verifyAccessToken,
    generateRefreshTokenString,
    createRefreshTokenForUser,
    hashToken,
    rotateRefreshToken,
    revokeRefreshToken
  };