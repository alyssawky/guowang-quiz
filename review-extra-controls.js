(function () {
    function getAllQuestionsForMajorModule(category, module) {
        const taskIds = new Set(
            studyPlan
                .filter(task => task.category === category && task.module === module)
                .map(task => task.id)
        );
        return questions.filter(question => taskIds.has(question.taskId));
    }

    function getAllQuestionsForTaskId(taskId) {
        return questions.filter(question => question.taskId === taskId);
    }

    function getAllQuestionBankQuestions() {
        const taskIds = new Set(
            studyPlan
                .filter(task => task.questionBank || task.category === "国网题库")
                .map(task => task.id)
        );
        return questions.filter(question => taskIds.has(question.taskId));
    }

    function questionOptionListHTML(question) {
        if (question.type === "short") {
            return `<div class="inventory-answer">参考答案：${question.answerDisplay || question.answer || ""}</div>`;
        }

        if (question.optionLabelsOnly || question.imageOnlyOptions) {
            return `<div class="inventory-answer">正确答案：${question.answer || ""}</div>`;
        }

        const entries = Object.entries(question.options || {});
        const options = entries.length
            ? `<div class="inventory-options">${entries.map(([key, value]) => `
                <div><strong>${key}.</strong> ${value}</div>
            `).join("")}</div>`
            : "";

        return `${options}<div class="inventory-answer">正确答案：${question.answerDisplay || question.answer || ""}</div>`;
    }

    function renderInventoryList(questionList, title) {
        const modal = document.getElementById("question-inventory-modal");
        const titleElement = document.getElementById("question-inventory-title");
        const countElement = document.getElementById("question-inventory-count");
        const body = document.getElementById("question-inventory-body");
        if (!modal || !titleElement || !countElement || !body) return;

        titleElement.textContent = title;
        countElement.textContent = `共 ${questionList.length} 道已导入题目`;

        body.innerHTML = questionList.map((question, index) => {
            const task = studyPlan.find(item => item.id === question.taskId);
            const visual = typeof renderQuestionImage === "function"
                ? renderQuestionImage(question)
                : "";
            const content = question.visualFirst
                ? `${visual}<h3>${question.question || ""}</h3>`
                : `<h3>${question.question || ""}</h3>${visual}`;

            return `
                <article class="inventory-question-card">
                    <div class="inventory-question-number">第 ${index + 1} 题</div>
                    <div class="inventory-question-meta">
                        ${question.sourceId ? `<span>${question.sourceId}</span>` : ""}
                        ${task ? `<span>${task.category} · ${task.module}</span>` : ""}
                        ${question.topic ? `<span>${question.topic}</span>` : ""}
                    </div>
                    ${content}
                    ${questionOptionListHTML(question)}
                </article>
            `;
        }).join("");

        modal.hidden = false;
        document.body.classList.add("inventory-modal-open");
    }

    function showQuestionInventory(questionList, title) {
        renderInventoryList(questionList, title);

        if (window.DA_HQ_READY && questionList.some(q => q.questionImage)) {
            Promise.resolve(window.DA_HQ_READY)
                .then(() => {
                    const modal = document.getElementById("question-inventory-modal");
                    if (modal && !modal.hidden) renderInventoryList(questionList, title);
                })
                .catch(error => console.error("题库核对页高清题图加载失败：", error));
        }
    }

    function closeQuestionInventory() {
        const modal = document.getElementById("question-inventory-modal");
        if (modal) modal.hidden = true;
        document.body.classList.remove("inventory-modal-open");
    }

    function ensureInventoryModal() {
        if (document.getElementById("question-inventory-modal")) return;

        const modal = document.createElement("div");
        modal.id = "question-inventory-modal";
        modal.className = "question-inventory-modal";
        modal.hidden = true;
        modal.innerHTML = `
            <div class="question-inventory-backdrop" data-close-inventory></div>
            <section class="question-inventory-panel" role="dialog" aria-modal="true" aria-labelledby="question-inventory-title">
                <header class="question-inventory-header">
                    <div>
                        <h2 id="question-inventory-title">题库核对</h2>
                        <p id="question-inventory-count"></p>
                    </div>
                    <button type="button" class="question-inventory-close" data-close-inventory aria-label="关闭">×</button>
                </header>
                <div id="question-inventory-body" class="question-inventory-body"></div>
            </section>
        `;
        document.body.appendChild(modal);

        modal.querySelectorAll("[data-close-inventory]").forEach(element => {
            element.addEventListener("click", closeQuestionInventory);
        });
    }

    function bindInventoryButton(button, questionList, title) {
        if (!button || button.dataset.inventoryBound === "1") return;
        button.dataset.inventoryBound = "1";
        button.addEventListener("click", () => showQuestionInventory(questionList, title));
    }

    function enhanceSectionChooser() {
        const chooser = document.getElementById("review-section-chooser");
        if (!chooser) return;

        chooser.querySelectorAll("[data-view-major-module]").forEach(button => {
            const module = button.dataset.viewMajorModule;
            bindInventoryButton(
                button,
                getAllQuestionsForMajorModule("行测", module),
                `题库核对 · ${module}`
            );
        });

        chooser.querySelectorAll("[data-view-task-id]").forEach(button => {
            const taskId = button.dataset.viewTaskId;
            const task = studyPlan.find(item => item.id === taskId);
            bindInventoryButton(
                button,
                getAllQuestionsForTaskId(taskId),
                `题库核对 · ${task ? task.name : taskId}`
            );
        });

        const bankButton = chooser.querySelector("[data-view-question-bank-all]");
        if (bankButton) {
            bindInventoryButton(
                bankButton,
                getAllQuestionBankQuestions(),
                "题库核对 · 国网必刷题"
            );
        }
    }

    const baseRenderSectionChooser = window.renderSectionChooser;
    if (typeof baseRenderSectionChooser === "function") {
        window.renderSectionChooser = function () {
            baseRenderSectionChooser();
            enhanceSectionChooser();
        };
    }

    function exitReviewSession() {
        if (typeof currentReviewQuestions !== "undefined") currentReviewQuestions = [];
        if (typeof currentQuestionIndex !== "undefined") currentQuestionIndex = 0;
        if (typeof currentOptionOrder !== "undefined") currentOptionOrder = [];
        if (typeof currentMultipleSelection !== "undefined") currentMultipleSelection = new Set();

        const quizArea = document.getElementById("quiz-area");
        if (quizArea) quizArea.innerHTML = "";

        const sessionInfo = document.getElementById("review-session-info");
        if (sessionInfo) {
            sessionInfo.hidden = true;
            sessionInfo.innerHTML = "";
        }

        const chooser = document.getElementById("review-section-chooser");
        if (chooser) {
            if (typeof window.renderSectionChooser === "function") window.renderSectionChooser();
            chooser.hidden = false;
        }

        const reviewMain = document.querySelector(".review-main");
        if (reviewMain) reviewMain.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    window.exitReviewSession = exitReviewSession;
    window.showQuestionInventory = showQuestionInventory;
    window.closeQuestionInventory = closeQuestionInventory;

    function addExitButtonToSession() {
        const sessionInfo = document.getElementById("review-session-info");
        if (!sessionInfo || sessionInfo.hidden || sessionInfo.querySelector(".exit-review-button")) return;

        const exitButton = document.createElement("button");
        exitButton.type = "button";
        exitButton.className = "exit-review-button";
        exitButton.textContent = "退出答题";
        exitButton.addEventListener("click", exitReviewSession);
        sessionInfo.appendChild(exitButton);
    }

    const baseStartQuestionSession = window.startQuestionSession;
    if (typeof baseStartQuestionSession === "function") {
        window.startQuestionSession = function (...args) {
            const result = baseStartQuestionSession(...args);
            addExitButtonToSession();
            return result;
        };
    }

    ensureInventoryModal();
    enhanceSectionChooser();
})();