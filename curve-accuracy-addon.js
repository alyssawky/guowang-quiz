// 总体正确率补充规则：
// - 完整章节：统计该章节全部正式作答；
// - 尚未完整的章节：只额外统计“记忆曲线答题”产生的作答，普通零散学习仍不计入。
(function () {
    const VERSION = 1;
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

    function computeEligibleAccuracy() {
        const completed = [];
        const completedTaskIds = new Set();
        let attempts = 0;
        let correct = 0;

        if (typeof window.getChapterStats === "function") {
            studyPlan.forEach(task => {
                const stats = window.getChapterStats(task.id);
                if (stats && stats.complete && stats.total > 0 && stats.attempts > 0) {
                    completed.push(stats);
                    completedTaskIds.add(task.id);
                    attempts += Number(stats.attempts || 0);
                    correct += Number(stats.correct || 0);
                }
            });
        }

        const curveHistory = loadCurveHistory();
        let curveAttemptsFromIncomplete = 0;
        let curveCorrectFromIncomplete = 0;

        Object.entries(curveHistory).forEach(([questionId, record]) => {
            const question = questions.find(item => item.id === questionId);
            if (!question || completedTaskIds.has(question.taskId)) return;
            const a = Number(record && record.attempts || 0);
            const c = Number(record && record.correct || 0);
            curveAttemptsFromIncomplete += a;
            curveCorrectFromIncomplete += c;
        });

        attempts += curveAttemptsFromIncomplete;
        correct += curveCorrectFromIncomplete;

        return {
            attempts,
            correct,
            accuracy: attempts > 0 ? Math.round((correct / attempts) * 100) : null,
            completedChapterCount: completed.length,
            curveAttemptsFromIncomplete
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
            detail.textContent = "完整刷完一个章节，或完成记忆曲线答题后显示";
            return;
        }

        const parts = [];
        if (stats.completedChapterCount) parts.push(`${stats.completedChapterCount}个完整章节`);
        if (stats.curveAttemptsFromIncomplete) parts.push(`${stats.curveAttemptsFromIncomplete}次曲线复习作答`);
        detail.textContent = `已计入 ${parts.join(" + ")} · ${stats.correct}/${stats.attempts} 次作答正确`;
    }

    const baseRecordAnswer = window.recordAnswer;
    if (typeof baseRecordAnswer === "function" && !window.__curveAccuracyRecordWrapped) {
        window.__curveAccuracyRecordWrapped = true;
        window.recordAnswer = function (...args) {
            const result = baseRecordAnswer.apply(this, args);
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
    updateGauge();
})();
