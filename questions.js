// 正式题库基础容器。
// 各课程/阶段题库由独立 questions-*.js 文件继续追加，避免单文件过大。
const questions = [];

// 判断推理｜逻辑论证之归因论证（xingce-002）
// 言语理解｜第1–2章（xingce-003 / xingce-007）
// 计算机｜第二章 数据的表示与运算（computer-002）：主文件49题；另有1道CRC补充题由 index.html 加载。
// 数量关系｜前五讲（xingce-004 / 008 / 009 / 012 / 016）：63题；先载入数学解析格式器，再载入题库。
// 在页面解析阶段同步载入，确保 app.js 初始化前对应题目已经进入 questions。
[
  "questions-reasoning-attribution-1.js?v=20260816-1",
  "questions-reasoning-attribution-2.js?v=20260816-1",
  "questions-reasoning-attribution-3.js?v=20260816-1",
  "questions-reasoning-attribution-4.js?v=20260816-1",
  "questions-verbal-ch1.js?v=20260817-1",
  "questions-verbal-ch2-1.js?v=20260817-1",
  "questions-verbal-ch2-2.js?v=20260817-1",
  "questions-verbal-ch2-3.js?v=20260817-1",
  "questions-computer-002-1.js?v=20260820-1",
  "questions-computer-002-2.js?v=20260820-1",
  "questions-computer-002-3.js?v=20260820-1",
  "quantity-math-format.js?v=20260821-1",
  "questions-quantity-l1.js?v=20260821-1",
  "questions-quantity-l2.js?v=20260821-1",
  "questions-quantity-l3.js?v=20260821-1",
  "questions-quantity-l4.js?v=20260821-1",
  "questions-quantity-l5.js?v=20260821-1"
].forEach(src => document.write(`<script src="${src}"><\/script>`));

// 每日国网任务、知识解析、记忆曲线等必须等 app.js 初始化完 answerHistory / recordAnswer 后再加载。
// 但国网300题的“每日题号→日期”必须先与 Apple 提醒事项计划同步，否则 daily-practice 会按错误日期判断“今日无新题”。
window.addEventListener("DOMContentLoaded", () => {
    const loadIntegrity = () => {
        if (!document.querySelector('script[data-question-bank-integrity]')) {
            const integrityScript = document.createElement("script");
            integrityScript.src = `question-bank-integrity.js?v=20260816-5&ts=${Date.now()}`;
            integrityScript.dataset.questionBankIntegrity = "true";
            document.body.appendChild(integrityScript);
        }
    };

    if (!document.querySelector('script[data-stategrid-daily-schedule-sync]')) {
        const scheduleScript = document.createElement("script");
        scheduleScript.src = `stategrid-daily-schedule-sync.js?v=20260823-1&ts=${Date.now()}`;
        scheduleScript.dataset.stategridDailyScheduleSync = "true";
        scheduleScript.onload = loadIntegrity;
        scheduleScript.onerror = () => {
            console.error("国网每日题目日期同步模块加载失败");
            loadIntegrity();
        };
        document.body.appendChild(scheduleScript);
    } else {
        loadIntegrity();
    }

    if (!document.querySelector('script[data-answer-history-reset]')) {
        const resetScript = document.createElement("script");
        resetScript.src = `reset-test-answer-history.js?v=20260816-1&ts=${Date.now()}`;
        resetScript.dataset.answerHistoryReset = "true";
        document.body.appendChild(resetScript);
    }
}, { once: true });
