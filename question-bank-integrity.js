// 国网“10月前必学300题”完整性保护。
// 每次页面启动都检查 Week1~Week6 是否各有 50 题；若某周脚本未成功注册，则强制重新加载。
(function () {
    const expectedWeeks = [
        ["preoct300-w1", "questions-preoct300-w1.js?v=20260816-2"],
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

    function refreshQuestionViews() {
        if (typeof renderSectionChooser === "function") renderSectionChooser();
        if (typeof renderReviewPool === "function") renderReviewPool();
        if (typeof renderWrongList === "function") renderWrongList();
        if (typeof renderSummary === "function") renderSummary();
        if (typeof updateDashboardStats === "function") updateDashboardStats();
    }

    function loadWeek(taskId, src) {
        return new Promise(resolve => {
            if (countWeek(taskId) >= 50) {
                resolve();
                return;
            }

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

    async function verifyQuestionBank() {
        for (const [taskId, src] of expectedWeeks) {
            if (countWeek(taskId) !== 50) {
                await loadWeek(taskId, src);
            }
        }

        const counts = Object.fromEntries(
            expectedWeeks.map(([taskId]) => [taskId, countWeek(taskId)])
        );
        const total = Object.values(counts).reduce((sum, count) => sum + count, 0);

        console.info("国网必刷题完整性检查", counts, `total=${total}`);
        refreshQuestionViews();
    }

    if (document.readyState === "loading") {
        window.addEventListener("DOMContentLoaded", verifyQuestionBank, { once: true });
    } else {
        verifyQuestionBank();
    }
})();
