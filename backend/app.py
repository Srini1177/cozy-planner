import sqlite3
import os
import pickle
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from datetime import datetime

# Setup Flask to find the frontend folder
# This is crucial so Render knows where your HTML/CSS/JS is located
app = Flask(__name__, static_folder='../frontend', template_folder='../frontend')
CORS(app)

# --- 🧠 SAFE MODEL LOADING ---
try:
    # We use 'backend/' prefix because Render runs from the root folder
    model = pickle.load(open("backend/model.pkl", "rb"))
    vectorizer = pickle.load(open("backend/vectorizer.pkl", "rb"))
    print("Models loaded successfully! ☕")
except Exception as e:
    print(f"Model load error: {e}. Using dummy logic for now.")
    model = None
    vectorizer = None

# --- 🗄️ DATABASE SETUP ---
def get_db():
    conn = sqlite3.connect('cozy_cafe.db')
    conn.row_factory = sqlite3.Row
    return conn

# Create tables if they don't exist yet
with get_db() as db:
    db.execute('''CREATE TABLE IF NOT EXISTS users 
                  (id INTEGER PRIMARY KEY, username TEXT UNIQUE, password TEXT)''')
    db.execute('''CREATE TABLE IF NOT EXISTS tasks 
                  (id INTEGER PRIMARY KEY, username TEXT, task TEXT, 
                   deadline TEXT, createdAt TEXT, score REAL, completed INTEGER DEFAULT 0)''')

# --- 🤖 PRIORITY LOGIC (AI + DEADLINES) ---
def calculate_priority(task_text, deadline_str, created_at_str):
    now = datetime.now()
    
    # 1. Calculate Deadline Urgency
    if deadline_str:
        try:
            deadline = datetime.strptime(deadline_str, "%Y-%m-%d")
            days_left = (deadline - now).days
            # Higher score for closer deadlines (or overdue)
            deadline_score = 1 / (days_left + 1) if days_left >= 0 else 2
        except:
            deadline_score = 0.5
    else:
        # If no deadline, score based on how long it's been in the list
        created = datetime.strptime(created_at_str, "%Y-%m-%d")
        days_old = (now - created).days
        deadline_score = 0.1 + (days_old / 100)

    # 2. Calculate ML Effort Score
    if model and vectorizer:
        vec = vectorizer.transform([task_text])
        effort = model.predict(vec)[0]
        # We want "Quick" tasks to have higher priority for "Easy Wins"
        effort_map = {"quick": 1.0, "medium": 0.6, "long": 0.3}
        effort_score = effort_map.get(effort, 0.5)
    else:
        effort_score = 0.5

    return deadline_score + effort_score

# --- 🏠 SERVE FRONTEND ---
@app.route('/')
def index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory(app.static_folder, path)

# --- ☕ AUTH ROUTES ---
@app.route("/signup", methods=["POST"])
def signup():
    data = request.json
    try:
        with get_db() as db:
            db.execute("INSERT INTO users (username, password) VALUES (?, ?)", 
                       (data['username'], data['password']))
        return jsonify({"message": "Welcome!"})
    except:
        return jsonify({"error": "Username taken"}), 400

@app.route("/login", methods=["POST"])
def login():
    data = request.json
    with get_db() as db:
        user = db.execute("SELECT * FROM users WHERE username = ? AND password = ?", 
                          (data['username'], data['password'])).fetchone()
    if user:
        return jsonify({"message": "Logged in", "username": user['username']})
    return jsonify({"error": "Invalid login"}), 401

# --- ✅ TASK ROUTES ---
@app.route("/tasks", methods=["GET"])
def get_tasks():
    username = request.args.get("username")
    with get_db() as db:
        # Sort by the AI score (highest score first)
        active = db.execute("SELECT * FROM tasks WHERE username = ? AND completed = 0 ORDER BY score DESC", (username,)).fetchall()
        completed = db.execute("SELECT * FROM tasks WHERE username = ? AND completed = 1", (username,)).fetchall()
    return jsonify({
        "active": [dict(row) for row in active], 
        "completed": [dict(row) for row in completed]
    })

@app.route("/add", methods=["POST"])
def add_task():
    data = request.json
    created_at = datetime.now().strftime("%Y-%m-%d")
    
    # Calculate priority before saving to the database
    score = calculate_priority(data["task"], data.get("deadline"), created_at)
    
    with get_db() as db:
        db.execute("INSERT INTO tasks (username, task, deadline, createdAt, score) VALUES (?,?,?,?,?)",
                   (data["username"], data["task"], data.get("deadline"), created_at, score))
    return jsonify({"message": "Added"})

@app.route("/complete", methods=["POST"])
def complete_task():
    task_id = request.json["id"]
    with get_db() as db:
        db.execute("UPDATE tasks SET completed = 1 WHERE id = ?", (task_id,))
    return jsonify({"message": "Done"})

if __name__ == "__main__":
    app.run()
