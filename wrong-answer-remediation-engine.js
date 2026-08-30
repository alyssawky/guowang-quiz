// 国网普通错题重点复习闭环。
// 规则：
// 1) 普通答错即进入重点复习；当前/历史答错次数越多，优先级越高。
// 2) 重点错题强制优先进入“国网记忆曲线答题”；其他会话若本来包含该题，则排到前面。
// 3) 重点错题连续答对3次后解除重点状态，恢复正常记忆模型。
// 4) 恢复时从“当前错题库”自动移除，但保留历史作答统计；以后再次答错会重新进入。
// 5) 记忆模糊题仍沿用 memory-blur-priority-engine 的提示，同时也享受本文件的错题清退机制。
(function () {
    const VERSION = 1;
    if (Number(window.__wrongAnswerRemediationVersion || 0) >= VERSION) return;
    window.__wrongAnswerRemediationVersion = VERSION;

    const CURVE_STORE_KEY = "guowang-memory-curve-v2";
    const REQUIRED_STREAK = 3;
    const INTERVALS = [1, 2, 4, 7, 15, 30];

    function safeParse(value, fallback) {
        try { return value ? JSON.parse(value) : fallback; }
        catch (error) { return fallback; }
    }

    function toLocalISO(value = new Date()) {
        const date = value instanceof Date ? new Date(value) : new Date(value);
        if (Number.isNaN(date.getTime())) return "";
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, "0");
        const d = String(date.getDate()).padStart(2, "0");
        return `${y}-${m}-${d}`;
    }

    function addDaysISO(days) {
        const date = new Date();
        date.setHours(0, 0, 0, 0);
        date.setDate(date.getDate() + days);
        return toLocalISO(date);
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

    function getQuestion(questionId) {
        return Array.isArray(questions) ? questions.find(question => question.id === questionId) : null;
    }

    function recordOf(questionId) {
        return (typeof answerHistory !== "undefined" && answerHistory)
            ? answerHistory[questionId] || null
            : null;
    }

    function saveHistory() {
        if (typeof window.saveAnswerHistory === "function") window.saveAnswerHistory();
        else if (typeof saveAnswerHistory === "function") saveAnswerHistory();
    }

    function loadCurveStore() {
        return safeParse(localStorage.getItem(CURVE_STORE_KEY), {});
    }

    function saveCurveStore(store) {
        localStorage.setItem(CURVE_STORE_KEY, JSON.stringify(store || {}));
    }

    function lifetimeWrong(record) {
        if (!record) return 0;
        return Number(record.archivedWrong || 0) + Number(record.wrong || 0);
    }

    function forceCurvePriority(questionId) {
        const store = loadCurveStore();
        const old = store[questionId] || {};
        store[questionId] = {
            ...old,
            level: 0,
            dueDate: addDaysISO(-30),
            lastReviewedDate: toLocalISO(),
            source: "wrong-answer-focus",
            wrongFocus: true
        };
        saveCurveStore(store);
    }

    function releaseCurvePriority(questionId) {
        const store = loadCurveStore();
        const old = store[questionId] || {};
        const level = Math.max(0, Math.min(INTERVALS.length - 1, Number(old.level || 0)));
        store[questionId] = {
            ...old,
            level,
            dueDate: addDaysISO(INTERVALS[level]),
            lastReviewedDate: toLocalISO(),
            source: "wrong-answer-recovered",
            wrongFocus: false,
            focus: false
        };
        saveCurveStore(store);
    }

    function focusScore(question) {
        const record = recordOf(question.id);
        if (!record || record.wrongFocusActive !== true) return 0;
        const wrongs = lifetimeWrong(record);
        const blur = Number(record.memoryBlurred || 0);
        const streak = Number(record.wrongFocusStreak || 0);
        // 核心：答错越多越靠前；记忆模糊在相同错次下再额外加权。
        return 100000 + wrongs * 1200 + blur * 1500 + (REQUIRED_STREAK - streak) * 20;
    }

    function activeWrongFocusQuestions() {
        if (!Array.isArray(questions)) return [];
        const today = toLocalISO();
        return questions
            .filter(question => {
                if (!isBankQuestion(question)) return false;
                if (question.unlockDate && question.unlockDate > today) return false;
                const record = recordOf(question.id);
                return Boolean(record && record.wrongFocusActive === true);
            })
            .sort((a, b) => focusScore(b) - focusScore(a));
    }

    function combinedFocusQuestions() {
        const blurFocus = typeof window.getMemoryBlurFocusQuestions === "function"
            ? window.getMemoryBlurFocusQuestions()
            : [];
        const wrongFocus = activeWrongFocusQuestions();
        const seen = new Set();
        return [...wrongFocus, ...blurFocus]
            .filter(question => {
                if (!question || seen.has(question.id)) return false;
                seen.add(question.id);
                return true;
            })
            .sort((a, b) => {
                const aWrong = focusScore(a);
                const bWrong = focusScore(b);
                if (aWrong !== bWrong) return bWrong - aWrong;
                const ar = recordOf(a.id);
                const br = recordOf(b.id);
                return Number(br?.memoryBlurred || 0) - Number(ar?.memoryBlurred || 0);
            });
    }

    function installToastStyle() {
        if (document.getElementById("wrong-remediation-toast-style")) return;
        const style = document.createElement("style");
        style.id = "wrong-remediation-toast-style";
        style.textContent = `
            .wrong-remediation-toast {
                position: fixed;
                right: 24px;
                bottom: 24px;
                z-index: 5200;
                max-width: min(470px, calc(100vw - 32px));
                padding: 12px 16px;
                border: 1px solid #d9b8b3;
                border-radius: 12px;
                background: rgba(255,250,249,.99);
                box-shadow: 0 12px 34px rgba(80,35,30,.16);
                color: #7b322c;
                font-size: 13px;
                font-weight: 750;
                line-height: 1.55;
                opacity: 0;
                transform: translateY(10px);
                pointer-events: none;
                transition: opacity .18s ease, transform .18s ease;
            }
            .wrong-remediation-toast.is-visible { opacity:1; transform:translateY(0); }
            .wrong-remediation-toast small { display:block; margin-top:2px; color:#836662; font-size:11px; font-weight:600; }
            .wrong-remediation-toast.is-progress { border-color:#c8ced8; background:rgba(250,251,253,.99); color:#2f3744; }
            .wrong-remediation-toast.is-recovered { border-color:#afd2b7; background:rgba(248,253,249,.99); color:#286239; }
            @media (max-width:640px) { .wrong-remediation-toast { left:16px; right:16px; bottom:18px; max-width:none; } }
        `;
        document.head.appendChild(style);
    }

    let toastTimer = null;
    function showToast(title, detail, kind = "wrong") {
        installToastStyle();
        let toast = document.getElementById("wrong-remediation-toast");
        if (!toast) {
            toast = document.createElement("div");
            toast.id = "wrong-remediation-toast";
            toast.className = "wrong-remediation-toast";
            toast.setAttribute("role", "status");
            toast.setAttribute("aria-live", "polite");
            document.body.appendChild(toast);
        }
        toast.classList.toggle("is-progress", kind === "progress");
        toast.classList.toggle("is-recovered", kind === "recovered");
        toast.innerHTML = `<span>${title}</span>${detail ? `<small>${detail}</small>` : ""}`;
        if (toastTimer) clearTimeout(toastTimer);
        toast.classList.remove("is-visible");
        void toast.offsetWidth;
        toast.classList.add("is-visible");
        toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 3400);
    }

    function refreshViews() {
        if (typeof window.renderWrongList === "function") window.renderWrongList();
        if (typeof window.updateDashboardStats === "function") window.updateDashboardStats();
        decorateCurveButton();
    }

    function activateWrongFocus(questionId) {
        const record = recordOf(questionId);
        if (!record) return;
        record.wrongFocusActive = true;
        record.wrongFocusStreak = 0;
        record.wrongFocusLastWrongAt = new Date().toISOString();
        record.wrongFocusEnteredAt = record.wrongFocusEnteredAt || new Date().toISOString();
        record.wrongFocusLifetimeWrong = lifetimeWrong(record);
        forceCurvePriority(questionId);
        saveHistory();
    }

    function recoverWrongFocus(questionId) {
        const record = recordOf(questionId);
        if (!record) return;

        // “删出错题库”采用归档而不是抹除历史：
        // renderWrongList / weak-knowledge-addon 都以 record.wrong > 0 判断当前错题，
        // 因而把当前 wrong 归档后清零，就会自动从当前错题库和薄弱知识点区消失。
        const currentWrong = Number(record.wrong || 0);
        record.archivedWrong = Number(record.archivedWrong || 0) + currentWrong;
        record.wrong = 0;
        record.wrongFocusActive = false;
        record.wrongFocusStreak = REQUIRED_STREAK;
        record.wrongFocusRecoveredAt = new Date().toISOString();
        record.wrongFocusLifetimeWrong = Number(record.archivedWrong || 0);
        releaseCurvePriority(questionId);
        saveHistory();
    }

    // 在现有所有 recordAnswer 包装器之后再包一层。
    // 因此普通点击错误、判断题错误、多选错误，以及“记忆模糊”触发的错误记录都能进入同一补救状态。
    const baseRecordAnswer = window.recordAnswer;
    if (typeof baseRecordAnswer === "function" && !window.__wrongAnswerRemediationRecordWrapped) {
        window.__wrongAnswerRemediationRecordWrapped = true;
        window.recordAnswer = function (questionId, isCorrect, ...rest) {
            const result = baseRecordAnswer.call(this, questionId, isCorrect, ...rest);
            const question = getQuestion(questionId);
            const record = recordOf(questionId);
            if (!question || !record || !isBankQuestion(question)) return result;

            if (!Boolean(isCorrect)) {
                activateWrongFocus(questionId);

                // “记忆模糊”会在 recordAnswer 返回后继续写 lastMistakeType，故延迟一个事件循环判断，避免双重提示。
                setTimeout(() => {
                    const latest = recordOf(questionId);
                    if (!latest || latest.lastMistakeType === "memory-blur") {
                        refreshViews();
                        return;
                    }
                    showToast(
                        `答错 · 已进入重点复习（累计错 ${lifetimeWrong(latest)} 次）`,
                        "答错次数越多，后续曲线刷题优先级越高；连续答对3次后自动移出错题库并恢复正常记忆模型。"
                    );
                    refreshViews();
                }, 0);
                return result;
            }

            if (record.wrongFocusActive === true) {
                const streak = Math.min(REQUIRED_STREAK, Number(record.wrongFocusStreak || 0) + 1);
                record.wrongFocusStreak = streak;
                record.wrongFocusLastCorrectAt = new Date().toISOString();

                if (streak >= REQUIRED_STREAK) {
                    const hadMemoryBlurFocus = Number(record.memoryBlurred || 0) > 0;
                    recoverWrongFocus(questionId);
                    setTimeout(() => {
                        // 若这道题也属于记忆模糊重点题，memory-blur-priority-engine 会同时显示恢复提示；
                        // 这里仍明确补充“已移出错题库”，确保用户知道当前错题已清退。
                        showToast(
                            "连续3次回答正确 · 已移出错题库",
                            hadMemoryBlurFocus
                                ? "重点状态已解除；历史错题与记忆模糊次数仍保留，后续回到正常记忆曲线。"
                                : "当前错题状态已清除，历史答题记录保留；后续回到正常记忆曲线。",
                            "recovered"
                        );
                        refreshViews();
                    }, 10);
                } else {
                    forceCurvePriority(questionId);
                    saveHistory();
                    setTimeout(() => {
                        // 记忆模糊引擎会对模糊重点题显示自己的1/3、2/3提示，避免重复弹两层。
                        if (record.memoryBlurFocusActive === true) {
                            refreshViews();
                            return;
                        }
                        showToast(
                            `错题巩固进度 ${streak}/${REQUIRED_STREAK}`,
                            `还需连续答对 ${REQUIRED_STREAK - streak} 次，之后自动移出错题库并恢复正常记忆模型。`,
                            "progress"
                        );
                        refreshViews();
                    }, 0);
                }
            }
            return result;
        };
    }

    // 曲线会话：所有当前重点错题强制进入本轮，并按“累计答错次数”优先排序。
    // 本轮题量保持不变，避免重点题过多时无限拉长一轮。
    const baseStartQuestionSession = window.startQuestionSession;
    if (typeof baseStartQuestionSession === "function" && !window.__wrongAnswerRemediationSessionWrapped) {
        window.__wrongAnswerRemediationSessionWrapped = true;
        window.startQuestionSession = function (questionList, title, sequenceText = "") {
            const list = Array.isArray(questionList) ? questionList.slice() : [];
            const titleText = String(title || "");
            const isCurve = titleText.includes("记忆曲线答题");
            let finalList = list;

            if (isCurve && list.length) {
                const focus = combinedFocusQuestions();
                const seen = new Set();
                finalList = [...focus, ...list]
                    .filter(question => {
                        if (!question || seen.has(question.id)) return false;
                        seen.add(question.id);
                        return true;
                    })
                    .slice(0, list.length);

                if (window.__memoryCurveQuizQuestionIds instanceof Set) {
                    finalList.forEach(question => window.__memoryCurveQuizQuestionIds.add(question.id));
                }
            } else if (list.length) {
                finalList = list
                    .map((question, index) => ({ question, index, score: focusScore(question) }))
                    .sort((a, b) => b.score - a.score || a.index - b.index)
                    .map(item => item.question);
            }

            const focusCount = finalList.filter(question => {
                const record = recordOf(question.id);
                return Boolean(record && (record.wrongFocusActive === true || record.memoryBlurFocusActive === true));
            }).length;
            const finalSequence = focusCount
                ? `${sequenceText || ""}${sequenceText ? " · " : ""}重点错题${focusCount}题优先`
                : sequenceText;

            return baseStartQuestionSession.call(this, finalList, title, finalSequence);
        };
    }

    function decorateCurveButton() {
        const button = document.getElementById("start-cumulative-memory");
        if (!button) return;
        const count = combinedFocusQuestions().length;
        let text = String(button.textContent || "")
            .replace(/\s*·\s*重点\d+题/g, "")
            .replace(/\s*·\s*重点错题\d+题/g, "");
        button.textContent = count ? `${text} · 重点${count}题` : text;
        if (count) {
            button.title = `${button.title ? button.title + "\n" : ""}当前有 ${count} 道重点错题/记忆模糊题；答错越多越优先，连续答对3次后自动恢复正常。`;
        }
    }

    // 迁移旧错题：此前 wrong>0、但还没有普通错题重点状态的国网题，统一进入重点复习。
    // 已被新机制恢复并归档的题 wrong=0，不会被重新激活。
    function migrateExistingWrongRecords() {
        if (!Array.isArray(questions) || typeof answerHistory === "undefined") return;
        let changed = false;
        questions.filter(isBankQuestion).forEach(question => {
            const record = recordOf(question.id);
            if (!record || Number(record.wrong || 0) <= 0) return;
            if (record.wrongFocusActive === true) return;
            record.wrongFocusActive = true;
            record.wrongFocusStreak = 0;
            record.wrongFocusEnteredAt = record.lastAnsweredAt || new Date().toISOString();
            record.wrongFocusLifetimeWrong = lifetimeWrong(record);
            forceCurvePriority(question.id);
            changed = true;
        });
        if (changed) saveHistory();
    }

    migrateExistingWrongRecords();

    // 让后加载的“曲线断点修复”同时认识普通错题与记忆模糊题。
    // 它调用这个函数判断是否需要废弃旧曲线题序。
    window.getMemoryBlurFocusQuestions = combinedFocusQuestions;
    window.getWrongAnswerFocusQuestions = activeWrongFocusQuestions;
    window.getWrongAnswerFocusScore = focusScore;
    window.getWrongAnswerLifetimeWrong = function (questionId) {
        return lifetimeWrong(recordOf(questionId));
    };

    setTimeout(() => {
        decorateCurveButton();
        if (typeof window.renderWrongList === "function") window.renderWrongList();
    }, 0);
})();
