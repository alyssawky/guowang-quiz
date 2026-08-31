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

        // 固定清单型题目扩展：答案若只是“六个明确/六个领先/三个系统”等标签，必须展开完整清单并解释干扰项。
        await loadScriptOnce("bank-fixed-list-explanations.js?v=20260831-1", "data-bank-fixed-list-explanations-loader");

        // 计划/阶段目标题：补知识来源、2030—2035同轴节点、当前2026口径与旧版题库版本辨析。
        await loadScriptOnce("bank-plan-timeline-explanations.js?v=20260831-1", "data-bank-plan-timeline-explanations-loader");

        await loadScriptOnce("bank-history-context.js?v=20260817-1", "data-bank-history-context-loader");
        await loadScriptOnce("bank-history-context-expanded.js?v=20260817-1", "data-bank-history-context-expanded-loader");
        await loadScriptOnce("daily-practice.js?v=20260816-4", "data-daily-practice-loader");
        await loadScriptOnce("memory-curve.js?v=20260817-3", "data-memory-curve-loader");
        await loadScriptOnce("preview-knowledge-click.js?v=20260816-1", "data-preview-knowledge-loader");
        await loadScriptOnce("bank-memory-hook-upgrade.js?v=20260823-1", "data-bank-memory-hook-upgrade-loader");
        await loadScriptOnce("study-session-rules.js?v=20260816-1", "data-study-session-rules-loader");
        await loadScriptOnce("curve-accuracy-addon.js?v=20260817-2", "data-curve-accuracy-loader");
        await loadScriptOnce("weak-knowledge-addon.js?v=20260816-1", "data-weak-knowledge-addon-loader");
        await loadScriptOnce("memory-blur-toast.js?v=20260817-1", "data-memory-blur-toast-loader");
        await loadScriptOnce("weak-knowledge-memory-facts.js?v=20260816-2", "data-weak-memory-facts-loader");
        await loadScriptOnce("weak-knowledge-hierarchy.js?v=20260817-1", "data-weak-knowledge-hierarchy-loader");
        await loadScriptOnce("weak-knowledge-xingce-methods.js?v=20260819-1", "data-weak-xingce-methods-loader");
        await loadScriptOnce("weak-knowledge-computer-modes.js?v=20260820-1", "data-weak-computer-modes-loader");
        await loadScriptOnce("computer-method-classification-fix.js?v=20260823-1", "data-computer-method-classification-fix-loader");
        await loadScriptOnce("computer-ch2-beginner-explanations.js?v=20260824-1", "data-computer-ch2-beginner-explanations-loader");
        await loadScriptOnce("computer-task-display.js?v=20260821-1", "data-computer-task-display-loader");
        await loadScriptOnce("question-type-badge.js?v=20260821-1", "data-question-type-badge-loader");
        await loadScriptOnce("question-learning-controls.js?v=20260823-1", "data-question-learning-controls-loader");

        // 国网记忆模糊闭环：重复模糊→重点出题；重点题优先进入曲线；连续3次正确→恢复正常记忆模型。
        await loadScriptOnce("memory-blur-priority-engine.js?v=20260831-1", "data-memory-blur-priority-engine-loader");

        // 国网普通错题闭环：答错越多越优先；连续3次正确→恢复正常，并自动从当前错题库移除。
        await loadScriptOnce("wrong-answer-remediation-engine.js?v=20260831-1", "data-wrong-answer-remediation-engine-loader");

        // 统一安全 getter：直接从答题历史读取普通错题/记忆模糊重点状态，避免两个重点引擎互相递归调用。
        await loadScriptOnce("wrong-answer-focus-getter-fix.js?v=20260831-1", "data-wrong-answer-focus-getter-fix-loader");

        // 若存在任何重点题，旧曲线断点不再锁死旧题序。
        await loadScriptOnce("memory-blur-session-resume-fix.js?v=20260831-1", "data-memory-blur-session-resume-fix-loader");

        // 每轮最多12题，重点错题/记忆模糊最多4题；连续3次正确必须跨3个不同日期。
        await loadScriptOnce("bank-curve-ratio-spacing-policy.js?v=20260831-1", "data-bank-curve-ratio-spacing-policy-loader");

        // 最终“今日应刷池”规则：只出今天真正到期/应复现的题；今天答对过的题当日后续回合彻底排除；绝不拿未来题补12道。
        await loadScriptOnce("bank-today-due-pool-policy.js?v=20260831-1", "data-bank-today-due-pool-policy-loader");

        await loadScriptOnce("weak-knowledge-collapse-defaults.js?v=20260817-1", "data-weak-knowledge-collapse-loader");

        refreshQuestionViews();
    }

    if (document.readyState === "loading") {
        window.addEventListener("DOMContentLoaded", verifyQuestionBank, { once: true });
    } else {
        verifyQuestionBank();
    }
})();