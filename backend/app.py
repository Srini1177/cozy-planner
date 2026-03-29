import sqlite3
import os
import pickle
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from datetime import datetime

# Setup Flask to find the frontend folder
app = Flask(__name__, static_folder='../frontend', template_folder='../frontend')
CORS(app)

# --- 🧠 SAFE MODEL LOADING ---
try:
    model = pickle.load(open("backend/model.pkl", "rb"))
    vectorizer = pickle.load(open("backend/vectorizer.pkl", "rb"))
    print("Models loaded successfully!")
except Exception as e:
    print(f"Model load error: {e}. Using dummy logic for now.")
    model = None

# --- 🗄️ DATABASE SETUP ---
def get_db():
    conn = sqlite3.connect('cozy_cafe.db')
    conn.row_factory = sqlite3.Row
    return conn

with get_db() as db:
    db.execute('''CREATE TABLE IF NOT EXISTS users 
                  (id INTEGER PRIMARY KEY, username TEXT UNIQUE, password TEXT)''')
    db.execute('''CREATE TABLE IF NOT EXISTS tasks 
                  (id INTEGER PRIMARY KEY, username TEXT, task TEXT, 
                   deadline TEXT, createdAt TEXT, score REAL, completed INTEGER DEFAULT 0)''')

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
        active = db.execute("SELECT * FROM tasks WHERE username = ? AND completed = 0", (username,)).fetchall()
        completed = db.execute("SELECT * FROM tasks WHERE username = ? AND completed = 1", (username,)).fetchall()
    return jsonify({"active": [dict(row) for row in active], "completed": [dict(row) for row in completed]})

@app.route("/add", methods=["POST"])
def add_task():
    data = request.json
    with get_db() as db:
        db.execute("INSERT INTO tasks (username, task, deadline) VALUES (?,?,?)",
                   (data["username"], data["task"], data.get("deadline")))
    return jsonify({"message": "Added"})

@app.route("/complete", methods=["POST"])
def complete_task():
    task_id = request.json["id"]
    with get_db() as db:
        db.execute("UPDATE tasks SET completed = 1 WHERE id = ?", (task_id,))
    return jsonify({"message": "Done"})

if __name__ == "__main__":
    app.run()
