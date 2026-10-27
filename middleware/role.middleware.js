//Vérifie que l'utilisateur connecté a un des rôles autorisés
const authorizeRoles = (...roles) => (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
        return res.status(403).json({ message: 'Access denied' });
    }
    next();
};

module.exports = authorizeRoles;
