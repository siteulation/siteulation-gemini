import os
import requests
import mimetypes
import traceback
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.exceptions import HTTPException
from google import genai
from google.genai import types

# --- Path Configuration ---
# Get the absolute path to the directory containing this file
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
# Define path to frontend folder
FRONTEND_DIR = os.path.join(BASE_DIR, 'frontend')
# Define path to index.html
INDEX_PATH = os.path.join(BASE_DIR, 'index.html')

# --- Env Vars ---
API_KEY = os.environ.get("APIKEY")
SUPABASE_URL = os.environ.get("DATABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("DATABASE_KEY") # Secret Service Role Key
SUPABASE_ANON_KEY = os.environ.get("SUPABASE_ANON_KEY") # Public Anon Key
ADMIN_USERNAME = "homelessman"

# --- App Setup ---
# static_folder points to the frontend directory
app = Flask(__name__, static_folder=FRONTEND_DIR, static_url_path='/frontend')
CORS(app)

mimetypes.add_type('application/javascript', '.js')

# Initialize Gemini
ai_client = None
if API_KEY:
    try:
        ai_client = genai.Client(api_key=API_KEY)
    except Exception as e:
        print(f"Gemini Init Error: {e}")

# --- Helpers ---
def get_db_headers():
    return {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }

def get_auth_headers():
    return {
        "apikey": SUPABASE_ANON_KEY,
        "Content-Type": "application/json"
    }

def verify_token(req):
    auth_header = req.headers.get('Authorization')
    if not auth_header:
        return None
    
    token = auth_header.split(" ")[1] if " " in auth_header else auth_header
    
    if not SUPABASE_URL or not SUPABASE_ANON_KEY:
        print("Error: Missing Supabase Config")
        return None

    url = f"{SUPABASE_URL}/auth/v1/user"
    headers = {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": f"Bearer {token}"
    }
    
    try:
        response = requests.get(url, headers=headers, timeout=5)
        if response.status_code == 200:
            user = response.json()
            # Enrich with profile status (banned)
            user_id = user['id']
            profile_url = f"{SUPABASE_URL}/rest/v1/profiles?id=eq.{user_id}&select=is_banned"
            prof_resp = requests.get(profile_url, headers=get_db_headers())
            
            is_banned = False
            if prof_resp.status_code == 200 and prof_resp.json():
                is_banned = prof_resp.json()[0].get('is_banned', False)
            
            user['is_banned'] = is_banned
            
            # Check Admin status
            username = user.get('user_metadata', {}).get('username')
            user['is_admin'] = (username == ADMIN_USERNAME)
            
            return user
    except Exception as e:
        print(f"Auth verification failed: {e}")
    
    return None

# --- Global Error Handlers ---

@app.errorhandler(Exception)
def handle_exception(e):
    if isinstance(e, HTTPException):
        return jsonify({"error": e.description}), e.code
    
    traceback.print_exc()
    return jsonify({"error": "Internal Server Error", "details": str(e)}), 500

@app.errorhandler(404)
def not_found(e):
    if request.path.startswith('/api/'):
        return jsonify({"error": f"API Endpoint not found: {request.path}"}), 404
    # For non-API 404s, we let the catch-all route handle it
    return "Page not found", 404

# --- API Routes ---

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "ok"}), 200

# --- Auth Routes ---

@app.route('/api/auth/signup', methods=['POST'])
def auth_signup():
    data = request.json or {}
    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY: 
        return jsonify({"error": "Server Config Missing (DB/KEY)"}), 500

    # 1. Create User via Admin API (bypasses email confirmation)
    admin_url = f"{SUPABASE_URL}/auth/v1/admin/users"
    admin_headers = {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": "application/json"
    }
    create_payload = {
        "email": data.get('email'),
        "password": data.get('password'),
        "email_confirm": True, # Force auto-confirmation
        "user_metadata": {"username": data.get('username')}
    }
    
    resp = requests.post(admin_url, json=create_payload, headers=admin_headers)
    
    if resp.status_code >= 400:
        try:
            err = resp.json()
            msg = err.get("msg") or err.get("error_description") or resp.text
        except:
            msg = resp.text
        return jsonify({"error": msg}), resp.status_code

    # 2. Auto-Sign In to get the token immediately
    token_url = f"{SUPABASE_URL}/auth/v1/token?grant_type=password"
    token_payload = {
        "email": data.get('email'), 
        "password": data.get('password')
    }
    token_resp = requests.post(token_url, json=token_payload, headers=get_auth_headers())
    
    try:
        return jsonify(token_resp.json()), token_resp.status_code
    except:
        return jsonify({"error": "User created but auto-login failed"}), 500

@app.route('/api/auth/signin', methods=['POST'])
def auth_signin():
    data = request.json or {}
    if not SUPABASE_URL: return jsonify({"error": "DB Config Missing"}), 500

    url = f"{SUPABASE_URL}/auth/v1/token?grant_type=password"
    payload = {
        "email": data.get('email'), 
        "password": data.get('password')
    }
    resp = requests.post(url, json=payload, headers=get_auth_headers())
    try:
        return jsonify(resp.json()), resp.status_code
    except:
        return jsonify({"error": resp.text}), resp.status_code

@app.route('/api/auth/user', methods=['GET'])
def auth_user():
    user = verify_token(request)
    if user:
        return jsonify(user), 200
    return jsonify({"error": "Invalid or expired token"}), 401

# --- Admin Routes ---

@app.route('/api/admin/ban', methods=['POST'])
def admin_ban_user():
    # Verify Admin
    user = verify_token(request)
    if not user or not user.get('is_admin'):
        return jsonify({"error": "Unauthorized"}), 403
    
    data = request.json or {}
    target_user_id = data.get('user_id')
    
    if not target_user_id:
        return jsonify({"error": "Target user ID required"}), 400
    
    if target_user_id == user['id']:
        return jsonify({"error": "Cannot ban yourself"}), 400

    # Update profile to banned
    url = f"{SUPABASE_URL}/rest/v1/profiles?id=eq.{target_user_id}"
    payload = {"is_banned": True}
    resp = requests.patch(url, json=payload, headers=get_db_headers())
    
    if resp.status_code >= 400:
        return jsonify({"error": "Failed to ban user", "details": resp.text}), resp.status_code
        
    return jsonify({"success": True}), 200

# --- Data Routes ---

@app.route('/api/carts', methods=['GET'])
def get_carts():
    if not SUPABASE_URL: return jsonify({"error": "DB Config Missing"}), 500

    sort_mode = request.args.get('sort', 'recent')
    
    # Determine sorting order
    if sort_mode == 'popular':
        order_param = 'views.desc'
    else:
        order_param = 'created_at.desc'

    url = f"{SUPABASE_URL}/rest/v1/carts?select=*&order={order_param}&limit=20"
    resp = requests.get(url, headers=get_db_headers())
    try:
        return jsonify(resp.json()), resp.status_code
    except:
        return jsonify({"error": "DB Error", "details": resp.text}), 500

@app.route('/api/carts/<id>', methods=['GET'])
def get_cart_by_id(id):
    if not SUPABASE_URL: return jsonify({"error": "DB Config Missing"}), 500

    url = f"{SUPABASE_URL}/rest/v1/carts?select=*&id=eq.{id}"
    resp = requests.get(url, headers=get_db_headers())
    data = resp.json()
    if not data:
        return jsonify({"error": "Cart not found"}), 404
    return jsonify(data[0]), 200

@app.route('/api/carts/<id>', methods=['DELETE'])
def delete_cart(id):
    user = verify_token(request)
    if not user: return jsonify({"error": "Unauthorized"}), 401
    
    # Check if user is admin
    if not user.get('is_admin'):
        return jsonify({"error": "Only admins can delete carts"}), 403

    if not SUPABASE_URL: return jsonify({"error": "DB Config Missing"}), 500
    
    url = f"{SUPABASE_URL}/rest/v1/carts?id=eq.{id}"
    resp = requests.delete(url, headers=get_db_headers())
    
    if resp.status_code >= 400:
        return jsonify({"error": "Delete failed", "details": resp.text}), resp.status_code
        
    return jsonify({"success": True}), 200

@app.route('/api/carts/<id>/view', methods=['POST'])
def increment_cart_view(id):
    if not SUPABASE_URL: return jsonify({"error": "DB Config Missing"}), 500

    # Call the stored procedure (RPC) to increment view count
    url = f"{SUPABASE_URL}/rest/v1/rpc/increment_cart_views"
    payload = {"row_id": id}
    
    try:
        resp = requests.post(url, json=payload, headers=get_db_headers())
        if resp.status_code >= 400:
            print(f"Failed to increment views for {id}: {resp.text}")
            # Don't fail the request significantly if view count fails, just log it
            return jsonify({"success": False}), 200
        return jsonify({"success": True}), 200
    except Exception as e:
        print(f"View increment error: {e}")
        return jsonify({"success": False}), 200

@app.route('/api/generate', methods=['POST'])
def generate_cart():
    user = verify_token(request)
    if not user:
        return jsonify({"error": "Unauthorized"}), 401
    
    # Check if banned
    if user.get('is_banned'):
         return jsonify({"error": "You have been banned from generating projects."}), 403
    
    if not ai_client:
        return jsonify({"error": "AI not initialized"}), 500

    data = request.json or {}
    prompt = data.get('prompt')
    model_choice = data.get('model', 'gemini-2.5')
    
    if not prompt:
        return jsonify({"error": "Prompt required"}), 400

    model_name = "gemini-3-flash-preview" if model_choice == "gemini-3" else "gemini-2.5-flash"
    
    system_instruction = (
        "You are Siteulation AI. Generate a SINGLE-FILE HTML app. "
        "Include CSS in <style> and JS in <script>. "
        "Do NOT use markdown. Return raw HTML only."
    )

    try:
        response = ai_client.models.generate_content(
            model=model_name,
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=0.7
            )
        )
        code = response.text.replace("```html", "").replace("```", "")
        
        # Save to DB
        url = f"{SUPABASE_URL}/rest/v1/carts"
        payload = {
            "user_id": user['id'],
            "username": user.get('user_metadata', {}).get('username', 'Anonymous'),
            "prompt": prompt,
            "model": model_name,
            "code": code,
            "views": 0
        }
        db_resp = requests.post(url, json=payload, headers=get_db_headers())
        
        if db_resp.status_code >= 300:
            raise Exception(f"DB Error: {db_resp.text}")
            
        return jsonify({"success": True, "cart": db_resp.json()[0]}), 201

    except Exception as e:
        print(f"Gen Error: {e}")
        return jsonify({"error": str(e)}), 500

# --- Catch-All Route (Must be last) ---
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_spa(path):
    # If it starts with api/, it's a 404'd API call
    if path.startswith('api/'):
        return jsonify({"error": f"API Endpoint not found: {path}"}), 404
        
    # Serve index.html for SPA routing
    if os.path.exists(INDEX_PATH):
        with open(INDEX_PATH, 'r') as f:
            return f.read()
    return "Index file not found. Ensure backend is running from root.", 404

if __name__ == '__main__':
    app.run(port=5000, debug=True)
