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

        // 史实类国网题补充“时代背景→为什么发生→前后节点→记忆钩子”，避免只背年份/工程名。
        await loadScriptOnce("bank-history-context.js?v=20260817-1", "data-bank-history-context-loader");

        // 全量史实识别：其余年份/首个/投运/改革标志/重大工程题也统一切换为背景串联式解析。
        await loadScriptOnce("bank-history-context-expanded.js?v=20260817-1", "data-bank-history-context-expanded-loader");

        await loadScriptOnce("daily-practice.js?v=20260816-4", "data-daily-practice-loader");

        // 每日8/9题整组完成后，当天立即进入累计旧题池；首次曲线复习仍按+1天到期。
        await loadScriptOnce("memory-curve.js?v=20260817-3", "data-memory-curve-loader");

        await loadScriptOnce("preview-knowledge-click.js?v=20260816-1", "data-preview-knowledge-loader");

        // 记忆钩子升级：长答案改为口诀/关键词链，并修复“记忆钩子”圆形标签的水平垂直居中。
        await loadScriptOnce("bank-memory-hook-upgrade.js?v=20260823-1", "data-bank-memory-hook-upgrade-loader");

        await loadScriptOnce("study-session-rules.js?v=20260816-1", "data-study-session-rules-loader");

        // 正确率：普通章节仍需完整；国网必刷题改为“当天8/9题整组完成即计入”；曲线答题继续计入并自动去重。
        await loadScriptOnce("curve-accuracy-addon.js?v=20260817-2", "data-curve-accuracy-loader");

        await loadScriptOnce("weak-knowledge-addon.js?v=20260816-1", "data-weak-knowledge-addon-loader");

        // “记忆模糊”成功写入错题后，显示几秒自动消失的确认提示。
        await loadScriptOnce("memory-blur-toast.js?v=20260817-1", "data-memory-blur-toast-loader");

        // 原有记忆型错题清单；计算机后续会再按“纯记忆 / 方法理解”重新分流。
        await loadScriptOnce("weak-knowledge-memory-facts.js?v=20260816-2", "data-weak-memory-facts-loader");

        // 大框架：行测→四板块；计算机→模块；国网必刷题→企业文化/战略/新型电力系统/品牌/形势政策→具体知识点。
        await loadScriptOnce("weak-knowledge-hierarchy.js?v=20260817-1", "data-weak-knowledge-hierarchy-loader");

        // 行测错题单独按“具体题型→识别信号→同类题通法→本题套用”复盘，不生成记忆钩子。
        await loadScriptOnce("weak-knowledge-xingce-methods.js?v=20260819-1", "data-weak-xingce-methods-loader");

        // 计算机错题分成两类：纯记忆直接记结论；方法理解按题型识别→步骤→本题套用→易错点复盘。
        await loadScriptOnce("weak-knowledge-computer-modes.js?v=20260820-1", "data-weak-computer-modes-loader");

        // 修正进制题误判：即使题干只写“对应/等于”而没写“转换”，具体数值之间的进制映射仍属于方法理解。
        await loadScriptOnce("computer-method-classification-fix.js?v=20260823-1", "data-computer-method-classification-fix-loader");

        // 计算机学习任务展示：章节标题单独一行，小节目录以更小字号显示在下一行，避免长标题被截断。
        await loadScriptOnce("computer-task-display.js?v=20260821-1", "data-computer-task-display-loader");

        // 刷题题型提示：把“单选/多选”从灰色小标签升级为题干前醒目标识。
        await loadScriptOnce("question-type-badge.js?v=20260821-1", "data-question-type-badge-loader");

        // 学习型作答控制：行测/计算机方法题用“不会”，记忆题保留“记忆模糊”，并支持上一题回退。
        await loadScriptOnce("question-learning-controls.js?v=20260823-1", "data-question-learning-controls-loader");

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