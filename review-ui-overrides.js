// 复习区显示层补丁：
// 1) 行测固定按四大板块（资料分析 / 判断推理 / 言语理解 / 数量关系）组织；
// 2) 点击行测大板块时，复习该板块所有“已解锁”的题；
// 3) 计算机继续按具体学习任务复习，但名称由 display-helpers.js 改为顺序编号。

const REVIEW_XINGCE_MODULES = ["资料分析", "判断推理", "言语理解", "数量关系"];

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

function startMajorModuleReview(category, module) {
    const moduleQuestions = shuffleArray(
        getUnlockedQuestionsForMajorModule(category, module)
    );

    startQuestionSession(
        moduleQuestions,
        `按板块复习 · ${module}`,
        `${category} · ${module} · ${moduleQuestions.length} 道`
    );

    const chooser = document.getElementById("review-section-chooser");
    if (chooser) chooser.hidden = true;
}

function renderSectionChooser() {
    const chooser = document.getElementById("review-section-chooser");
    if (!chooser) return;

    const availableTasks = studyPlan
        .map(task => ({
            task,
            count: getUnlockedQuestionsForTask(task).length
        }))
        .filter(item => item.count > 0);

    const xingceCards = REVIEW_XINGCE_MODULES.map(module => {
        const count = getUnlockedQuestionsForMajorModule("行测", module).length;
        return `
            <button
                type="button"
                class="review-section-button review-major-module-button"
                data-review-major-module="${module}"
                ${count === 0 ? "disabled" : ""}
            >
                <strong>${module}</strong>
                <span>${count} 道已解锁</span>
            </button>
        `;
    }).join("");

    const computerItems = availableTasks.filter(item => item.task.category === "计算机");
    const otherItems = availableTasks.filter(item =>
        item.task.category !== "行测" && item.task.category !== "计算机"
    );

    const sections = [];

    sections.push(`
        <div class="review-section-group">
            <div class="review-section-group-title">行测 · 四大板块</div>
            <div class="review-section-grid xingce-major-grid">
                ${xingceCards}
            </div>
        </div>
    `);

    if (computerItems.length > 0) {
        sections.push(`
            <div class="review-section-group">
                <div class="review-section-group-title">计算机</div>
                <div class="review-section-grid">
                    ${computerItems.map(({ task, count }) => `
                        <button
                            type="button"
                            class="review-section-button"
                            data-review-task-id="${task.id}"
                        >
                            <strong>${task.name}</strong>
                            <span>${task.module} · ${count} 道</span>
                        </button>
                    `).join("")}
                </div>
            </div>
        `);
    }

    const otherGrouped = {};
    otherItems.forEach(item => {
        const category = item.task.category || "其他";
        if (!otherGrouped[category]) otherGrouped[category] = [];
        otherGrouped[category].push(item);
    });

    Object.entries(otherGrouped).forEach(([category, items]) => {
        sections.push(`
            <div class="review-section-group">
                <div class="review-section-group-title">${category}</div>
                <div class="review-section-grid">
                    ${items.map(({ task, count }) => `
                        <button
                            type="button"
                            class="review-section-button"
                            data-review-task-id="${task.id}"
                        >
                            <strong>${task.name}</strong>
                            <span>${task.module || ""} · ${count} 道</span>
                        </button>
                    `).join("")}
                </div>
            </div>
        `);
    });

    chooser.innerHTML = sections.join("");

    chooser.querySelectorAll("[data-review-major-module]").forEach(button => {
        if (button.disabled) return;
        button.addEventListener("click", () => {
            startMajorModuleReview("行测", button.dataset.reviewMajorModule);
        });
    });

    chooser.querySelectorAll("[data-review-task-id]").forEach(button => {
        button.addEventListener("click", () => {
            startTaskReview(button.dataset.reviewTaskId);
        });
    });
}

function renderReviewPool() {
    const container = document.getElementById("review-list");
    const countElement = document.getElementById("unlocked-task-count");
    if (!container) return;

    const html = [];
    let logicalCount = 0;

    // 行测：按四大板块汇总，而不是把每一次学习任务逐条铺开。
    const visibleXingceModules = REVIEW_XINGCE_MODULES
        .map(module => {
            const moduleTasks = studyPlan.filter(task =>
                task.category === "行测" && task.module === module
            );
            const unlocked = getUnlockedQuestionsForMajorModule("行测", module);
            const hasCompletedTask = moduleTasks.some(task => Boolean(progress[task.id]));
            return { module, unlocked, hasCompletedTask };
        })
        .filter(item => item.unlocked.length > 0 || item.hasCompletedTask);

    if (visibleXingceModules.length > 0) {
        logicalCount += visibleXingceModules.length;
        html.push(`
            <div class="review-pool-category">
                <div class="review-pool-category-title">行测</div>
                <div class="review-pool-module-grid xingce-major-grid">
                    ${visibleXingceModules.map(({ module, unlocked }) => `
                        <div class="review-card review-pool-module-card">
                            <strong>${module}</strong>
                            <span>${unlocked.length} 道已解锁</span>
                        </div>
                    `).join("")}
                </div>
            </div>
        `);
    }

    // 计算机：保留每次学习任务的粒度，名称已被 display-helpers.js 改成 1、2、3……
    const computerRecords = studyPlan
        .filter(task => task.category === "计算机")
        .map(task => {
            const allQuestions = questions.filter(q => q.taskId === task.id);
            const unlockedQuestions = allQuestions.filter(questionIsUnlocked);
            return { task, allQuestions, unlockedQuestions };
        })
        .filter(({ task, unlockedQuestions }) =>
            Boolean(progress[task.id]) || unlockedQuestions.length > 0
        );

    if (computerRecords.length > 0) {
        logicalCount += computerRecords.length;
        html.push(`
            <div class="review-pool-category">
                <div class="review-pool-category-title">计算机</div>
                <div class="review-pool-module-grid">
                    ${computerRecords.map(({ task, allQuestions, unlockedQuestions }) => `
                        <div class="review-card review-pool-module-card">
                            <strong>${task.name}</strong>
                            <span>${unlockedQuestions.length}${allQuestions.length ? `/${allQuestions.length}` : ""} 道已解锁</span>
                            <small>${task.module || ""}</small>
                        </div>
                    `).join("")}
                </div>
            </div>
        `);
    }

    // 其他题库（例如 10 月前必学 300 题）仍按原任务显示。
    const otherRecords = studyPlan
        .filter(task => task.category !== "行测" && task.category !== "计算机")
        .map(task => {
            const allQuestions = questions.filter(q => q.taskId === task.id);
            const unlockedQuestions = allQuestions.filter(questionIsUnlocked);
            return { task, allQuestions, unlockedQuestions };
        })
        .filter(({ task, unlockedQuestions }) =>
            Boolean(progress[task.id]) || unlockedQuestions.length > 0
        );

    const otherByCategory = {};
    otherRecords.forEach(record => {
        const category = record.task.category || "其他";
        if (!otherByCategory[category]) otherByCategory[category] = [];
        otherByCategory[category].push(record);
    });

    Object.entries(otherByCategory).forEach(([category, records]) => {
        logicalCount += records.length;
        html.push(`
            <div class="review-pool-category">
                <div class="review-pool-category-title">${category}</div>
                <div class="review-pool-module-grid">
                    ${records.map(({ task, allQuestions, unlockedQuestions }) => `
                        <div class="review-card review-pool-module-card">
                            <strong>${task.name}</strong>
                            <span>${unlockedQuestions.length}${allQuestions.length ? `/${allQuestions.length}` : ""} 道已解锁</span>
                            <small>${task.module || ""}</small>
                        </div>
                    `).join("")}
                </div>
            </div>
        `);
    });

    if (countElement) countElement.textContent = `${logicalCount} 项`;

    container.innerHTML = html.length
        ? html.join("")
        : `<div class="empty-message">还没有已经解锁的复习内容</div>`;
}

(function installMajorModuleStyles() {
    if (document.getElementById("major-module-review-styles")) return;

    const style = document.createElement("style");
    style.id = "major-module-review-styles";
    style.textContent = `
        .xingce-major-grid {
            grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
        }

        .review-major-module-button {
            min-height: 78px;
        }

        .review-pool-category + .review-pool-category {
            margin-top: 20px;
        }

        .review-pool-category-title {
            margin: 0 0 10px;
            color: #68686d;
            font-size: 13px;
            font-weight: 700;
        }

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
        .review-pool-module-card small {
            color: #667085;
        }

        @media (max-width: 900px) {
            .xingce-major-grid {
                grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            }
        }

        @media (max-width: 560px) {
            .xingce-major-grid {
                grid-template-columns: 1fr !important;
            }
        }
    `;

    document.head.appendChild(style);
})();

// scheduled-questionbank.js 已经先渲染过一次，覆盖函数后立即按新结构重绘。
renderReviewPool();
