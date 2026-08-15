let currentMultipleSelection = new Set();

function questionIsMultiple(question) {
    return question.type === "multiple" || String(question.answer || "").length > 1;
}

function getQuestionTypeLabel(question) {
    return questionIsMultiple(question) ? "多选题" : "单选题";
}

function getPriorityLabel(priority) {
    if (!priority) return "";
    const labels = { S: "S 核心", A: "A 重要", B: "B 低优先" };
    return labels[priority] || priority;
}

function optionDisplayText(originalKeys) {
    const keys = Array.isArray(originalKeys)
        ? originalKeys
        : String(originalKeys || "").split("");

    return currentOptionOrder
        .filter(option => keys.includes(option.originalKey))
        .map(option => `${option.displayKey}. ${option.value}`)
        .join("；");
}

function renderQuestion() {
    const quizArea = document.getElementById("quiz-area");
    if (!quizArea) return;

    const question = currentReviewQuestions[currentQuestionIndex];
    if (!question) return;

    const task = studyPlan.find(item => item.id === question.taskId);
    const isMultiple = questionIsMultiple(question);

    currentMultipleSelection = new Set();

    const shuffledOptions = shuffleArray(Object.entries(question.options));
    const displayLabels = ["A", "B", "C", "D"];

    currentOptionOrder = shuffledOptions.map(
        ([originalKey, value], index) => ({
            originalKey,
            displayKey: displayLabels[index],
            value
        })
    );

    const optionsHTML = currentOptionOrder
        .map(option => {
            if (isMultiple) {
                return `
                    <button
                        class="option-btn multi-option-btn"
                        type="button"
                        data-original-key="${option.originalKey}"
                        onclick="toggleMultipleOption('${option.originalKey}', this)"
                    >
                        ${option.displayKey}. ${option.value}
                    </button>
                `;
            }

            return `
                <button
                    class="option-btn"
                    type="button"
                    onclick="checkAnswer('${option.originalKey}')"
                >
                    ${option.displayKey}. ${option.value}
                </button>
            `;
        })
        .join("");

    const metadata = [
        question.sourceId || "",
        getQuestionTypeLabel(question),
        getPriorityLabel(question.priority),
        question.topic || ""
    ].filter(Boolean);

    quizArea.innerHTML = `
        <div class="task-card quiz-question-card">
            <div style="width:100%;">
                <div class="task-module">
                    ${task ? `${task.category} · ${task.module}` : ""}
                </div>

                <div class="question-meta">
                    ${metadata.map(item => `<span>${item}</span>`).join("")}
                </div>

                <div class="task-week">
                    ${task ? task.name : ""}
                </div>

                <p class="question-progress">
                    第 ${currentQuestionIndex + 1} / ${currentReviewQuestions.length} 题
                </p>

                <h3 class="question-title">${question.question}</h3>

                ${isMultiple ? `<p class="multiple-tip">多选题：可选择多个答案，选好后点击“提交答案”。</p>` : ""}

                <div class="question-options">
                    ${optionsHTML}
                </div>

                ${isMultiple ? `
                    <div class="multiple-submit-row">
                        <button
                            id="multiple-submit-btn"
                            type="button"
                            onclick="submitMultipleAnswer()"
                            disabled
                        >
                            提交答案
                        </button>
                    </div>
                ` : ""}

                <div id="answer-feedback" style="margin-top:20px;"></div>
            </div>
        </div>
    `;
}

function toggleMultipleOption(originalKey, button) {
    if (currentMultipleSelection.has(originalKey)) {
        currentMultipleSelection.delete(originalKey);
        button.classList.remove("is-selected");
    } else {
        currentMultipleSelection.add(originalKey);
        button.classList.add("is-selected");
    }

    const submitButton = document.getElementById("multiple-submit-btn");
    if (submitButton) {
        submitButton.disabled = currentMultipleSelection.size === 0;
        submitButton.textContent = currentMultipleSelection.size > 0
            ? `提交答案（已选 ${currentMultipleSelection.size} 项）`
            : "提交答案";
    }
}

function submitMultipleAnswer() {
    if (currentMultipleSelection.size === 0) return;

    const selected = [...currentMultipleSelection]
        .sort()
        .join("");

    checkAnswer(selected);
}

function checkAnswer(selectedOriginalKeys) {
    const question = currentReviewQuestions[currentQuestionIndex];
    if (!question) return;

    const feedback = document.getElementById("answer-feedback");
    if (!feedback) return;

    const selectedNormalized = String(selectedOriginalKeys || "")
        .split("")
        .sort()
        .join("");

    const correctNormalized = String(question.answer || "")
        .split("")
        .sort()
        .join("");

    const isCorrect = selectedNormalized === correctNormalized;

    recordAnswer(question.id, isCorrect);
    renderWrongList();

    document.querySelectorAll(".option-btn").forEach(button => {
        button.disabled = true;
    });

    const submitButton = document.getElementById("multiple-submit-btn");
    if (submitButton) submitButton.disabled = true;

    const selectedText = optionDisplayText(selectedNormalized);
    const correctText = optionDisplayText(correctNormalized);

    const noteHTML = question.note
        ? `<p class="answer-note"><strong>口径提醒：</strong>${question.note}</p>`
        : "";

    feedback.innerHTML = `
        <div class="review-card answer-result ${isCorrect ? "correct-result" : "wrong-result"}">
            <strong>${isCorrect ? "✓ 回答正确" : "✕ 回答错误"}</strong>

            ${!isCorrect ? `<p>你的答案：${selectedText || "未选择"}</p>` : ""}

            <p>正确答案：${correctText}</p>
            <p>${question.explanation}</p>
            ${noteHTML}
            <button onclick="nextQuestion()">下一题</button>
        </div>
    `;
}
