import os
import json
import requests
import mimetypes
from flask import Flask, request, jsonify, send_from_directory, make_response
from flask_cors import CORS
from google import genai
from google.genai import types

# Load environment variables
API_KEY = os.environ.get("APIKEY")
SUPABASE_URL = os.environ.get("DATABASE_URL")

# SECURITY CRITICAL: 
# DATABASE_KEY is the Service Role (Secret) key. NEVER send this to the frontend.
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("DATABASE_KEY")

# SUPABASE_ANON_KEY is the Public (Anon) key. This IS safe for the frontend.
# You must set this env var in your deployment.
SUPABASE_ANON_KEY = os.environ.get("SUPABASE_ANON_KEY")

# Configure Flask to serve static files from the 'frontend' directory
app = Flask(__name__, static_folder='../frontend', static_url_path='/frontend')
CORS(app)

# Ensure .js files are served with the correct MIME type
mimetypes.add_type('application/javascript', '.js')

# Initialize Gemini Client
ai_client = genai.Client(api_key=API_KEY)

def get_supabase_headers():
    """Headers for backend requests using the Secret Key"""
    return {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }

@app.route('/')
def index():
    # Read index.html from the parent directory
    try:
        with open('index.html', 'r') as f:
            content = f.read()
            
        # Inject environment variables for Frontend
        # WE ONLY INJECT THE ANON KEY. 
        # If SUPABASE_ANON_KEY is missing, we send an empty string (app will warn but not crash with security error).
        frontend_key = SUPABASE_ANON_KEY if SUPABASE_ANON_KEY else ""
        
        env_script = f"""
        <script>
          window.env = {{
            SUPABASE_URL: "{SUPABASE_URL}",
            SUPABASE_KEY: "{frontend_key}"
          }};
        </script>
        """
        # Inject before </head>
        content = content.replace('</head>', f'{env_script}</head>')
        
        return content
    except FileNotFoundError:
        return "index.html not found", 404

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "ok", "service": "Siteulation Backend"}), 200

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
        "You are 'Siteulation AI', an advanced web architect. Your task is to generate a SINGLE-FILE "
        "HTML application based on the user's simulation parameters (prompt). "
        "The file must include valid HTML5, CSS (in <style> tags), and JavaScript (in <script> tags). "
        "The application must be fully functional within this single file. "
        "Do not include markdown formatting (like ```html). Return ONLY the raw code."
        "Make the design futuristic, clean, and highly responsive."
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

        # Clean up markdown
        if generated_code.startswith("```"):
            lines = generated_code.splitlines()
            if lines[0].strip().startswith("```"):
                lines = lines[1:]
            if lines[-1].strip().startswith("```"):
                lines = lines[:-1]
            generated_code = "\n".join(lines)

        url = f"{SUPABASE_URL}/rest/v1/carts"
        payload = {
            "user_id": user_id,
            "username": username,
            "prompt": prompt,
            "model": selected_model,
            "code": generated_code
        }
        
        # Backend uses the secure SERVICE ROLE KEY
        db_response = requests.post(url, json=payload, headers=get_supabase_headers())
        
        if db_response.status_code not in [200, 201]:
            raise Exception(f"Database error: {db_response.text}")

        saved_cart = db_response.json()[0]

        return jsonify({
            "success": True, 
            "cart": saved_cart
        }), 201

    except Exception as e:
        print(f"Error generating site: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/carts', methods=['GET'])
def get_recent_carts():
    try:
        url = f"{SUPABASE_URL}/rest/v1/carts?select=*&order=created_at.desc&limit=20"
        # Backend uses the secure SERVICE ROLE KEY
        response = requests.get(url, headers=get_supabase_headers())
        
        if response.status_code != 200:
            return jsonify({"error": "Failed to fetch sites"}), response.status_code

        return jsonify(response.json()), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(port=5000, debug=True)
