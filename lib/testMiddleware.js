/**
 * Test Mode Middleware
 * Provides test mode bypass functionality for authentication and authorization
 */

// Test configuration constants
export const TEST_CONFIG = {
  TEST_MODE_TOKEN: 'TEST_BYPASS_2024!',
  ADMIN_BYPASS_TOKEN: 'ADMIN_TEST_BYPASS',
  VERIFIER_BYPASS_TOKEN: 'VERIFIER_TEST_BYPASS',
  TEST_ADMIN_USERNAME: 'testadmin',
  TEST_ADMIN_PASSWORD: 'TestAdmin@2024!',
  TEST_ADMIN_EMAIL: 'testadmin@verification.portal',
  TEST_VERIFIER_EMAIL: 'testverifier@company.test',
  TEST_VERIFIER_PASSWORD: 'TestVerifier@2024!'
};

/**
 * Check if request is using test mode bypass
 * @param {Object} req - Request object
 * @param {string} bypassToken - Optional bypass token to check
 * @returns {boolean} - True if test mode is active
 */
export function isTestMode(req, bypassToken = null) {
  // Check for test mode in headers
  const testModeHeader = req.headers['x-test-mode'];
  const bypassTokenHeader = req.headers['x-bypass-token'];
  
  // Check for test mode in body (for login routes)
  const bodyTestMode = req.body?.testMode;
  const bodyBypassToken = req.body?.bypassToken;
  
  // Check provided bypass token
  if (bypassToken) {
    return bypassToken === TEST_CONFIG.ADMIN_BYPASS_TOKEN || 
           bypassToken === TEST_CONFIG.VERIFIER_BYPASS_TOKEN ||
           bypassToken === TEST_CONFIG.TEST_MODE_TOKEN;
  }
  
  // Check various test mode indicators
  return testModeHeader === TEST_CONFIG.TEST_MODE_TOKEN ||
         bypassTokenHeader === TEST_CONFIG.ADMIN_BYPASS_TOKEN ||
         bypassTokenHeader === TEST_CONFIG.VERIFIER_BYPASS_TOKEN ||
         bodyTestMode === TEST_CONFIG.TEST_MODE_TOKEN ||
         bodyBypassToken === TEST_CONFIG.ADMIN_BYPASS_TOKEN ||
         bodyBypassToken === TEST_CONFIG.VERIFIER_BYPASS_TOKEN ||
         bodyBypassToken === TEST_CONFIG.TEST_MODE_TOKEN;
}

/**
 * Enhanced authentication middleware with test mode bypass
 */
export function authenticateWithTestBypass(req, res, next) {
  try {
    const token = extractTokenFromHeader(req);
    
    // Check for test mode bypass
    if (isTestMode(req) || (token && verifyTestToken(token))) {
      console.log('🧪 Test mode bypass activated for authentication');
      
      // Create test user context
      req.user = {
        id: 'test-user-id',
        email: 'test@example.com',
        testMode: true,
        bypassAllChecks: true,
        role: 'test'
      };
      
      return next();
    }
    
    // Normal authentication flow
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
 * Enhanced admin authentication middleware with test mode bypass
 */
export function authenticateAdminWithTestBypass(req, res, next) {
  try {
    const token = extractTokenFromHeader(req);
    
    // Check for test mode bypass
    if (isTestMode(req, token) || (token && verifyTestToken(token))) {
      console.log('🧪 Test mode bypass activated for admin authentication');
      
      // Create test admin context
      req.admin = {
        id: 'test-admin-id',
        username: TEST_CONFIG.TEST_ADMIN_USERNAME,
        email: TEST_CONFIG.TEST_ADMIN_EMAIL,
        fullName: 'Test Administrator',
        role: 'super_admin',
        permissions: [
          'view_appeals', 
          'manage_appeals', 
          'view_employees', 
          'manage_employees', 
          'send_emails', 
          'view_reports', 
          'manage_admins'
        ],
        testMode: true,
        bypassAllChecks: true
      };
      
      return next();
    }
    
    // Normal admin authentication flow
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
 * Enhanced verifier authentication middleware with test mode bypass
 */
export function authenticateVerifierWithTestBypass(req, res, next) {
  try {
    const token = extractTokenFromHeader(req);
    
    // Check for test mode bypass
    if (isTestMode(req, token) || (token && verifyTestToken(token))) {
      console.log('🧪 Test mode bypass activated for verifier authentication');
      
      // Create test verifier context
      req.verifier = {
        id: 'test-verifier-id',
        email: TEST_CONFIG.TEST_VERIFIER_EMAIL,
        companyName: 'Test Company Inc',
        testMode: true,
        bypassAllChecks: true,
        role: 'verifier'
      };
      
      return next();
    }
    
    // Normal verifier authentication flow
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

/**
 * Enhanced permission check with test mode bypass
 */
export function hasPermissionWithTestBypass(permission) {
  return (req, res, next) => {
    // Check for test mode bypass
    if (isTestMode(req) || req.admin?.testMode || req.admin?.bypassAllChecks) {
      console.log(`🧪 Test mode bypass activated for permission: ${permission}`);
      return next();
    }
    
    // Normal permission check
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
 * Verify test token (simplified for demo)
 */
function verifyTestToken(token) {
  try {
    // In a real implementation, you'd verify against a test token store
    // For demo purposes, we'll check if token contains test indicators
    return token.includes('test') || 
           token.includes('bypass') || 
           token.includes(TEST_CONFIG.TEST_MODE_TOKEN);
  } catch (error) {
    return false;
  }
}

/**
 * Extract token from Authorization header (copied from auth.js)
 */
function extractTokenFromHeader(req) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}

/**
 * Verify JWT token (copied from auth.js)
 */
function verifyToken(token) {
  try {
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
    
    return jwt.verify(token, JWT_SECRET, {
      issuer: 'employee-verification-portal',
      audience: 'verification-users'
    });
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

/**
 * Test mode data sanitizer - removes sensitive test data
 */
export function sanitizeTestData(data) {
  if (!data) return data;
  
  // Remove test mode indicators from responses unless explicitly allowed
  const sanitized = { ...data };
  
  // Only remove sensitive fields, keep testMode for UI indication
  if (sanitized.bypassAllChecks) {
    delete sanitized.bypassAllChecks;
  }
  if (sanitized.bypassToken) {
    delete sanitized.bypassToken;
  }
  
  return sanitized;
}

/**
 * Test mode response enhancer - adds test mode indicators to responses
 */
export function enhanceTestResponse(response, req) {
  if (isTestMode(req) || req.user?.testMode || req.admin?.testMode || req.verifier?.testMode) {
    return {
      ...response,
      testMode: true,
      testModeIndicators: {
        authenticationBypassed: true,
        restrictionsBypassed: true,
        testData: true
      }
    };
  }
  
  return response;
}