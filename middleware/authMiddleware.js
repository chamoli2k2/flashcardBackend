import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';

const protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Extract the token from the authorization header
            token = req.headers.authorization.split(' ')[1];

            // Decode the token using the JWT secret
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Find the user by decoded ID and exclude the password field
            req.user = await User.findById(decoded.id).select('-password');

            if (!req.user) {
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }

            // Proceed to the next middleware or route handler
            next();
        } catch (error) {
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    } else {
        // No token provided
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

export { protect };
