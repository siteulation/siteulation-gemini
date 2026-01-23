
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
    // Non-JSON response
    const text = await response.text();
    console.error("Non-JSON API Response:", response.status, response.url, text);
    
    let errorMsg = `Server Error (${response.status})`;
    if (response.status === 404) errorMsg = `Endpoint not found (404): ${response.url}`;
    
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

    const MAX_RETRIES = 2;
    let attempt = 0;

    while (true) {
        try {
            const response = await fetch(`${BACKEND_URL}${endpoint}`, {
                ...options,
                headers,
            });

            // If 502 Bad Gateway, 503 Service Unavailable, or 504 Gateway Timeout
            // Retry a few times to handle transient server glitches
            if ([502, 503, 504].includes(response.status) && attempt < MAX_RETRIES) {
                attempt++;
                console.log(`Server error ${response.status}, retrying (attempt ${attempt})...`);
                await new Promise(r => setTimeout(r, 1500)); // Wait 1.5s
                continue;
            }

            if (response.status === 401) {
                localStorage.removeItem(TOKEN_KEY);
            }

            return await handleResponse(response);

        } catch (e) {
            // Network errors (fetch throws)
             if (attempt < MAX_RETRIES) {
                attempt++;
                console.log(`Network error, retrying (attempt ${attempt})...`);
                await new Promise(r => setTimeout(r, 1500));
                continue;
            }
            console.error("API Call Failed:", e);
            throw e; 
        }
    }
  },

  admin: {
    deleteCart: async (id) => {
        return api.request(`/api/carts/${id}`, { method: 'DELETE' });
    },
    banUser: async (userId) => {
        return api.request(`/api/admin/ban`, { 
            method: 'POST',
            body: JSON.stringify({ user_id: userId })
        });
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
