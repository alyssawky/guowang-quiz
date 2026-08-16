// 正式题库基础容器。
// 各课程/阶段题库由独立 questions-*.js 文件继续追加，避免单文件过大。
const questions = [];

// 判断推理｜逻辑论证之归因论证（xingce-002）
// 在页面解析阶段同步载入，确保 app.js 初始化前 34 道题已经进入 questions。
[
  "questions-reasoning-attribution-1.js?v=20260816-1",
  "questions-reasoning-attribution-2.js?v=20260816-1",
  "questions-reasoning-attribution-3.js?v=20260816-1",
  "questions-reasoning-attribution-4.js?v=20260816-1"
].forEach(src => document.write(`<script src="${src}"><\/script>`));

// 页面完成解析后再做一次国网必刷300题完整性检查。
// 如果某一周脚本因缓存/加载异常没有注册，会自动强制补载。
window.addEventListener("DOMContentLoaded", () => {
    if (document.querySelector('script[data-question-bank-integrity]')) return;
    const script = document.createElement("script");
    script.src = `question-bank-integrity.js?v=20260816-1&ts=${Date.now()}`;
    script.dataset.questionBankIntegrity = "true";
    document.body.appendChild(script);
}, { once: true });
