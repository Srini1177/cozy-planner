const API = window.location.origin; 

document.addEventListener("DOMContentLoaded", () => {
    const user = localStorage.getItem("cozy_user");
    const isAuthPage = window.location.pathname.includes("login.html") || 
                       window.location.pathname.includes("signup.html");
                       
    if (!user && !isAuthPage) {
        window.location.href = "login.html";
    } else if (document.getElementById("taskList")) {
        loadTasks();
    }
});

async function loadTasks() {
    const user = localStorage.getItem("cozy_user") || "Guest";
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
                        <div class="coffee">
                            <div class="coffee-fill ${level}"></div>
                        </div>
                    </div>
                </li>`;
        }).join("");

        if (historyList) {
            historyList.innerHTML = data.completed.map(t => 
                `<div class="history-item">✔ ${t.task}</div>`
            ).join("");
        }
    } catch (err) {
        console.log("Waiting for backend...");
    }
}

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

async function completeTask(index) {
    await fetch(`${API}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ index })
    });
    loadTasks();
}

function toggleHistory() {
    const section = document.getElementById("historySection");
    if (section) section.classList.toggle("show");
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

window.addTask = addTask;
window.completeTask = completeTask;
window.toggleHistory = toggleHistory;
window.logout = logout;
