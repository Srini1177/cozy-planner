const API = window.location.origin;

/* 🛠️ NAVIGATION & STARTUP */
window.onload = () => {
    const user = localStorage.getItem("cozy_user");
    const isLoginPage = window.location.pathname.includes("login.html");

    if (!user && !isLoginPage) {
        window.location.href = "login.html";
    } else if (user) {
        loadTasks();
    }
};

/* 🔐 AUTHENTICATION */
async function handleAuth(type) {
    const user = document.getElementById("username").value.trim();
    const pass = document.getElementById("password").value.trim();
    if (!user || !pass) return alert("Coffee first, then login! ☕");

    const res = await fetch(`${API}/${type}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: user, password: pass })
    });

    if (res.ok) {
        localStorage.setItem("cozy_user", user);
        window.location.href = "index.html";
    } else {
        const data = await res.json();
        alert(data.error);
    }
}

/* 📋 TASK MANAGEMENT */
async function addTask() {
    const task = document.getElementById("taskInput").value.trim();
    const deadline = document.getElementById("deadlineInput").value;
    const username = localStorage.getItem("cozy_user");
    if (!task) return;

    await fetch(`${API}/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task, deadline, username })
    });

    document.getElementById("taskInput").value = "";
    loadTasks();
}

async function loadTasks() {
    const user = localStorage.getItem("cozy_user");
    const welcome = document.getElementById("welcomeMsg");
    if (welcome) welcome.innerText = `welcome back, ${user}`;

    const res = await fetch(`${API}/tasks?username=${user}`);
    const data = await res.json();

    // Render Active Tasks
    const list = document.getElementById("taskList");
    list.innerHTML = "";
    data.active.forEach(t => {
        const level = getCoffeeLevel(t.deadline);
        list.innerHTML += `
            <li>
                <input type="checkbox" onclick="completeTask(${t.id})">
                <div class="task-content">
                    <b>${t.task}</b>
                    <span style="font-size: 11px; color: #8d6e63;">${t.deadline || 'no deadline'}</span>
                </div>
                <div class="coffee-wrapper">
                    <div class="steam"></div>
                    <div class="coffee"><div class="coffee-fill ${level}"></div></div>
                </div>
            </li>`;
    });

    // Render History
    const historyList = document.getElementById("historyList");
    if (historyList) {
        historyList.innerHTML = data.completed.map(t => 
            `<li style="opacity: 0.6; text-decoration: line-through; border-style: dashed;">${t.task}</li>`
        ).join("");
    }
}

async function completeTask(id) {
    await fetch(`${API}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
    });
    loadTasks();
}

/* 📜 UTILITIES */
function toggleHistory() {
    const hist = document.getElementById("historySection");
    hist.style.display = hist.style.display === "none" ? "block" : "none";
}

function logout() {
    localStorage.removeItem("cozy_user");
    window.location.href = "login.html";
}

function getCoffeeLevel(deadline) {
    if (!deadline) return "low";
    const days = (new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24);
    return days < 1 ? "full" : days < 3 ? "half" : "low";
}

// Global Exports
window.handleAuth = handleAuth;
window.logout = logout;
window.addTask = addTask;
window.toggleHistory = toggleHistory;
window.completeTask = completeTask;
