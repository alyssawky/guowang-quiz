const STORAGE_KEY = "guowang-study-progress";

function loadProgress() {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved) {
        return JSON.parse(saved);
    }

    const initialProgress = {};

    studyPlan.forEach(task => {
        initialProgress[task.id] = task.defaultCompleted;
    });

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(initialProgress)
    );

    return initialProgress;
}

let progress = loadProgress();

function saveProgress() {
    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(progress)
    );
}

function toggleTask(taskId) {
    progress[taskId] = !progress[taskId];

    saveProgress();

    render();
}

function renderTasks() {
    const container = document.getElementById("task-list");

    container.innerHTML = "";

    studyPlan.forEach(task => {
        const completed = progress[task.id];

        const card = document.createElement("div");

        card.className = "task-card";

        card.innerHTML = `
            <div class="task-info">

                <div class="task-module">
                    ${task.category} · ${task.module}
                </div>

                <div class="task-name">
                    ${completed ? "✓ " : ""}
                    ${task.name}
                </div>

                <div class="task-week">
                    ${task.week}
                </div>

            </div>

            <button
                class="${completed ? "completed" : ""}"
                onclick="toggleTask('${task.id}')"
            >
                ${completed ? "已完成" : "标记完成"}
            </button>
        `;

        container.appendChild(card);
    });
}

function renderReviewPool() {
    const container = document.getElementById("review-list");

    container.innerHTML = "";

    const unlocked = studyPlan.filter(
        task => progress[task.id]
    );

    if (unlocked.length === 0) {
        container.innerHTML = `
            <div class="empty-message">
                还没有已经解锁的复习内容
            </div>
        `;

        return;
    }

    unlocked.forEach(task => {
        const card = document.createElement("div");

        card.className = "review-card";

        card.innerHTML = `
            <strong>
                ${task.name}
            </strong>

            <span>
                ${task.category} · ${task.module}
            </span>
        `;

        container.appendChild(card);
    });
}

function renderSummary() {
    const completed = studyPlan.filter(
        task => progress[task.id]
    ).length;

    document.getElementById("completed-count").textContent =
        completed;

    document.getElementById("review-count").textContent =
        completed;

    document.getElementById("total-count").textContent =
        studyPlan.length;
}

function render() {
    renderTasks();

    renderReviewPool();

    renderSummary();
}

render();
