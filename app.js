const STORAGE_KEY = "guowang-study-progress";
const ANSWER_HISTORY_KEY = "guowang-answer-history";

function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

function parseLocalDate(dateString) {
    if (!dateString) return null;
    const [year, month, day] = dateString.split("-").map(Number);
    return new Date(year, month - 1, day);
}

function startOfDay(date = new Date()) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

function getMonday(date) {
    const d = startOfDay(date);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    return addDays(d, diff);
}

function formatMonthDay(date) {
    return `${date.getMonth() + 1}月${date.getDate()}日`;
}

function formatDateRange(startDate, endDate) {
    if (!startDate || !endDate) return "";
    return `${startDate.replaceAll("-", ".")} — ${endDate.replaceAll("-", ".")}`;
}

function taskIsCurrent(task, today = startOfDay()) {
    const start = parseLocalDate(task.startDate);
    const end = parseLocalDate(task.endDate);
    if (!start || !end) return false;
    return start <= today && today <= end;
}

function taskIsOverdue(task, today = startOfDay()) {
    const end = parseLocalDate(task.endDate);
    return Boolean(end && end < today && !progress[task.id]);
}

function taskOverlapsWeek(task, weekStart, weekEnd) {
    const start = parseLocalDate(task.startDate);
    const end = parseLocalDate(task.endDate);
    if (!start || !end) return false;
    return start <= weekEnd && end >= weekStart;
}

function getVisibleStudyTasks() {
    const today = startOfDay();
    return studyPlan.filter(task =>
        taskIsCurrent(task, today) ||
        taskIsOverdue(task, today)
    );
}

function loadProgress() {
    const saved = localStorage.getItem(STORAGE_KEY);
    let savedProgress = {};

    if (saved) {
        try {
            savedProgress = JSON.parse(saved);
        } catch (error) {
            savedProgress = {};
        }
    }

    studyPlan.forEach(task => {
        if (!(task.id in savedProgress)) {
            savedProgress[task.id] = task.defaultCompleted;
        }
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedProgress));
    return savedProgress;
}

let progress = loadProgress();

function saveProgress() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

function loadAnswerHistory() {
    const saved = localStorage.getItem(ANSWER_HISTORY_KEY);
    if (!saved) return {};

    try {
        return JSON.parse(saved);
    } catch (error) {
        return {};
    }
}

let answerHistory = loadAnswerHistory();

function saveAnswerHistory() {
    localStorage.setItem(ANSWER_HISTORY_KEY, JSON.stringify(answerHistory));
}

function recordAnswer(questionId, isCorrect) {
    if (!answerHistory[questionId]) {
        answerHistory[questionId] = {
            attempts: 0,
            correct: 0,
            wrong: 0,
            lastCorrect: null,
            lastAnsweredAt: null
        };
    }

    const record = answerHistory[questionId];
    record.attempts++;

    if (isCorrect) {
        record.correct++;
    } else {
        record.wrong++;
    }

    record.lastCorrect = isCorrect;
    record.lastAnsweredAt = new Date().toISOString();
    saveAnswerHistory();
}

function toggleTask(taskId) {
    progress[taskId] = !progress[taskId];
    saveProgress();
    render();
}

function renderCalendar() {
    const dateElement = document.getElementById("calendar-date");
    const dayElement = document.getElementById("calendar-day");
    const weekElement = document.getElementById("calendar-week");
    const stripElement = document.getElementById("week-strip");
    const taskCountElement = document.getElementById("week-task-count");
    const taskListElement = document.getElementById("week-task-list");

    if (!dateElement || !dayElement || !weekElement || !stripElement || !taskListElement) {
        return;
    }

    const today = startOfDay();
    const weekStart = getMonday(today);
    const weekEnd = addDays(weekStart, 6);
    const weekdays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
    const shortWeekdays = ["日", "一", "二", "三", "四", "五", "六"];

    dateElement.textContent = `${today.getMonth() + 1}月${today.getDate()}日`;
    dayElement.textContent = `${today.getFullYear()}年 · ${weekdays[today.getDay()]}`;
    weekElement.textContent = `本周 ${formatMonthDay(weekStart)} — ${formatMonthDay(weekEnd)}`;

    stripElement.innerHTML = "";

    for (let i = 0; i < 7; i++) {
        const date = addDays(weekStart, i);
        const item = document.createElement("div");
        item.className = "week-day";

        if (date.getTime() === today.getTime()) {
            item.classList.add("today");
        }

        item.innerHTML = `
            <span class="dow">${shortWeekdays[date.getDay()]}</span>
            <span class="dom">${date.getDate()}</span>
        `;

        stripElement.appendChild(item);
    }

    const weekTasks = studyPlan.filter(task =>
        taskOverlapsWeek(task, weekStart, weekEnd)
    );

    const finishedCount = weekTasks.filter(task => progress[task.id]).length;

    if (taskCountElement) {
        taskCountElement.textContent = `${finishedCount}/${weekTasks.length} 完成`;
    }

    taskListElement.innerHTML = "";

    if (weekTasks.length === 0) {
        taskListElement.innerHTML = `<div class="week-task-item">本周暂无计划</div>`;
        return;
    }

    weekTasks.forEach(task => {
        const item = document.createElement("div");
        item.className = `week-task-item${progress[task.id] ? " done" : ""}`;

        item.innerHTML = `
            <span class="week-task-dot"></span>
            <span>${progress[task.id] ? "✓ " : ""}${task.category} · ${task.name}</span>
        `;

        taskListElement.appendChild(item);
    });
}

function renderTasks() {
    const container = document.getElementById("task-list");
    const countElement = document.getElementById("visible-task-count");
    if (!container) return;

    container.innerHTML = "";
    const visibleTasks = getVisibleStudyTasks();

    if (countElement) {
        countElement.textContent = `${visibleTasks.length} 项`;
    }

    if (visibleTasks.length === 0) {
        container.innerHTML = `
            <div class="empty-message">
                当前没有需要打卡的任务
            </div>
        `;
        return;
    }

    visibleTasks.forEach(task => {
        const completed = Boolean(progress[task.id]);
        const overdue = taskIsOverdue(task);
        const statusText = overdue ? "逾期未完成" : "当前计划";

        const card = document.createElement("div");
        card.className = `task-card${overdue ? " overdue" : ""}`;

        card.innerHTML = `
            <div class="task-info">
                <div class="task-module">
                    ${task.category} · ${task.module}
                    <span class="status-chip">${statusText}</span>
                </div>

                <div class="task-name">
                    ${completed ? "✓ " : ""}${task.name}
                </div>

                <div class="task-week">
                    ${task.week} · ${formatDateRange(task.startDate, task.endDate)}
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
    const countElement = document.getElementById("unlocked-task-count");
    if (!container) return;

    container.innerHTML = "";

    const unlockedTasks = studyPlan.filter(task =>
        Boolean(progress[task.id])
    );

    if (countElement) {
        countElement.textContent = `${unlockedTasks.length} 项`;
    }

    if (unlockedTasks.length === 0) {
        container.innerHTML = `
            <div class="empty-message">
                还没有已经解锁的复习内容
            </div>
        `;
        return;
    }

    unlockedTasks.forEach(task => {
        const questionCount = questions.filter(
            question => question.taskId === task.id
        ).length;

        const card = document.createElement("div");
        card.className = "review-card";

        card.innerHTML = `
            <strong>${task.name}</strong>
            <span>
                ${task.category} · ${task.module}
                ${questionCount > 0 ? ` · ${questionCount} 道题` : " · 暂无题目"}
            </span>
        `;

        container.appendChild(card);
    });
}

function createWrongQuestionCard(question, record, task) {
    const attempts = Number(record.attempts || 0);
    const correct = Number(record.correct || 0);
    const wrong = Number(record.wrong || 0);
    const accuracy = attempts > 0
        ? Math.round((correct / attempts) * 100)
        : 0;

    const lastResult = record.lastCorrect === true
        ? "正确"
        : record.lastCorrect === false
            ? "错误"
            : "暂无";

    const card = document.createElement("div");
    card.className = "review-card";
    card.style.marginTop = "10px";

    card.innerHTML = `
        <div style="width: 100%;">
            <div class="task-module">
                ${task ? `${task.category} · ${task.module}` : ""}
            </div>

            <strong style="display:block; margin-top:8px; line-height:1.6;">
                ${question.question}
            </strong>

            <div style="margin-top:12px; color:#667085; font-size:14px; line-height:1.8;">
                做题 ${attempts} 次
                ｜ 正确 ${correct}
                ｜ 错误 ${wrong}
                ｜ 正确率 ${accuracy}%
                <br>
                最近一次：${lastResult}
            </div>
        </div>
    `;

    return card;
}

function renderWrongList() {
    const container = document.getElementById("wrong-list");
    const countElement = document.getElementById("wrong-total-count");
    if (!container) return;

    container.innerHTML = "";

    const wrongQuestions = questions.filter(question => {
        const record = answerHistory[question.id];
        return Boolean(record && Number(record.wrong) > 0);
    });

    if (countElement) {
        countElement.textContent = `${wrongQuestions.length} 道`;
    }

    if (wrongQuestions.length === 0) {
        container.innerHTML = `
            <div class="empty-message">
                暂时没有错题
            </div>
        `;
        return;
    }

    const grouped = {};

    wrongQuestions.forEach(question => {
        const task = studyPlan.find(item => item.id === question.taskId);
        const category = task ? task.category : "其他";
        const module = task ? task.module : "未分类";

        if (!grouped[category]) grouped[category] = {};
        if (!grouped[category][module]) grouped[category][module] = [];

        grouped[category][module].push({
            question,
            task,
            record: answerHistory[question.id]
        });
    });

    const categoryOrder = [];

    studyPlan.forEach(task => {
        if (!categoryOrder.includes(task.category)) {
            categoryOrder.push(task.category);
        }
    });

    Object.keys(grouped).forEach(category => {
        if (!categoryOrder.includes(category)) {
            categoryOrder.push(category);
        }
    });

    categoryOrder.forEach(category => {
        if (!grouped[category]) return;

        const categoryModules = grouped[category];
        const categoryCount = Object.values(categoryModules)
            .reduce((sum, items) => sum + items.length, 0);

        const categoryDetails = document.createElement("details");
        categoryDetails.style.marginBottom = "14px";
        categoryDetails.style.background = "white";
        categoryDetails.style.borderRadius = "14px";
        categoryDetails.style.padding = "16px 18px";

        const categorySummary = document.createElement("summary");
        categorySummary.style.cursor = "pointer";
        categorySummary.style.fontWeight = "600";
        categorySummary.innerHTML = `
            ${category}
            <span style="margin-left:8px; color:#86868b; font-size:13px; font-weight:400;">
                ${categoryCount} 道
            </span>
        `;

        categoryDetails.appendChild(categorySummary);

        const moduleOrder = [];

        studyPlan
            .filter(task => task.category === category)
            .forEach(task => {
                if (!moduleOrder.includes(task.module)) {
                    moduleOrder.push(task.module);
                }
            });

        Object.keys(categoryModules).forEach(module => {
            if (!moduleOrder.includes(module)) {
                moduleOrder.push(module);
            }
        });

        moduleOrder.forEach(module => {
            const items = categoryModules[module];
            if (!items || items.length === 0) return;

            const moduleDetails = document.createElement("details");
            moduleDetails.style.marginTop = "12px";
            moduleDetails.style.background = "#f7f8fa";
            moduleDetails.style.borderRadius = "12px";
            moduleDetails.style.padding = "12px 14px";

            const moduleSummary = document.createElement("summary");
            moduleSummary.style.cursor = "pointer";
            moduleSummary.style.fontWeight = "500";
            moduleSummary.innerHTML = `
                ${module}
                <span style="margin-left:8px; color:#86868b; font-size:13px; font-weight:400;">
                    ${items.length} 道
                </span>
            `;

            moduleDetails.appendChild(moduleSummary);

            items.forEach(item => {
                moduleDetails.appendChild(
                    createWrongQuestionCard(
                        item.question,
                        item.record,
                        item.task
                    )
                );
            });

            categoryDetails.appendChild(moduleDetails);
        });

        container.appendChild(categoryDetails);
    });
}

function renderSummary() {
    const completed = studyPlan.filter(
        task => Boolean(progress[task.id])
    ).length;

    const reviewable = studyPlan.filter(task => {
        if (!progress[task.id]) return false;

        return questions.some(
            question => question.taskId === task.id
        );
    }).length;

    const completedElement = document.getElementById("completed-count");
    const reviewElement = document.getElementById("review-count");
    const totalElement = document.getElementById("total-count");

    if (completedElement) completedElement.textContent = completed;
    if (reviewElement) reviewElement.textContent = reviewable;
    if (totalElement) totalElement.textContent = studyPlan.length;
}

let currentReviewQuestions = [];
let currentQuestionIndex = 0;
let currentOptionOrder = [];

function buildReviewQuestions() {
    const reviewQuestions = [];

    studyPlan.forEach(task => {
        if (!progress[task.id]) return;

        const taskQuestions = questions.filter(
            question => question.taskId === task.id
        );

        reviewQuestions.push(
            ...shuffleArray(taskQuestions)
        );
    });

    return reviewQuestions;
}

function startReview() {
    currentReviewQuestions = buildReviewQuestions();
    currentQuestionIndex = 0;

    const quizArea = document.getElementById("quiz-area");
    if (!quizArea) return;

    if (currentReviewQuestions.length === 0) {
        quizArea.innerHTML = `
            <div class="empty-message">
                当前还没有可以复习的题目
            </div>
        `;
        return;
    }

    renderQuestion();
}

function renderQuestion() {
    const quizArea = document.getElementById("quiz-area");
    if (!quizArea) return;

    const question = currentReviewQuestions[currentQuestionIndex];
    if (!question) return;

    const task = studyPlan.find(
        item => item.id === question.taskId
    );

    const shuffledOptions = shuffleArray(
        Object.entries(question.options)
    );

    const displayLabels = ["A", "B", "C", "D"];

    currentOptionOrder = shuffledOptions.map(
        ([originalKey, value], index) => ({
            originalKey,
            displayKey: displayLabels[index],
            value
        })
    );

    const optionsHTML = currentOptionOrder
        .map(option => `
            <button
                class="option-btn"
                onclick="checkAnswer('${option.originalKey}', '${option.displayKey}')"
            >
                ${option.displayKey}. ${option.value}
            </button>
        `)
        .join("");

    quizArea.innerHTML = `
        <div class="task-card">
            <div style="width: 100%;">
                <div class="task-module">
                    ${task ? `${task.category} · ${task.module}` : ""}
                </div>

                <div class="task-week">
                    ${task ? task.name : ""}
                </div>

                <p>
                    第 ${currentQuestionIndex + 1}
                    / ${currentReviewQuestions.length} 题
                </p>

                <h3>${question.question}</h3>

                <div style="display:grid; gap:10px; margin-top:20px;">
                    ${optionsHTML}
                </div>

                <div id="answer-feedback" style="margin-top:20px;"></div>
            </div>
        </div>
    `;
}

function checkAnswer(selectedOriginalKey, selectedDisplayKey) {
    const question = currentReviewQuestions[currentQuestionIndex];
    if (!question) return;

    const feedback = document.getElementById("answer-feedback");
    if (!feedback) return;

    const isCorrect = selectedOriginalKey === question.answer;

    recordAnswer(question.id, isCorrect);
    renderWrongList();

    const selectedOption = currentOptionOrder.find(
        option => option.originalKey === selectedOriginalKey
    );

    const correctOption = currentOptionOrder.find(
        option => option.originalKey === question.answer
    );

    document.querySelectorAll(".option-btn").forEach(button => {
        button.disabled = true;
    });

    if (isCorrect) {
        feedback.innerHTML = `
            <div class="review-card">
                <strong>✓ 回答正确</strong>
                <p>
                    正确答案：
                    ${correctOption ? correctOption.displayKey : ""}.
                    ${correctOption ? correctOption.value : ""}
                </p>
                <p>${question.explanation}</p>
                <button onclick="nextQuestion()">下一题</button>
            </div>
        `;
    } else {
        feedback.innerHTML = `
            <div class="review-card">
                <strong>✕ 回答错误</strong>
                <p>
                    你的答案：
                    ${selectedOption ? selectedDisplayKey : ""}.
                    ${selectedOption ? selectedOption.value : ""}
                </p>
                <p>
                    正确答案：
                    ${correctOption ? correctOption.displayKey : ""}.
                    ${correctOption ? correctOption.value : ""}
                </p>
                <p>${question.explanation}</p>
                <button onclick="nextQuestion()">下一题</button>
            </div>
        `;
    }
}

function nextQuestion() {
    currentQuestionIndex++;

    if (currentQuestionIndex >= currentReviewQuestions.length) {
        const quizArea = document.getElementById("quiz-area");
        if (!quizArea) return;

        quizArea.innerHTML = `
            <div class="review-card">
                <strong>本次复习完成 ✓</strong>
                <p>共完成 ${currentReviewQuestions.length} 道题。</p>
                <button onclick="startReview()">再复习一次</button>
            </div>
        `;

        return;
    }

    renderQuestion();
}

function render() {
    renderCalendar();
    renderTasks();
    renderReviewPool();
    renderSummary();
    renderWrongList();
}

render();

const startReviewButton = document.getElementById("start-review-btn");

if (startReviewButton) {
    startReviewButton.addEventListener("click", startReview);
}
