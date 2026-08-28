 const state = {
        tasks: [],
        filter: "all"
    };
    function generateId() {
    return Date.now().toString();
}
function saveToStorage() {
    localStorage.setItem(
        "todo-dashboard-tasks",
        JSON.stringify(state.tasks)
    );
}
function loadFromStorage() {
    const savedTasks = localStorage.getItem("todo-dashboard-tasks");

    if (savedTasks) {
        try {
            state.tasks = JSON.parse(savedTasks);
        } catch (error) {
            state.tasks = [];
            localStorage.setItem(
                "todo-dashboard-tasks",
                JSON.stringify([])
            );
        }
    }
}
function addTask(description) {
    const trimmedDescription = description.trim();

    if (!trimmedDescription) {
        return false;
    }

    if (state.tasks.length >= 500) {
        return false;
    }

    const newTask = {
        id: generateId(),
        description: trimmedDescription,
        status: "active",
        createdAt: Date.now()
    };

    state.tasks.push(newTask);
    saveToStorage();
    renderStats()

    return true;
}
function toggleTask(id) {
    const task = state.tasks.find(function (task) {
        return task.id === id;
    });

    if (!task) {
        return;
    }

    if (task.status === "active") {
        task.status = "completed";
    } else {
        task.status = "active";
    }

    saveToStorage();
    renderTaskList();
    renderStats()
}
document.getElementById("task-list").addEventListener("change", function (event) {
    if (event.target.classList.contains("complete-toggle")) {
        const taskId = event.target.dataset.id;
        toggleTask(taskId);
    }
});
function deleteTask(id) {
    const taskIndex = state.tasks.findIndex(function (task) {
        return task.id === id;
    });

    if (taskIndex === -1) {
        return;
    }

    state.tasks.splice(taskIndex, 1);

    saveToStorage();
    renderTaskList();
    renderStats()
}
document.getElementById("task-list").addEventListener("click", function (event) {
    if (event.target.classList.contains("delete-button")) {
        const taskId = event.target.dataset.id;
        deleteTask(taskId);
    }
});
function getVisibleTasks() {
    if (state.filter === "all") {
        return state.tasks;
    }

    return state.tasks.filter(function (task) {
        return task.status === state.filter;
    });
}
document.getElementById("filter-controls").addEventListener("click", function (event) {
    if (event.target.matches("button[data-filter]")) {
        state.filter = event.target.dataset.filter;
        renderTaskList();
        renderFilterButtons();
    }
});
function renderFilterButtons() {
    const filterButtons = document.querySelectorAll("#filter-controls button");

    filterButtons.forEach(function (button) {
        if (button.dataset.filter === state.filter) {
            button.classList.add("active");
        } else {
            button.classList.remove("active");
        }
    });
}
document.getElementById("add-button").addEventListener("click", function () {
    const input = document.getElementById("task-input");

    if (addTask(input.value)) {
        input.value = "";
        renderTaskList()
        input.focus();
    }
});
function renderTaskList() {
    const taskList = document.getElementById("task-list");

    taskList.innerHTML = "";
    if (getVisibleTasks().length === 0) {
    taskList.innerHTML = "<li class=\"empty-state\">No tasks match the current view.</li>";
    return;
}

    getVisibleTasks().forEach(function (task) {
        const taskItem = document.createElement("li");

        taskItem.className = "task-item";

        if (task.status === "completed") {
            taskItem.classList.add("completed");
        }

        taskItem.innerHTML = `
            <input type="checkbox" class="complete-toggle" data-id="${task.id}" ${task.status === "completed" ? "checked" : ""}>
            <span class="task-text">${task.description}</span>
            <button class="edit-button" data-id="${task.id}">Edit</button>
            <button class="delete-button" data-id="${task.id}">Delete</button>
        `;

        taskList.appendChild(taskItem);
    });
}
function getStats() {
    const total = state.tasks.length;

    const active = state.tasks.filter(function (task) {
        return task.status === "active";
    }).length;

    const completed = state.tasks.filter(function (task) {
        return task.status === "completed";
    }).length;

    return {
        total: total,
        active: active,
        completed: completed
    };
}
function renderStats() {
    const stats = getStats();

    document.getElementById("total-tasks").textContent = stats.total;
    document.getElementById("active-tasks").textContent = stats.active;
    document.getElementById("completed-tasks").textContent = stats.completed;
}
function init() {
    loadFromStorage();
    renderTaskList();
    renderStats();
    renderFilterButtons();
}

init();
const taskInput = document.getElementById("task-input");
const validationMessage = document.getElementById("validation-message");

function showValidation(message) {
    validationMessage.textContent = message;
}

function clearValidation() {
    validationMessage.textContent = "";
}

taskInput.addEventListener("input", function () {
    clearValidation();

    if (taskInput.value.length >= 500) {
        taskInput.value = taskInput.value.slice(0, 500);
        showValidation("Character limit reached (500/500).");
    }
});

taskInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
        event.preventDefault();

        if (addTask(taskInput.value)) {
            taskInput.value = "";
            clearValidation();
            renderTaskList();
            renderStats();
            taskInput.focus();
        } else if (!taskInput.value.trim()) {
            showValidation("Task text is required.");
            taskInput.focus();
        } else if (state.tasks.length >= 500) {
            showValidation("Task limit reached (500 tasks).");
        }
    }
});
let userName = localStorage.getItem("userName") || "";
function updateGreeting() {
    const now = new Date();
    const hour = now.getHours();

    let greeting;

    if (hour >= 5 && hour < 12) {
        greeting = userName
            ? `Good morning, ${userName}!`
            : "Good morning!";
    } else if (hour >= 12 && hour < 18) {
        greeting = userName
            ? `Good afternoon, ${userName}!`
            : "Good afternoon!";
    } else {
        greeting = userName
            ? `Good evening, ${userName}!`
            : "Good evening!";
    }

    const dateText = now.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
    });

    const timeText = now.toLocaleTimeString("en-US");

    document.getElementById("greeting-message").textContent = greeting;
    document.getElementById("current-date").textContent = dateText;
    document.getElementById("current-time").textContent = timeText;
}
updateGreeting();

setInterval(updateGreeting, 1000);
let selectedDuration = Number(localStorage.getItem("pomodoroDuration")) || 25;
let timerSeconds = selectedDuration * 60;
let timerInterval = null;

function updateTimerDisplay() {
    const minutes = Math.floor(timerSeconds / 60);
    const seconds = timerSeconds % 60;

    const formattedMinutes = String(minutes).padStart(2, "0");
    const formattedSeconds = String(seconds).padStart(2, "0");

    document.getElementById("timer-display").textContent =
        `${formattedMinutes}:${formattedSeconds}`;
}

function startTimer() {
    if (timerInterval !== null) {
        return;
    }

    timerInterval = setInterval(function () {
        if (timerSeconds > 0) {
            timerSeconds--;
            updateTimerDisplay();
        } else {
            clearInterval(timerInterval);
            timerInterval = null;
        }
    }, 1000);
}

function stopTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
}

function resetTimer() {
    stopTimer();
    timerSeconds = selectedDuration * 60;
    updateTimerDisplay();
}

document.getElementById("start-timer").addEventListener("click", startTimer);
document.getElementById("stop-timer").addEventListener("click", stopTimer);
document.getElementById("reset-timer").addEventListener("click", resetTimer);
const durationSelect = document.getElementById("duration-select");

durationSelect.value = selectedDuration;

durationSelect.addEventListener("change", function () {
    selectedDuration = Number(durationSelect.value);

    localStorage.setItem("pomodoroDuration", selectedDuration);

    resetTimer();
});

updateTimerDisplay();
function editTask(id) {
    const task = state.tasks.find(function (task) {
        return task.id === id;
    });

    if (!task) {
        return;
    }

    const newDescription = prompt("Edit your task:", task.description);

    if (newDescription === null) {
        return;
    }

    const trimmedDescription = newDescription.trim();

    if (!trimmedDescription) {
        return;
    }

    task.description = trimmedDescription;

    saveToStorage();
    renderTaskList();
    renderStats();
}
document.getElementById("task-list").addEventListener("click", function (event) {
    if (event.target.classList.contains("edit-button")) {
        const taskId = event.target.dataset.id;
        editTask(taskId);
    }
});
let quickLinks = JSON.parse(localStorage.getItem("quickLinks")) || [];

function saveQuickLinks() {
    localStorage.setItem("quickLinks", JSON.stringify(quickLinks));
}

function renderQuickLinks() {
    const linkList = document.getElementById("quick-link-list");

    linkList.innerHTML = "";

    quickLinks.forEach(function (link, index) {
        const linkButton = document.createElement("a");

        linkButton.href = link.url;
        linkButton.textContent = link.name;
        linkButton.target = "_blank";
        linkButton.rel = "noopener noreferrer";
        linkButton.className = "quick-link";

        linkList.appendChild(linkButton);
    });
}

document.getElementById("add-link-button").addEventListener("click", function () {
    const nameInput = document.getElementById("link-name");
    const urlInput = document.getElementById("link-url");

    const name = nameInput.value.trim();
    const url = urlInput.value.trim();

    if (!name || !url) {
        return;
    }

    quickLinks.push({
        name: name,
        url: url
    });

    saveQuickLinks();
    renderQuickLinks();

    nameInput.value = "";
    urlInput.value = "";
});

renderQuickLinks();
function saveName() {
    const nameInput = document.getElementById("name-input");
    const name = nameInput.value.trim();

    if (!name) {
        return;
    }

    userName = name;
    localStorage.setItem("userName", userName);

    updateGreeting();

    nameInput.value = "";
}

document.getElementById("save-name-button").addEventListener("click", saveName);
const themeToggle = document.getElementById("theme-toggle");

function applyTheme() {
    const savedTheme = localStorage.getItem("theme");

    if (savedTheme === "dark") {
        document.body.classList.add("dark-mode");
        themeToggle.textContent = "☀️ Light Mode";
    } else {
        document.body.classList.remove("dark-mode");
        themeToggle.textContent = "🌙 Dark Mode";
    }
}

themeToggle.addEventListener("click", function () {
    const isDark = document.body.classList.toggle("dark-mode");

    if (isDark) {
        localStorage.setItem("theme", "dark");
        themeToggle.textContent = "☀️ Light Mode";
    } else {
        localStorage.setItem("theme", "light");
        themeToggle.textContent = "🌙 Dark Mode";
    }
});

applyTheme();