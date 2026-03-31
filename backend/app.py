import sqlite3
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from datetime import datetime

app = Flask(__name__, static_folder='../frontend', template_folder='../frontend')
CORS(app)

# 🗄️ DATABASE
def get_db():
    conn = sqlite3.connect('cozy.db')
    conn.row_factory = sqlite3.Row
    return conn

with get_db() as db:
    db.execute('''CREATE TABLE IF NOT EXISTS users 
                  (id INTEGER PRIMARY KEY, username TEXT UNIQUE, password TEXT)''')

    db.execute('''CREATE TABLE IF NOT EXISTS tasks 
                  (id INTEGER PRIMARY KEY, username TEXT, task TEXT, deadline TEXT, completed INTEGER DEFAULT 0)''')

# 🌐 SERVE FRONTEND
@app.route('/')
def index():
    return send_from_directory(app.static_folder, 'login.html')

@app.route('/<path:path>')
def static_files(path):
    return send_from_directory(app.static_folder, path)

# 🔐 SIGNUP
@app.route('/signup', methods=['POST'])
def signup():
    data = request.json
    try:
        with get_db() as db:
            db.execute("INSERT INTO users (username, password) VALUES (?, ?)",
                       (data['username'], data['password']))
        return jsonify({"message": "User created"})
    except:
        return jsonify({"error": "Username exists"}), 400

# 🔐 LOGIN
@app.route('/login', methods=['POST'])
def login():
    data = request.json
    with get_db() as db:
        user = db.execute("SELECT * FROM users WHERE username=? AND password=?",
                          (data['username'], data['password'])).fetchone()

    if user:
        return jsonify({"message": "Login success"})
    return jsonify({"error": "Invalid credentials"}), 401

# 📋 GET TASKS
@app.route('/tasks')
def get_tasks():
    username = request.args.get("username")

    with get_db() as db:
        active = db.execute("SELECT * FROM tasks WHERE username=? AND completed=0",
                            (username,)).fetchall()
        completed = db.execute("SELECT * FROM tasks WHERE username=? AND completed=1",
                               (username,)).fetchall()

    return jsonify({
        "active": [dict(x) for x in active],
        "completed": [dict(x) for x in completed]
    })

# ➕ ADD TASK
@app.route('/add', methods=['POST'])
def add_task():
    data = request.json

    with get_db() as db:
        db.execute("INSERT INTO tasks (username, task, deadline) VALUES (?, ?, ?)",
                   (data['username'], data['task'], data['deadline']))

    return jsonify({"message": "Added"})

# ✅ COMPLETE TASK
@app.route('/complete', methods=['POST'])
def complete():
    task_id = request.json['id']

    with get_db() as db:
        db.execute("UPDATE tasks SET completed=1 WHERE id=?", (task_id,))

    return jsonify({"message": "Done"})

# ❌ DELETE TASK
@app.route('/delete', methods=['POST'])
def delete():
    task_id = request.json['id']

    with get_db() as db:
        db.execute("DELETE FROM tasks WHERE id=?", (task_id,))

    return jsonify({"message": "Deleted"})

if __name__ == "__main__":
    app.run(debug=True)
