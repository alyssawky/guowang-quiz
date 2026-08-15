let currentMultipleSelection = new Set();

function questionIsMultiple(question) {
    if (!question || question.type === "short") return false;
    return question.type === "multiple" || String(question.answer || "").length > 1;
}

function getQuestionTypeLabel(question) {
    if (question.type === "judge") return "判断题";
    if (question.type === "short") return "填空题";
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

function renderShortAnswerArea(question) {
    return `
        <div class="short-answer-area">
            <label for="short-answer-input">请输入答案</label>
            <div class="short-answer-row">
                <input
                    id="short-answer-input"
                    type="text"
                    inputmode="decimal"
                    autocomplete="off"
                    placeholder="输入数值后提交"
                    onkeydown="if(event.key==='Enter'){submitShortAnswer();}"
                >
                <button type="button" onclick="submitShortAnswer()">提交答案</button>
            </div>
        </div>
    `;
}

function renderQuestion() {
    const quizArea = document.getElementById("quiz-area");
    if (!quizArea) return;

    const question = currentReviewQuestions[currentQuestionIndex];
    if (!question) return;

    const task = studyPlan.find(item => item.id === question.taskId);
    const isShort = question.type === "short";
    const isMultiple = questionIsMultiple(question);
    const labelsOnly = questionUsesLetterOnlyOptions(question);

    currentMultipleSelection = new Set();

    const rawOptions = isShort ? [] : Object.entries(question.options || {});
    const shouldShuffle = isShort
        ? false
        : (question.lockOptionOrder ? false : question.shuffleOptions !== false);

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
    const questionAndVisualHTML = question.visualFirst
        ? `${imageHTML}<h3 class="question-title">${question.question}</h3>`
        : `<h3 class="question-title">${question.question}</h3>${imageHTML}`;

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

                ${questionAndVisualHTML}

                ${labelsOnly ? `<p class="image-answer-tip"><strong>原题题面和选项保留在上方。</strong> 下方是作答键，请选择对应字母。</p>` : ""}

                ${isMultiple ? `<p class="multiple-tip">多选题：可选择多个答案，选好后点击“提交答案”。</p>` : ""}

                ${isShort ? renderShortAnswerArea(question) : `
                    <div class="question-options ${labelsOnly ? "image-letter-options" : ""}">
                        ${optionsHTML}
                    </div>
                `}

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

function normalizeShortAnswer(value) {
    return String(value ?? "")
        .trim()
        .replace(/[，,\s]/g, "")
        .replace(/亿元|万公里|亿立方米|亿千瓦时|元|支|件|万吨|万户|%/g, "");
}

function submitShortAnswer() {
    const question = currentReviewQuestions[currentQuestionIndex];
    if (!question || question.type !== "short") return;

    const input = document.getElementById("short-answer-input");
    const feedback = document.getElementById("answer-feedback");
    if (!input || !feedback) return;

    const selected = normalizeShortAnswer(input.value);
    const correct = normalizeShortAnswer(question.answer);
    if (!selected) {
        input.focus();
        return;
    }

    let isCorrect = selected === correct;
    const selectedNumber = Number(selected);
    const correctNumber = Number(correct);

    if (Number.isFinite(selectedNumber) && Number.isFinite(correctNumber)) {
        const tolerance = Number(question.answerTolerance || 0);
        isCorrect = Math.abs(selectedNumber - correctNumber) <= tolerance;
    }

    recordAnswer(question.id, isCorrect);
    renderWrongList();

    input.disabled = true;
    const submit = input.parentElement && input.parentElement.querySelector("button");
    if (submit) submit.disabled = true;

    feedback.innerHTML = `
        <div class="review-card answer-result ${isCorrect ? "correct-result" : "wrong-result"}">
            <strong>${isCorrect ? "✓ 回答正确" : "✕ 回答错误"}</strong>
            ${!isCorrect ? `<p>你的答案：${input.value}</p>` : ""}
            <p>正确答案：${question.answerDisplay || question.answer}</p>
            <div class="answer-explanation">${question.explanation || ""}</div>
            ${question.note ? `<p class="answer-note"><strong>口径提醒：</strong>${question.note}</p>` : ""}
            <button onclick="nextQuestion()">下一题</button>
        </div>
    `;
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

function loadSupplementalScript(src) {
    return new Promise((resolve, reject) => {
        const existing = document.querySelector(`script[data-supplemental-src="${src}"]`);
        if (existing) {
            resolve();
            return;
        }
        const script = document.createElement("script");
        script.src = src;
        script.dataset.supplementalSrc = src;
        script.onload = resolve;
        script.onerror = reject;
        document.body.appendChild(script);
    });
}

function loadSupplementalStylesheet(href) {
    if (document.querySelector(`link[data-supplemental-href="${href}"]`)) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    link.dataset.supplementalHref = href;
    document.head.appendChild(link);
}

window.addEventListener("load", () => {
    loadSupplementalStylesheet("review-extra-controls.css?v=20260816-7");
    loadSupplementalScript("data-analysis-ch1-original-ui.js?v=20260816-7")
        .then(() => loadSupplementalScript("review-extra-controls.js?v=20260816-7"))
        .catch(error => console.error("复习补丁加载失败：", error));
});
