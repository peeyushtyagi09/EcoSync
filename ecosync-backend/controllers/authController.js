const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const User = require("../models/User");
const RefreshToken = require("../models/RefreshToken");
const {
    signAccessToken,
    createRefreshTokenForUser,
    rotateRefreshToken,
    revokeRefreshToken,
    hashToken
} = require("../utils/token");

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS  || '12', 10);
const REFRESH_COOKIE_NAME = 'ecosync_refresh';

function setRefreshCookie(res, token) {
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie(REFRESH_COOKIE_NAME, token, {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? 'strict' : 'lax',
        maxAge: parseInt(process.env.REFRESH_TOKEN_EXPIRES_DAYS || process.env.REFRESH_TOKEN_EXPIRES || '30', 10) * 24 * 60 * 60 * 1000
    });
}

function clearRefreshCookie(res) {
    res.clearCookie(REFRESH_COOKIE_NAME, { httpOnly: true });
}

async function register(req, res) {
    try {
        const errors = validationResult(req);
        if(!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array()});

        const { username, email, password } = req.body;
        const existing = await User.findOne({ $or: [{ username}, {email}] });
        if(existing) return res.status(400).json({ success: false, message: 'user already exists' });

        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
        const user = await User.create({ username, email, passwordHash });

        const accessToken = signAccessToken({ sub: user._id.toString(), username: user.username });
        const { token: refreshToken } = await createRefreshTokenForUser(user._id, req.ip);
        setRefreshCookie(res, refreshToken);

        res.status(201).json({
            success: true,
            data: {
                user: {id: user._id, username: user.username, email: user.email},
                accessToken
            }
        });
    }catch (err) {
        console.error('auth.register', err);
        res.status(500).json({ success: false, message: 'server error' });
    }
}


async function login(req, res) {
    try {
        const errors = validationResult(req);
        if(!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array()});

        const { username, email, password } = req.body;
        const user = await User.findOne(email ? { email } : { username });
        if(!user) return res.status(401).json({ success: false, message: 'Invalid credentials '});

        const verified = await bcrypt.compare(password, user.passwordHash);
        if(!verified) return res.status(401).json({ success: false, mesaage: 'Invalid credentials '});

        const accessToken = signAccessToken({ sub: user._id.toString(), username: user.username});
        const { token: refreshToken } = await createRefreshTokenForUser(user._id, req.ip);
        setRefreshCookie(res, refreshToken);

        res.json({ 
            success: true, 
            data: {
                user: { id: user._id, username: user.username, email: user.email, walletAddress: user.walletAddress},
                accessToken
            }
        });
    }catch (err) {
        console.error('auth.login', err);
        res.status(500).json({ success: false, message: 'server error '});
    }
} 

async function refreshToken(req, res) {
    try {
      console.log("Cookies received:", req.cookies);
  
      const token = req.cookies && req.cookies[REFRESH_COOKIE_NAME];
      console.log("Token from cookie:", token ? token.slice(0, 25) + "..." : "none");
  
      if (!token) {
        return res.status(401).json({ success: false, message: 'refresh token missing' });
      }
  
      const tokenHash = hashToken(token);
      console.log("Token hash:", tokenHash);
  
      const existing = await RefreshToken.findOne({ tokenHash }).populate('userId');
      console.log("Found token doc:", existing ? existing._id : "not found");
  
      if (!existing || !existing.isActive()) {
        return res.status(401).json({ success: false, message: 'invalid refresh token' });
      }
  
      const { token: newRefreshToken } = await rotateRefreshToken(token, existing.userId._id, req.ip);
      console.log("New refresh token issued");
  
      const accessToken = signAccessToken({
        sub: existing.userId._id.toString(),
        username: existing.userId.username
      });
  
      setRefreshCookie(res, newRefreshToken);
  
      res.json({
        success: true,
        data: {
          accessToken,
          user: {
            id: existing.userId._id,
            username: existing.userId.username,
            email: existing.userId.email
          }
        }
      });
    } catch (err) {
      console.error('auth.refresh error details:', err);
      res.status(500).json({ success: false, message: 'server error' });
    }
  }
  
async function logout(req, res) {
    try {
        const token = req.cookie && req.cookies[REFRESH_COOKIE_NAME];
        if(token){
            await revokeRefreshToken(token);
            clearRefreshCookie(res);
        }
        res.json({ success: true, message: 'logged out'});
    }catch (err) {
        console.error('auth.logout', err);
        res.status(500).json({ success: false, message: 'server error' });
    }
}

module.exports = {
    register,
    login,
    refreshToken,
    logout
}