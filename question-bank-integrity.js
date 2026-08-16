// 国网“10月前必学300题”完整性保护 + 每日任务保护。
// 每次页面启动都检查 Week1~Week6 是否各有 50 题；若某周脚本未成功注册，则强制重新加载。
(function () {
    const expectedWeeks = [
        ["preoct300-w1", "questions-preoct300-w1.js?v=20260816-4"],
        ["preoct300-w2", "questions-preoct300-w2.js?v=20260816-2"],
        ["preoct300-w3", "questions-preoct300-w3.js?v=20260816-2"],
        ["preoct300-w4", "questions-preoct300-w4.js?v=20260816-2"],
        ["preoct300-w5", "questions-preoct300-w5.js?v=20260816-2"],
        ["preoct300-w6", "questions-preoct300-w6.js?v=20260816-2"]
    ];

    function countWeek(taskId) {
        return Array.isArray(questions)
            ? questions.filter(question => question.taskId === taskId).length
            : 0;
    }

    function removeWeek(taskId) {
        if (!Array.isArray(questions)) return;
        for (let i = questions.length - 1; i >= 0; i--) {
            if (questions[i].taskId === taskId) questions.splice(i, 1);
        }
    }

    function applyStrictDailyUnlockRule() {
        window.questionIsUnlocked = function (question) {
            const task = studyPlan.find(item => item.id === question.taskId);
            if (!task || !task.questionBank) return Boolean(progress[question.taskId]);
            if (!question.unlockDate) return false;
            const unlockDate = parseLocalDate(question.unlockDate);
            return Boolean(unlockDate && unlockDate <= startOfDay());
        };
    }

    function refreshQuestionViews() {
        if (typeof renderSectionChooser === "function") renderSectionChooser();
        if (typeof renderReviewPool === "function") renderReviewPool();
        if (typeof renderWrongList === "function") renderWrongList();
        if (typeof renderSummary === "function") renderSummary();
        if (typeof updateDashboardStats === "function") updateDashboardStats();
        if (typeof renderDailyPracticeCard === "function") renderDailyPracticeCard();
        if (typeof updateRestrictedAccuracyGauge === "function") updateRestrictedAccuracyGauge();
        if (typeof refreshBankMemoryKnowledge === "function") refreshBankMemoryKnowledge();
    }

    function loadWeek(taskId, src) {
        return new Promise(resolve => {
            if (countWeek(taskId) === 50) {
                resolve();
                return;
            }
            removeWeek(taskId);
            const old = document.querySelector(`script[data-bank-rescue="${taskId}"]`);
            if (old) old.remove();
            const script = document.createElement("script");
            script.src = `${src}&reload=${Date.now()}`;
            script.dataset.bankRescue = taskId;
            script.onload = () => resolve();
            script.onerror = () => {
                console.error(`题库补载失败：${taskId}`);
                resolve();
            };
            document.body.appendChild(script);
        });
    }

    function loadScriptOnce(src, dataAttr) {
        return new Promise(resolve => {
            const selector = `script[${dataAttr}]`;
            const existing = document.querySelector(selector);
            if (existing) existing.remove();
            const script = document.createElement("script");
            script.src = `${src}${src.includes("?") ? "&" : "?"}reload=${Date.now()}`;
            script.setAttribute(dataAttr, "true");
            script.onload = () => resolve();
            script.onerror = () => resolve();
            document.body.appendChild(script);
        });
    }

    async function verifyQuestionBank() {
        applyStrictDailyUnlockRule();

        for (const [taskId, src] of expectedWeeks) {
            if (countWeek(taskId) !== 50) await loadWeek(taskId, src);
        }

        const counts = Object.fromEntries(expectedWeeks.map(([taskId]) => [taskId, countWeek(taskId)]));
        const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
        console.info("国网必刷题完整性检查", counts, `total=${total}`);

        await loadScriptOnce("reset-test-answer-history.js?v=20260816-1", "data-answer-history-reset-loader");

        // 基础记忆知识层：8/17企业文化重点题 + 全题库保守兜底。
        await loadScriptOnce("bank-memory-knowledge.js?v=20260816-1", "data-bank-memory-knowledge-loader");

        // 形势政策50题全部使用专门的知识解析、易混辨析和记忆钩子。
        await loadScriptOnce("bank-memory-policy-knowledge.js?v=20260816-1", "data-bank-memory-policy-loader");

        // 三层结构：往日题累计记忆 + 明日题提前1天预习 + 今日正式刷题。
        await loadScriptOnce("daily-practice.js?v=20260816-4", "data-daily-practice-loader");

        // 累计记忆按1/2/4/7/15/30天间隔，到期与逾期题优先加权抽取。
        await loadScriptOnce("memory-curve.js?v=20260816-1", "data-memory-curve-loader");

        // 稳定展示“知识点解析 / 易混辨析 / 记忆钩子”，避免观察器循环重绘。
        await loadScriptOnce("memory-knowledge-ui.js?v=20260816-2", "data-memory-knowledge-ui-loader");

        // 正确率只统计完整刷完的章节；章节复习支持断点续刷。
        await loadScriptOnce("study-session-rules.js?v=20260816-1", "data-study-session-rules-loader");

        refreshQuestionViews();
    }

    if (document.readyState === "loading") {
        window.addEventListener("DOMContentLoaded", verifyQuestionBank, { once: true });
    } else {
        verifyQuestionBank();
    }
})();
