// 章节正确率门槛 + 复习断点续刷
// 规则：
// 1. 一个章节的全部题目至少作答1次后，才显示该章节正确率，并计入顶部总体正确率。
// 2. 章节复习保存本轮随机题序和下一题位置；刷新/关闭页面后再次进入同章节继续。
// 3. 只有主动点击“退出答题”才放弃该章节当前轮次，下次重新开始。
(function () {
    const SESSION_STORE_KEY = "guowang-review-session-store-v1";
    let activeSessionKey = null;

    function safeParse(value, fallback) {
        try {
            return value ? JSON.parse(value) : fallback;
        } catch (error) {
            return fallback;
        }
    }

    function loadSessionStore() {
        return safeParse(localStorage.getItem(SESSION_STORE_KEY), {});
    }

    function saveSessionStore(store) {
        localStorage.setItem(SESSION_STORE_KEY, JSON.stringify(store || {}));
    }

    function getQuestionById(id) {
        return questions.find(question => question.id === id);
    }

    function getTaskQuestions(taskId) {
        return questions.filter(question => question.taskId === taskId);
    }

    function getRecord(questionId) {
        return answerHistory && answerHistory[questionId] ? answerHistory[questionId] : null;
    }

    function questionWasAnswered(question) {
        const record = getRecord(question.id);
        return Boolean(record && Number(record.attempts || 0) > 0);
    }

    function getChapterStats(taskId) {
        const chapterQuestions = getTaskQuestions(taskId);
        if (!chapterQuestions.length) {
            return {
                taskId,
                total: 0,
                answered: 0,
                attempts: 0,
                correct: 0,
                complete: false,
                accuracy: null
            };
        }

        let answered = 0;
        let attempts = 0;
        let correct = 0;

        chapterQuestions.forEach(question => {
            const record = getRecord(question.id);
            if (record && Number(record.attempts || 0) > 0) answered += 1;
            attempts += Number(record && record.attempts || 0);
            correct += Number(record && record.correct || 0);
        });

        const complete = answered === chapterQuestions.length;
        return {
            taskId,
            total: chapterQuestions.length,
            answered,
            attempts,
            correct,
            complete,
            accuracy: complete && attempts > 0
                ? Math.round((correct / attempts) * 100)
                : null
        };
    }

    function getCompletedChapterStats() {
        return studyPlan
            .map(task => getChapterStats(task.id))
            .filter(stats => stats.complete && stats.total > 0 && stats.attempts > 0);
    }

    function updateRestrictedAccuracyGauge() {
        const ring = document.getElementById("sg-accuracy-ring");
        const value = document.getElementById("sg-accuracy-value");
        const detail = document.getElementById("sg-accuracy-detail");
        if (!ring || !value || !detail) return;

        const completedChapters = getCompletedChapterStats();
        const attempts = completedChapters.reduce((sum, item) => sum + item.attempts, 0);
        const correct = completedChapters.reduce((sum, item) => sum + item.correct, 0);
        const accuracy = attempts > 0 ? Math.round((correct / attempts) * 100) : null;

        ring.style.setProperty("--accuracy", accuracy == null ? 0 : accuracy);
        value.textContent = accuracy == null ? "—" : `${accuracy}%`;
        detail.textContent = accuracy == null
            ? "完整刷完一个章节后显示"
            : `已计入 ${completedChapters.length} 个完整章节 · ${correct}/${attempts} 次作答正确`;
    }

    function decorateChapterAccuracy() {
        document.querySelectorAll("[data-review-task-id]").forEach(button => {
            const taskId = button.dataset.reviewTaskId;
            const row = button.closest(".review-chapter-row");
            if (!row) return;

            const copy = row.querySelector(".review-chapter-copy small");
            if (!copy) return;

            const old = copy.querySelector(".review-chapter-accuracy");
            if (old) old.remove();

            const stats = getChapterStats(taskId);
            if (!stats.complete || stats.accuracy == null) return;

            const badge = document.createElement("span");
            badge.className = "review-chapter-accuracy";
            badge.textContent = ` · 正确率 ${stats.accuracy}%`;
            copy.appendChild(badge);
        });
    }

    function normalizeTitle(value) {
        return String(value || "").replace(/\s+/g, " ").trim();
    }

    function simpleHash(text) {
        let hash = 0;
        for (let i = 0; i < text.length; i++) {
            hash = ((hash << 5) - hash + text.charCodeAt(i)) | 0;
        }
        return Math.abs(hash).toString(36);
    }

    function deriveSessionKey(questionList, title) {
        const list = Array.isArray(questionList) ? questionList : [];
        if (!list.length) return null;

        const normalizedTitle = normalizeTitle(title);
        const taskIds = [...new Set(list.map(question => question.taskId).filter(Boolean))];

        // 搜索/单题核对不与章节复习共享断点。
        if (normalizedTitle.includes("搜索题目")) {
            return `search:${list.map(question => question.id).join(",")}`;
        }

        if (normalizedTitle.includes("今日必刷题")) {
            const dates = [...new Set(list.map(question => question.unlockDate).filter(Boolean))];
            return `daily:${dates[0] || new Date().toISOString().slice(0, 10)}`;
        }

        if (normalizedTitle.includes("错题")) {
            return `wrong:${simpleHash(normalizedTitle + "|" + list.map(question => question.id).sort().join(","))}`;
        }

        // 章节复习：这是用户最主要的断点续刷对象。
        if (normalizedTitle.includes("按板块复习") && taskIds.length === 1) {
            return `task:${taskIds[0]}`;
        }

        if (normalizedTitle.includes("按板块复习") && taskIds.length > 1) {
            const tasks = taskIds
                .map(id => studyPlan.find(task => task.id === id))
                .filter(Boolean);
            const categories = [...new Set(tasks.map(task => task.category))];
            const modules = [...new Set(tasks.map(task => task.module))];
            if (categories.length === 1 && modules.length === 1) {
                return `module:${categories[0]}:${modules[0]}`;
            }
        }

        if (normalizedTitle.includes("国网必刷题")) {
            return `bank:${simpleHash(normalizedTitle)}`;
        }

        if (normalizedTitle.includes("本周随机复习")) {
            const monday = typeof getMonday === "function" ? getMonday(new Date()) : new Date();
            return `weekly:${monday.getFullYear()}-${monday.getMonth() + 1}-${monday.getDate()}`;
        }

        return `session:${simpleHash(normalizedTitle + "|" + list.map(question => question.id).sort().join(","))}`;
    }

    function getStoredSession(key) {
        if (!key) return null;
        const store = loadSessionStore();
        return store[key] || null;
    }

    function setStoredSession(key, session) {
        if (!key) return;
        const store = loadSessionStore();
        store[key] = session;
        saveSessionStore(store);
    }

    function removeStoredSession(key) {
        if (!key) return;
        const store = loadSessionStore();
        delete store[key];
        saveSessionStore(store);
    }

    function clearActiveReviewSession() {
        if (activeSessionKey) removeStoredSession(activeSessionKey);
        activeSessionKey = null;
    }

    function saveActiveNextIndex(nextIndex) {
        if (!activeSessionKey) return;
        const store = loadSessionStore();
        const session = store[activeSessionKey];
        if (!session) return;
        session.nextIndex = Math.max(0, Number(nextIndex || 0));
        session.updatedAt = new Date().toISOString();
        store[activeSessionKey] = session;
        saveSessionStore(store);
    }

    function addResumeNotice(index, total) {
        if (!index) return;
        const sessionInfo = document.getElementById("review-session-info");
        if (!sessionInfo || sessionInfo.querySelector(".review-resume-notice")) return;
        const notice = document.createElement("span");
        notice.className = "review-resume-notice";
        notice.textContent = `已恢复上次进度 · 从第 ${index + 1}/${total} 题继续`;
        sessionInfo.insertBefore(notice, sessionInfo.querySelector(".exit-review-button") || null);
    }

    const baseStartQuestionSession = window.startQuestionSession;
    if (typeof baseStartQuestionSession === "function") {
        window.startQuestionSession = function (questionList, title, sequenceText = "") {
            const list = Array.isArray(questionList) ? questionList : [];
            const key = deriveSessionKey(list, title);
            let finalList = list;
            let resumeIndex = 0;
            let stored = getStoredSession(key);

            if (stored && Array.isArray(stored.questionIds) && stored.questionIds.length) {
                const restored = stored.questionIds.map(getQuestionById).filter(Boolean);
                const nextIndex = Number(stored.nextIndex || 0);

                if (restored.length === stored.questionIds.length && nextIndex < restored.length) {
                    finalList = restored;
                    resumeIndex = Math.max(0, nextIndex);
                } else {
                    removeStoredSession(key);
                    stored = null;
                }
            }

            if (!stored && key) {
                setStoredSession(key, {
                    key,
                    title: title || "",
                    sequenceText: sequenceText || "",
                    questionIds: finalList.map(question => question.id),
                    nextIndex: 0,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });
            }

            activeSessionKey = key;
            const result = baseStartQuestionSession(finalList, title, sequenceText);

            if (resumeIndex > 0 && typeof currentQuestionIndex !== "undefined") {
                currentQuestionIndex = resumeIndex;
                if (typeof renderQuestion === "function") renderQuestion();
                addResumeNotice(resumeIndex, finalList.length);
            }

            return result;
        };
    }

    const baseRecordAnswer = window.recordAnswer;
    if (typeof baseRecordAnswer === "function") {
        window.recordAnswer = function (...args) {
            const result = baseRecordAnswer.apply(this, args);

            // 当前题一旦提交，就把断点推进到下一题；即使此时关闭网页，再回来也不会重复这题。
            if (activeSessionKey && typeof currentQuestionIndex !== "undefined") {
                saveActiveNextIndex(currentQuestionIndex + 1);
            }

            updateRestrictedAccuracyGauge();
            decorateChapterAccuracy();
            return result;
        };
    }

    const baseNextQuestion = window.nextQuestion;
    if (typeof baseNextQuestion === "function") {
        window.nextQuestion = function (...args) {
            const result = baseNextQuestion.apply(this, args);

            if (
                activeSessionKey &&
                typeof currentQuestionIndex !== "undefined" &&
                typeof currentReviewQuestions !== "undefined"
            ) {
                if (currentQuestionIndex >= currentReviewQuestions.length) {
                    removeStoredSession(activeSessionKey);
                    activeSessionKey = null;
                } else {
                    saveActiveNextIndex(currentQuestionIndex);
                }
            }

            updateRestrictedAccuracyGauge();
            decorateChapterAccuracy();
            return result;
        };
    }

    // “退出答题”是唯一主动放弃当前轮次的动作：捕获阶段先清断点，再执行原退出逻辑。
    document.addEventListener("click", event => {
        const button = event.target && event.target.closest
            ? event.target.closest(".exit-review-button")
            : null;
        if (!button) return;
        clearActiveReviewSession();
    }, true);

    const baseRenderSectionChooser = window.renderSectionChooser;
    if (typeof baseRenderSectionChooser === "function") {
        window.renderSectionChooser = function (...args) {
            const result = baseRenderSectionChooser.apply(this, args);
            decorateChapterAccuracy();
            return result;
        };
    }

    const baseRenderSummary = window.renderSummary;
    if (typeof baseRenderSummary === "function") {
        window.renderSummary = function (...args) {
            const result = baseRenderSummary.apply(this, args);
            updateRestrictedAccuracyGauge();
            decorateChapterAccuracy();
            return result;
        };
    }

    window.getChapterStats = getChapterStats;
    window.updateRestrictedAccuracyGauge = updateRestrictedAccuracyGauge;
    window.clearActiveReviewSession = clearActiveReviewSession;

    // 初次加载时覆盖旧的“只要答过就显示总体正确率”逻辑。
    updateRestrictedAccuracyGauge();
    decorateChapterAccuracy();
})();