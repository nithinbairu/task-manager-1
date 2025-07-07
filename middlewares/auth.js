const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        console.log("Auth Middleware: No Authorization header found.");
        return res.status(403).json({ message: 'No token, authorization denied' });
    }
    if (!authHeader.startsWith('Bearer ')) {
        console.log("Auth Middleware: Token does not start with 'Bearer '.");
        return res.status(403).json({ message: 'Invalid token format. Must be Bearer <token>' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        req.user = decoded;
        next();
    } catch (error) { 
        console.error("Auth Middleware: Token verification failed:", error.message);
        res.status(403).json({ message: 'Invalid token' });
    }
};