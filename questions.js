// 正式题库基础容器。
// 各课程/阶段题库由独立 questions-*.js 文件继续追加，避免单文件过大。
const questions = [];

// 判断推理｜逻辑论证之归因论证（xingce-002）
// 在页面解析阶段同步载入，确保 app.js 初始化前 34 道题已经进入 questions。
[
  "questions-reasoning-attribution-1.js?v=20260816-1",
  "questions-reasoning-attribution-2.js?v=20260816-1",
  "questions-reasoning-attribution-3.js?v=20260816-1",
  "questions-reasoning-attribution-4.js?v=20260816-1",
  "daily-practice.js?v=20260816-2"
].forEach(src => document.write(`<script src="${src}"><\/script>`));

// 页面完成解析后再做一次国网必刷300题完整性检查，
// 并执行一次性的测试答题历史清理。
window.addEventListener("DOMContentLoaded", () => {
    if (!document.querySelector('script[data-question-bank-integrity]')) {
        const integrityScript = document.createElement("script");
        integrityScript.src = `question-bank-integrity.js?v=20260816-1&ts=${Date.now()}`;
        integrityScript.dataset.questionBankIntegrity = "true";
        document.body.appendChild(integrityScript);
    }

    if (!document.querySelector('script[data-answer-history-reset]')) {
        const resetScript = document.createElement("script");
        resetScript.src = `reset-test-answer-history.js?v=20260816-1&ts=${Date.now()}`;
        resetScript.dataset.answerHistoryReset = "true";
        document.body.appendChild(resetScript);
    }
}, { once: true });
