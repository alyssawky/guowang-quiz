// 显示层命名：计算机按学习顺序编号，不使用课程大纲中的“1-4 / 2-1”等编号。
(function normalizeComputerTaskDisplayNames() {
    if (typeof studyPlan === "undefined") return;

    const computerTasks = studyPlan.filter(task => task.category === "计算机");

    computerTasks.forEach((task, index) => {
        if (!task.originalName) task.originalName = task.name;

        const simplified = String(task.originalName)
            .replace(/\b\d{1,2}-\d+(?:\/\d{1,2}-\d+)?\s*/g, "")
            .replace(/\s{2,}/g, " ")
            .trim();

        task.name = `${index + 1} ${simplified}`;
    });
})();

// 第二章后半段题图修复必须在 quiz-enhancements 与 hq35 override 之后执行。
// 这里等页面所有同步脚本加载完成，再追加修复脚本，避免它再次被旧低清覆盖层覆盖。
window.addEventListener("DOMContentLoaded", () => {
    if (document.querySelector('script[data-late-ch2-image-fix]')) return;

    const script = document.createElement("script");
    script.src = "assets/late-ch2-image-fix.js?v=20260816-2";
    script.dataset.lateCh2ImageFix = "true";
    document.body.appendChild(script);
});
