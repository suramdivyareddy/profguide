const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const authenticateAdmin = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.error('Token verification error:', err);
      return res.status(403).json({ error: 'Invalid token' });
    }
    
    // Check if user is admin
    db.get('SELECT is_admin FROM users WHERE id = ?', [user.userId], (err, row) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Server error' });
      }
      if (!row || !row.is_admin) {
        return res.status(403).json({ error: 'Admin access required' });
      }
      req.user = user;
      next();
    });
  });
};

module.exports = { authenticateAdmin, JWT_SECRET }; 