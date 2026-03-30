const API = window.location.origin;

/* 🔄 NAVIGATION */
document.addEventListener("DOMContentLoaded", () => {
    const user = localStorage.getItem("cozy_user");
    const path = window.location.pathname;
    const isAuthPage = path.includes("login.html");

    if (!user && !isAuthPage) {
        window.location.href = "login.html";
    } else if (user && isAuthPage) {
        window.location.href = "index.html";
    } else if (user && document.getElementById("taskList")) {
        loadTasks();
    }
});

/* 🔐 AUTH */
async function handleAuth(type) {
    const user = document.getElementById("username").value.trim();
    const pass = document.getElementById("password").value.trim();

    if (!user || !pass) return alert("Fill all fields ☕");

    try {
        const res = await fetch(`${API}/${type}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: user, password: pass })
        });

        const data = await res.json();

        if (res.ok) {
            localStorage.setItem("cozy_user", user);
            window.location.href = "index.html";
        } else {
            alert(data.error || "Auth failed");
        }
    } catch {
        alert("Server sleeping 😴 try again");
    }
}

/* 📋 LOAD TASKS */
async function loadTasks() {
    const user = localStorage.getItem("cozy_user");

    try {
        const res = await fetch(`${API}/tasks?username=${user}`);
        const data = await res.json();

        const list = document.getElementById("taskList");
        const historyList = document.getElementById("historyList");

        list.innerHTML = data.active.map(t => `
            <li>
                <input type="checkbox" onclick="completeTask(${t.id})">
                <div class="task-content">
                    <b>${t.task}</b>
                    <span>${t.deadline || 'no deadline'}</span>
                </div>
            </li>
        `).join("");

        if (historyList) {
            historyList.innerHTML = data.completed.map(t => `
                <div class="history-item">
                    ✔ ${t.task}
                </div>
            `).join("") || "no finished brews ☕";
        }

    } catch {
        console.log("error loading tasks");
    }
}

/* ➕ ADD TASK */
async function addTask() {
    const taskInput = document.getElementById("taskInput");
    const deadlineInput = document.getElementById("deadlineInput");
    const user = localStorage.getItem("cozy_user");

    if (!taskInput.value.trim()) return;

    await fetch(`${API}/add`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
            task: taskInput.value.trim(),
            deadline: deadlineInput.value,
            username: user
        })
    });

    taskInput.value = "";
    deadlineInput.value = "";
    loadTasks();
}

/* ✅ FIXED COMPLETE TASK */
async function completeTask(taskId) {
    try {
        await fetch(`${API}/complete`, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                id: taskId   // ✅ FIXED (was task_id ❌)
            })
        });

        loadTasks(); // refresh UI
    } catch (err) {
        console.error(err);
    }
}

/* 🎛️ OTHER */
function toggleHistory() {
    document.getElementById("historySection").classList.toggle("show");
}

function logout() {
    localStorage.removeItem("cozy_user");
    window.location.href = "login.html";
}

window.addTask = addTask;
window.completeTask = completeTask;
window.toggleHistory = toggleHistory;
window.logout = logout;
