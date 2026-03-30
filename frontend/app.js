const API = window.location.origin;

/* 🔄 NAVIGATION & ROUTING */
document.addEventListener("DOMContentLoaded", () => {
    const user = localStorage.getItem("cozy_user");
    const path = window.location.pathname;
    const isAuthPage = path.includes("login.html") || path.includes("signup.html");

    if (!user && !isAuthPage) {
        window.location.href = "login.html";
    } else if (user && isAuthPage) {
        window.location.href = "index.html";
    } else if (user && document.getElementById("taskList")) {
        loadTasks();
    }
});

async function handleAuth(type) {
    const user = document.getElementById("username").value.trim();
    const pass = document.getElementById("password").value.trim();

    if (!user || !pass) return alert("Please fill in all fields! ☕");

    try {
        const res = await fetch(`${API}/${type}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: user, password: pass })
        });

        if (res.ok) {
            localStorage.setItem("cozy_user", user);
            window.location.href = "index.html"; // Redirect after success
        } else {
            const data = await res.json();
            alert(data.error || "Authentication failed");
        }
    } catch (err) {
        alert("Server is sleeping. Please try again later.");
    }
}

/* 📋 LOAD TASKS & HISTORY */
async function loadTasks() {
    const user = localStorage.getItem("cozy_user") || "Guest";
    const welcome = document.getElementById("welcomeMsg");
    if (welcome) welcome.innerText = `welcome back, ${user}`;

    try {
        const res = await fetch(`${API}/tasks?username=${user}`);
        const data = await res.json();
        
        const list = document.getElementById("taskList");
        const historyList = document.getElementById("historyList");

        // 1. Render Active Tasks
        list.innerHTML = data.active.map((t, i) => {
            const level = getCoffeeLevel(t.deadline);
            return `
                <li>
                    // ... inside list.innerHTML mapping ...
                    <input type="checkbox" onclick="completeTask(${t.id || i}, '${t.task}')">
                    <div class="task-content">
                        <b>${t.task}</b>
                        <span>${t.deadline || 'no deadline'}</span>
                    </div>
                    <div class="coffee-wrapper">
                        <div class="steam">☁️</div>
                        <div class="coffee">
                            <div class="coffee-fill ${level}"></div>
                        </div>
                    </div>
                </li>`;
        }).join("");

        // 2. Render History (Finished Brews)
        if (historyList) {
            if (data.completed.length === 0) {
                historyList.innerHTML = `<p style="font-size:11px; color:#8d6e63; text-align:center;">no finished brews yet ☕</p>`;
            } else {
                historyList.innerHTML = data.completed.map(t => 
                    `<div class="history-item">
                        <span>✔ ${t.task}</span>
                        <small>${t.deadline || ''}</small>
                    </div>`
                ).join("");
            }
        }
    } catch (err) {
        console.log("Cafe is syncing...");
    }
}

/* ➕ ADD TASK */
async function addTask() {
    const taskInput = document.getElementById("taskInput");
    const deadlineInput = document.getElementById("deadlineInput");
    const user = localStorage.getItem("cozy_user");

    if (!taskInput || !taskInput.value.trim()) return;

    try {
        await fetch(`${API}/add`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                task: taskInput.value.trim(), 
                deadline: deadlineInput ? deadlineInput.value : "",
                username: user 
            })
        });
        taskInput.value = "";
        if (deadlineInput) deadlineInput.value = "";
        loadTasks();
    } catch (err) {
        console.error("Add failed:", err);
    }
}

/* ✅ COMPLETE TASK */
/* ✅ COMPLETE TASK - FIXED */
async function completeTask(taskId, taskName) {
    const user = localStorage.getItem("cozy_user");
    
    try {
        await fetch(`${API}/complete`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                username: user,
                task_id: taskId,
                task_name: taskName // Sending the name ensures the backend finds the right one
            })
        });
        
        // Refresh the list so it disappears from 'Active' and appears in 'History'
        loadTasks(); 
    } catch (err) {
        console.error("Could not complete task:", err);
    }
}

// Ensure the window can see the updated function
window.completeTask = completeTask;

/* 📜 TOGGLE HISTORY */
function toggleHistory() {
    const section = document.getElementById("historySection");
    if (section) {
        section.classList.toggle("show");
    }
}

function logout() {
    localStorage.removeItem("cozy_user");
    window.location.href = "login.html";
}

function getCoffeeLevel(deadline) {
    if (!deadline) return "low";
    const diff = (new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24);
    if (diff <= 1) return "full";
    if (diff <= 3) return "half";
    return "low";
}

// Global exposure for HTML onclicks
window.addTask = addTask;
window.completeTask = completeTask;
window.toggleHistory = toggleHistory;
window.logout = logout;
