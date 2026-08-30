// 修复普通错题引擎接管重点题 getter 后可能产生的递归。
// 统一从 answerHistory 直接读取两种重点状态：wrongFocusActive / memoryBlurFocusActive。
(function () {
    if (window.__wrongAnswerFocusGetterFixInstalled) return;
    window.__wrongAnswerFocusGetterFixInstalled = true;

    function recordOf(questionId) {
        return (typeof answerHistory !== "undefined" && answerHistory)
            ? answerHistory[questionId] || null
            : null;
    }

    function taskOf(question) {
        if (!question || typeof studyPlan === "undefined") return null;
        return studyPlan.find(task => task.id === question.taskId) || null;
    }

    function isBankQuestion(question) {
        const task = taskOf(question);
        return Boolean(
            question &&
            (String(question.taskId || "").startsWith("preoct300-w") ||
                question.sourceSet === "10月前必学300题" ||
                (task && (task.questionBank || task.category === "国网题库")))
        );
    }

    function localISO() {
        const d = new Date();
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${y}-${m}-${day}`;
    }

    function safeCombinedFocusQuestions() {
        if (typeof questions === "undefined" || !Array.isArray(questions)) return [];
        const today = localISO();
        return questions
            .filter(question => {
                if (!isBankQuestion(question)) return false;
                if (question.unlockDate && question.unlockDate > today) return false;
                const record = recordOf(question.id);
                return Boolean(record && (
                    record.wrongFocusActive === true ||
                    record.memoryBlurFocusActive === true
                ));
            })
            .sort((a, b) => {
                const ar = recordOf(a.id) || {};
                const br = recordOf(b.id) || {};
                const aWrong = Number(ar.archivedWrong || 0) + Number(ar.wrong || 0);
                const bWrong = Number(br.archivedWrong || 0) + Number(br.wrong || 0);
                if (aWrong !== bWrong) return bWrong - aWrong;
                const aBlur = Number(ar.memoryBlurred || 0);
                const bBlur = Number(br.memoryBlurred || 0);
                if (aBlur !== bBlur) return bBlur - aBlur;
                return Number(ar.wrongFocusStreak || 0) - Number(br.wrongFocusStreak || 0);
            });
    }

    // 旧的 session-resume-fix 与普通错题引擎都会读取这个 getter。
    // 直接替换为无递归实现即可同时覆盖“普通错题 + 记忆模糊”。
    window.getMemoryBlurFocusQuestions = safeCombinedFocusQuestions;
    window.getAllBankFocusQuestions = safeCombinedFocusQuestions;
})();
