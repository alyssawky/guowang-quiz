let currentMultipleSelection = new Set();

function questionIsMultiple(question) {
    return question.type === "multiple" || String(question.answer || "").length > 1;
}

function getQuestionTypeLabel(question) {
    if (question.type === "judge") return "判断题";
    return questionIsMultiple(question) ? "多选题" : "单选题";
}

function getPriorityLabel(priority) {
    if (!priority) return "";
    const labels = { S: "S 核心", A: "A 重要", B: "B 低优先" };
    return labels[priority] || priority;
}

function questionUsesLetterOnlyOptions(question) {
    return Boolean(question.optionLabelsOnly || question.imageOnlyOptions);
}

function optionDisplayText(originalKeys) {
    const keys = Array.isArray(originalKeys)
        ? originalKeys
        : String(originalKeys || "").split("");

    const activeQuestion = currentReviewQuestions[currentQuestionIndex];
    const labelsOnly = activeQuestion && questionUsesLetterOnlyOptions(activeQuestion);

    return currentOptionOrder
        .filter(option => keys.includes(option.originalKey))
        .map(option => labelsOnly ? option.displayKey : `${option.displayKey}. ${option.value}`)
        .join("；");
}

function renderQuestionImage(question) {
    if (question.questionImage) {
        const img = question.questionImage;
        const x = Number(img.x || 0);
        const y = Number(img.y || 0);
        const w = Number(img.w || img.sheetW || 1);
        const h = Number(img.h || img.sheetH || 1);
        const sheetW = Number(img.sheetW || w);
        const sheetH = Number(img.sheetH || h);

        return `
            <div class="question-image-wrap">
                <svg
                    class="question-original-svg"
                    viewBox="${x} ${y} ${w} ${h}"
                    role="img"
                    aria-label="${question.sourceId || question.question || "原题"}"
                    preserveAspectRatio="xMidYMid meet"
                >
                    <image
                        href="${img.sprite}"
                        x="0"
                        y="0"
                        width="${sheetW}"
                        height="${sheetH}"
                    ></image>
                </svg>
            </div>
        `;
    }

    if (question.image) {
        return `
            <div class="question-image-wrap">
                <img
                    class="question-original-image"
                    src="${question.image}"
                    alt="${question.sourceId || question.question || "原题"}"
                >
            </div>
        `;
    }

    return "";
}

function renderQuestion() {
    const quizArea = document.getElementById("quiz-area");
    if (!quizArea) return;

    const question = currentReviewQuestions[currentQuestionIndex];
    if (!question) return;

    const task = studyPlan.find(item => item.id === question.taskId);
    const isMultiple = questionIsMultiple(question);
    const labelsOnly = questionUsesLetterOnlyOptions(question);

    currentMultipleSelection = new Set();

    const rawOptions = Object.entries(question.options || {});
    const shouldShuffle = question.lockOptionOrder
        ? false
        : question.shuffleOptions !== false;

    const orderedOptions = shouldShuffle
        ? shuffleArray(rawOptions)
        : rawOptions;

    const displayLabels = ["A", "B", "C", "D", "E", "F"];

    currentOptionOrder = orderedOptions.map(
        ([originalKey, value], index) => ({
            originalKey,
            displayKey: shouldShuffle ? displayLabels[index] : originalKey,
            value
        })
    );

    const optionsHTML = currentOptionOrder
        .map(option => {
            const buttonText = labelsOnly
                ? `答 ${option.displayKey}`
                : `${option.displayKey}. ${option.value}`;

            if (isMultiple) {
                return `
                    <button
                        class="option-btn multi-option-btn ${labelsOnly ? "image-letter-option" : ""}"
                        type="button"
                        data-original-key="${option.originalKey}"
                        onclick="toggleMultipleOption('${option.originalKey}', this)"
                    >
                        ${buttonText}
                    </button>
                `;
            }

            return `
                <button
                    class="option-btn ${labelsOnly ? "image-letter-option" : ""}"
                    type="button"
                    onclick="checkAnswer('${option.originalKey}')"
                >
                    ${buttonText}
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

    const imageHTML = renderQuestionImage(question);

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

                ${imageHTML}

                ${labelsOnly ? `<p class="image-answer-tip"><strong>完整题干和选项都在上方原题图中。</strong> 下方是作答键，请选择对应字母。</p>` : ""}

                ${isMultiple ? `<p class="multiple-tip">多选题：可选择多个答案，选好后点击“提交答案”。</p>` : ""}

                <div class="question-options ${labelsOnly ? "image-letter-options" : ""}">
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
            <div class="answer-explanation">${question.explanation || ""}</div>
            ${noteHTML}
            <button onclick="nextQuestion()">下一题</button>
        </div>
    `;
}
