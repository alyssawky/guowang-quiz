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
