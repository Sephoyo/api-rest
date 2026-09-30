const jwt = require('jsonwebtoken');

const authenticateToken = (secretKey) => (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];//bearer toke 

    if (token == null) return res.sendStatus(401);//pas de token

    jwt.verify(token, secretKey, (err, user) => {
        if (err) return res.sendStatus(403);//token invalid

        req.user = user;
        next();
    });
};

module.exports = authenticateToken;