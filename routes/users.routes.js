const express = require('express');
const jwt = require('jsonwebtoken');

const UserRoute = (db, secretKey) => {
    const router = express.Router();

    //Login user
    router.post('/login', (req, res) => {
        const { email, password } = req.body;
        const user = db.prepare('SELECT * FROM USERS WHERE email=? AND password=?').get(email, password);

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user.id, username: user.nom, role: user.role }, secretKey, { expiresIn: '5m' });
        return res.status(200).json({ token });
    });

    return router;
};

module.exports = UserRoute;
