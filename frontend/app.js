/* 🚀 DEPLOYMENT CONFIG: Uses relative paths for GitHub/Cloud hosting */
const API = window.location.origin; 

/* 🔄 INITIALIZE */
document.addEventListener("DOMContentLoaded", () => {
    const user = localStorage.getItem("cozy_user");
    
    // Redirect to login if no user is found, unless already on login/signup pages
    const isAuthPage = window.location.pathname.includes("login.html") || 
                       window.location.pathname.includes("signup.html");
                       
    if (!user && !isAuthPage) {
        window.location.href = "login.html";
    } else if (document.getElementById("taskList")) {
        loadTasks();
    }
});

/* 📋 LOAD TASKS */
async function loadTasks() {
    const user = localStorage.getItem("cozy_user") || "Guest";
    const welcome = document.getElementById("welcomeMsg");
    if (welcome) welcome.innerText = `welcome back, ${user}`;

    try {
        const res = await fetch(`${API}/tasks?username=${user}`);
        const data = await res.json();

        const list = document.getElementById("taskList");
        const historyList = document.getElementById("historyList");
        const dayPlan = document.getElementById("dayPlan");

        if (dayPlan) {
            dayPlan.innerText = data.active.length > 0 
                ? `Start with "${data.active[0].task}"` 
                : "☕ add something to start your day";
        }

        // Active Tasks with Steam and Alignment
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
                        <div class="coffee">
                            <div class="coffee-fill ${level}"></div>
                        </div>
                    </div>
                </li>`;
        }).join("");

        // History Tasks
        if (historyList) {
            historyList.innerHTML = data.completed.map(t => 
                `<div class="history-item">✔ ${t.task}</div>`
            ).join("");
        }
    } catch (err) {
        console.error("Deployment Error: Ensure backend is running.", err);
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            task: taskInput.value, 
            deadline: deadlineInput.value,
            username: user 
        })
    });

    taskInput.value = "";
    loadTasks();
}

/* ✅ COMPLETE TASK */
async function completeTask(index) {
    await fetch(`${API}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ index })
    });
    loadTasks();
}

/* 📜 UTILITIES */
function toggleHistory() {
    const historySection = document.getElementById("historySection");
    if (historySection) historySection.classList.toggle("show");
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

// Global exposure for HTML onclick events
window.addTask = addTask;
window.completeTask = completeTask;
window.toggleHistory = toggleHistory;
window.logout = logout;
