const API = window.location.origin;

/* 🛠️ PAGE DETECTOR */
// This runs automatically to see if we are on the login page or the planner page
window.onload = () => {
    const user = localStorage.getItem("cozy_user");
    const isLoginPage = window.location.pathname.includes("login.html");

    if (!user && !isLoginPage) {
        // If not logged in and trying to see tasks, send to login
        window.location.href = "login.html";
    } else if (user && isLoginPage) {
        // If already logged in and on login page, send to planner
        window.location.href = "index.html";
    } else if (user) {
        // If logged in and on planner, load the tasks
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
            window.location.href = "index.html"; // Redirect to planner
        } else {
            alert(data.error || "Login failed");
        }
    } catch (err) {
        console.error("Auth error:", err);
        alert("Server is sleeping. Try again in a minute!");
    }
}

/* 📋 TASK MANAGEMENT */
async function loadTasks() {
    const username = localStorage.getItem("cozy_user");
    
    // Update the UI with the name
    const welcome = document.getElementById("welcomeMessage");
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
        console.log("Could not load tasks yet.");
    }
}

function logout() {
    localStorage.removeItem("cozy_user");
    window.location.href = "login.html";
}

// Utility for coffee levels
function getCoffeeLevel(deadline) {
    if (!deadline) return "low";
    const diff = (new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24);
    return diff < 1 ? "full" : diff < 3 ? "half" : "low";
}

// Global scope for HTML buttons
window.handleAuth = handleAuth;
window.logout = logout;
