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
        await loadScriptOnce("bank-fixed-list-explanations.js?v=20260831-1", "data-bank-fixed-list-explanations-loader");
        await loadScriptOnce("bank-plan-timeline-explanations.js?v=20260831-1", "data-bank-plan-timeline-explanations-loader");
        await loadScriptOnce("bank-history-context.js?v=20260817-1", "data-bank-history-context-loader");
        await loadScriptOnce("bank-history-context-expanded.js?v=20260817-1", "data-bank-history-context-expanded-loader");

        // 首页每日任务 v6：今天的新题若未在昨天完成预习，正式答题前强制先补完未预习题。
        await loadScriptOnce("daily-practice.js?v=20260902-6", "data-daily-practice-loader");

        // 底层曲线只负责保存/推进基础 schedule；最终“今天刷什么”由最后的唯一控制器决定。
        await loadScriptOnce("memory-curve.js?v=20260831-4", "data-memory-curve-loader");

        await loadScriptOnce("preview-knowledge-click.js?v=20260816-1", "data-preview-knowledge-loader");
        await loadScriptOnce("bank-memory-hook-upgrade.js?v=20260823-1", "data-bank-memory-hook-upgrade-loader");
        await loadScriptOnce("study-session-rules.js?v=20260816-1", "data-study-session-rules-loader");
        await loadScriptOnce("curve-accuracy-addon.js?v=20260817-2", "data-curve-accuracy-loader");
        await loadScriptOnce("weak-knowledge-addon.js?v=20260816-1", "data-weak-knowledge-addon-loader");
        await loadScriptOnce("memory-blur-toast.js?v=20260901-2", "data-memory-blur-toast-loader");
        await loadScriptOnce("weak-knowledge-memory-facts.js?v=20260816-2", "data-weak-memory-facts-loader");
        await loadScriptOnce("weak-knowledge-hierarchy.js?v=20260817-1", "data-weak-knowledge-hierarchy-loader");
        await loadScriptOnce("weak-knowledge-xingce-methods.js?v=20260819-1", "data-weak-xingce-methods-loader");
        await loadScriptOnce("weak-knowledge-computer-modes.js?v=20260820-1", "data-weak-computer-modes-loader");
        await loadScriptOnce("computer-method-classification-fix.js?v=20260823-1", "data-computer-method-classification-fix-loader");
        await loadScriptOnce("computer-ch2-beginner-explanations.js?v=20260824-1", "data-computer-ch2-beginner-explanations-loader");
        await loadScriptOnce("computer-task-display.js?v=20260821-1", "data-computer-task-display-loader");
        await loadScriptOnce("question-type-badge.js?v=20260821-1", "data-question-type-badge-loader");
        await loadScriptOnce("question-learning-controls.js?v=20260823-1", "data-question-learning-controls-loader");

        // 错题/记忆模糊模块只维护重点状态和跨日3次正确进度，不再拥有“今日曲线”按钮口径。
        await loadScriptOnce("memory-blur-priority-engine.js?v=20260831-1", "data-memory-blur-priority-engine-loader");
        await loadScriptOnce("wrong-answer-remediation-engine.js?v=20260831-1", "data-wrong-answer-remediation-engine-loader");
        await loadScriptOnce("wrong-answer-focus-getter-fix.js?v=20260831-1", "data-wrong-answer-focus-getter-fix-loader");
        await loadScriptOnce("memory-blur-session-resume-fix.js?v=20260831-1", "data-memory-blur-session-resume-fix-loader");

        // 修复旧版升级时把历史错题/模糊题全部强制变成“30天前逾期”的假 backlog。
        await loadScriptOnce("bank-legacy-focus-migration-repair.js?v=20260831-1", "data-bank-legacy-focus-migration-repair-loader");

        // 长期曲线先完成最终 level/dueDate：1→2→4→7→15→30→60→90天，90天封顶。
        await loadScriptOnce("bank-long-term-memory-curve-policy.js?v=20260901-1", "data-bank-long-term-memory-curve-policy-loader");

        // 唯一“今日曲线”控制器：按钮数字、今日池、全量会话、当日答对排除都只以它为准。
        await loadScriptOnce("bank-today-curve-controller.js?v=20260901-1", "data-bank-today-curve-controller-loader");

        // 浏览器本地曲线详情：只读取唯一控制器的 getBankTodayDuePool，不参与题池计算。
        await loadScriptOnce("bank-curve-diagnostics.js?v=20260901-3", "data-bank-curve-diagnostics-loader");

        await loadScriptOnce("weak-knowledge-collapse-defaults.js?v=20260817-1", "data-weak-knowledge-collapse-loader");

        refreshQuestionViews();
        if (typeof window.refreshBankTodayCurveButton === "function") window.refreshBankTodayCurveButton();
        if (typeof window.__refreshBankCurveDiagnostics === "function") window.__refreshBankCurveDiagnostics();
    }

    if (document.readyState === "loading") {
        window.addEventListener("DOMContentLoaded", verifyQuestionBank, { once: true });
    } else {
        verifyQuestionBank();
    }
})();
