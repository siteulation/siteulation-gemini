import os
import requests
import mimetypes
import traceback
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.exceptions import HTTPException
from google import genai
from google.genai import types

# --- Configuration & Validation ---
API_KEY = os.environ.get("APIKEY")
SUPABASE_URL = os.environ.get("DATABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("DATABASE_KEY") # Secret Key
SUPABASE_ANON_KEY = os.environ.get("SUPABASE_ANON_KEY") # Public Key

# Validate critical env vars on startup
missing_vars = []
if not API_KEY: missing_vars.append("APIKEY")
if not SUPABASE_URL: missing_vars.append("DATABASE_URL")
if not SUPABASE_SERVICE_ROLE_KEY: missing_vars.append("DATABASE_KEY")
if not SUPABASE_ANON_KEY: missing_vars.append("SUPABASE_ANON_KEY")

if missing_vars:
    print(f"CRITICAL WARNING: Missing environment variables: {', '.join(missing_vars)}")
    print("The application may crash or malfunction.")

app = Flask(__name__, static_folder='../frontend', static_url_path='/frontend')
CORS(app)

mimetypes.add_type('application/javascript', '.js')

# Initialize Gemini Client (Handle missing key gracefully)
ai_client = None
if API_KEY:
    try:
        ai_client = genai.Client(api_key=API_KEY)
    except Exception as e:
        print(f"Failed to initialize Gemini Client: {e}")

# --- Global Error Handlers ---

@app.errorhandler(Exception)
def handle_exception(e):
    """Return JSON instead of HTML for HTTP 500 errors"""
    # Pass through HTTP errors
    if isinstance(e, HTTPException):
        return e
    
    # Log the full error
    print("INTERNAL SERVER ERROR:")
    traceback.print_exc()
    
    # Return JSON response
    return jsonify({
        "error": "Internal Server Error",
        "details": str(e)
    }), 500

@app.errorhandler(404)
def not_found(e):
    # If the request is for the API, return JSON
    if request.path.startswith('/api/'):
        return jsonify({"error": "API Endpoint not found"}), 404
    # Otherwise fallback to index (Handled by the root route usually, but just in case)
    return "Page not found", 404

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
        raise Exception("Server misconfigured: Missing Supabase URL/Key")

    url = f"{SUPABASE_URL}/auth/v1/user"
    headers = {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": f"Bearer {token}"
    }
    
    # We use a session with no retries to fail fast
    response = requests.get(url, headers=headers, timeout=10)
    if response.status_code == 200:
        return response.json()
    return None

# --- Routes ---

@app.route('/')
def index():
    try:
        with open('index.html', 'r') as f:
            return f.read()
    except FileNotFoundError:
        return "index.html not found. Ensure you are running from the project root.", 404

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        "status": "ok", 
        "configured": not bool(missing_vars)
    }), 200

# --- Auth Routes ---

@app.route('/api/auth/signup', methods=['POST'])
def auth_signup():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    username = data.get('username')
    
    if not SUPABASE_URL:
        return jsonify({"error": "Database URL not configured"}), 500

    url = f"{SUPABASE_URL}/auth/v1/signup"
    payload = {
        "email": email,
        "password": password,
        "data": {"username": username}
    }
    
    response = requests.post(url, json=payload, headers=get_auth_headers())
    
    # Try to parse JSON from Supabase, fallback to text if it fails
    try:
        resp_data = response.json()
    except:
        resp_data = {"error": response.text}
        
    return jsonify(resp_data), response.status_code

@app.route('/api/auth/signin', methods=['POST'])
def auth_signin():
    data = request.json or {}
    email = data.get('email')
    password = data.get('password')
    
    if not email or not password:
        return jsonify({"error": "Email and password required"}), 400

    if not SUPABASE_URL:
        return jsonify({"error": "Database URL not configured"}), 500
    
    url = f"{SUPABASE_URL}/auth/v1/token?grant_type=password"
    payload = {"email": email, "password": password}
    
    response = requests.post(url, json=payload, headers=get_auth_headers())
    
    try:
        resp_data = response.json()
    except:
        resp_data = {"error": response.text}

    return jsonify(resp_data), response.status_code

@app.route('/api/auth/user', methods=['GET'])
def auth_user():
    try:
        user = verify_token(request)
        if user:
            return jsonify(user), 200
        return jsonify({"error": "Invalid token"}), 401
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# --- Data Routes ---

@app.route('/api/carts', methods=['GET'])
def get_carts():
    if not SUPABASE_URL:
        return jsonify({"error": "Database URL not configured"}), 500

    url = f"{SUPABASE_URL}/rest/v1/carts?select=*&order=created_at.desc&limit=20"
    response = requests.get(url, headers=get_db_headers())
    
    try:
        return jsonify(response.json()), response.status_code
    except:
        return jsonify({"error": "Failed to parse database response", "details": response.text}), 500

@app.route('/api/carts/<id>', methods=['GET'])
def get_cart_by_id(id):
    if not SUPABASE_URL:
        return jsonify({"error": "Database URL not configured"}), 500

    url = f"{SUPABASE_URL}/rest/v1/carts?select=*&id=eq.{id}"
    response = requests.get(url, headers=get_db_headers())
    data = response.json()
    if not data:
        return jsonify({"error": "Not found"}), 404
    return jsonify(data[0]), 200

@app.route('/api/generate', methods=['POST'])
def generate_cart():
    user = verify_token(request)
    if not user:
        return jsonify({"error": "Unauthorized"}), 401
        
    if not ai_client:
         return jsonify({"error": "AI Client not initialized (Missing API Key)"}), 500

    data = request.json
    prompt = data.get('prompt')
    model_choice = data.get('model')
    
    user_id = user['id']
    username = user.get('user_metadata', {}).get('username', 'Anonymous')

    if not prompt:
        return jsonify({"error": "Prompt is required"}), 400

    model_map = {
        "gemini-2.5": "gemini-2.5-flash",
        "gemini-3": "gemini-3-flash-preview"
    }
    selected_model = model_map.get(model_choice, "gemini-2.5-flash")

    system_instruction = (
        "You are 'Siteulation AI'. Generate a SINGLE-FILE HTML application based on the user's prompt. "
        "Include CSS in <style> and JS in <script>. "
        "Do NOT use markdown. Return raw HTML only."
    )

    try:
        response = ai_client.models.generate_content(
            model=selected_model,
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=0.7
            )
        )
        
        generated_code = response.text
        if generated_code.startswith("```"):
            generated_code = generated_code.replace("```html", "").replace("```", "")

        url = f"{SUPABASE_URL}/rest/v1/carts"
        payload = {
            "user_id": user_id,
            "username": username,
            "prompt": prompt,
            "model": selected_model,
            "code": generated_code
        }
        
        db_response = requests.post(url, json=payload, headers=get_db_headers())
        
        if db_response.status_code not in [200, 201]:
            raise Exception(f"Database Save Error: {db_response.text}")

        return jsonify({"success": True, "cart": db_response.json()[0]}), 201

    except Exception as e:
        print(f"Generation Error: {e}")
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(port=5000, debug=True)
