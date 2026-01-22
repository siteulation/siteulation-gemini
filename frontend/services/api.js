import { BACKEND_URL } from '../constants.js';

const TOKEN_KEY = 'siteulation_auth_token';

async function handleResponse(response) {
  const contentType = response.headers.get('content-type');
  
  if (contentType && contentType.includes('application/json')) {
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || data.msg || data.error_description || 'Request failed');
    }
    return data;
  } else {
    // Non-JSON response (likely HTML error page from a crash or 404)
    const text = await response.text();
    // Try to extract a meaningful message if it's standard HTML
    let errorMsg = `Server Error (${response.status})`;
    if (response.status === 404) errorMsg = "Endpoint not found (404)";
    if (response.status === 500) errorMsg = "Internal Server Error (500) - Check backend console";
    
    console.error("Non-JSON Response detected:", text);
    throw new Error(errorMsg);
  }
}

export const api = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  
  setToken: (token) => {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  },

  request: async (endpoint, options = {}) => {
    const token = localStorage.getItem(TOKEN_KEY);
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${BACKEND_URL}${endpoint}`, {
        ...options,
        headers,
      });

      if (response.status === 401) {
        localStorage.removeItem(TOKEN_KEY);
        // Optional: redirect to auth
      }

      return handleResponse(response);
    } catch (e) {
      console.error("API Request failed:", e);
      // Re-throw so UI can handle it
      throw e; 
    }
  },

  auth: {
    signIn: async (email, password) => {
      const res = await fetch(`${BACKEND_URL}/api/auth/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      return handleResponse(res);
    },

    signUp: async (email, password, username) => {
      const res = await fetch(`${BACKEND_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, username }),
      });
      return handleResponse(res);
    },

    getUser: async () => {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) return null;

      const res = await fetch(`${BACKEND_URL}/api/auth/user`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      // We don't use handleResponse here strictly because if it's 401, we just want null
      if (res.ok) {
         return await res.json();
      }
      return null;
    },
    
    signOut: () => {
      localStorage.removeItem(TOKEN_KEY);
    }
  }
};
