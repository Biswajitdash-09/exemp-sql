/**
 * API Service Layer
 * Handles all communication with backend API endpoints
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

// Store token in localStorage for client-side persistence
const getToken = () => {
  if (typeof window !== 'undefined') {
    // Try to get token from session storage based on user type
    const adminSession = localStorage.getItem('admin_session');
    const verifierSession = localStorage.getItem('verifier_session');

    console.log('[getToken] Checking sessions:', {
      hasAdminSession: !!adminSession,
      hasVerifierSession: !!verifierSession
    });

    if (adminSession) {
      try {
        const adminData = JSON.parse(adminSession);
        console.log('[getToken] Admin session parsed:', {
          hasToken: !!adminData.token,
          tokenPreview: adminData.token ? adminData.token.substring(0, 20) + '...' : 'none'
        });
        if (adminData.token) {
          return adminData.token;
        }
      } catch (e) {
        console.error('[getToken] Failed to parse admin session:', e);
        // Remove corrupted session
        localStorage.removeItem('admin_session');
      }
    }

    if (verifierSession) {
      try {
        const verifierData = JSON.parse(verifierSession);
        console.log('[getToken] Verifier session parsed:', {
          hasToken: !!verifierData.token,
          tokenPreview: verifierData.token ? verifierData.token.substring(0, 20) + '...' : 'none'
        });
        if (verifierData.token) {
          return verifierData.token;
        }
      } catch (e) {
        console.error('[getToken] Failed to parse verifier session:', e);
        // Remove corrupted session
        localStorage.removeItem('verifier_session');
      }
    }

    // Fallback to old token method
    const fallbackToken = localStorage.getItem('auth_token');
    if (fallbackToken) {
      console.log('[getToken] Using fallback token');
      return fallbackToken;
    }

    console.log('[getToken] No token found in any storage');
  }
  return null;
};

const setToken = (token) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('auth_token', token);
  }
};

const removeToken = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('admin_session');
    localStorage.removeItem('verifier_session');
  }
};

// Helper to safely parse JSON or text from response
async function parseResponseSafely(response) {
  const text = await response.text().catch(() => '');
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    // not JSON — return raw text
    return text;
  }
}

// Generic API request function (more forgiving on non-2xx responses)
async function apiRequest(endpoint, options = {}) {
  const token = getToken();

  console.log(`API Request to ${endpoint}:`, {
    hasToken: !!token,
    tokenPreview: token ? `${token.substring(0, 20)}...` : 'none',
    endpoint
  });

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  // Add authorization header if token exists
  if (token) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    };
    console.log('[apiRequest] Authorization header set:', {
      header: `Bearer ${token.substring(0, 20)}...`,
      headerExists: !!config.headers.Authorization
    });
  } else {
    console.log('[apiRequest] NO TOKEN - Authorization header NOT set');
  }

  const url = `${API_BASE_URL}/api${endpoint}`;

  console.log('[apiRequest] Final request config:', {
    url,
    method: config.method || 'GET',
    hasAuthHeader: !!config.headers.Authorization,
    headers: Object.keys(config.headers)
  });

  try {
    const response = await fetch(url, config);

    console.log(`API Response from ${endpoint}:`, {
      status: response.status,
      ok: response.ok
    });

    // If unauthorized — remove token and redirect to login
    if (response.status === 401) {
      console.error('401 Unauthorized - token may be invalid or expired');
      removeToken();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      throw new Error('Session expired. Please log in again.');
    }

    // Try to parse response body (JSON or text)
    const parsed = await parseResponseSafely(response);

    if (!response.ok) {
      // If parsed is an object with a message field, return structured error
      if (parsed && typeof parsed === 'object') {
        const msg = parsed.message || parsed.error || JSON.stringify(parsed);
        return { success: false, message: msg, data: parsed };
      }

      // If parsed is text, return it as message
      if (typeof parsed === 'string' && parsed.trim().length > 0) {
        return { success: false, message: parsed };
      }

      // Fallback to generic message
      return { success: false, message: `Request failed with status ${response.status}` };
    }

    // response.ok === true
    // If parsed is null (no content), return a safe success object
    if (parsed === null) {
      return { success: true, data: null };
    }

    // If parsed is already an object (and maybe contains success/data), return as-is
    if (typeof parsed === 'object') {
      // normalize to { success, data, message } shape if possible
      if ('success' in parsed || 'data' in parsed || 'message' in parsed) {
        return parsed;
      }
      return { success: true, data: parsed };
    }

    // If parsed is a plain string body
    return { success: true, data: parsed };
  } catch (error) {
    // Network error or thrown above (e.g., 401 already thrown)
    console.error('API Request Error:', error);
    // Rethrow so callers can handle network/exception cases
    throw error;
  }
}

// Authentication API
const authAPI = {
  // Register new verifier
  register: async (companyName, email, password) => {
    const data = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ companyName, email, password }),
    });

    // If apiRequest returned a structured failure, propagate it (don't throw)
    if (data && data.success === false) {
      return data;
    }

    // Normal success shape — store token if present
    if (data && data.data?.token) {
      setToken(data.data.token);
    }

    return data;
  },

  // Login verifier
  login: async (email, password) => {
    const data = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (data && data.data?.token) {
      setToken(data.data.token);
    }

    return data;
  },

  // Admin login
  adminLogin: async (username, password) => {
    const data = await apiRequest('/admin/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });

    if (data && data.data?.token) {
      setToken(data.data.token);
    }

    return data;
  },

  // Get current user profile
  getProfile: async () => {
    return authRequest('/auth/me');
  },

  // Logout
  logout: () => {
    removeToken();
    // Optionally call logout endpoint if available
    return Promise.resolve();
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return !!getToken();
  },

  // Get current token
  getToken: () => {
    return getToken();
  }
};

// Verification API
const verificationAPI = {
  // Submit verification request
  submitRequest: async (verificationData) => {
    return apiRequest('/verify/request', {
      method: 'POST',
      body: JSON.stringify(verificationData),
    });
  },

  // Get verification history
  getHistory: async (page = 1, limit = 10) => {
    return apiRequest(`/verify/request?page=${page}&limit=${limit}`);
  },

  // Get verification details by ID
  getVerificationDetails: async (verificationId) => {
    return apiRequest(`/verify/request?id=${verificationId}`);
  },
};

// Appeal API
const appealAPI = {
  // Submit appeal with file upload
  submitAppeal: async (appealData, file) => {
    const token = getToken();

    const formData = new FormData();
    formData.append('verificationId', appealData.verificationId);
    formData.append('comments', appealData.comments);
    if (file) {
      formData.append('supportingDocument', file);
    }

    const response = await fetch(`${API_BASE_URL}/api/appeals`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const parsed = await parseResponseSafely(response);
      if (parsed && typeof parsed === 'object') {
        return { success: false, message: parsed.message || JSON.stringify(parsed), data: parsed };
      }
      if (typeof parsed === 'string') {
        return { success: false, message: parsed };
      }
      return { success: false, message: 'Failed to submit appeal' };
    }

    const parsed = await parseResponseSafely(response);
    return parsed && typeof parsed === 'object' ? parsed : { success: true, data: parsed };
  },

  // Get appeals (admin)
  getAppeals: async (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    return apiRequest(`/appeals${params ? `?${params}` : ''}`);
  },

  // Get appeal details
  getAppeal: async (appealId) => {
    return apiRequest(`/admin/appeals/${appealId}/respond`);
  },

  // Respond to appeal (admin)
  respondToAppeal: async (appealId, status, hrResponse) => {
    return apiRequest(`/admin/appeals/${appealId}/respond`, {
      method: 'POST',
      body: JSON.stringify({ status, hrResponse }),
    });
  },
};

// Report API
const reportAPI = {
  // Generate PDF report
  generateReport: async (verificationId, sendEmail = false) => {
    return apiRequest('/reports/generate', {
      method: 'POST',
      body: JSON.stringify({ verificationId, sendEmail }),
    });
  },

  // Get existing report
  getReport: async (verificationId) => {
    const params = new URLSearchParams({ verificationId }).toString();
    return apiRequest(`/reports/generate?${params}`);
  },
};

// Admin Dashboard API
const dashboardAPI = {
  // Get dashboard statistics
  getStats: async () => {
    return apiRequest('/admin/dashboard');
  },
};

// Employee API (admin)
const employeeAPI = {
  // Get all employees
  getEmployees: async (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    return apiRequest(`/admin/employees${params ? `?${params}` : ''}`);
  },

  // Add/update employee
  updateEmployee: async (employeeId, employeeData) => {
    return apiRequest(`/admin/employees${employeeId ? `/${employeeId}` : ''}`, {
      method: employeeId ? 'PUT' : 'POST',
      body: JSON.stringify(employeeData),
    });
  },
};

// Utility function for authenticated requests
async function authRequest(endpoint, options = {}) {
  if (!authAPI.isAuthenticated()) {
    throw new Error('Not authenticated');
  }
  return apiRequest(endpoint, options);
}

// Error handling wrapper
const handleAPIError = (error, showToast) => {
  console.error('API Error:', error);

  let message = 'An unexpected error occurred. Please try again.';

  if (error && error.message) {
    message = error.message;
  } else if (typeof error === 'string') {
    message = error;
  } else if (error && typeof error === 'object' && 'message' in error) {
    message = error.message;
  }

  if (showToast) {
    showToast(message, 'error');
  } else {
    // Fallback to console if no toast function provided
    console.error(message);
  }

  return { success: false, message };
};

// Export for use in components
export default {
  auth: authAPI,
  verification: verificationAPI,
  appeal: appealAPI,
  report: reportAPI,
  dashboard: dashboardAPI,
  employee: employeeAPI,
  handleError: handleAPIError,
};

// Also export named exports for convenience
export {
  appealAPI,
  reportAPI,
  dashboardAPI,
  employeeAPI,
  handleAPIError as handleError,
};
