// 总体正确率补充规则：
// 1. 普通章节：全部题目至少作答1次后，才整章计入总体正确率。
// 2. 国网必刷题：不必等待整周50题；某个 unlockDate 当天的8/9题全部至少作答1次后，该日整组立即计入。
// 3. 记忆曲线答题仍可在未完成章节/未完成国网日组时单独计入。
// 4. 已计入的国网日组、最终完成的整周章节与曲线历史之间自动去重，避免重复统计。
(function () {
    const VERSION = 2;
    if (Number(window.__curveAccuracyAddonVersion || 0) >= VERSION) return;
    window.__curveAccuracyAddonVersion = VERSION;

    const CURVE_HISTORY_KEY = window.CURVE_HISTORY_KEY || "guowang-memory-curve-answer-history-v1";

    function safeParse(value, fallback) {
        try { return value ? JSON.parse(value) : fallback; }
        catch (error) { return fallback; }
    }

    function loadCurveHistory() {
        return safeParse(localStorage.getItem(CURVE_HISTORY_KEY), {});
    }

    function getRecord(questionId) {
        return (typeof answerHistory !== "undefined" && answerHistory)
            ? answerHistory[questionId] || null
            : null;
    }

    function isBankQuestion(question) {
        if (!question) return false;
        const task = studyPlan.find(item => item.id === question.taskId);
        return Boolean(
            String(question.taskId || "").startsWith("preoct300-w") ||
            question.sourceSet === "10月前必学300题" ||
            (task && (task.questionBank || task.category === "国网题库"))
        );
    }

    function getCompletedBankDayGroups(completedTaskIds) {
        const grouped = new Map();

        questions.forEach(question => {
            if (!isBankQuestion(question) || !question.unlockDate) return;
            // 整周50题已经完整时，由章节统计统一接管，不再按天重复计入。
            if (completedTaskIds.has(question.taskId)) return;

            const key = `${question.taskId}::${question.unlockDate}`;
            if (!grouped.has(key)) {
                grouped.set(key, {
                    key,
                    taskId: question.taskId,
                    date: question.unlockDate,
                    questions: []
                });
            }
            grouped.get(key).questions.push(question);
        });

        const completedDays = [];
        grouped.forEach(group => {
            if (!group.questions.length) return;

            const complete = group.questions.every(question => {
                const record = getRecord(question.id);
                return Boolean(record && Number(record.attempts || 0) > 0);
            });
            if (!complete) return;

            let attempts = 0;
            let correct = 0;
            const questionIds = [];

            group.questions.forEach(question => {
                const record = getRecord(question.id);
                attempts += Number(record && record.attempts || 0);
                correct += Number(record && record.correct || 0);
                questionIds.push(question.id);
            });

            if (attempts > 0) {
                completedDays.push({
                    ...group,
                    attempts,
                    correct,
                    questionIds
                });
            }
        });

        return completedDays.sort((a, b) => a.date.localeCompare(b.date));
    }

    function computeEligibleAccuracy() {
        const completed = [];
        const completedTaskIds = new Set();
        const coveredQuestionIds = new Set();
        let attempts = 0;
        let correct = 0;

        // A. 已完整刷完的普通章节/整周国网章节：沿用原规则整章统计。
        if (typeof window.getChapterStats === "function") {
            studyPlan.forEach(task => {
                const stats = window.getChapterStats(task.id);
                if (stats && stats.complete && stats.total > 0 && stats.attempts > 0) {
                    completed.push(stats);
                    completedTaskIds.add(task.id);
                    attempts += Number(stats.attempts || 0);
                    correct += Number(stats.correct || 0);
                    questions
                        .filter(question => question.taskId === task.id)
                        .forEach(question => coveredQuestionIds.add(question.id));
                }
            });
        }

        // B. 尚未完成整周的国网题，改为“当天8/9题整组完成即计入”。
        const completedBankDays = getCompletedBankDayGroups(completedTaskIds);
        completedBankDays.forEach(day => {
            attempts += day.attempts;
            correct += day.correct;
            day.questionIds.forEach(id => coveredQuestionIds.add(id));
        });

        // C. 曲线答题：只补充尚未被完整章节/完整国网日组覆盖的题，防止重复统计。
        const curveHistory = loadCurveHistory();
        let curveAttemptsFromUncovered = 0;
        let curveCorrectFromUncovered = 0;

        Object.entries(curveHistory).forEach(([questionId, record]) => {
            const question = questions.find(item => item.id === questionId);
            if (!question || coveredQuestionIds.has(questionId) || completedTaskIds.has(question.taskId)) return;

            const a = Number(record && record.attempts || 0);
            const c = Number(record && record.correct || 0);
            curveAttemptsFromUncovered += a;
            curveCorrectFromUncovered += c;
        });

        attempts += curveAttemptsFromUncovered;
        correct += curveCorrectFromUncovered;

        return {
            attempts,
            correct,
            accuracy: attempts > 0 ? Math.round((correct / attempts) * 100) : null,
            completedChapterCount: completed.length,
            completedBankDayCount: completedBankDays.length,
            completedBankDays,
            curveAttemptsFromUncovered
        };
    }

    function updateGauge() {
        const ring = document.getElementById("sg-accuracy-ring");
        const value = document.getElementById("sg-accuracy-value");
        const detail = document.getElementById("sg-accuracy-detail");
        if (!ring || !value || !detail) return;

        const stats = computeEligibleAccuracy();
        ring.style.setProperty("--accuracy", stats.accuracy == null ? 0 : stats.accuracy);
        value.textContent = stats.accuracy == null ? "—" : `${stats.accuracy}%`;

        if (stats.accuracy == null) {
            detail.textContent = "完整刷完一个章节、完成当日国网整组，或完成记忆曲线答题后显示";
            return;
        }

        const parts = [];
        if (stats.completedChapterCount) parts.push(`${stats.completedChapterCount}个完整章节`);
        if (stats.completedBankDayCount) parts.push(`${stats.completedBankDayCount}个国网完整日`);
        if (stats.curveAttemptsFromUncovered) parts.push(`${stats.curveAttemptsFromUncovered}次曲线复习作答`);

        detail.textContent = `已计入 ${parts.join(" + ")} · ${stats.correct}/${stats.attempts} 次作答正确`;
    }

    const baseRecordAnswer = window.recordAnswer;
    if (typeof baseRecordAnswer === "function" && !window.__curveAccuracyRecordWrapped) {
        window.__curveAccuracyRecordWrapped = true;
        window.recordAnswer = function (...args) {
            const result = baseRecordAnswer.apply(this, args);
            // 当当天最后一道国网题提交时，这里会立即识别整组完成并刷新总体正确率。
            updateGauge();
            return result;
        };
    }

    const baseRenderSummary = window.renderSummary;
    if (typeof baseRenderSummary === "function" && !window.__curveAccuracySummaryWrapped) {
        window.__curveAccuracySummaryWrapped = true;
        window.renderSummary = function (...args) {
            const result = baseRenderSummary.apply(this, args);
            updateGauge();
            return result;
        };
    }

    window.updateRestrictedAccuracyGauge = updateGauge;
    window.getEligibleAccuracyWithCurve = computeEligibleAccuracy;
    window.getCompletedBankDayAccuracyGroups = function () {
        const stats = computeEligibleAccuracy();
        return stats.completedBankDays || [];
    };

    // 页面刷新后直接读取已有 answerHistory，因此今天已经完成的8/9题会自动补计，无需重刷。
    updateGauge();
})();
