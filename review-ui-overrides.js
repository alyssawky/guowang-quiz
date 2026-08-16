// 复习区结构：
// 1) 一级：行测 / 计算机 / 国网必刷题；
// 2) 行测二级：资料分析 / 判断推理 / 言语理解 / 数量关系；
// 3) 行测三级：按学习章节（studyPlan task）单独复习，同时保留“复习本板块全部已解锁题”；
// 4) 国网必刷题始终显示，按 Week 1～Week 6 复习，并提供“全部已解锁题”入口。

const REVIEW_XINGCE_MODULES = ["资料分析", "判断推理", "言语理解", "数量关系"];
const REVIEW_QUESTION_BANK_CATEGORY = "国网题库";
const REVIEW_QUESTION_BANK_LABEL = "国网必刷题";

function getAllQuestionsForTask(taskId) {
    return questions.filter(question => question.taskId === taskId);
}

function getUnlockedQuestionsForTaskLocal(taskId) {
    return getAllQuestionsForTask(taskId).filter(questionIsUnlocked);
}

function getUnlockedQuestionsForMajorModule(category, module) {
    const taskIds = new Set(
        studyPlan
            .filter(task => task.category === category && task.module === module)
            .map(task => task.id)
    );

    return questions.filter(question =>
        taskIds.has(question.taskId) && questionIsUnlocked(question)
    );
}

function getAllQuestionsForMajorModuleLocal(category, module) {
    const taskIds = new Set(
        studyPlan
            .filter(task => task.category === category && task.module === module)
            .map(task => task.id)
    );
    return questions.filter(question => taskIds.has(question.taskId));
}

function getXingceChapterRecords(module) {
    return studyPlan
        .filter(task => task.category === "行测" && task.module === module)
        .map(task => {
            const allQuestions = getAllQuestionsForTask(task.id);
            const unlockedQuestions = allQuestions.filter(questionIsUnlocked);
            return { task, allQuestions, unlockedQuestions };
        })
        // 只有已经导入题目的章节才进入复习区，避免把未来空章节铺满页面。
        .filter(record => record.allQuestions.length > 0);
}

function getQuestionBankTasks() {
    return studyPlan.filter(task =>
        task.questionBank || task.category === REVIEW_QUESTION_BANK_CATEGORY
    );
}

function getQuestionBankRecords() {
    return getQuestionBankTasks().map(task => {
        const allQuestions = getAllQuestionsForTask(task.id);
        const unlockedQuestions = allQuestions.filter(questionIsUnlocked);
        return { task, allQuestions, unlockedQuestions };
    });
}

function getAllQuestionBankQuestions() {
    const taskIds = new Set(getQuestionBankTasks().map(task => task.id));
    return questions.filter(question => taskIds.has(question.taskId));
}

function getUnlockedQuestionBankQuestions() {
    return getAllQuestionBankQuestions().filter(questionIsUnlocked);
}

function formatShortDate(dateString) {
    if (!dateString) return "";
    const date = new Date(`${dateString}T00:00:00`);
    if (Number.isNaN(date.getTime())) return dateString;
    return `${date.getMonth() + 1}/${date.getDate()}`;
}

function startMajorModuleReview(category, module) {
    const moduleQuestions = shuffleArray(
        getUnlockedQuestionsForMajorModule(category, module)
    );
    if (!moduleQuestions.length) return;

    startQuestionSession(
        moduleQuestions,
        `按板块复习 · ${module}`,
        `${category} · ${module} · ${moduleQuestions.length} 道`
    );

    const chooser = document.getElementById("review-section-chooser");
    if (chooser) chooser.hidden = true;
}

function startQuestionBankReview() {
    const bankQuestions = shuffleArray(getUnlockedQuestionBankQuestions());
    if (!bankQuestions.length) return;

    startQuestionSession(
        bankQuestions,
        `国网必刷题 · 全部已解锁`,
        `${bankQuestions.length} 道已解锁题目`
    );

    const chooser = document.getElementById("review-section-chooser");
    if (chooser) chooser.hidden = true;
}

function renderXingceModulePanel(module) {
    const chapters = getXingceChapterRecords(module);
    const unlockedTotal = getUnlockedQuestionsForMajorModule("行测", module).length;
    const importedTotal = getAllQuestionsForMajorModuleLocal("行测", module).length;

    const chapterHTML = chapters.length
        ? chapters.map(({ task, allQuestions, unlockedQuestions }, index) => `
            <button
                type="button"
                class="review-section-button review-chapter-button"
                data-review-task-id="${task.id}"
                ${unlockedQuestions.length === 0 ? "disabled" : ""}
            >
                <strong>${index + 1}. ${task.name}</strong>
                <span>${unlockedQuestions.length}/${allQuestions.length} 道已解锁</span>
                <small>${task.week || ""}</small>
            </button>
        `).join("")
        : `<div class="review-chapter-empty">这一板块暂时还没有导入题目</div>`;

    return `
        <div class="review-major-panel">
            <div class="review-major-panel-head">
                <div>
                    <strong class="review-major-panel-title">${module}</strong>
                    <span class="review-major-panel-count">${unlockedTotal}/${importedTotal} 道已解锁</span>
                </div>
                <button
                    type="button"
                    class="review-all-module-button"
                    data-review-major-module="${module}"
                    ${unlockedTotal === 0 ? "disabled" : ""}
                >
                    复习全部已解锁
                </button>
            </div>
            <div class="review-chapter-label">按章节复习</div>
            <div class="review-section-grid review-chapter-grid">
                ${chapterHTML}
            </div>
        </div>
    `;
}

function renderQuestionBankSection() {
    const records = getQuestionBankRecords();
    if (!records.length) return "";

    const allCount = records.reduce((sum, record) => sum + record.allQuestions.length, 0);
    const unlockedCount = records.reduce((sum, record) => sum + record.unlockedQuestions.length, 0);

    return `
        <div class="review-section-group review-question-bank-group">
            <div class="review-section-group-title">${REVIEW_QUESTION_BANK_LABEL}</div>
            <div class="review-bank-summary">
                <div>
                    <strong>10月前必学300题</strong>
                    <span>${unlockedCount}/${allCount} 道已解锁</span>
                </div>
                <button
                    type="button"
                    class="review-all-module-button"
                    data-review-question-bank-all
                    ${unlockedCount === 0 ? "disabled" : ""}
                >
                    复习全部已解锁
                </button>
            </div>
            <div class="review-chapter-label">按周复习</div>
            <div class="review-section-grid review-bank-grid">
                ${records.map(({ task, allQuestions, unlockedQuestions }) => `
                    <button
                        type="button"
                        class="review-section-button review-bank-week-button"
                        data-review-task-id="${task.id}"
                        ${unlockedQuestions.length === 0 ? "disabled" : ""}
                    >
                        <strong>${task.week || task.name}</strong>
                        <span>${unlockedQuestions.length}/${allQuestions.length} 道已解锁</span>
                        <small>${formatShortDate(task.startDate)}–${formatShortDate(task.endDate)} · ${task.name}</small>
                    </button>
                `).join("")}
            </div>
        </div>
    `;
}

function renderSectionChooser() {
    const chooser = document.getElementById("review-section-chooser");
    if (!chooser) return;

    const availableTasks = studyPlan
        .map(task => ({
            task,
            allQuestions: getAllQuestionsForTask(task.id),
            unlockedQuestions: getUnlockedQuestionsForTaskLocal(task.id)
        }))
        .filter(item => item.allQuestions.length > 0);

    const computerItems = availableTasks.filter(item => item.task.category === "计算机");

    const sections = [];

    sections.push(`
        <div class="review-section-group review-xingce-group">
            <div class="review-section-group-title">行测</div>
            <div class="review-xingce-modules">
                ${REVIEW_XINGCE_MODULES.map(renderXingceModulePanel).join("")}
            </div>
        </div>
    `);

    if (computerItems.length > 0) {
        sections.push(`
            <div class="review-section-group">
                <div class="review-section-group-title">计算机</div>
                <div class="review-section-grid">
                    ${computerItems.map(({ task, allQuestions, unlockedQuestions }) => `
                        <button
                            type="button"
                            class="review-section-button"
                            data-review-task-id="${task.id}"
                            ${unlockedQuestions.length === 0 ? "disabled" : ""}
                        >
                            <strong>${task.name}</strong>
                            <span>${unlockedQuestions.length}/${allQuestions.length} 道已解锁</span>
                            <small>${task.module || ""}</small>
                        </button>
                    `).join("")}
                </div>
            </div>
        `);
    }

    sections.push(renderQuestionBankSection());

    chooser.innerHTML = sections.join("");

    chooser.querySelectorAll("[data-review-major-module]").forEach(button => {
        if (button.disabled) return;
        button.addEventListener("click", () => {
            startMajorModuleReview("行测", button.dataset.reviewMajorModule);
        });
    });

    chooser.querySelectorAll("[data-review-task-id]").forEach(button => {
        if (button.disabled) return;
        button.addEventListener("click", () => {
            startTaskReview(button.dataset.reviewTaskId);
        });
    });

    const questionBankAllButton = chooser.querySelector("[data-review-question-bank-all]");
    if (questionBankAllButton && !questionBankAllButton.disabled) {
        questionBankAllButton.addEventListener("click", startQuestionBankReview);
    }
}

function renderReviewPool() {
    const container = document.getElementById("review-list");
    const countElement = document.getElementById("unlocked-task-count");
    if (!container) return;

    const html = [];
    let logicalCount = 0;

    // 行测：显示板块 + 已导入的章节，方便确认当前可复习范围。
    const xingcePanels = REVIEW_XINGCE_MODULES.map(module => {
        const chapters = getXingceChapterRecords(module)
            .filter(record => record.unlockedQuestions.length > 0 || Boolean(progress[record.task.id]));
        const unlocked = getUnlockedQuestionsForMajorModule("行测", module);
        if (!chapters.length && !unlocked.length) return "";
        logicalCount += Math.max(1, chapters.length);
        return `
            <div class="review-pool-major-panel">
                <div class="review-pool-major-title">
                    <strong>${module}</strong>
                    <span>${unlocked.length} 道已解锁</span>
                </div>
                <div class="review-pool-module-grid">
                    ${chapters.map(({ task, allQuestions, unlockedQuestions }, index) => `
                        <div class="review-card review-pool-module-card">
                            <strong>${index + 1}. ${task.name}</strong>
                            <span>${unlockedQuestions.length}/${allQuestions.length} 道已解锁</span>
                        </div>
                    `).join("")}
                </div>
            </div>
        `;
    }).filter(Boolean).join("");

    if (xingcePanels) {
        html.push(`
            <div class="review-pool-category">
                <div class="review-pool-category-title">行测</div>
                ${xingcePanels}
            </div>
        `);
    }

    const computerRecords = studyPlan
        .filter(task => task.category === "计算机")
        .map(task => {
            const allQuestions = getAllQuestionsForTask(task.id);
            const unlockedQuestions = allQuestions.filter(questionIsUnlocked);
            return { task, allQuestions, unlockedQuestions };
        })
        .filter(({ task, unlockedQuestions }) => Boolean(progress[task.id]) || unlockedQuestions.length > 0);

    if (computerRecords.length > 0) {
        logicalCount += computerRecords.length;
        html.push(`
            <div class="review-pool-category">
                <div class="review-pool-category-title">计算机</div>
                <div class="review-pool-module-grid">
                    ${computerRecords.map(({ task, allQuestions, unlockedQuestions }) => `
                        <div class="review-card review-pool-module-card">
                            <strong>${task.name}</strong>
                            <span>${unlockedQuestions.length}/${allQuestions.length} 道已解锁</span>
                            <small>${task.module || ""}</small>
                        </div>
                    `).join("")}
                </div>
            </div>
        `);
    }

    const bankRecords = getQuestionBankRecords().filter(record => record.unlockedQuestions.length > 0);
    if (bankRecords.length > 0) {
        logicalCount += bankRecords.length;
        html.push(`
            <div class="review-pool-category">
                <div class="review-pool-category-title">${REVIEW_QUESTION_BANK_LABEL}</div>
                <div class="review-pool-module-grid">
                    ${bankRecords.map(({ task, allQuestions, unlockedQuestions }) => `
                        <div class="review-card review-pool-module-card">
                            <strong>${task.week || task.name}</strong>
                            <span>${unlockedQuestions.length}/${allQuestions.length} 道已解锁</span>
                            <small>${task.name}</small>
                        </div>
                    `).join("")}
                </div>
            </div>
        `);
    }

    if (countElement) countElement.textContent = `${logicalCount} 项`;

    container.innerHTML = html.length
        ? html.join("")
        : `<div class="empty-message">还没有已经解锁的复习内容</div>`;
}

(function installHierarchicalReviewStyles() {
    if (document.getElementById("hierarchical-review-styles")) return;

    const style = document.createElement("style");
    style.id = "hierarchical-review-styles";
    style.textContent = `
        .review-section-group + .review-section-group { margin-top: 22px; }
        .review-section-group-title {
            margin: 0 0 12px;
            color: #525866;
            font-size: 15px;
            font-weight: 800;
        }
        .review-xingce-modules { display: grid; gap: 14px; }
        .review-major-panel {
            padding: 14px;
            border: 1px solid #e5e7eb;
            border-radius: 14px;
            background: #fafbfc;
        }
        .review-major-panel-head,
        .review-bank-summary {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            margin-bottom: 10px;
        }
        .review-major-panel-head > div,
        .review-bank-summary > div {
            display: flex;
            align-items: baseline;
            gap: 10px;
            flex-wrap: wrap;
        }
        .review-major-panel-title { font-size: 16px; }
        .review-major-panel-count,
        .review-bank-summary span { color: #667085; font-size: 13px; }
        .review-all-module-button {
            min-height: 36px;
            padding: 8px 13px;
            border-radius: 9px;
            border: 1px solid #cfd4dc;
            background: #fff;
            color: #24262b;
            font-weight: 700;
            cursor: pointer;
        }
        .review-all-module-button:disabled { opacity: .45; cursor: default; }
        .review-chapter-label {
            margin: 8px 0;
            color: #7a8190;
            font-size: 12px;
            font-weight: 700;
        }
        .review-chapter-grid {
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)) !important;
        }
        .review-chapter-button,
        .review-bank-week-button { min-height: 76px; }
        .review-section-button small {
            display: block;
            margin-top: 4px;
            color: #8a9099;
            font-size: 11px;
            line-height: 1.45;
        }
        .review-chapter-empty {
            padding: 12px;
            border-radius: 10px;
            background: #fff;
            color: #9aa0aa;
            font-size: 13px;
        }
        .review-question-bank-group {
            padding: 14px;
            border: 1px solid #e5e7eb;
            border-radius: 14px;
            background: #fafbfc;
        }
        .review-bank-grid {
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)) !important;
        }
        .review-pool-category + .review-pool-category { margin-top: 20px; }
        .review-pool-category-title {
            margin: 0 0 10px;
            color: #68686d;
            font-size: 13px;
            font-weight: 700;
        }
        .review-pool-major-panel + .review-pool-major-panel { margin-top: 12px; }
        .review-pool-major-title {
            display: flex;
            gap: 10px;
            align-items: baseline;
            margin-bottom: 8px;
        }
        .review-pool-major-title span { color: #667085; font-size: 12px; }
        .review-pool-module-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
            gap: 9px;
        }
        .review-pool-module-card {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            gap: 5px;
            margin: 0;
        }
        .review-pool-module-card span,
        .review-pool-module-card small { color: #667085; }
        @media (max-width: 720px) {
            .review-major-panel-head,
            .review-bank-summary { align-items: stretch; flex-direction: column; }
            .review-all-module-button { width: 100%; }
            .review-chapter-grid,
            .review-bank-grid { grid-template-columns: 1fr !important; }
        }
    `;

    document.head.appendChild(style);
})();

// scheduled-questionbank.js 已经先渲染过一次，覆盖函数后立即按新结构重绘。
renderReviewPool();
