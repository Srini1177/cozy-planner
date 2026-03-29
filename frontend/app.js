const API = window.location.origin;

/* 🔐 AUTHENTICATION */
async function handleAuth(type) {
    const user = document.getElementById("username").value.trim();
    const pass = document.getElementById("password").value.trim();

    if (!user || !pass) {
        alert("Please fill in both fields ☕");
        return;
    }

    const res = await fetch(`${API}/${type}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: user, password: pass })
    });

    const data = await res.json();
    if (res.ok) {
        // Store the username so the planner knows who is logged in
        localStorage.setItem("cozy_user", user); 
        // Redirect to the main planner
        window.location.href = "index.html";
    } else {
        alert(data.error || "Something went wrong");
    }
}

function logout() {
    localStorage.removeItem("cozy_user");
    window.location.href = "login.html";
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
    if (!username) {
        window.location.href = "login.html";
        return;
    }

    // Update the "Welcome" text
    const welcomeText = document.getElementById("welcomeMessage");
    if (welcomeText) welcomeText.innerText = `welcome back, ${username}`;

    const res = await fetch(`${API}/tasks?username=${username}`);
    const data = await res.json();

    const list = document.getElementById("taskList");
    list.innerHTML = "";

    data.active.forEach((t) => {
        const coffeeClass = getCoffeeLevel(t.deadline);
        list.innerHTML += `
            <li>
                <input type="checkbox" onclick="completeTask(${t.id})">
                <div class="task-content">
                    <b>${t.task}</b>
                    <span>${t.deadline || 'no deadline'}</span>
                </div>
                <div class="coffee"><div class="coffee-fill ${coffeeClass}"></div></div>
            </li>`;
    });
}

function getCoffeeLevel(deadline) {
    if (!deadline) return "low";
    const today = new Date();
    const due = new Date(deadline);
    const diff = (due - today) / (1000 * 60 * 60 * 24);
    if (diff < 1) return "full";
    if (diff < 3) return "half";
    return "low";
}

async function completeTask(id) {
    await fetch(API + "/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
    });
    loadTasks();
}

// Initialize the page
window.onload = loadTasks;
