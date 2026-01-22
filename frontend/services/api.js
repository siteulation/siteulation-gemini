import { BACKEND_URL } from '../constants.js';

const TOKEN_KEY = 'siteulation_auth_token';

export const api = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  
  setToken: (token) => {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  },

  // Helper to make requests with Authorization header
  request: async (endpoint, options = {}) => {
    const token = localStorage.getItem(TOKEN_KEY);
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${BACKEND_URL}${endpoint}`, {
      ...options,
      headers,
    });

    // Handle 401 (Unauthorized) - potentially clear token
    if (response.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
    }

    return response;
  },

  // Auth Methods
  auth: {
    signIn: async (email, password) => {
      const res = await fetch(`${BACKEND_URL}/api/auth/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error_description || data.msg || 'Login failed');
      return data;
    },

    signUp: async (email, password, username) => {
      const res = await fetch(`${BACKEND_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, username }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error_description || data.msg || 'Signup failed');
      return data;
    },

    getUser: async () => {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) return null;

      const res = await fetch(`${BACKEND_URL}/api/auth/user`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) return await res.json();
      return null;
    },
    
    signOut: () => {
      localStorage.removeItem(TOKEN_KEY);
    }
  }
};
