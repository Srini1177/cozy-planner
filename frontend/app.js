const API = window.location.origin; // Update this after you deploy!

/* 🔐 AUTHENTICATION */
async function handleAuth(type) {
    const user = document.getElementById("username").value.trim();
    const pass = document.getElementById("password").value.trim();

    const res = await fetch(`${API}/${type}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: user, password: pass })
    });

    const data = await res.json();
    if (res.ok) {
        localStorage.setItem("cozy_user", data.username);
        location.reload();
    } else {
        alert(data.error);
    }
}

function logout() {
    localStorage.removeItem("cozy_user");
    location.reload();
}

/* 📋 TASK MANAGEMENT */
async function addTask() {
    const task = document.getElementById("taskInput").value.trim();
    const deadline = document.getElementById("deadlineInput").value;
    const username = localStorage.getItem("cozy_user");

    if (!task) return;

    await fetch(API + "/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task, deadline, username })
    });

    document.getElementById("taskInput").value = "";
    loadTasks();
}

async function loadTasks() {
    const username = localStorage.getItem("cozy_user");
    const res = await fetch(`${API}/tasks?username=${username}`);
    const data = await res.json();

    const list = document.getElementById("taskList");
    const history = document.getElementById("historyList");
    list.innerHTML = "";
    history.innerHTML = "";
    
    document.getElementById("dayPlan").innerText = generateDayPlan(data.active);

    data.active.forEach((t) => {
        const level = getCoffeeLevel(t.deadline);
        list.innerHTML += `
            <li>
                <input type="checkbox" onclick="completeTask(${t.id})">
                <div class="task-content">
                    <b>${t.task}</b>
                    <span>${t.deadline || "no deadline"}</span>
                </div>
                <div class="coffee"><div class="coffee-fill ${level}"></div></div>
            </li>`;
    });

    data.completed.forEach(t => {
        history.innerHTML += `<div> ✔ ${t.task}</div>`;
    });
}

async function completeTask(taskId) {
    await fetch(API + "/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: taskId })
    });
    loadTasks();
}

/* 🌤️ HELPERS [cite: 144, 177] */
function generateDayPlan(tasks) {
    return tasks.length === 0 ? "☕ add something to start your day" : `Start with "${tasks[0].task}"`;
}

function getCoffeeLevel(deadline) {
    if (!deadline) return "low";
    const diff = (new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24);
    return diff <= 1 ? "full" : diff <= 3 ? "half" : "low";
}

function toggleHistory() {
    document.getElementById("historyList").classList.toggle("show");
}

/* 🚀 INIT */
window.onload = () => {
    const user = localStorage.getItem("cozy_user");
    if (user) {
        document.getElementById("authSection").style.display = "none";
        document.getElementById("mainPlanner").style.display = "block";
        document.getElementById("welcomeMsg").innerText = `welcome back, ${user}`;
        loadTasks();
    }
};