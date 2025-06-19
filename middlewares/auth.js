const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    // Check for authorization header (case-insensitive)
    const authHeader = req.headers.authorization;
    // console.log("Auth Middleware: Received Authorization header:", authHeader); // Log the raw header

    if (!authHeader) {
        console.log("Auth Middleware: No Authorization header found.");
        return res.status(403).json({ message: 'No token, authorization denied' });
    }

    // Check if the token starts with 'Bearer '
    if (!authHeader.startsWith('Bearer ')) {
        console.log("Auth Middleware: Token does not start with 'Bearer '.");
        return res.status(403).json({ message: 'Invalid token format. Must be Bearer <token>' });
    }

    // Extract the token value
    const token = authHeader.split(' ')[1];
    // console.log("Auth Middleware: Extracted token value:", token); // Log the extracted token

    // Log the JWT_SECRET being used by this middleware
    // console.log("Auth Middleware: JWT_SECRET used for verification:", process.env.JWT_SECRET);

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // console.log("Auth Middleware: Token decoded successfully:", decoded); // Log the decoded payload
        req.user = decoded; // Assign the decoded payload to req.user
        next();
    } catch (error) { // Catch the specific error object
        console.error("Auth Middleware: Token verification failed:", error.message); // Log the specific error message
        res.status(403).json({ message: 'Invalid token' });
    }
};