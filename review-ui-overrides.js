// 复习区：紧凑目录式层级
// 一级：行测 / 计算机 / 国网必刷题
// 行测二级：四大板块；三级：每个已导入章节一行显示。

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
    return questions.filter(question => taskIds.has(question.taskId) && questionIsUnlocked(question));
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
        .filter(record => record.allQuestions.length > 0);
}

function getQuestionBankTasks() {
    return studyPlan.filter(task => task.questionBank || task.category === REVIEW_QUESTION_BANK_CATEGORY);
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
    const moduleQuestions = shuffleArray(getUnlockedQuestionsForMajorModule(category, module));
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
        "国网必刷题 · 全部已解锁",
        `${bankQuestions.length} 道已解锁题目`
    );

    const chooser = document.getElementById("review-section-chooser");
    if (chooser) chooser.hidden = true;
}

function renderChapterRow(task, allQuestions, unlockedQuestions, index, extraMeta = "") {
    const disabled = unlockedQuestions.length === 0;
    const meta = [
        `${unlockedQuestions.length}/${allQuestions.length} 道已解锁`,
        extraMeta || task.week || ""
    ].filter(Boolean).join(" · ");

    return `
        <div class="review-chapter-row ${disabled ? "is-locked" : ""}">
            <div class="review-chapter-info">
                <span class="review-chapter-index">${String(index + 1).padStart(2, "0")}</span>
                <div class="review-chapter-copy">
                    <strong>${task.name}</strong>
                    <small>${meta}</small>
                </div>
            </div>
            <div class="review-row-actions">
                <button
                    type="button"
                    class="review-row-start"
                    data-review-task-id="${task.id}"
                    ${disabled ? "disabled" : ""}
                >复习</button>
                <button
                    type="button"
                    class="review-row-view"
                    data-view-task-id="${task.id}"
                >查看题目</button>
            </div>
        </div>
    `;
}

function renderXingceModulePanel(module) {
    const chapters = getXingceChapterRecords(module);
    const unlockedTotal = getUnlockedQuestionsForMajorModule("行测", module).length;
    const importedTotal = getAllQuestionsForMajorModuleLocal("行测", module).length;

    const rows = chapters.length
        ? chapters.map(({ task, allQuestions, unlockedQuestions }, index) =>
            renderChapterRow(task, allQuestions, unlockedQuestions, index)
        ).join("")
        : `<div class="review-chapter-empty">暂时还没有导入题目</div>`;

    return `
        <section class="review-major-panel">
            <div class="review-major-panel-head">
                <div class="review-major-title-block">
                    <strong class="review-major-panel-title">${module}</strong>
                    <span class="review-major-panel-count">${unlockedTotal}/${importedTotal} 道已解锁</span>
                </div>
                <div class="review-major-actions">
                    <button
                        type="button"
                        class="review-all-module-button"
                        data-review-major-module="${module}"
                        ${unlockedTotal === 0 ? "disabled" : ""}
                    >复习全部</button>
                    <button
                        type="button"
                        class="review-view-module-button"
                        data-view-major-module="${module}"
                    >查看全部题目</button>
                </div>
            </div>
            <div class="review-chapter-list">${rows}</div>
        </section>
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
            <section class="review-major-panel review-bank-panel">
                <div class="review-major-panel-head">
                    <div class="review-major-title-block">
                        <strong class="review-major-panel-title">10月前必学300题</strong>
                        <span class="review-major-panel-count">${unlockedCount}/${allCount} 道已解锁</span>
                    </div>
                    <div class="review-major-actions">
                        <button
                            type="button"
                            class="review-all-module-button"
                            data-review-question-bank-all
                            ${unlockedCount === 0 ? "disabled" : ""}
                        >复习全部</button>
                        <button
                            type="button"
                            class="review-view-module-button"
                            data-view-question-bank-all
                        >查看全部题目</button>
                    </div>
                </div>
                <div class="review-chapter-list">
                    ${records.map(({ task, allQuestions, unlockedQuestions }, index) =>
                        renderChapterRow(
                            task,
                            allQuestions,
                            unlockedQuestions,
                            index,
                            `${formatShortDate(task.startDate)}–${formatShortDate(task.endDate)}`
                        )
                    ).join("")}
                </div>
            </section>
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
            <div class="review-section-group review-computer-group">
                <div class="review-section-group-title">计算机</div>
                <section class="review-major-panel">
                    <div class="review-chapter-list">
                        ${computerItems.map(({ task, allQuestions, unlockedQuestions }, index) =>
                            renderChapterRow(task, allQuestions, unlockedQuestions, index, task.module || "")
                        ).join("")}
                    </div>
                </section>
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
        button.addEventListener("click", () => startTaskReview(button.dataset.reviewTaskId));
    });

    const bankButton = chooser.querySelector("[data-review-question-bank-all]");
    if (bankButton && !bankButton.disabled) bankButton.addEventListener("click", startQuestionBankReview);
}

function renderReviewPool() {
    const container = document.getElementById("review-list");
    const countElement = document.getElementById("unlocked-task-count");
    if (!container) return;

    const rows = [];

    REVIEW_XINGCE_MODULES.forEach(module => {
        getXingceChapterRecords(module)
            .filter(record => record.unlockedQuestions.length > 0 || Boolean(progress[record.task.id]))
            .forEach(({ task, allQuestions, unlockedQuestions }) => {
                rows.push(`
                    <div class="review-pool-compact-row">
                        <strong>行测 · ${module} · ${task.name}</strong>
                        <span>${unlockedQuestions.length}/${allQuestions.length} 道已解锁</span>
                    </div>
                `);
            });
    });

    studyPlan
        .filter(task => task.category === "计算机")
        .forEach(task => {
            const allQuestions = getAllQuestionsForTask(task.id);
            const unlockedQuestions = allQuestions.filter(questionIsUnlocked);
            if (!allQuestions.length || (!unlockedQuestions.length && !progress[task.id])) return;
            rows.push(`
                <div class="review-pool-compact-row">
                    <strong>计算机 · ${task.name}</strong>
                    <span>${unlockedQuestions.length}/${allQuestions.length} 道已解锁</span>
                </div>
            `);
        });

    getQuestionBankRecords()
        .filter(record => record.unlockedQuestions.length > 0)
        .forEach(({ task, allQuestions, unlockedQuestions }) => {
            rows.push(`
                <div class="review-pool-compact-row">
                    <strong>${REVIEW_QUESTION_BANK_LABEL} · ${task.week || task.name}</strong>
                    <span>${unlockedQuestions.length}/${allQuestions.length} 道已解锁</span>
                </div>
            `);
        });

    if (countElement) countElement.textContent = `${rows.length} 项`;
    container.innerHTML = rows.length ? rows.join("") : `<div class="empty-message">还没有已经解锁的复习内容</div>`;
}

(function installCompactReviewStyles() {
    const old = document.getElementById("hierarchical-review-styles");
    if (old) old.remove();

    const style = document.createElement("style");
    style.id = "hierarchical-review-styles";
    style.textContent = `
        .review-section-group + .review-section-group { margin-top: 20px; }
        .review-section-group-title {
            margin: 0 0 10px;
            color: #4f5665;
            font-size: 16px;
            font-weight: 800;
        }
        .review-xingce-modules { display: grid; gap: 10px; }
        .review-major-panel {
            overflow: hidden;
            border: 1px solid #e3e6eb;
            border-radius: 13px;
            background: #fff;
        }
        .review-major-panel-head {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 14px;
            padding: 10px 12px;
            border-bottom: 1px solid #eceef2;
            background: #fafbfc;
        }
        .review-major-title-block {
            display: flex;
            align-items: baseline;
            gap: 9px;
            min-width: 0;
        }
        .review-major-panel-title { font-size: 15px; }
        .review-major-panel-count { color: #667085; font-size: 12px; white-space: nowrap; }
        .review-major-actions,
        .review-row-actions {
            display: flex;
            align-items: center;
            gap: 6px;
            flex: 0 0 auto;
        }
        .review-major-actions button,
        .review-row-actions button {
            width: auto !important;
            min-width: 0 !important;
            margin: 0 !important;
            border-radius: 8px;
            box-shadow: none;
        }
        .review-major-actions button {
            min-height: 32px;
            padding: 6px 10px;
            font-size: 12px;
        }
        .review-chapter-list { display: block; }
        .review-chapter-row {
            display: grid;
            grid-template-columns: minmax(0, 1fr) auto;
            align-items: center;
            gap: 12px;
            min-height: 48px;
            padding: 7px 12px;
            border-bottom: 1px solid #f0f1f3;
        }
        .review-chapter-row:last-child { border-bottom: 0; }
        .review-chapter-row:hover { background: #fafbfc; }
        .review-chapter-row.is-locked { background: #fbfbfc; }
        .review-chapter-info {
            display: flex;
            align-items: center;
            gap: 10px;
            min-width: 0;
        }
        .review-chapter-index {
            width: 24px;
            flex: 0 0 24px;
            color: #98a2b3;
            font-size: 12px;
            font-variant-numeric: tabular-nums;
        }
        .review-chapter-copy {
            display: flex;
            align-items: baseline;
            gap: 10px;
            min-width: 0;
        }
        .review-chapter-copy strong {
            overflow: hidden;
            color: #24262b;
            font-size: 14px;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        .review-chapter-copy small {
            color: #8a93a3;
            font-size: 12px;
            white-space: nowrap;
        }
        .review-row-actions button {
            min-height: 30px;
            padding: 5px 9px;
            font-size: 12px;
        }
        .review-row-view,
        .review-view-module-button {
            background: #fff !important;
            color: #596273 !important;
            border: 1px solid #d9dde5 !important;
        }
        .review-row-start:disabled,
        .review-all-module-button:disabled {
            opacity: .42;
            cursor: not-allowed;
        }
        .review-chapter-empty {
            padding: 10px 12px;
            color: #98a2b3;
            font-size: 12px;
        }
        .review-pool-compact-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            padding: 8px 2px;
            border-bottom: 1px solid #eceef2;
            font-size: 13px;
        }
        .review-pool-compact-row:last-child { border-bottom: 0; }
        .review-pool-compact-row span { color: #667085; white-space: nowrap; }

        @media (max-width: 720px) {
            .review-major-panel-head {
                align-items: flex-start;
                flex-direction: column;
            }
            .review-chapter-row {
                grid-template-columns: 1fr;
                gap: 6px;
            }
            .review-chapter-copy {
                align-items: flex-start;
                flex-direction: column;
                gap: 2px;
            }
            .review-row-actions {
                padding-left: 34px;
            }
        }
    `;
    document.head.appendChild(style);
})();

renderReviewPool();
