import os
import requests
import mimetypes
import traceback
import json
import uuid
import time
from datetime import datetime, date
from flask import Flask, request, jsonify, send_from_directory, send_file, Response
from flask_cors import CORS
from flask_socketio import SocketIO, emit, join_room, leave_room
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
OPENROUTER_KEY = os.environ.get("OPENROUTERKEY")
SUPABASE_URL = os.environ.get("DATABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("DATABASE_KEY") # Secret Service Role Key
SUPABASE_ANON_KEY = os.environ.get("SUPABASE_ANON_KEY") # Public Anon Key
ADMIN_USERNAME = "homelessman"

# --- App Setup ---
# static_folder points to the frontend directory
app = Flask(__name__, static_folder=FRONTEND_DIR, static_url_path='/frontend')
CORS(app)

# --- SocketIO Setup ---
# Allow all origins for the generated iframe scripts to connect
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

mimetypes.add_type('application/javascript', '.js')

# Initialize Gemini
ai_client = None
if API_KEY:
    try:
        ai_client = genai.Client(api_key=API_KEY)
    except Exception as e:
        print(f"Gemini Init Error: {e}")

# --- Auth Cache ---
# Simple in-memory cache to prevent hitting Supabase Rate Limits on every request
# Key: Token, Value: (User Object, Timestamp)
AUTH_CACHE = {}
AUTH_CACHE_TTL = 60 # 1 minute

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

def update_credits(user_id, new_credits, reset_date=None):
    """Updates the user's credit balance and optionally the reset date."""
    url = f"{SUPABASE_URL}/rest/v1/profiles?id=eq.{user_id}"
    payload = {"credits": new_credits}
    if reset_date:
        payload["last_reset_date"] = str(reset_date)
        
    requests.patch(url, json=payload, headers=get_db_headers())

def verify_token(req):
    auth_header = req.headers.get('Authorization')
    if not auth_header:
        return None
    
    token = auth_header.split(" ")[1] if " " in auth_header else auth_header
    
    # Check Cache
    now = time.time()
    if token in AUTH_CACHE:
        cached_user, timestamp = AUTH_CACHE[token]
        if now - timestamp < AUTH_CACHE_TTL:
            return cached_user
        else:
            del AUTH_CACHE[token]
    
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
            user_id = user['id']
            
            # Fetch Profile Data (Banned status + Credits)
            # We can also cache this logic if needed, but the profile fetch uses Service Role 
            # which has higher limits than the public Auth endpoint usually.
            profile_url = f"{SUPABASE_URL}/rest/v1/profiles?id=eq.{user_id}&select=is_banned,credits,last_reset_date"
            prof_resp = requests.get(profile_url, headers=get_db_headers())
            
            is_banned = False
            credits = 15
            last_reset = None
            
            if prof_resp.status_code == 200 and prof_resp.json():
                profile = prof_resp.json()[0]
                is_banned = profile.get('is_banned', False)
                credits = profile.get('credits', 15)
                last_reset_str = profile.get('last_reset_date')
                
                # Check for Daily Reset
                today = date.today()
                if last_reset_str != str(today):
                    # It's a new day! Reset credits.
                    credits = 15
                    update_credits(user_id, 15, reset_date=today)
            
            user['is_banned'] = is_banned
            user['credits'] = credits
            
            # Check Admin status
            username = user.get('user_metadata', {}).get('username')
            user['is_admin'] = (username == ADMIN_USERNAME)
            
            # Cache the result
            AUTH_CACHE[token] = (user, now)
            
            return user
        elif response.status_code == 429:
            print(f"Supabase Auth Rate Limit Hit: {response.text}")
            # Raise exception so it propagates as 429 to client instead of generic 401
            raise Exception("Upstream Auth Rate Limit")
        else:
             # Just return None for invalid tokens (401, etc)
             # print(f"Auth Token Invalid: {response.status_code}")
             pass

    except Exception as e:
        if str(e) == "Upstream Auth Rate Limit":
            raise HTTPException(description="Too Many Requests (Auth Provider)", response=Response("Too Many Requests", status=429))
        print(f"Auth verification failed: {e}")
    
    return None

def serve_html_with_meta(title=None, description=None):
    """Reads index.html and injects dynamic meta tags."""
    if not os.path.exists(INDEX_PATH):
        return "Index file not found.", 404

    with open(INDEX_PATH, 'r') as f:
        html_content = f.read()

    # Defaults
    default_title = "Siteulation | Digital Reality Generator"
    default_desc = "Generate your digital reality. AI-powered single-file web app generator using Gemini 3.0."
    
    target_title = title if title else default_title
    target_desc = description if description else default_desc
    
    # Simple string replacements (Assuming index.html has these default strings)
    # We replace the Open Graph and Twitter tags specifically
    
    html_content = html_content.replace(f'content="{default_title}"', f'content="{target_title}"')
    html_content = html_content.replace(f'content="{default_desc}"', f'content="{target_desc}"')
    
    # Also update the actual <title> tag
    html_content = html_content.replace(f'<title>{default_title}</title>', f'<title>{target_title}</title>')
    
    return html_content

# --- OpenRouter Generation ---
def generate_with_openrouter(prompt, model):
    """
    Generates content using OpenRouter API.
    """
    if not OPENROUTER_KEY:
        raise Exception("OpenRouter Key not configured on server")

    url = "https://openrouter.ai/api/v1/chat/completions"
    
    headers = {
        "Authorization": f"Bearer {OPENROUTER_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://siteulation.com",
        "X-Title": "Siteulation"
    }
    
    payload = {
        "model": model, 
        "messages": [
            {"role": "user", "content": prompt}
        ],
        "max_tokens": 10000, 
        "temperature": 0.7
    }

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=120) 
        
        if response.status_code == 200:
            data = response.json()
            if 'choices' in data and len(data['choices']) > 0:
                return data['choices'][0]['message']['content']
            else:
                 print(f"OpenRouter Unexpected Response: {data}")
                 raise Exception("Invalid response structure from OpenRouter")
        elif response.status_code == 429:
             print("OpenRouter 429 Rate Limit Hit")
             # Propagate 429
             raise HTTPException(description="OpenRouter Rate Limit Exceeded", response=Response("AI Provider Busy", status=429))
        else:
            print(f"OpenRouter API Error: {response.status_code} - {response.text}")
            raise Exception(f"OpenRouter API failed with status {response.status_code}")

    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        print(f"OpenRouter Generation Exception: {e}")
        raise e

# --- SocketIO Events ---

@socketio.on('join')
def on_join(data):
    """
    Client emits 'join' with { 'room': 'cart_id_or_unique_id' }
    """
    room = data.get('room')
    if not room:
        return
    join_room(room)
    # Notify others in room
    emit('player_joined', {'sid': request.sid}, room=room, include_self=False)

@socketio.on('leave')
def on_leave(data):
    room = data.get('room')
    if not room:
        return
    leave_room(room)
    emit('player_left', {'sid': request.sid}, room=room)

@socketio.on('state_update')
def on_state_update(data):
    """
    Generic state relay. 
    Client emits 'state_update' with { 'room': '...', 'data': ... }
    Server broadcasts 'state_update' to everyone else in the room.
    """
    room = data.get('room')
    payload = data.get('data')
    if room and payload is not None:
        # Broadcast to everyone else in the room
        emit('state_update', payload, room=room, include_self=False)

@socketio.on('chat_message')
def on_chat_message(data):
    """
    Relay chat messages specifically.
    Client emits 'chat_message' with { 'room': '...', 'user': '...', 'text': '...' }
    """
    room = data.get('room')
    if room:
        emit('chat_message', data, room=room, include_self=False)

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
    return serve_html_with_meta()

# --- API Routes ---

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "ok"}), 200

# --- Auth Routes ---

@app.route('/api/auth/signup', methods=['POST'])
def auth_signup():
    data = request.json or {}
    if not SUPABASE_URL: 
        return jsonify({"error": "Server Config Missing (DB)"}), 500

    # Use the Public Auth Endpoint (enforces email verification if enabled in Supabase)
    url = f"{SUPABASE_URL}/auth/v1/signup"
    
    headers = get_auth_headers()
    
    payload = {
        "email": data.get('email'),
        "password": data.get('password'),
        "data": {"username": data.get('username')} # User metadata
    }
    
    try:
        resp = requests.post(url, json=payload, headers=headers)
        
        if resp.status_code >= 400:
            try:
                err = resp.json()
                msg = err.get("msg") or err.get("error_description") or resp.text
            except:
                msg = resp.text
            return jsonify({"error": msg}), resp.status_code
            
        return jsonify(resp.json()), resp.status_code

    except Exception as e:
        return jsonify({"error": str(e)}), 500

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
    filter_user_id = request.args.get('user_id')
    
    url = f"{SUPABASE_URL}/rest/v1/carts?select=*"

    # Filter logic:
    # If user_id is provided (viewing specific profile/my carts), show everything belonging to them.
    # If NO user_id is provided (public feed), ONLY show listed carts.
    if filter_user_id:
        url += f"&user_id=eq.{filter_user_id}"
    else:
        url += "&is_listed=eq.true"
    
    # Determine sorting order
    if sort_mode == 'popular':
        url += '&order=views.desc'
    else:
        url += '&order=created_at.desc'
        
    url += '&limit=50'

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

@app.route('/api/carts/<id>', methods=['PATCH'])
def update_cart(id):
    user = verify_token(request)
    if not user: return jsonify({"error": "Unauthorized"}), 401
    
    data = request.json or {}
    
    # Construct Payload dynamically
    payload = {}
    if 'name' in data:
        payload['name'] = data['name']
    if 'is_listed' in data:
        payload['is_listed'] = data['is_listed']
        
    if not payload:
        return jsonify({"error": "No valid fields to update"}), 400

    if not SUPABASE_URL: return jsonify({"error": "DB Config Missing"}), 500
    
    # RLS Policies on Supabase side should technically handle the user_id check
    # But explicitly doing it here for the endpoint logic is safer/clearer
    
    url = f"{SUPABASE_URL}/rest/v1/carts?id=eq.{id}&user_id=eq.{user['id']}"
    
    resp = requests.patch(url, json=payload, headers=get_db_headers())
    
    if resp.status_code >= 400:
        return jsonify({"error": "Update failed (Check permission)", "details": resp.text}), resp.status_code

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
    
    data = request.json or {}
    prompt = data.get('prompt')
    name = data.get('name') or prompt
    model_choice = data.get('model', 'gemini-3')
    remix_code = data.get('remix_code') 
    multiplayer_enabled = data.get('multiplayer', False)
    provider = data.get('provider', 'official') 
    is_mobile = data.get('is_mobile', False)
    
    if not prompt:
        return jsonify({"error": "Prompt required"}), 400
        
    # --- Cost Calculation & Deduction ---
    cost = 0
    if provider == 'official':
        cost = 1
        
    current_credits = user.get('credits', 0)
    
    if cost > 0 and current_credits < cost:
        return jsonify({"error": f"Insufficient credits. Requires {cost} credit(s), you have {current_credits}."}), 402

    # --- Construct Final Prompt ---
    
    # Updated System Instruction for Multi-file JSON output
    system_instruction = (
        "You are Siteulation AI. You generate web applications. "
        "You MUST return the code in a valid JSON format. "
        "The JSON object must have a key 'files', which is an array of objects. "
        "Each object must have 'name' (filename, e.g., 'index.html', 'style.css') and 'content' (the file code). "
        "Always include an 'index.html' as the entry point. "
        "If the user asks for a simple app, you can just return one file. "
        "Do NOT use markdown fencing around the JSON. Return raw JSON."
    )

    if is_mobile:
        system_instruction += " IMPORTANT: The user is on a mobile device. Ensure the app is mobile-responsive, uses touch events if needed, and fits within the screen without overflow."

    final_prompt = prompt

    if remix_code:
        # Check if remix_code is likely JSON or string
        is_json_remix = False
        try:
            json.loads(remix_code)
            is_json_remix = True
        except:
            pass

        final_prompt = f"""
I want to Remix/Modify this existing application.

EXISTING CODE ({'JSON' if is_json_remix else 'LEGACY STRING'}):
{remix_code}

USER REQUEST:
{prompt}

Return the updated project structure in the requested JSON format.
"""

    if multiplayer_enabled:
        multiplayer_prompt = """
        
*** IMPORTANT: MULTIPLAYER MODE ENABLED ***
You MUST implement real-time multiplayer functionality using the provided WebSocket server.

1.  **Include Socket.IO**: `<script src="https://cdn.socket.io/4.7.4/socket.io.min.js"></script>`
2.  **Initialize**: `const socket = io({transports: ['websocket', 'polling']});`
3.  **Rooms**: Generate a Room ID or let the user input one.
4.  **Join**: `socket.emit('join', { room: myRoomId });`

**Sending Data:**
*   **State Updates** (Positions, Game Data): 
    `socket.emit('state_update', { room: myRoomId, data: { ... } });`
    *Server relays this to other players.*
*   **Chat/Messages**: 
    `socket.emit('chat_message', { room: myRoomId, username: 'User', text: 'Hello' });`
    *Server relays this to other players.*

**Receiving Data:**
*   `socket.on('state_update', (data) => { ...updateGameState(data)... });`
*   `socket.on('chat_message', (msg) => { ...appendMessageToChat(msg)... });`
*   `socket.on('player_joined', (data) => { ... });`
*   `socket.on('player_left', (data) => { ... });`
"""
        final_prompt += multiplayer_prompt
        
    final_prompt += "\nGenerate the complete JSON structure."

    # --- Generation Logic ---
    raw_output = ""
    model_used = ""

    try:
        if provider == 'openrouter':
            # Mapping for Free OpenRouter models
            if model_choice == 'deepseek-free':
                model_used = "deepseek/deepseek-r1:free"
            elif model_choice == 'gemini-2-free':
                model_used = "google/gemini-2.0-flash-exp:free"
            else:
                model_used = "google/gemini-2.0-flash-exp:free" # Default Fallback

            openrouter_prompt = f"{system_instruction}\n\n{final_prompt}"
            raw_output = generate_with_openrouter(openrouter_prompt, model=model_used)
            
        else:
            # Official API - Exclusive to Gemini 3 Flash
            if not ai_client:
                raise Exception("Official API Key not configured on server")
            
            model_used = "gemini-3-flash-preview"
            
            response = ai_client.models.generate_content(
                model=model_used,
                contents=final_prompt,
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    temperature=0.7,
                    response_mime_type="application/json"
                )
            )
            if not response.text:
                raise Exception("AI returned empty response")
            raw_output = response.text

        # Cleanup Code
        cleaned_output = raw_output.strip()
        if cleaned_output.startswith("```json"):
            cleaned_output = cleaned_output[7:]
        if cleaned_output.startswith("```"):
            cleaned_output = cleaned_output[3:]
        if cleaned_output.endswith("```"):
            cleaned_output = cleaned_output[:-3]
        
        # Validate JSON
        try:
            json_structure = json.loads(cleaned_output)
            if 'files' not in json_structure:
                 if isinstance(json_structure, list):
                     json_structure = {"files": json_structure}
                 else:
                     raise Exception("Invalid JSON structure: Missing 'files' key")
            
            final_code_storage = json.dumps(json_structure)

        except json.JSONDecodeError:
            print("JSON Parsing Failed, falling back to raw string storage")
            fallback_struct = {
                "files": [
                    {"name": "index.html", "content": raw_output}
                ]
            }
            final_code_storage = json.dumps(fallback_struct)

    except Exception as e:
        print(f"Generation Error ({provider}): {e}")
        return jsonify({"error": str(e)}), 500

    # --- Save to DB ---
    try:
        url = f"{SUPABASE_URL}/rest/v1/carts"
        payload = {
            "user_id": user['id'],
            "username": user.get('user_metadata', {}).get('username', 'Anonymous'),
            "name": name,
            "prompt": prompt,
            "model": model_used,
            "code": final_code_storage,
            "views": 0,
            "is_listed": False 
        }
        db_resp = requests.post(url, json=payload, headers=get_db_headers())
        
        if db_resp.status_code >= 300:
            raise Exception(f"DB Error: {db_resp.text}")
        
        # Deduct Credit if applicable
        if cost > 0:
            new_credits = current_credits - cost
            update_credits(user['id'], new_credits)
            
        return jsonify({"success": True, "cart": db_resp.json()[0]}), 201
    
    except Exception as e:
        print(f"Save Error: {e}")
        return jsonify({"error": str(e)}), 500

# --- Serving & Meta Injection ---

@app.route('/siteulationlogo.png')
def serve_logo():
    # Force absolute path check
    logo_filename = 'siteulationlogo.png'
    
    # Try ROOT first
    logo_path = os.path.join(BASE_DIR, logo_filename)
    if os.path.exists(logo_path):
        return send_file(logo_path, mimetype='image/png')
    
    # Try FRONTEND_DIR
    logo_path_frontend = os.path.join(FRONTEND_DIR, logo_filename)
    if os.path.exists(logo_path_frontend):
        return send_file(logo_path_frontend, mimetype='image/png')
        
    print(f"ERROR: Logo file not found at {logo_path} or {logo_path_frontend}")
    return "Logo not found", 404

@app.route('/site/<id>', methods=['GET'])
def serve_site_preview(id):
    """
    SSR Route specifically for Discord/Social crawlers to see correct meta tags.
    """
    if not SUPABASE_URL:
        return serve_html_with_meta() # Fallback

    # Fetch cart details to get title/desc
    url = f"{SUPABASE_URL}/rest/v1/carts?select=name,prompt,username&id=eq.{id}"
    
    title = None
    description = None
    
    try:
        resp = requests.get(url, headers=get_db_headers())
        if resp.status_code == 200:
            data = resp.json()
            if data and len(data) > 0:
                cart = data[0]
                # Use Name if available, otherwise Prompt
                display_name = cart.get('name') or cart.get('prompt', 'Untitled Cart')
                
                title = display_name
                if len(title) > 60:
                    title = title[:57] + "..."
                
                username = cart.get('username', 'Anonymous')
                description = f"A Siteulation cart by {username}"
    except Exception as e:
        print(f"Meta fetch error: {e}")

    return serve_html_with_meta(title=title, description=description)

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_spa(path):
    # If it starts with api/, it's a 404'd API call
    if path.startswith('api/'):
        return jsonify({"error": f"API Endpoint not found: {request.path}"}), 404
        
    # Standard catch-all serves index.html with default meta
    return serve_html_with_meta()

if __name__ == '__main__':
    # Use socketio.run instead of app.run
    socketio.run(app, port=5000, debug=True)
