import jwt from 'jsonwebtoken';

// JWT Secret - MUST be set in production environment
const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV === 'development' ? 'dev-secret-key-change-in-production' : null);
const JWT_EXPIRES_IN = '7d';

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required in production');
}

/**
 * Generate JWT token for user
 * @param {Object} payload - User data to encode
 * @returns {String} JWT token
 */
export function generateToken(payload) {
  const token = jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'employee-verification-portal',
    audience: 'verification-users'
  });
  return token;
}

/**
 * Verify JWT token
 * @param {String} token - JWT token to verify
 * @returns {Object} Decoded payload
 */
export function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'employee-verification-portal',
      audience: 'verification-users'
    });
    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

/**
 * Extract token from Authorization header
 * Works with both Express-style and Next.js App Router requests
 * @param {Object} req - Request object (Express or Next.js)
 * @returns {String|null} JWT token or null
 */
export function extractTokenFromHeader(req) {
  let authHeader;

  // Check if it's a Next.js App Router Request (Web API)
  if (req.headers && typeof req.headers.get === 'function') {
    authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
  }
  // Check if it's Express-style request
  else if (req.headers && typeof req.headers === 'object') {
    authHeader = req.headers.authorization || req.headers.Authorization;
  } else {
    return null;
  }

  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  return null;
}

/**
 * Authentication middleware for API routes
 */
export function authenticate(req, res, next) {
  try {
    const token = extractTokenFromHeader(req);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token is required'
      });
    }

    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: error.message || 'Invalid authentication'
    });
  }
}

/**
 * Admin authentication middleware
 */
export function authenticateAdmin(req, res, next) {
  try {
    const token = extractTokenFromHeader(req);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token is required'
      });
    }

    const decoded = verifyToken(token);

    if (decoded.role !== 'admin' && decoded.role !== 'hr_manager' && decoded.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    req.admin = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: error.message || 'Invalid authentication'
    });
  }
}

/**
 * Check if user has specific permission (for admins)
 */
export function hasPermission(permission) {
  return (req, res, next) => {
    if (!req.admin || !req.admin.permissions) {
      return res.status(403).json({
        success: false,
        message: 'Permission denied'
      });
    }

    if (!req.admin.permissions.includes(permission)) {
      return res.status(403).json({
        success: false,
        message: `Permission ${permission} required`
      });
    }

    next();
  };
}

/**
 * Verifier authentication middleware
 */
export function authenticateVerifier(req, res, next) {
  try {
    const token = extractTokenFromHeader(req);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token is required'
      });
    }

    const decoded = verifyToken(token);

    if (decoded.role !== 'verifier') {
      return res.status(403).json({
        success: false,
        message: 'Verifier access required'
      });
    }

    req.verifier = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: error.message || 'Invalid authentication'
    });
  }
}