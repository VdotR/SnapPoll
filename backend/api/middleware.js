// Require user is logged in for a route
function checkSession(req, res, next) {
    if (req.session.userId) {
        return next();
    } else {
        return res.status(401).json({ error: 'Unauthorized' });
    }
}

module.exports = {
    checkSession
}