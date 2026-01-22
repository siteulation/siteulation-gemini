import os
import requests
import mimetypes
from flask import Flask, request, jsonify
from flask_cors import CORS
from google import genai
from google.genai import types

# Load environment variables
API_KEY = os.environ.get("APIKEY")
SUPABASE_URL = os.environ.get("DATABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("DATABASE_KEY") # For DB Access (Admin)
SUPABASE_ANON_KEY = os.environ.get("SUPABASE_ANON_KEY") # For Auth Handshake

app = Flask(__name__, static_folder='../frontend', static_url_path='/frontend')
CORS(app)

mimetypes.add_type('application/javascript', '.js')

# Initialize Gemini Client
ai_client = genai.Client(api_key=API_KEY)

# --- Helpers ---

def get_db_headers():
    """Headers for DB operations (Service Role - Bypass RLS)"""
    return {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }

def get_auth_headers():
    """Headers for Auth Handshake (Anon Key)"""
    return {
        "apikey": SUPABASE_ANON_KEY,
        "Content-Type": "application/json"
    }

def verify_token(request):
    """Verify the Bearer token sent from Frontend against Supabase"""
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return None
    
    token = auth_header.split(" ")[1] if " " in auth_header else auth_header
    
    # Verify via Supabase Auth API
    url = f"{SUPABASE_URL}/auth/v1/user"
    headers = {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": f"Bearer {token}"
    }
    
    response = requests.get(url, headers=headers)
    if response.status_code == 200:
        return response.json()
    return None

# --- Routes ---

@app.route('/')
def index():
    try:
        with open('index.html', 'r') as f:
            content = f.read()
        # Remove any previous injection logic, we don't need it.
        return content
    except FileNotFoundError:
        return "index.html not found", 404

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "ok"}), 200

# --- Auth Routes ---

@app.route('/api/auth/signup', methods=['POST'])
def auth_signup():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    username = data.get('username')
    
    url = f"{SUPABASE_URL}/auth/v1/signup"
    payload = {
        "email": email,
        "password": password,
        "data": {"username": username}
    }
    
    response = requests.post(url, json=payload, headers=get_auth_headers())
    return jsonify(response.json()), response.status_code

@app.route('/api/auth/signin', methods=['POST'])
def auth_signin():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    
    url = f"{SUPABASE_URL}/auth/v1/token?grant_type=password"
    payload = {"email": email, "password": password}
    
    response = requests.post(url, json=payload, headers=get_auth_headers())
    return jsonify(response.json()), response.status_code

@app.route('/api/auth/user', methods=['GET'])
def auth_user():
    user = verify_token(request)
    if user:
        return jsonify(user), 200
    return jsonify({"error": "Invalid token"}), 401

# --- Data Routes ---

@app.route('/api/carts', methods=['GET'])
def get_carts():
    # Public route, return recent carts
    url = f"{SUPABASE_URL}/rest/v1/carts?select=*&order=created_at.desc&limit=20"
    response = requests.get(url, headers=get_db_headers())
    return jsonify(response.json()), response.status_code

@app.route('/api/carts/<id>', methods=['GET'])
def get_cart_by_id(id):
    url = f"{SUPABASE_URL}/rest/v1/carts?select=*&id=eq.{id}"
    response = requests.get(url, headers=get_db_headers())
    data = response.json()
    if not data:
        return jsonify({"error": "Not found"}), 404
    return jsonify(data[0]), 200

@app.route('/api/generate', methods=['POST'])
def generate_cart():
    # Verify User
    user = verify_token(request)
    if not user:
        return jsonify({"error": "Unauthorized"}), 401

    data = request.json
    prompt = data.get('prompt')
    model_choice = data.get('model')
    
    # Use user data from the verified token
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

        # Save to DB
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
            raise Exception(f"Database error: {db_response.text}")

        return jsonify({"success": True, "cart": db_response.json()[0]}), 201

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(port=5000, debug=True)
