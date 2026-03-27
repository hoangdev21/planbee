const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    try {
        const token = req.cookies.token || (req.headers.authorization && req.headers.authorization.split(' ')[1]);

        if (!token || token === 'null' || token === 'undefined') {
            return res.status(401).json({ message: 'Không có quyền truy cập.' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        req.user = decoded;
        next();
    } catch (error) {
        console.error('Auth check error:', error);
        res.status(401).json({ message: 'Lỗi xác thực.' });
    }
};

module.exports = authMiddleware;
