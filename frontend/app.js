const API = window.location.origin;

/* 🛠️ PAGE DETECTOR */
window.onload = () => {
    const user = localStorage.getItem("cozy_user");
    const isLoginPage = window.location.pathname.includes("login.html");

    // If on the root "/" or empty path, decide where to send the user
    if (window.location.pathname === "/" || window.location.pathname === "") {
        window.location.href = user ? "index.html" : "login.html";
        return;
    }

    if (!user && !isLoginPage) {
        window.location.href = "login.html";
    } else if (user && isLoginPage) {
        window.location.href = "index.html";
    } else if (user) {
        loadTasks();
    }
};

/* 🔐 AUTHENTICATION */
async function handleAuth(type) {
    const userField = document.getElementById("username");
    const passField = document.getElementById("password");
    if (!userField || !passField) return;

    const user = userField.value.trim();
    const pass = passField.value.trim();

    if (!user || !pass) {
        alert("Fill in the blanks! ☕");
        return;
    }

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
            alert(data.error || "Login failed");
        }
    } catch (err) {
        alert("Server error. Check your backend!");
    }
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
    const welcome = document.getElementById("welcomeMsg");
    if (welcome) welcome.innerText = `welcome back, ${username}`;

    try {
        const res = await fetch(`${API}/tasks?username=${username}`);
        const data = await res.json();
        const list = document.getElementById("taskList");
        if (!list) return;

        list.innerHTML = "";
        data.active.forEach(t => {
            const level = getCoffeeLevel(t.deadline);
            list.innerHTML += `
                <li>
                    <input type="checkbox" onclick="completeTask(${t.id})">
                    <div class="task-content">
                        <b>${t.task}</b>
                        <span>${t.deadline || 'No deadline'}</span>
                    </div>
                    <div class="coffee"><div class="coffee-fill ${level}"></div></div>
                </li>`;
        });
    } catch (err) {
        console.log("Loading error");
    }
}

async function completeTask(id) {
    await fetch(API + "/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
    });
    loadTasks();
}

function logout() {
    localStorage.removeItem("cozy_user");
    window.location.href = "login.html";
}

function getCoffeeLevel(deadline) {
    if (!deadline) return "low";
    const diff = (new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24);
    return diff < 1 ? "full" : diff < 3 ? "half" : "low";
}

// Global scope
window.handleAuth = handleAuth;
window.logout = logout;
window.addTask = addTask;
window.completeTask = completeTask;
