const API = window.location.origin;

/* 🔄 NAVIGATION & ROUTING */
document.addEventListener("DOMContentLoaded", () => {
    const user = localStorage.getItem("cozy_user");
    const path = window.location.pathname;
    const isAuthPage = path.includes("login.html") || path.includes("signup.html") || path === "/";

    // If no user and NOT on login page -> go to login
    if (!user && !isAuthPage) {
        window.location.href = "login.html";
    } 
    // If user exists and IS on login page -> go to dashboard
    else if (user && isAuthPage) {
        window.location.href = "index.html";
    } 
    // Otherwise, if we are on the dashboard, load the data
    else if (user && document.getElementById("taskList")) {
        loadTasks();
    }
});

/* 🔐 AUTHENTICATION (For login.html / signup.html) */
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

/* 📋 DASHBOARD LOGIC */
async function loadTasks() {
    const user = localStorage.getItem("cozy_user");
    const welcome = document.getElementById("welcomeMsg");
    if (welcome) welcome.innerText = `welcome back, ${user}`;

    try {
        const res = await fetch(`${API}/tasks?username=${user}`);
        const data = await res.json();

        const list = document.getElementById("taskList");
        const historyList = document.getElementById("historyList");

        list.innerHTML = data.active.map((t, i) => {
            const level = getCoffeeLevel(t.deadline);
            return `
                <li>
                    <input type="checkbox" onclick="completeTask(${i})">
                    <div class="task-content">
                        <b>${t.task}</b>
                        <span>${t.deadline || 'no deadline'}</span>
                    </div>
                    <div class="coffee-wrapper">
                        <div class="steam">☁️</div>
                        <div class="coffee"><div class="coffee-fill ${level}"></div></div>
                    </div>
                </li>`;
        }).join("");

        if (historyList) {
            historyList.innerHTML = data.completed.map(t => 
                `<div class="history-item">✔ ${t.task}</div>`
            ).join("");
        }
    } catch (err) {
        console.log("Fetching tasks...");
    }
}

function logout() {
    localStorage.removeItem("cozy_user");
    window.location.href = "login.html";
}

// Global exposure
window.handleAuth = handleAuth;
window.logout = logout;
