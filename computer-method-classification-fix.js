// 修正计算机题“纯记忆 / 方法理解”误判。
// 重点：题干即使不写“转换/换算”，只要要求把一个具体进制数对应到另一进制结果，仍属于规则应用/计算题。
(function () {
    if (window.__computerMethodClassificationFixInstalled) return;
    window.__computerMethodClassificationFixInstalled = true;

    const normalize = value => String(value == null ? "" : value).replace(/\s+/g, " ").trim();

    function isNumericBaseApplication(question) {
        if (!question) return false;
        const text = `${normalize(question.question)} ${normalize(question.topic)}`;

        // 典型结构：1101 对应（ ）、1010 等于几、某二进制数对应十六进制数等。
        const mentionsBase = /(二进制|八进制|十进制|十六进制|[₂₈₁₀₁₆]|\)\s*[248]|\b[01]{2,}\b|\b[0-9A-F]+H\b)/i.test(text);
        const asksMapping = /(对应|等于|相当于|表示为|写成|转为|转换为|换成|换算为|结果|求值)/.test(text);
        const concreteValue = /\b[01]{2,}\b|\b[0-9A-F]+H\b|\([0-9A-F.]+\)\s*(?:2|8|10|16)/i.test(text);

        if (mentionsBase && asksMapping && concreteValue) return true;

        // “四个二进制位对应一个十六进制数，1101对应（ ）”这类分组映射题。
        if (/二进制/.test(text) && /十六进制/.test(text) && /对应/.test(text) && /[01]{4}/.test(text)) return true;

        // 二/八/十六进制分组法本质属于转换方法，不应当作为固定事实死记答案。
        if (/(二进制).*(八进制|十六进制)|(八进制|十六进制).*二进制/.test(text) && /[0-9A-F]{2,}/i.test(text)) {
            return /(对应|等于|转|换|表示)/.test(text);
        }

        return false;
    }

    // 给内部错题分类器一个显式人工覆盖；其 isMethod() 会优先读取 computerReviewMode。
    if (typeof questions !== "undefined" && Array.isArray(questions)) {
        questions.forEach(question => {
            const task = typeof studyPlan !== "undefined"
                ? studyPlan.find(item => item.id === question.taskId)
                : null;
            if (task?.category !== "计算机") return;
            if (question.computerReviewMode === "memory") return;
            if (isNumericBaseApplication(question)) question.computerReviewMode = "method";
        });
    }

    const baseClassifier = window.isComputerMethodQuestion;
    window.isComputerMethodQuestion = function (question) {
        if (isNumericBaseApplication(question)) return true;
        return typeof baseClassifier === "function" ? baseClassifier(question) : false;
    };

    window.isNumericBaseApplicationQuestion = isNumericBaseApplication;
})();
