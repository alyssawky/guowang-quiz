// 国网“10月前必学300题”完整性保护 + 每日任务保护。
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
        return Array.isArray(questions) ? questions.filter(q => q.taskId === taskId).length : 0;
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
    }

    function loadWeek(taskId, src) {
        return new Promise(resolve => {
            if (countWeek(taskId) === 50) return resolve();
            removeWeek(taskId);
            const old = document.querySelector(`script[data-bank-rescue="${taskId}"]`);
            if (old) old.remove();
            const script = document.createElement("script");
            script.src = `${src}&reload=${Date.now()}`;
            script.dataset.bankRescue = taskId;
            script.onload = resolve;
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
            if (document.querySelector(selector)) return resolve();
            const script = document.createElement("script");
            script.src = `${src}${src.includes("?") ? "&" : "?"}reload=${Date.now()}`;
            script.setAttribute(dataAttr, "true");
            script.onload = resolve;
            script.onerror = () => {
                console.error(`模块加载失败：${src}`);
                resolve();
            };
            document.body.appendChild(script);
        });
    }

    async function verifyQuestionBank() {
        applyStrictDailyUnlockRule();

        for (const [taskId, src] of expectedWeeks) {
            if (countWeek(taskId) !== 50) await loadWeek(taskId, src);
        }

        const counts = Object.fromEntries(expectedWeeks.map(([taskId]) => [taskId, countWeek(taskId)]));
        console.info("国网必刷题完整性检查", counts, `total=${Object.values(counts).reduce((a, b) => a + b, 0)}`);

        await loadScriptOnce("reset-test-answer-history.js?v=20260816-1", "data-answer-history-reset-loader");
        await loadScriptOnce("bank-memory-knowledge.js?v=20260816-1", "data-bank-memory-knowledge-loader");
        await loadScriptOnce("bank-memory-policy-knowledge.js?v=20260816-1", "data-bank-memory-policy-loader");
        await loadScriptOnce("daily-practice.js?v=20260816-4", "data-daily-practice-loader");

        // 每日8/9题整组完成后，当天立即进入累计旧题池；首次曲线复习仍按+1天到期。
        await loadScriptOnce("memory-curve.js?v=20260817-3", "data-memory-curve-loader");

        await loadScriptOnce("preview-knowledge-click.js?v=20260816-1", "data-preview-knowledge-loader");
        await loadScriptOnce("study-session-rules.js?v=20260816-1", "data-study-session-rules-loader");

        // 正确率：普通章节仍需完整；国网必刷题改为“当天8/9题整组完成即计入”；曲线答题继续计入并自动去重。
        await loadScriptOnce("curve-accuracy-addon.js?v=20260817-2", "data-curve-accuracy-loader");

        await loadScriptOnce("weak-knowledge-addon.js?v=20260816-1", "data-weak-knowledge-addon-loader");

        // “记忆模糊”成功写入错题后，显示几秒自动消失的确认提示。
        await loadScriptOnce("memory-blur-toast.js?v=20260817-1", "data-memory-blur-toast-loader");

        // 记忆型错题知识区（计算机/国网）采用紧凑结论清单；答案视觉突出，行测仍保留方法解析。
        await loadScriptOnce("weak-knowledge-memory-facts.js?v=20260816-2", "data-weak-memory-facts-loader");

        // 大框架：行测→四板块；计算机→模块；国网必刷题→企业文化/战略/新型电力系统/品牌/形势政策→具体知识点。
        await loadScriptOnce("weak-knowledge-hierarchy.js?v=20260817-1", "data-weak-knowledge-hierarchy-loader");

        // 所有层级默认闭合：进入错题知识点复习区后，由用户逐级点击展开。
        await loadScriptOnce("weak-knowledge-collapse-defaults.js?v=20260817-1", "data-weak-knowledge-collapse-loader");

        refreshQuestionViews();
    }

    if (document.readyState === "loading") {
        window.addEventListener("DOMContentLoaded", verifyQuestionBank, { once: true });
    } else {
        verifyQuestionBank();
    }
})();
