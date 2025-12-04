/**
 * DEBUG VERSION - API Service with Extensive Logging
 * This version has comprehensive debug logging to track token flow
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

console.log('🔧 [API Service] Initialized with BASE_URL:', API_BASE_URL);

// ==================== TOKEN MANAGEMENT ====================

function getToken() {
    console.log('🔍 [getToken] Starting token retrieval...');

    if (typeof window === 'undefined') {
        console.log('⚠️ [getToken] Running on server-side, no token available');
        return null;
    }

    // Check all possible token locations
    const adminSession = localStorage.getItem('admin_session');
    const verifierSession = localStorage.getItem('verifier_session');
    const fallbackToken = localStorage.getItem('auth_token');

    console.log('📦 [getToken] Storage check:', {
        hasAdminSession: !!adminSession,
        hasVerifierSession: !!verifierSession,
        hasFallbackToken: !!fallbackToken
    });

    // Try admin session
    if (adminSession) {
        try {
            const adminData = JSON.parse(adminSession);
            console.log('✅ [getToken] Admin session parsed successfully');
            console.log('📄 [getToken] Admin data keys:', Object.keys(adminData));

            if (adminData.token) {
                console.log('🎫 [getToken] Token found in admin session');
                console.log('    - Token preview:', adminData.token.substring(0, 50) + '...');
                console.log('    - Token length:', adminData.token.length);
                console.log('    - Token type:', typeof adminData.token);
                return adminData.token;
            } else {
                console.warn('⚠️ [getToken] Admin session exists but NO token field');
            }
        } catch (e) {
            console.error('❌ [getToken] Failed to parse admin session:', e);
            localStorage.removeItem('admin_session');
        }
    }

    // Try verifier session
    if (verifierSession) {
        try {
            const verifierData = JSON.parse(verifierSession);
            console.log('✅ [getToken] Verifier session parsed successfully');
            console.log('📄 [getToken] Verifier data keys:', Object.keys(verifierData));

            if (verifierData.token) {
                console.log('🎫 [getToken] Token found in verifier session');
                console.log('    - Token preview:', verifierData.token.substring(0, 50) + '...');
                console.log('    - Token length:', verifierData.token.length);
                console.log('    - Token type:', typeof verifierData.token);
                console.log('    - Full session:', JSON.stringify(verifierData, null, 2));
                return verifierData.token;
            } else {
                console.warn('⚠️ [getToken] Verifier session exists but NO token field');
                console.log('    - Available fields:', Object.keys(verifierData));
            }
        } catch (e) {
            console.error('❌ [getToken] Failed to parse verifier session:', e);
            localStorage.removeItem('verifier_session');
        }
    }

    // Try fallback
    if (fallbackToken) {
        console.log('🎫 [getToken] Using fallback token (deprecated method)');
        console.log('    - Token preview:', fallbackToken.substring(0, 50) + '...');
        return fallbackToken;
    }

    console.error('❌ [getToken] NO TOKEN FOUND in any storage location');
    return null;
}

// ==================== API REQUEST ====================

async function apiRequest(endpoint, options = {}) {
    console.log('\n📡 [apiRequest] ==================== NEW REQUEST ====================');
    console.log('🎯 [apiRequest] Endpoint:', endpoint);
    console.log('⚙️ [apiRequest] Options:', JSON.stringify(options, null, 2));

    const token = getToken();

    console.log('🔐 [apiRequest] Token retrieval result:', {
        hasToken: !!token,
        tokenPreview: token ? token.substring(0, 50) + '...' : 'NULL',
        tokenLength: token ? token.length : 0
    });

    // Build headers
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    console.log('📋 [apiRequest] Initial headers:', Object.keys(headers));

    // Add Authorization header if token exists
    if (token) {
        headers.Authorization = `Bearer ${token}`;
        console.log('✅ [apiRequest] Authorization header ADDED');
        console.log('    - Header value:', `Bearer ${token.substring(0, 50)}...`);
        console.log('    - Full header length:', headers.Authorization.length);
    } else {
        console.error('❌ [apiRequest] NO TOKEN - Authorization header NOT added');
    }

    console.log('📋 [apiRequest] Final headers:', Object.keys(headers));
    console.log('🔍 [apiRequest] Headers detail:', JSON.stringify(headers, null, 2).substring(0, 500));

    const config = {
        ...options,
        headers
    };

    const url = `${API_BASE_URL}/api${endpoint}`;

    console.log('🌐 [apiRequest] Full URL:', url);
    console.log('📤 [apiRequest] Request method:', config.method || 'GET');
    console.log('📤 [apiRequest] Request config:', {
        method: config.method || 'GET',
        hasBody: !!config.body,
        headerKeys: Object.keys(config.headers),
        hasAuthHeader: !!config.headers.Authorization
    });

    try {
        console.log('⏳ [apiRequest] Sending request...');
        const response = await fetch(url, config);

        console.log('📥 [apiRequest] Response received:', {
            status: response.status,
            statusText: response.statusText,
            ok: response.ok,
            headers: Object.fromEntries(response.headers.entries())
        });

        // Handle 401 specially
        if (response.status === 401) {
            console.error('🚫 [apiRequest] 401 UNAUTHORIZED!');
            console.error('    - This means the backend rejected the token');
            console.error('    - Token sent:', token ? `Bearer ${token.substring(0, 50)}...` : 'NONE');

            // Try to get error details
            const errorText = await response.text();
            console.error('    - Backend error:', errorText);

            // Remove token and redirect
            localStorage.removeItem('verifier_session');
            localStorage.removeItem('admin_session');
            localStorage.removeItem('auth_token');

            if (typeof window !== 'undefined') {
                console.log('🔄 [apiRequest] Redirecting to /login');
                window.location.href = '/login';
            }

            throw new Error('Session expired. Please log in again.');
        }

        const text = await response.text();
        console.log('📄 [apiRequest] Response body (first 500 chars):', text.substring(0, 500));

        let parsed;
        try {
            parsed = text ? JSON.parse(text) : null;
            console.log('✅ [apiRequest] Response parsed as JSON');
        } catch {
            parsed = text;
            console.log('⚠️ [apiRequest] Response is plain text, not JSON');
        }

        if (!response.ok) {
            console.error('❌ [apiRequest] Request failed with status:', response.status);
            const msg = parsed?.message || parsed?.error || JSON.stringify(parsed) || `Request failed with status ${response.status}`;
            return { success: false, message: msg, data: parsed };
        }

        console.log('✅ [apiRequest] Request successful!');
        console.log('[apiRequest] ==================== END REQUEST ====================\n');

        if (parsed === null) {
            return { success: true, data: null };
        }

        if (typeof parsed === 'object') {
            if ('success' in parsed || 'data' in parsed || 'message' in parsed) {
                return parsed;
            }
            return { success: true, data: parsed };
        }

        return { success: true, data: parsed };

    } catch (error) {
        console.error('💥 [apiRequest] ERROR:', error);
        console.error('    - Error message:', error.message);
        console.error('    - Error stack:', error.stack);
        throw error;
    }
}

// ==================== VERIFICATION API ====================

const verificationAPI = {
    submitRequest: async (verificationData) => {
        console.log('\n🎯 [verificationAPI.submitRequest] Starting verification request');
        console.log('📦 [verificationAPI] Data:', JSON.stringify(verificationData, null, 2).substring(0, 300));

        const result = await apiRequest('/verify/request', {
            method: 'POST',
            body: JSON.stringify(verificationData),
        });

        console.log('✅ [verificationAPI.submitRequest] Result:', result);
        return result;
    }
};

// ==================== REPORT API ====================

const reportAPI = {
    generateReport: async (verificationId, sendEmail = false) => {
        console.log('\n📄 [reportAPI.generateReport] Generating report');
        console.log('    - verificationId:', verificationId);
        console.log('    - sendEmail:', sendEmail);

        return apiRequest('/reports/generate', {
            method: 'POST',
            body: JSON.stringify({ verificationId, sendEmail }),
        });
    }
};

// ==================== APPEAL API ====================

const appealAPI = {
    submitAppeal: async (appealData, file) => {
        console.log('\n📝 [appealAPI.submitAppeal] Submitting appeal');

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

        const parsed = await response.text().then(t => {
            try { return JSON.parse(t); } catch { return t; }
        });

        return response.ok ? parsed : { success: false, message: parsed.message || 'Failed to submit appeal' };
    }
};

// ==================== ERROR HANDLER ====================

const handleError = (error, showToast) => {
    console.error('💥 [handleError] Error:', error);

    let message = 'An unexpected error occurred. Please try again.';
    if (error?.message) {
        message = error.message;
    }

    if (showToast) {
        showToast(message, 'error');
    }

    return { success: false, message };
};

// ==================== AUTH API ====================

const authAPI = {
    login: async (email, password) => {
        console.log('\n🔐 [authAPI.login] Login attempt');
        console.log('📧 [authAPI] Email:', email);

        const result = await apiRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });

        if (result && result.data?.token) {
            console.log('✅ [authAPI.login] Token received, storing in localStorage');
            console.log('    - Token preview:', result.data.token.substring(0, 50) + '...');

            const sessionData = {
                ...result.data.verifier,
                token: result.data.token,
                userType: 'verifier'
            };

            localStorage.setItem('verifier_session', JSON.stringify(sessionData));
            console.log('💾 [authAPI.login] Session stored as verifier_session');
            console.log('📄 [authAPI.login] Session data:', JSON.stringify(sessionData, null, 2).substring(0, 500));
        }

        return result;
    },

    isAuthenticated: () => {
        const hasToken = !!getToken();
        console.log('🔍 [authAPI.isAuthenticated]:', hasToken);
        return hasToken;
    },

    getToken: () => {
        return getToken();
    }
};

// Export
export default {
    auth: authAPI,
    verification: verificationAPI,
};

export { reportAPI, appealAPI, handleError };

console.log('✅ [API Service] Exports configured');
