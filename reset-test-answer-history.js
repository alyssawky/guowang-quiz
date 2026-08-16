// 一次性清理此前用于测试界面的答题历史。
// 只重置 answerHistory / 正确率 / 错题记录，不影响学习打卡 progress。
(function () {
    const RESET_MARKER_KEY = "guowang-answer-history-reset-20260816";
    const ANSWER_KEY = "guowang-answer-history";

    if (localStorage.getItem(RESET_MARKER_KEY) === "done") return;

    try {
        localStorage.removeItem(ANSWER_KEY);
        if (typeof answerHistory !== "undefined") {
            answerHistory = {};
        }
        if (typeof saveAnswerHistory === "function") {
            saveAnswerHistory();
        }
        localStorage.setItem(RESET_MARKER_KEY, "done");

        // 立刻刷新依赖答题历史的界面。
        if (typeof renderWrongList === "function") renderWrongList();
        if (typeof updateDashboardStats === "function") updateDashboardStats();
        if (typeof renderDailyPracticeCard === "function") renderDailyPracticeCard();
        if (typeof renderSummary === "function") renderSummary();

        console.info("测试答题历史已清空，后续正式数据将重新累计。");
    } catch (error) {
        console.error("测试答题历史清理失败", error);
    }
})();