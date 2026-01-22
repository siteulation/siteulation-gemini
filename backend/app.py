import os
import json
import requests
import mimetypes
from flask import Flask, request, jsonify
from flask_cors import CORS
from google import genai
from google.genai import types

# Load environment variables
API_KEY = os.environ.get("APIKEY")
SUPABASE_URL = os.environ.get("DATABASE_URL")

# --- SECURITY CRITICAL ---
# The Service Role Key is for the BACKEND ONLY. It has admin privileges.
# NEVER inject this into index.html.
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("DATABASE_KEY")

# The Anon Key is for the FRONTEND. It is safe for the browser.
# You must add this variable to your environment.
SUPABASE_ANON_KEY = os.environ.get("SUPABASE_ANON_KEY")

app = Flask(__name__, static_folder='../frontend', static_url_path='/frontend')
CORS(app)

# Ensure .js files are served with the correct MIME type
mimetypes.add_type('application/javascript', '.js')

# Initialize Gemini Client
ai_client = genai.Client(api_key=API_KEY)

def get_backend_headers():
    """Headers for backend-to-database requests using the Secret Key."""
    return {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }

@app.route('/')
def index():
    try:
        with open('index.html', 'r') as f:
            content = f.read()
            
        # Inject ONLY the Public Anon Key into the browser
        # If SUPABASE_ANON_KEY is missing, we send an empty string to avoid
        # accidentally sending the secret key.
        frontend_key = SUPABASE_ANON_KEY if SUPABASE_ANON_KEY else ""
        
        env_script = f"""
        <script>
          window.env = {{
            SUPABASE_URL: "{SUPABASE_URL}",
            SUPABASE_KEY: "{frontend_key}"
          }};
        </script>
        """
        content = content.replace('</head>', f'{env_script}</head>')
        return content
    except FileNotFoundError:
        return "index.html not found", 404

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "ok"}), 200

@app.route('/api/generate', methods=['POST'])
def generate_cart():
    data = request.json
    prompt = data.get('prompt')
    model_choice = data.get('model')
    user_id = data.get('userId')
    username = data.get('username')

    if not all([prompt, model_choice, user_id]):
        return jsonify({"error": "Missing required fields"}), 400

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
        # Clean markdown if present
        if generated_code.startswith("```"):
            generated_code = generated_code.replace("```html", "").replace("```", "")

        # Save to Supabase using the Backend Secret Key
        url = f"{SUPABASE_URL}/rest/v1/carts"
        payload = {
            "user_id": user_id,
            "username": username,
            "prompt": prompt,
            "model": selected_model,
            "code": generated_code
        }
        
        db_response = requests.post(url, json=payload, headers=get_backend_headers())
        
        if db_response.status_code not in [200, 201]:
            raise Exception(f"Database error: {db_response.text}")

        return jsonify({"success": True, "cart": db_response.json()[0]}), 201

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/carts', methods=['GET'])
def get_recent_carts():
    try:
        url = f"{SUPABASE_URL}/rest/v1/carts?select=*&order=created_at.desc&limit=20"
        response = requests.get(url, headers=get_backend_headers())
        return jsonify(response.json()), response.status_code
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(port=5000, debug=True)
