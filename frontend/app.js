const API = window.location.origin;

/* 🔄 ROUTING */
document.addEventListener("DOMContentLoaded", () => {
  const user = localStorage.getItem("cozy_user");
  const path = window.location.pathname;

  if (!user && !path.includes("login.html")) {
    window.location.href = "login.html";
  } else if (user && path.includes("login.html")) {
    window.location.href = "index.html";
  } else if (user && document.getElementById("taskList")) {
    loadTasks();
  }
});

/* 🔐 LOGIN + SIGNUP */
async function handleAuth(type) {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!username || !password) return alert("Fill all fields ☕");

  const res = await fetch(`${API}/${type}`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ username, password })
  });

  const data = await res.json();

  if (res.ok) {
    localStorage.setItem("cozy_user", username);
    window.location.href = "index.html";
  } else {
    alert(data.error);
  }
}

/* ➕ ADD TASK */
async function addTask() {
  const task = document.getElementById("taskInput").value.trim();
  const deadline = document.getElementById("deadlineInput").value;
  const username = localStorage.getItem("cozy_user");

  if (!task) return;

  await fetch(`${API}/add`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ task, deadline, username })
  });

  document.getElementById("taskInput").value = "";
  document.getElementById("deadlineInput").value = "";

  loadTasks();
}

/* ✅ COMPLETE TASK */
async function completeTask(id) {
  await fetch(`${API}/complete`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ id })
  });

  loadTasks();
}

/* ❌ DELETE TASK */
async function deleteTask(id) {
  await fetch(`${API}/delete`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ id })
  });

  loadTasks();
}

/* 📜 TOGGLE HISTORY */
function toggleHistory() {
  document.getElementById("historyList").classList.toggle("show");
}

/* ☕ COFFEE LEVEL */
function getCoffeeLevel(deadline) {
  if (!deadline) return "low";

  const diff = (new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24);

  if (diff <= 1) return "full";
  if (diff <= 3) return "half";
  return "low";
}

/* 📋 LOAD TASKS */
async function loadTasks() {
  const username = localStorage.getItem("cozy_user");

  const res = await fetch(`${API}/tasks?username=${username}`);
  const data = await res.json();

  const list = document.getElementById("taskList");
  const history = document.getElementById("historyList");

  list.innerHTML = "";
  history.innerHTML = "";

  /* ACTIVE TASKS */
  data.active.forEach(t => {
    const level = getCoffeeLevel(t.deadline);

    list.innerHTML += `
      <li>
        <input type="checkbox" onclick="completeTask(${t.id})">

        <div class="task-content">
          <b>${t.task}</b>
          <span>${t.deadline || "no deadline"}</span>
        </div>

        <div class="coffee">
          <div class="coffee-fill ${level}"></div>
        </div>

        <button class="delete-btn" onclick="deleteTask(${t.id})">✖</button>
      </li>
    `;
  });

  /* COMPLETED TASKS */
  data.completed.forEach(t => {
    history.innerHTML += `<div>✔ ${t.task}</div>`;
  });
}

/* 🚪 LOGOUT */
function logout() {
  localStorage.removeItem("cozy_user");
  window.location.href = "login.html";
}

/* 🌍 GLOBAL */
window.addTask = addTask;
window.completeTask = completeTask;
window.deleteTask = deleteTask;
window.toggleHistory = toggleHistory;
window.logout = logout;
window.handleAuth = handleAuth;
