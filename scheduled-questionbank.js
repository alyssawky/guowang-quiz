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

function buildReviewQuestions() {
    const reviewQuestions = [];

    studyPlan.forEach(task => {
        const taskQuestions = questions.filter(
            question => question.taskId === task.id && questionIsUnlocked(question)
        );

        // 每个学习/题库板块内部随机，避免记住题目顺序。
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

// app.js 首次渲染后，再用新的按日期解锁逻辑刷新这两个区域。
renderReviewPool();
renderSummary();
