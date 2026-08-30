// 当存在“记忆模糊”重点题时，不恢复旧的记忆曲线题序。
// 这样重点题可以按最新优先级重新进入本轮；其他章节/每日刷题的断点续刷不受影响。
(function () {
    if (window.__memoryBlurSessionResumeFixInstalled) return;
    window.__memoryBlurSessionResumeFixInstalled = true;

    const SESSION_STORE_KEY = "guowang-review-session-store-v1";

    function safeParse(value, fallback) {
        try { return value ? JSON.parse(value) : fallback; }
        catch (error) { return fallback; }
    }

    function clearStoredCurveSessions() {
        const store = safeParse(localStorage.getItem(SESSION_STORE_KEY), {});
        let changed = false;
        Object.keys(store).forEach(key => {
            const session = store[key];
            if (session && String(session.title || "").includes("记忆曲线答题")) {
                delete store[key];
                changed = true;
            }
        });
        if (changed) localStorage.setItem(SESSION_STORE_KEY, JSON.stringify(store));
    }

    const baseStartQuestionSession = window.startQuestionSession;
    if (typeof baseStartQuestionSession !== "function") return;

    window.startQuestionSession = function (questionList, title, sequenceText = "") {
        const isCurve = String(title || "").includes("记忆曲线答题");
        const focusCount = typeof window.getMemoryBlurFocusQuestions === "function"
            ? window.getMemoryBlurFocusQuestions().length
            : 0;

        if (isCurve && focusCount > 0) clearStoredCurveSessions();
        return baseStartQuestionSession.call(this, questionList, title, sequenceText);
    };
})();
