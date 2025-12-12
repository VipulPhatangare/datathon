/**
 * Authentication middleware
 * Checks if user is authenticated via session
 */
export const requireAuth = (req, res, next) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ 
      error: 'Authentication required. Please log in.' 
    });
  }
  next();
};

/**
 * Admin authorization middleware
 * Checks if authenticated user has admin role
 */
export const requireAdmin = (req, res, next) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ 
      error: 'Authentication required. Please log in.' 
    });
  }
  
  if (req.session.user.role !== 'admin') {
    return res.status(403).json({ 
      error: 'Access denied. Admin privileges required.' 
    });
  }
  
  next();
};
