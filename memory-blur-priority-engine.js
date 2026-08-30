// 国网“记忆模糊”重点复习闭环。
// 规则：
// 1) 点击“记忆模糊”立即有反馈，并进入重点出题状态；重复点击继续累计模糊次数。
// 2) 重点题在国网记忆曲线答题中强制优先进入本轮，并排在普通题之前。
// 3) 重点题必须连续答对 3 次才解除重点状态，随后恢复原有 1→2→4→7→15→30 天记忆曲线。
// 4) 重点状态下任何一次答错或再次“记忆模糊”，连续正确次数归零。
(function () {
    const VERSION = 1;
    if (Number(window.__memoryBlurPriorityEngineVersion || 0) >= VERSION) return;
    window.__memoryBlurPriorityEngineVersion = VERSION;

    const CURVE_STORE_KEY = "guowang-memory-curve-v2";
    const REQUIRED_STREAK = 3;

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

    function supportsMemoryBlur(question) {
        const task = taskOf(question);
        if (isBankQuestion(question)) return true;
        if (!task || task.category !== "计算机") return false;
        const isMethod = typeof window.isComputerMethodQuestion === "function"
            ? window.isComputerMethodQuestion(question)
            : false;
        return !isMethod;
    }

    function currentQuestion() {
        return (typeof currentReviewQuestions !== "undefined" && typeof currentQuestionIndex !== "undefined")
            ? currentReviewQuestions[currentQuestionIndex]
            : null;
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

    function forceCurvePriority(questionId) {
        const store = loadCurveStore();
        const old = store[questionId] || {};
        // 设为明显逾期，使原有记忆曲线权重函数把它放到最高一档。
        store[questionId] = {
            ...old,
            level: 0,
            dueDate: addDaysISO(-30),
            lastReviewedDate: toLocalISO(),
            source: "memory-blur-focus",
            focus: true
        };
        saveCurveStore(store);
    }

    function releaseCurvePriority(questionId) {
        const store = loadCurveStore();
        const old = store[questionId];
        if (!old) return;
        // 正常情况下 memory-curve.js 已在本次正确作答中写回正常 dueDate。
        // 只有仍残留 focus 标记时才兜底恢复为明日到期，避免旧的“30天逾期”继续抢权重。
        if (old.focus || old.source === "memory-blur-focus") {
            store[questionId] = {
                ...old,
                level: Math.max(0, Number(old.level || 0)),
                dueDate: addDaysISO(1),
                lastReviewedDate: toLocalISO(),
                source: "memory-blur-recovered",
                focus: false
            };
            saveCurveStore(store);
        }
    }

    function focusScore(question) {
        const record = recordOf(question.id);
        if (!record || record.memoryBlurFocusActive !== true) return 0;
        const blur = Number(record.memoryBlurred || 0);
        const streak = Number(record.memoryBlurFocusStreak || 0);
        const wrong = Number(record.wrong || 0);
        return 10000 + blur * 500 + wrong * 20 + (REQUIRED_STREAK - streak) * 10;
    }

    function activeFocusQuestions() {
        if (typeof questions === "undefined" || !Array.isArray(questions)) return [];
        const today = toLocalISO();
        return questions
            .filter(question => {
                if (!isBankQuestion(question)) return false;
                if (question.unlockDate && question.unlockDate > today) return false;
                const record = recordOf(question.id);
                return Boolean(
                    record &&
                    record.memoryBlurFocusActive === true &&
                    Number(record.attempts || 0) > 0
                );
            })
            .sort((a, b) => focusScore(b) - focusScore(a));
    }

    function installFocusToastStyle() {
        if (document.getElementById("memory-focus-toast-style")) return;
        const style = document.createElement("style");
        style.id = "memory-focus-toast-style";
        style.textContent = `
            .memory-focus-toast {
                position: fixed;
                right: 24px;
                bottom: 24px;
                z-index: 5100;
                max-width: min(450px, calc(100vw - 32px));
                padding: 12px 16px;
                border: 1px solid #c8ced8;
                border-radius: 12px;
                background: rgba(250,251,253,.99);
                box-shadow: 0 12px 34px rgba(20,30,50,.16);
                color: #2f3744;
                font-size: 13px;
                font-weight: 750;
                line-height: 1.55;
                opacity: 0;
                transform: translateY(10px);
                pointer-events: none;
                transition: opacity .18s ease, transform .18s ease;
            }
            .memory-focus-toast.is-visible { opacity: 1; transform: translateY(0); }
            .memory-focus-toast small { display:block; margin-top:2px; color:#6b7280; font-size:11px; font-weight:600; }
            .memory-focus-toast.is-recovered { border-color:#afd2b7; background:rgba(248,253,249,.99); color:#286239; }
            @media (max-width:640px) { .memory-focus-toast { left:16px; right:16px; bottom:18px; max-width:none; } }
        `;
        document.head.appendChild(style);
    }

    let focusToastTimer = null;
    function showFocusToast(title, detail, recovered = false) {
        installFocusToastStyle();
        let toast = document.getElementById("memory-focus-toast");
        if (!toast) {
            toast = document.createElement("div");
            toast.id = "memory-focus-toast";
            toast.className = "memory-focus-toast";
            toast.setAttribute("role", "status");
            toast.setAttribute("aria-live", "polite");
            document.body.appendChild(toast);
        }
        toast.classList.toggle("is-recovered", recovered);
        toast.innerHTML = `<span>${title}</span>${detail ? `<small>${detail}</small>` : ""}`;
        if (focusToastTimer) clearTimeout(focusToastTimer);
        toast.classList.remove("is-visible");
        void toast.offsetWidth;
        toast.classList.add("is-visible");
        focusToastTimer = setTimeout(() => toast.classList.remove("is-visible"), 3300);
    }

    function answerDisplay(question) {
        if (!question) return "";
        if (question.type === "short") return String(question.answerDisplay || question.answer || "");
        const keys = String(question.answer || "").split("").sort().join("");
        if (typeof window.optionDisplayText === "function") {
            try {
                const display = window.optionDisplayText(keys);
                if (display) return display;
            } catch (error) {}
        }
        return keys.split("").map(key => {
            const value = question.options && question.options[key];
            return value ? `${key}. ${value}` : key;
        }).join("；");
    }

    function disableCurrentControls() {
        const card = document.querySelector("#quiz-area .quiz-question-card") || document.querySelector("#quiz-area .task-card") || document;
        card.querySelectorAll(".option-btn").forEach(button => { button.disabled = true; });
        const multipleSubmit = card.querySelector("#multiple-submit-btn");
        if (multipleSubmit) multipleSubmit.disabled = true;
        const shortInput = card.querySelector("#short-answer-input");
        if (shortInput) shortInput.disabled = true;
        const blur = card.querySelector("#memory-blur-btn");
        if (blur) blur.disabled = true;
    }

    function markMemoryBlurredFocus() {
        const question = currentQuestion();
        const feedback = document.getElementById("answer-feedback");
        if (!question || !feedback || !supportsMemoryBlur(question)) return;

        if (feedback.querySelector(".answer-result")) {
            showFocusToast("本题本轮已经提交", "下一次出现时仍可再次标记“记忆模糊”。");
            return;
        }

        // 记忆模糊本身记为一次错误作答。
        if (typeof window.recordAnswer === "function") window.recordAnswer(question.id, false);
        else if (typeof recordAnswer === "function") recordAnswer(question.id, false);

        const record = recordOf(question.id);
        let blurCount = 1;
        if (record) {
            record.memoryBlurred = Number(record.memoryBlurred || 0) + 1;
            blurCount = Number(record.memoryBlurred || 0);
            record.lastMistakeType = "memory-blur";
            record.lastMemoryBlurredAt = new Date().toISOString();

            if (isBankQuestion(question)) {
                record.memoryBlurFocusActive = true;
                record.memoryBlurFocusStreak = 0;
                record.memoryBlurFocusEnteredAt = record.memoryBlurFocusEnteredAt || new Date().toISOString();
                record.memoryBlurFocusLastMarkedAt = new Date().toISOString();
                record.memoryBlurFocusLevel = blurCount >= 2 ? "repeat" : "focus";
                forceCurvePriority(question.id);
            }
            saveHistory();
        }

        if (typeof window.showMemoryBlurToast === "function") {
            window.showMemoryBlurToast({
                kind: "memory-blur",
                count: blurCount,
                priority: isBankQuestion(question)
                    ? (blurCount >= 2
                        ? "已提高重点出题优先级 · 连续答对3次后恢复正常记忆模型"
                        : "已进入重点出题复习 · 连续答对3次后恢复正常记忆模型")
                    : (blurCount >= 2 ? "优先级：反复遗忘" : "优先级：重点补")
            });
        }

        if (typeof window.renderWrongList === "function") window.renderWrongList();
        disableCurrentControls();

        const bankText = isBankQuestion(question)
            ? `<p class="memory-blur-note">已进入<strong>重点出题复习</strong>。之后会在国网记忆曲线答题中优先出现；必须连续回答正确 ${REQUIRED_STREAK} 次才恢复正常记忆模型。任何一次答错或再次标记“记忆模糊”，连续正确次数都会重新从 0 开始。</p>`
            : `<p class="memory-blur-note">已按高优先级记忆错题记录，重复模糊会继续提高复习优先级。</p>`;

        feedback.innerHTML = `
            <div class="review-card answer-result wrong-result memory-blur-result">
                <strong>记忆模糊 · 已记录${isBankQuestion(question) ? "并加入重点复习" : ""}</strong>
                ${bankText}
                <p>正确答案：${answerDisplay(question)}</p>
                <div class="answer-explanation">${question.explanation || ""}</div>
                ${question.note ? `<p class="answer-note"><strong>口径提醒：</strong>${question.note}</p>` : ""}
                <button onclick="nextQuestion()">下一题</button>
            </div>
        `;
    }

    // 覆盖旧实现：按钮的 inline onclick 会在点击时读取当前 window.markMemoryBlurred。
    // 这样即使旧版本在某些国网会话里提前 return，也不会再出现“点了没反应”。
    window.markMemoryBlurred = markMemoryBlurredFocus;

    // 在所有既有 recordAnswer 包装器之后再包一层，用于维护“连续正确3次”的状态。
    const baseRecordAnswer = window.recordAnswer;
    if (typeof baseRecordAnswer === "function" && !window.__memoryBlurPriorityRecordWrapped) {
        window.__memoryBlurPriorityRecordWrapped = true;
        window.recordAnswer = function (questionId, isCorrect, ...rest) {
            const result = baseRecordAnswer.call(this, questionId, isCorrect, ...rest);
            const record = recordOf(questionId);
            if (!record || record.memoryBlurFocusActive !== true) return result;

            if (Boolean(isCorrect)) {
                const streak = Math.min(REQUIRED_STREAK, Number(record.memoryBlurFocusStreak || 0) + 1);
                record.memoryBlurFocusStreak = streak;
                record.memoryBlurFocusLastCorrectAt = new Date().toISOString();

                if (streak >= REQUIRED_STREAK) {
                    record.memoryBlurFocusActive = false;
                    record.memoryBlurFocusLevel = "normal";
                    record.memoryBlurRecoveredAt = new Date().toISOString();
                    releaseCurvePriority(questionId);
                    saveHistory();
                    setTimeout(() => {
                        showFocusToast(
                            "连续3次回答正确 · 已恢复正常记忆模型",
                            "这道题不再享有重点出题优先级，后续继续按原有记忆曲线复习。",
                            true
                        );
                        decorateCurveButton();
                    }, 0);
                } else {
                    // 前两次正确仍维持“到期最高优先级”，直到第三次正确。
                    forceCurvePriority(questionId);
                    saveHistory();
                    setTimeout(() => {
                        showFocusToast(
                            `重点复习进度 ${streak}/${REQUIRED_STREAK}`,
                            `还需连续答对 ${REQUIRED_STREAK - streak} 次，才恢复正常记忆模型。`
                        );
                        decorateCurveButton();
                    }, 0);
                }
            } else {
                record.memoryBlurFocusStreak = 0;
                record.memoryBlurFocusLastWrongAt = new Date().toISOString();
                forceCurvePriority(questionId);
                saveHistory();
                setTimeout(decorateCurveButton, 0);
            }
            return result;
        };
    }

    // 在所有既有 startQuestionSession 包装器之后再包一层：
    // - 所有会话中，已被选中的重点题自动排到最前；
    // - 对“国网记忆曲线答题”，把所有当前重点题强制纳入本轮（本轮题量不增加），从而真正做到重点出题。
    const baseStartQuestionSession = window.startQuestionSession;
    if (typeof baseStartQuestionSession === "function" && !window.__memoryBlurPrioritySessionWrapped) {
        window.__memoryBlurPrioritySessionWrapped = true;
        window.startQuestionSession = function (questionList, title, sequenceText = "") {
            const list = Array.isArray(questionList) ? questionList.slice() : [];
            const titleText = String(title || "");
            let finalList = list;

            const isCurve = titleText.includes("记忆曲线答题");
            if (isCurve && list.length) {
                const focus = activeFocusQuestions();
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

            const focusCount = finalList.filter(question => focusScore(question) > 0).length;
            const finalSequence = focusCount
                ? `${sequenceText || ""}${sequenceText ? " · " : ""}重点复习${focusCount}题优先`
                : sequenceText;

            return baseStartQuestionSession.call(this, finalList, title, finalSequence);
        };
    }

    function decorateCurveButton() {
        const button = document.getElementById("start-cumulative-memory");
        if (!button) return;
        const count = activeFocusQuestions().length;
        const old = String(button.textContent || "").replace(/\s*·\s*重点\d+题/g, "");
        button.textContent = count ? `${old} · 重点${count}题` : old;
        if (count) {
            button.title = `${button.title ? button.title + "\n" : ""}当前有 ${count} 道“记忆模糊”重点题，会优先进入曲线答题；连续答对3次后自动恢复正常。`;
        }
    }

    // 迁移旧数据：此前已经点过“记忆模糊”但旧版没有重点状态字段的国网题，自动纳入重点复习。
    function migrateExistingBlurRecords() {
        if (typeof questions === "undefined" || !Array.isArray(questions) || typeof answerHistory === "undefined") return;
        let changed = false;
        questions.filter(isBankQuestion).forEach(question => {
            const record = recordOf(question.id);
            if (!record || Number(record.memoryBlurred || 0) <= 0) return;
            if (typeof record.memoryBlurFocusActive === "boolean") return;
            record.memoryBlurFocusActive = true;
            record.memoryBlurFocusStreak = 0;
            record.memoryBlurFocusEnteredAt = record.lastMemoryBlurredAt || new Date().toISOString();
            record.memoryBlurFocusLevel = Number(record.memoryBlurred || 0) >= 2 ? "repeat" : "focus";
            forceCurvePriority(question.id);
            changed = true;
        });
        if (changed) saveHistory();
    }

    migrateExistingBlurRecords();
    setTimeout(decorateCurveButton, 0);

    window.getMemoryBlurFocusQuestions = activeFocusQuestions;
    window.getMemoryBlurFocusScore = focusScore;
})();
