// 刷题学习控制：方法型题用“不会”，记忆型题保留“记忆模糊”，并支持返回上一题。
(function () {
    if (window.__questionLearningControlsInstalled) return;
    window.__questionLearningControlsInstalled = true;

    function taskOf(question) {
        return studyPlan.find(task => task.id === question?.taskId) || null;
    }

    function isBankQuestion(question) {
        const task = taskOf(question);
        return Boolean(
            question &&
            (String(question.taskId || "").startsWith("preoct300-w") ||
                (task && (task.questionBank || task.category === "国网题库")))
        );
    }

    function learningMode(question) {
        if (!question) return "none";
        const task = taskOf(question);
        if (task?.category === "行测") return "unknown";
        if (task?.category === "计算机") {
            const method = typeof window.isComputerMethodQuestion === "function"
                ? window.isComputerMethodQuestion(question)
                : false;
            return method ? "unknown" : "memory";
        }
        if (isBankQuestion(question)) return "memory";
        return "none";
    }

    function currentQuestion() {
        return (typeof currentReviewQuestions !== "undefined" && typeof currentQuestionIndex !== "undefined")
            ? currentReviewQuestions[currentQuestionIndex]
            : null;
    }

    function answerDisplay(question) {
        if (!question) return "";
        if (question.type === "short") return String(question.answerDisplay || question.answer || "");
        const keys = String(question.answer || "").split("").sort().join("");
        if (typeof optionDisplayText === "function") {
            const display = optionDisplayText(keys);
            if (display) return display;
        }
        return keys.split("").map(key => {
            const value = question.options && question.options[key];
            return value ? `${key}. ${value}` : key;
        }).join("；");
    }

    function disableAnswerControls(card) {
        (card || document).querySelectorAll(".option-btn").forEach(button => { button.disabled = true; });
        const multipleSubmit = (card || document).querySelector("#multiple-submit-btn");
        if (multipleSubmit) multipleSubmit.disabled = true;
        const shortInput = (card || document).querySelector("#short-answer-input");
        if (shortInput) shortInput.disabled = true;
        if (shortInput?.parentElement) {
            const submit = shortInput.parentElement.querySelector("button");
            if (submit) submit.disabled = true;
        }
        const stateButton = (card || document).querySelector("#memory-blur-btn");
        if (stateButton) stateButton.disabled = true;
    }

    function markQuestionUnknown() {
        const question = currentQuestion();
        const card = document.querySelector("#quiz-area .quiz-question-card");
        const feedback = card?.querySelector("#answer-feedback");
        if (!question || !card || !feedback || learningMode(question) !== "unknown") return;
        if (feedback.querySelector(".answer-result")) return;

        window.recordAnswer(question.id, false);
        const record = typeof answerHistory !== "undefined" ? answerHistory[question.id] : null;
        if (record) {
            record.notKnown = Number(record.notKnown || 0) + 1;
            record.lastMistakeType = "unknown";
            record.lastUnknownAt = new Date().toISOString();
            if (typeof window.saveAnswerHistory === "function") window.saveAnswerHistory();
        }

        if (typeof window.renderWrongList === "function") window.renderWrongList();
        disableAnswerControls(card);

        feedback.innerHTML = `
            <div class="review-card answer-result wrong-result question-unknown-result">
                <strong>不会 · 已按错题记录</strong>
                <p class="question-unknown-note">这类题按“方法/理解未掌握”记录，不计入“记忆模糊”次数。后续会进入错题本和对应的方法复盘。</p>
                <p>正确答案：${answerDisplay(question)}</p>
                <div class="answer-explanation">${question.explanation || ""}</div>
                ${question.note ? `<p class="answer-note"><strong>口径提醒：</strong>${question.note}</p>` : ""}
                <button onclick="nextQuestion()">下一题</button>
            </div>
        `;

        decorateFeedbackNavigation();
        if (typeof window.showMemoryBlurToast === "function") window.showMemoryBlurToast();
    }

    window.markQuestionUnknown = markQuestionUnknown;

    function previousQuestion() {
        if (
            typeof currentQuestionIndex === "undefined" ||
            typeof currentReviewQuestions === "undefined" ||
            currentQuestionIndex <= 0
        ) return;

        currentQuestionIndex -= 1;
        if (typeof renderQuestion === "function") renderQuestion();
        requestAnimationFrame(() => {
            document.querySelector("#quiz-area .quiz-question-card")?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
    }

    window.previousQuestion = previousQuestion;

    function decorateTopNavigation(card) {
        const progress = card?.querySelector(".question-progress");
        if (!progress || progress.closest(".question-progress-nav")) return;

        const row = document.createElement("div");
        row.className = "question-progress-nav";
        progress.parentNode.insertBefore(row, progress);
        row.appendChild(progress);

        const previous = document.createElement("button");
        previous.type = "button";
        previous.className = "previous-question-button";
        previous.textContent = "← 上一题";
        previous.disabled = typeof currentQuestionIndex === "undefined" || currentQuestionIndex <= 0;
        previous.addEventListener("click", previousQuestion);
        row.appendChild(previous);
    }

    function ensureStateRow(card, question) {
        const mode = learningMode(question);
        if (mode === "none") return;

        const feedback = card.querySelector("#answer-feedback");
        if (!feedback) return;

        let row = card.querySelector(".memory-blur-row");
        if (!row) {
            row = document.createElement("div");
            row.className = "memory-blur-row";
            feedback.parentNode.insertBefore(row, feedback);
        }

        if (mode === "unknown") {
            row.classList.add("question-unknown-row");
            row.innerHTML = `
                <button type="button" id="memory-blur-btn" class="memory-blur-btn question-unknown-btn" onclick="markQuestionUnknown()">不会</button>
                <span>这类题不会做时直接标记，按方法/理解薄弱记录，不用靠蒙答案判断掌握程度。</span>
            `;
            return;
        }

        row.classList.remove("question-unknown-row");
        row.innerHTML = `
            <button type="button" id="memory-blur-btn" class="memory-blur-btn" onclick="markMemoryBlurred()">记忆模糊</button>
            <span>固定知识记不清时直接标记，按记忆薄弱记录。</span>
        `;
    }

    function decorateQuestion() {
        const question = currentQuestion();
        const card = document.querySelector("#quiz-area .quiz-question-card");
        if (!question || !card) return;
        decorateTopNavigation(card);
        ensureStateRow(card, question);
    }

    function decorateFeedbackNavigation() {
        const result = document.querySelector("#quiz-area .answer-result");
        if (!result || result.querySelector(".answer-history-nav")) return;

        const next = [...result.querySelectorAll("button")].find(button =>
            String(button.getAttribute("onclick") || "").includes("nextQuestion")
        );
        if (!next) return;

        const row = document.createElement("div");
        row.className = "answer-history-nav";

        const previous = document.createElement("button");
        previous.type = "button";
        previous.className = "answer-previous-button";
        previous.textContent = "← 上一题";
        previous.disabled = typeof currentQuestionIndex === "undefined" || currentQuestionIndex <= 0;
        previous.addEventListener("click", previousQuestion);

        next.parentNode.insertBefore(row, next);
        row.appendChild(previous);
        row.appendChild(next);
    }

    if (!document.getElementById("question-learning-controls-style")) {
        const style = document.createElement("style");
        style.id = "question-learning-controls-style";
        style.textContent = `
            .question-progress-nav {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 12px;
                margin: 10px 0 12px;
            }
            .question-progress-nav .question-progress {
                margin: 0 !important;
            }
            .previous-question-button,
            .answer-previous-button {
                min-height: 34px;
                padding: 0 12px;
                border: 1px solid #d7d7dc;
                border-radius: 8px;
                background: #f5f5f7;
                color: #3f4045;
                font-size: 12.5px;
                font-weight: 700;
                cursor: pointer;
            }
            .previous-question-button:hover:not(:disabled),
            .answer-previous-button:hover:not(:disabled) {
                background: #ececef;
            }
            .previous-question-button:disabled,
            .answer-previous-button:disabled {
                opacity: .38;
                cursor: default;
            }
            .question-unknown-row .question-unknown-btn {
                background: #1d1d1f !important;
                border-color: #1d1d1f !important;
                color: #fff !important;
            }
            .question-unknown-note {
                color: #5f6065;
                font-size: 12px;
                line-height: 1.65;
            }
            .answer-history-nav {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 10px;
                margin-top: 14px;
            }
            .answer-history-nav > button {
                margin-top: 0 !important;
            }
            @media (max-width: 600px) {
                .question-progress-nav { gap: 8px; }
                .previous-question-button,
                .answer-previous-button {
                    min-height: 32px;
                    padding: 0 10px;
                    font-size: 12px;
                }
            }
        `;
        document.head.appendChild(style);
    }

    const baseRenderQuestion = window.renderQuestion;
    if (typeof baseRenderQuestion === "function") {
        window.renderQuestion = function (...args) {
            const result = baseRenderQuestion.apply(this, args);
            decorateQuestion();
            return result;
        };
    }

    const baseCheckAnswer = window.checkAnswer;
    if (typeof baseCheckAnswer === "function") {
        window.checkAnswer = function (...args) {
            const result = baseCheckAnswer.apply(this, args);
            decorateFeedbackNavigation();
            return result;
        };
    }

    const baseSubmitShortAnswer = window.submitShortAnswer;
    if (typeof baseSubmitShortAnswer === "function") {
        window.submitShortAnswer = function (...args) {
            const result = baseSubmitShortAnswer.apply(this, args);
            decorateFeedbackNavigation();
            return result;
        };
    }

    const baseMarkMemoryBlurred = window.markMemoryBlurred;
    if (typeof baseMarkMemoryBlurred === "function") {
        window.markMemoryBlurred = function (...args) {
            const result = baseMarkMemoryBlurred.apply(this, args);
            decorateFeedbackNavigation();
            return result;
        };
    }

    decorateQuestion();
})();
