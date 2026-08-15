// 题库按计划日期自动解锁：用于“10月前必学300题”等提前导入、按日释放的题库。

function questionIsUnlocked(question) {
    const task = studyPlan.find(item => item.id === question.taskId);

    // 普通课程题：仍然遵循“学习任务完成后才解锁”。
    if (!task || !task.questionBank) {
        return Boolean(progress[question.taskId]);
    }

    // 题库型任务：如果整周任务已经完成，整组题均进入复习池。
    if (progress[question.taskId]) {
        return true;
    }

    // 否则严格按每一道题的计划日期自动解锁。
    if (question.unlockDate) {
        const unlockDate = parseLocalDate(question.unlockDate);
        return Boolean(unlockDate && unlockDate <= startOfDay());
    }

    return false;
}

function getQuestionTypeLabel(question) {
    if (question.type === "judge") return "判断题";
    if (question.type === "multiple" || String(question.answer || "").length > 1) return "多选题";
    return "单选题";
}

function getUnlockedQuestionsForTask(task) {
    return questions.filter(
        question => question.taskId === task.id && questionIsUnlocked(question)
    );
}

// 默认构造函数仍保留：按 studyPlan 的板块顺序，板块内部随机。
function buildReviewQuestions() {
    const reviewQuestions = [];

    studyPlan.forEach(task => {
        const taskQuestions = getUnlockedQuestionsForTask(task);
        reviewQuestions.push(...shuffleArray(taskQuestions));
    });

    return reviewQuestions;
}

function renderReviewPool() {
    const container = document.getElementById("review-list");
    const countElement = document.getElementById("unlocked-task-count");
    if (!container) return;

    container.innerHTML = "";

    const visibleGroups = studyPlan
        .map(task => {
            const allQuestions = questions.filter(question => question.taskId === task.id);
            const unlockedQuestions = allQuestions.filter(questionIsUnlocked);
            return { task, allQuestions, unlockedQuestions };
        })
        .filter(({ task, unlockedQuestions }) =>
            Boolean(progress[task.id]) || unlockedQuestions.length > 0
        );

    if (countElement) {
        countElement.textContent = `${visibleGroups.length} 项`;
    }

    if (visibleGroups.length === 0) {
        container.innerHTML = `
            <div class="empty-message">
                还没有已经解锁的复习内容
            </div>
        `;
        return;
    }

    visibleGroups.forEach(({ task, allQuestions, unlockedQuestions }) => {
        const card = document.createElement("div");
        card.className = "review-card";

        let countText = " · 暂无题目";

        if (task.questionBank) {
            countText = allQuestions.length > 0
                ? ` · ${unlockedQuestions.length}/${allQuestions.length} 道已解锁`
                : " · 暂无题目";
        } else if (allQuestions.length > 0) {
            countText = ` · ${unlockedQuestions.length} 道题`;
        }

        card.innerHTML = `
            <strong>${task.name}</strong>
            <span>
                ${task.category} · ${task.module}${countText}
            </span>
        `;

        container.appendChild(card);
    });
}

function renderSummary() {
    const completed = studyPlan.filter(
        task => Boolean(progress[task.id])
    ).length;

    const reviewable = studyPlan.filter(task =>
        questions.some(question =>
            question.taskId === task.id && questionIsUnlocked(question)
        )
    ).length;

    const completedElement = document.getElementById("completed-count");
    const reviewElement = document.getElementById("review-count");
    const totalElement = document.getElementById("total-count");

    if (completedElement) completedElement.textContent = completed;
    if (reviewElement) reviewElement.textContent = reviewable;
    if (totalElement) totalElement.textContent = studyPlan.length;
}

// ==================================================
// 两种复习模式
// 1. 按板块复习：选择一个已解锁的学习任务，只做该任务的题。
// 2. 本周随机复习：只取本周已解锁内容；板块顺序随机，板块内部题序随机，
//    但一个板块会连续做完，绝不在不同板块之间逐题交替。
// ==================================================

function startQuestionSession(questionList, title, sequenceText = "") {
    const quizArea = document.getElementById("quiz-area");
    const sessionInfo = document.getElementById("review-session-info");

    currentReviewQuestions = questionList;
    currentQuestionIndex = 0;

    if (sessionInfo) {
        sessionInfo.hidden = false;
        sessionInfo.innerHTML = `
            <strong>${title}</strong>
            ${sequenceText ? `<span>${sequenceText}</span>` : ""}
        `;
    }

    if (!quizArea) return;

    if (currentReviewQuestions.length === 0) {
        quizArea.innerHTML = `
            <div class="empty-message">当前没有符合条件的复习题目</div>
        `;
        return;
    }

    renderQuestion();
    quizArea.scrollIntoView({ behavior: "smooth", block: "start" });
}

function startTaskReview(taskId) {
    const task = studyPlan.find(item => item.id === taskId);
    if (!task) return;

    const taskQuestions = shuffleArray(getUnlockedQuestionsForTask(task));

    startQuestionSession(
        taskQuestions,
        `按板块复习 · ${task.name}`,
        `${task.category} · ${task.module} · ${taskQuestions.length} 道`
    );

    const chooser = document.getElementById("review-section-chooser");
    if (chooser) chooser.hidden = true;
}

function getThisWeekReviewGroups() {
    const today = startOfDay();
    const weekStart = getMonday(today);
    const weekEnd = addDays(weekStart, 6);

    return studyPlan
        .filter(task => taskOverlapsWeek(task, weekStart, weekEnd))
        .map(task => ({
            task,
            questions: getUnlockedQuestionsForTask(task)
        }))
        .filter(group => group.questions.length > 0);
}

function startWeeklyReview() {
    const groups = shuffleArray(getThisWeekReviewGroups());

    if (groups.length === 0) {
        startQuestionSession([], "本周随机复习");
        return;
    }

    const sessionQuestions = [];

    // 先随机板块顺序，再对每个板块内部随机；同一板块连续出现。
    groups.forEach(group => {
        sessionQuestions.push(...shuffleArray(group.questions));
    });

    const sequenceText = groups
        .map(group => `${group.task.category} · ${group.task.name}（${group.questions.length}题）`)
        .join(" → ");

    startQuestionSession(
        sessionQuestions,
        "本周随机复习",
        `本次板块顺序：${sequenceText}`
    );

    const chooser = document.getElementById("review-section-chooser");
    if (chooser) chooser.hidden = true;
}

function renderSectionChooser() {
    const chooser = document.getElementById("review-section-chooser");
    if (!chooser) return;

    const available = studyPlan
        .map(task => ({
            task,
            count: getUnlockedQuestionsForTask(task).length
        }))
        .filter(item => item.count > 0);

    if (available.length === 0) {
        chooser.innerHTML = `<div class="empty-message">目前还没有可以选择的复习板块</div>`;
        return;
    }

    const grouped = {};

    available.forEach(item => {
        const category = item.task.category || "其他";
        if (!grouped[category]) grouped[category] = [];
        grouped[category].push(item);
    });

    chooser.innerHTML = Object.entries(grouped)
        .map(([category, items]) => `
            <div class="review-section-group">
                <div class="review-section-group-title">${category}</div>
                <div class="review-section-grid">
                    ${items.map(({ task, count }) => `
                        <button
                            type="button"
                            class="review-section-button"
                            data-review-task-id="${task.id}"
                        >
                            <strong>${task.name}</strong>
                            <span>${task.module} · ${count} 道</span>
                        </button>
                    `).join("")}
                </div>
            </div>
        `)
        .join("");

    chooser.querySelectorAll("[data-review-task-id]").forEach(button => {
        button.addEventListener("click", () => {
            startTaskReview(button.dataset.reviewTaskId);
        });
    });
}

function installReviewModeStyles() {
    if (document.getElementById("review-mode-styles")) return;

    const style = document.createElement("style");
    style.id = "review-mode-styles";
    style.textContent = `
        .review-mode-actions {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
            justify-content: flex-end;
        }

        .review-mode-actions .secondary-review-button {
            background: white;
            color: #1d1d1f;
            border: 1px solid #d8d8dc;
        }

        .review-section-chooser {
            margin: -4px 0 22px;
            padding: 18px;
            background: white;
            border: 1px solid #ececef;
            border-radius: 16px;
        }

        .review-section-group + .review-section-group {
            margin-top: 18px;
        }

        .review-section-group-title {
            margin-bottom: 9px;
            color: #68686d;
            font-size: 13px;
            font-weight: 600;
        }

        .review-section-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            gap: 9px;
        }

        .review-section-button {
            min-height: 68px;
            padding: 12px 14px;
            text-align: left;
            background: #f7f7f9;
            color: #1d1d1f;
            border: 1px solid #ececef;
        }

        .review-section-button:hover {
            background: #eeeeF2;
        }

        .review-section-button strong,
        .review-section-button span {
            display: block;
        }

        .review-section-button strong {
            font-size: 14px;
            line-height: 1.45;
        }

        .review-section-button span {
            margin-top: 5px;
            color: #86868b;
            font-size: 12px;
        }

        .review-session-info {
            display: flex;
            flex-direction: column;
            gap: 5px;
            margin: -4px 0 16px;
            padding: 12px 15px;
            border-radius: 12px;
            background: #f0f3f7;
        }

        .review-session-info span {
            color: #667085;
            font-size: 12px;
            line-height: 1.55;
        }

        @media (max-width: 600px) {
            .review-mode-actions {
                width: 100%;
            }

            .review-mode-actions button {
                flex: 1;
            }
        }
    `;

    document.head.appendChild(style);
}

function setupReviewModes() {
    installReviewModeStyles();

    const oldButton = document.getElementById("start-review-btn");
    const titleRow = document.querySelector(".review-title-row");
    const quizArea = document.getElementById("quiz-area");

    if (!oldButton || !titleRow || !quizArea) return;
    if (document.getElementById("review-by-section-btn")) return;

    // 克隆后替换，移除 app.js 已经绑定在旧“开始复习”按钮上的监听器。
    const sectionButton = oldButton.cloneNode(true);
    sectionButton.id = "review-by-section-btn";
    sectionButton.textContent = "按板块复习";

    const weekButton = document.createElement("button");
    weekButton.id = "review-week-btn";
    weekButton.type = "button";
    weekButton.className = "secondary-review-button";
    weekButton.textContent = "本周随机复习";

    const actions = document.createElement("div");
    actions.className = "review-mode-actions";
    actions.append(sectionButton, weekButton);

    oldButton.replaceWith(actions);

    const chooser = document.createElement("div");
    chooser.id = "review-section-chooser";
    chooser.className = "review-section-chooser";
    chooser.hidden = true;

    const sessionInfo = document.createElement("div");
    sessionInfo.id = "review-session-info";
    sessionInfo.className = "review-session-info";
    sessionInfo.hidden = true;

    quizArea.parentNode.insertBefore(chooser, quizArea);
    quizArea.parentNode.insertBefore(sessionInfo, quizArea);

    sectionButton.addEventListener("click", () => {
        renderSectionChooser();
        chooser.hidden = !chooser.hidden;
    });

    weekButton.addEventListener("click", startWeeklyReview);
}

// app.js 首次渲染后，再用新的按日期解锁逻辑刷新页面并安装复习模式。
renderReviewPool();
renderSummary();
setupReviewModes();
