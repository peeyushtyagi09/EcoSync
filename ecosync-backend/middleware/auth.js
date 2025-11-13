const { verifyAccessToken } = require("../utils/token");
const User = require("../models/User");

async function authMiddleware(req, res, next) {
    try {
        const header = req.header.authorization;
        if(!header || !header.startWith('Bearer ')){
            return res.status(401).json({ success: false, message: 'Unauthorized'});
        }

        const token = header.split(' ')[1];
        const payload = verifyAccessToken(token);

        const user = await User.findById(payload.sub).select('-passwordHash');
        if(!user || user.isDisabled) {
            return res.status(401).json({ success: false, message: 'Unauthorized'});
        }
        req.user = user;
        next()
    }catch (err) {
        if(err.name === 'TokenExpiredError'){
            return res.status(401).json({ success: false, message: 'Access token expired '});
        }
        return res.status(401).json({ success: false, message: 'Unauthorized '});
    }
}

module.exports = authMiddleware;