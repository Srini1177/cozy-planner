import os
import psycopg2
import psycopg2.extras
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

app = Flask(__name__, static_folder='../frontend', template_folder='../frontend')
CORS(app)

DATABASE_URL = os.environ.get("DATABASE_URL")

# ─── DB CONNECTION ───────────────────────────────────────────
def get_db():
    if DATABASE_URL:
        # Render gives postgres:// but psycopg2 needs postgresql://
        url = DATABASE_URL.replace("postgres://", "postgresql://", 1)
        conn = psycopg2.connect(url)
    else:
        # Local fallback — SQLite
        import sqlite3
        conn = sqlite3.connect('cozy.db')
        conn.row_factory = sqlite3.Row
    return conn

def is_pg():
    return bool(DATABASE_URL)

# ─── INIT TABLES ─────────────────────────────────────────────
def init_db():
    conn = get_db()
    cur = conn.cursor()
    if is_pg():
        cur.execute('''CREATE TABLE IF NOT EXISTS users
            (id SERIAL PRIMARY KEY, username TEXT UNIQUE, password TEXT)''')
        cur.execute('''CREATE TABLE IF NOT EXISTS tasks
            (id SERIAL PRIMARY KEY, username TEXT, task TEXT,
             deadline TEXT, completed INTEGER DEFAULT 0)''')
    else:
        cur.execute('''CREATE TABLE IF NOT EXISTS users
            (id INTEGER PRIMARY KEY, username TEXT UNIQUE, password TEXT)''')
        cur.execute('''CREATE TABLE IF NOT EXISTS tasks
            (id INTEGER PRIMARY KEY, username TEXT, task TEXT,
             deadline TEXT, completed INTEGER DEFAULT 0)''')
    conn.commit()
    cur.close()
    conn.close()

init_db()

# ─── SERVE FRONTEND ──────────────────────────────────────────
@app.route('/')
def index():
    return send_from_directory(app.static_folder, 'login.html')

@app.route('/<path:path>')
def static_files(path):
    return send_from_directory(app.static_folder, path)

# ─── SIGNUP ──────────────────────────────────────────────────
@app.route('/signup', methods=['POST'])
def signup():
    data = request.json
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute("INSERT INTO users (username, password) VALUES (%s, %s)" if is_pg()
                    else "INSERT INTO users (username, password) VALUES (?, ?)",
                    (data['username'], data['password']))
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({"message": "User created"})
    except Exception:
        return jsonify({"error": "Username exists"}), 400

# ─── LOGIN ───────────────────────────────────────────────────
@app.route('/login', methods=['POST'])
def login():
    data = request.json
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM users WHERE username=%s AND password=%s" if is_pg()
                else "SELECT * FROM users WHERE username=? AND password=?",
                (data['username'], data['password']))
    user = cur.fetchone()
    cur.close()
    conn.close()
    if user:
        return jsonify({"message": "Login success"})
    return jsonify({"error": "Invalid credentials"}), 401

# ─── GET TASKS ───────────────────────────────────────────────
@app.route('/tasks')
def get_tasks():
    username = request.args.get("username")
    conn = get_db()
    cur = conn.cursor()
    ph = "%s" if is_pg() else "?"
    cur.execute(f"SELECT * FROM tasks WHERE username={ph} AND completed=0", (username,))
    active = cur.fetchall()
    cur.execute(f"SELECT * FROM tasks WHERE username={ph} AND completed=1", (username,))
    completed = cur.fetchall()
    cur.close()
    conn.close()

    def row(r):
        if is_pg():
            return {"id": r[0], "username": r[1], "task": r[2], "deadline": r[3], "completed": r[4]}
        return dict(r)

    return jsonify({"active": [row(r) for r in active], "completed": [row(r) for r in completed]})

# ─── ADD TASK ────────────────────────────────────────────────
@app.route('/add', methods=['POST'])
def add_task():
    data = request.json
    conn = get_db()
    cur = conn.cursor()
    ph = "%s" if is_pg() else "?"
    cur.execute(f"INSERT INTO tasks (username, task, deadline) VALUES ({ph},{ph},{ph})",
                (data['username'], data['task'], data['deadline']))
    conn.commit()
    cur.close()
    conn.close()
    return jsonify({"message": "Added"})

# ─── COMPLETE TASK ───────────────────────────────────────────
@app.route('/complete', methods=['POST'])
def complete():
    task_id = request.json['id']
    conn = get_db()
    cur = conn.cursor()
    ph = "%s" if is_pg() else "?"
    cur.execute(f"UPDATE tasks SET completed=1 WHERE id={ph}", (task_id,))
    conn.commit()
    cur.close()
    conn.close()
    return jsonify({"message": "Done"})

# ─── DELETE TASK ─────────────────────────────────────────────
@app.route('/delete', methods=['POST'])
def delete():
    task_id = request.json['id']
    conn = get_db()
    cur = conn.cursor()
    ph = "%s" if is_pg() else "?"
    cur.execute(f"DELETE FROM tasks WHERE id={ph}", (task_id,))
    conn.commit()
    cur.close()
    conn.close()
    return jsonify({"message": "Deleted"})

if __name__ == "__main__":
    app.run(debug=True)
