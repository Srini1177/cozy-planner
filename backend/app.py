import sqlite3
from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
from datetime import datetime

app = Flask(__name__, static_folder='../frontend', template_folder='../frontend')
CORS(app)

# Load your ML models [cite: 10, 11]
# Load your ML models with correct folder paths
model = pickle.load(open("backend/model.pkl", "rb"))
vectorizer = pickle.load(open("backend/vectorizer.pkl", "rb"))

# --- DATABASE SETUP ---
def get_db():
    conn = sqlite3.connect('cozy_cafe.db')
    conn.row_factory = sqlite3.Row
    return conn

# Initialize tables
with get_db() as db:
    db.execute('''CREATE TABLE IF NOT EXISTS users 
                  (id INTEGER PRIMARY KEY, username TEXT UNIQUE, password TEXT)''')
    db.execute('''CREATE TABLE IF NOT EXISTS tasks 
                  (id INTEGER PRIMARY KEY, username TEXT, task TEXT, 
                   deadline TEXT, createdAt TEXT, score REAL, completed INTEGER DEFAULT 0)''')

# --- ML PRIORITY LOGIC [cite: 23-42] ---
def calculate_priority(task_text, deadline_str, created_at_str):
    now = datetime.now()
    if deadline_str:
        deadline = datetime.strptime(deadline_str, "%Y-%m-%d")
        days_left = (deadline - now).days
        deadline_score = 1 / (days_left + 1) if days_left >= 0 else 2
    else:
        created = datetime.strptime(created_at_str, "%Y-%m-%d")
        days_old = (now - created).days
        deadline_score = 0.1 + (days_old / 100)

    vec = vectorizer.transform([task_text])
    effort = model.predict(vec)[0]
    effort_map = {"quick": 1.0, "medium": 0.6, "long": 0.3}
    return deadline_score + effort_map[effort]

# --- ROUTES ---
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

@app.route("/add", methods=["POST"])
def add_task():
    data = request.json
    created_at = datetime.now().strftime("%Y-%m-%d")
    score = calculate_priority(data["task"], data.get("deadline"), created_at)
    
    with get_db() as db:
        db.execute("INSERT INTO tasks (username, task, deadline, createdAt, score) VALUES (?,?,?,?,?)",
                   (data["username"], data["task"], data.get("deadline"), created_at, score))
    return jsonify({"message": "Task added"})

@app.route("/tasks", methods=["GET"])
def get_tasks():
    username = request.args.get("username")
    with get_db() as db:
        active = db.execute("SELECT * FROM tasks WHERE username = ? AND completed = 0 ORDER BY score DESC", (username,)).fetchall()
        completed = db.execute("SELECT * FROM tasks WHERE username = ? AND completed = 1", (username,)).fetchall()
    
    return jsonify({
        "active": [dict(row) for row in active],
        "completed": [dict(row) for row in completed]
    })

@app.route("/complete", methods=["POST"])
def complete_task():
    task_id = request.json["id"]
    with get_db() as db:
        db.execute("UPDATE tasks SET completed = 1 WHERE id = ?", (task_id,))
    return jsonify({"message": "Task completed"})

if __name__ == "__main__":
    app.run(debug=True)
