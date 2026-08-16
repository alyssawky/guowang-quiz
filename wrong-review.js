// 错题本升级：按板块组织，并允许直接进入错题复习。
// 保留原 answerHistory 规则：历史上答错过的题都会继续留在错题本中。

(function () {
    const WRONG_XINGCE_MODULES = ["资料分析", "判断推理", "言语理解", "数量关系"];
    const QUESTION_BANK_CATEGORY = "国网题库";
    const QUESTION_BANK_LABEL = "国网必刷题";

    function getWrongQuestions() {
        return questions.filter(question => {
            const record = answerHistory[question.id];
            return Boolean(record && Number(record.wrong || 0) > 0);
        });
    }

    function getTask(question) {
        return studyPlan.find(task => task.id === question.taskId) || null;
    }

    function startWrongSession(questionList, title, meta = "") {
        if (!questionList.length) return;

        const shuffled = shuffleArray(questionList);
        startQuestionSession(
            shuffled,
            title,
            meta || `${shuffled.length} 道错题`
        );

        const chooser = document.getElementById("review-section-chooser");
        if (chooser) chooser.hidden = true;

        const wrongBook = document.getElementById("wrong-book");
        if (wrongBook) wrongBook.open = false;
    }

    function buildGroupedAllWrongQuestions() {
        const wrongQuestions = getWrongQuestions();
        const groups = [];

        // 行测：四大板块依次出现，板块内部随机。
        WRONG_XINGCE_MODULES.forEach(module => {
            const list = wrongQuestions.filter(question => {
                const task = getTask(question);
                return task && task.category === "行测" && task.module === module;
            });
            if (list.length) groups.push(list);
        });

        // 计算机：按学习章节顺序。
        studyPlan
            .filter(task => task.category === "计算机")
            .forEach(task => {
                const list = wrongQuestions.filter(question => question.taskId === task.id);
                if (list.length) groups.push(list);
            });

        // 国网必刷题：按主题顺序，同主题连续刷。
        const bankQuestions = wrongQuestions.filter(question => {
            const task = getTask(question);
            return task && (task.questionBank || task.category === QUESTION_BANK_CATEGORY);
        });
        const bankTopics = [...new Set(bankQuestions.map(question => question.topic || "未分类"))];
        bankTopics.forEach(topic => {
            const list = bankQuestions.filter(question => (question.topic || "未分类") === topic);
            if (list.length) groups.push(list);
        });

        // 其他未覆盖题。
        const coveredIds = new Set(groups.flat().map(question => question.id));
        const remaining = wrongQuestions.filter(question => !coveredIds.has(question.id));
        if (remaining.length) groups.push(remaining);

        return groups.flatMap(group => shuffleArray(group));
    }

    function showWrongInventory(questionList, title) {
        if (typeof window.showQuestionInventory === "function") {
            window.showQuestionInventory(questionList, title);
        }
    }

    function wrongRow({ label, count, key, kind, meta = "" }) {
        return `
            <div class="wrong-review-row">
                <div class="wrong-review-row-info">
                    <strong>${label}</strong>
                    <small>${count} 道错题${meta ? ` · ${meta}` : ""}</small>
                </div>
                <div class="wrong-review-row-actions">
                    <button type="button" class="wrong-review-start" data-wrong-kind="${kind}" data-wrong-key="${key}">刷错题</button>
                    <button type="button" class="wrong-review-view" data-wrong-view-kind="${kind}" data-wrong-view-key="${key}">查看错题</button>
                </div>
            </div>
        `;
    }

    function getWrongByXingceModule(module) {
        return getWrongQuestions().filter(question => {
            const task = getTask(question);
            return task && task.category === "行测" && task.module === module;
        });
    }

    function getWrongByComputerTask(taskId) {
        return getWrongQuestions().filter(question => question.taskId === taskId);
    }

    function getWrongByBankTopic(topic) {
        return getWrongQuestions().filter(question => {
            const task = getTask(question);
            return task &&
                (task.questionBank || task.category === QUESTION_BANK_CATEGORY) &&
                (question.topic || "未分类") === topic;
        });
    }

    function resolveWrongGroup(kind, key) {
        if (kind === "xingce") return getWrongByXingceModule(key);
        if (kind === "computer") return getWrongByComputerTask(key);
        if (kind === "bank") return getWrongByBankTopic(key);
        return [];
    }

    function resolveWrongTitle(kind, key) {
        if (kind === "xingce") return `错题复习 · ${key}`;
        if (kind === "computer") {
            const task = studyPlan.find(item => item.id === key);
            return `错题复习 · ${task ? task.name : "计算机"}`;
        }
        if (kind === "bank") return `错题复习 · ${QUESTION_BANK_LABEL} · ${key}`;
        return "错题复习";
    }

    function renderWrongList() {
        const container = document.getElementById("wrong-list");
        const countElement = document.getElementById("wrong-total-count");
        if (!container) return;

        const wrongQuestions = getWrongQuestions();
        if (countElement) countElement.textContent = `${wrongQuestions.length} 道`;

        if (!wrongQuestions.length) {
            container.innerHTML = `<div class="empty-message">暂时没有错题</div>`;
            return;
        }

        const html = [];

        html.push(`
            <div class="wrong-review-overview">
                <div>
                    <strong>错题复习</strong>
                    <span>共 ${wrongQuestions.length} 道历史错题</span>
                </div>
                <div class="wrong-review-overview-actions">
                    <button type="button" id="wrong-review-all">刷全部错题</button>
                    <button type="button" id="wrong-view-all">查看全部错题</button>
                </div>
            </div>
        `);

        const xingceRows = WRONG_XINGCE_MODULES.map(module => {
            const list = getWrongByXingceModule(module);
            if (!list.length) return "";
            return wrongRow({ label: module, count: list.length, key: module, kind: "xingce" });
        }).filter(Boolean).join("");

        if (xingceRows) {
            html.push(`
                <section class="wrong-review-group">
                    <div class="wrong-review-group-title">行测</div>
                    <div class="wrong-review-list">${xingceRows}</div>
                </section>
            `);
        }

        const computerRows = studyPlan
            .filter(task => task.category === "计算机")
            .map(task => {
                const list = getWrongByComputerTask(task.id);
                if (!list.length) return "";
                return wrongRow({
                    label: task.name,
                    count: list.length,
                    key: task.id,
                    kind: "computer",
                    meta: task.module || ""
                });
            })
            .filter(Boolean)
            .join("");

        if (computerRows) {
            html.push(`
                <section class="wrong-review-group">
                    <div class="wrong-review-group-title">计算机</div>
                    <div class="wrong-review-list">${computerRows}</div>
                </section>
            `);
        }

        const bankWrong = wrongQuestions.filter(question => {
            const task = getTask(question);
            return task && (task.questionBank || task.category === QUESTION_BANK_CATEGORY);
        });
        const bankTopics = [...new Set(bankWrong.map(question => question.topic || "未分类"))];
        const bankRows = bankTopics.map(topic => {
            const list = getWrongByBankTopic(topic);
            return wrongRow({ label: topic, count: list.length, key: topic, kind: "bank" });
        }).join("");

        if (bankRows) {
            html.push(`
                <section class="wrong-review-group">
                    <div class="wrong-review-group-title">${QUESTION_BANK_LABEL}</div>
                    <div class="wrong-review-list">${bankRows}</div>
                </section>
            `);
        }

        container.innerHTML = html.join("");

        const allButton = document.getElementById("wrong-review-all");
        if (allButton) {
            allButton.addEventListener("click", () => {
                const sessionQuestions = buildGroupedAllWrongQuestions();
                startWrongSession(
                    sessionQuestions,
                    "错题复习 · 全部错题",
                    `共 ${sessionQuestions.length} 道；按板块连续出题，板块内随机`
                );
            });
        }

        const viewAllButton = document.getElementById("wrong-view-all");
        if (viewAllButton) {
            viewAllButton.addEventListener("click", () => {
                showWrongInventory(getWrongQuestions(), "错题核对 · 全部错题");
            });
        }

        container.querySelectorAll("[data-wrong-kind]").forEach(button => {
            button.addEventListener("click", () => {
                const kind = button.dataset.wrongKind;
                const key = button.dataset.wrongKey;
                const list = resolveWrongGroup(kind, key);
                startWrongSession(
                    list,
                    resolveWrongTitle(kind, key),
                    `${list.length} 道错题 · 随机顺序`
                );
            });
        });

        container.querySelectorAll("[data-wrong-view-kind]").forEach(button => {
            button.addEventListener("click", () => {
                const kind = button.dataset.wrongViewKind;
                const key = button.dataset.wrongViewKey;
                const list = resolveWrongGroup(kind, key);
                showWrongInventory(list, resolveWrongTitle(kind, key).replace("错题复习", "错题核对"));
            });
        });
    }

    function installWrongReviewStyles() {
        if (document.getElementById("wrong-review-styles")) return;
        const style = document.createElement("style");
        style.id = "wrong-review-styles";
        style.textContent = `
            .wrong-review-overview {
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 14px;
                padding: 12px 14px;
                border: 1px solid #e5e7eb;
                border-radius: 12px;
                background: #fafbfc;
            }
            .wrong-review-overview > div:first-child {
                display: flex;
                align-items: baseline;
                gap: 10px;
                flex-wrap: wrap;
            }
            .wrong-review-overview span {
                color: #667085;
                font-size: 13px;
            }
            .wrong-review-overview-actions,
            .wrong-review-row-actions {
                display: flex;
                gap: 7px;
                flex-shrink: 0;
            }
            .wrong-review-overview-actions button,
            .wrong-review-row-actions button {
                min-height: 32px;
                padding: 6px 11px;
                border-radius: 8px;
                font-size: 12px;
            }
            .wrong-review-overview-actions button:last-child,
            .wrong-review-view {
                background: white;
                color: #404652;
                border: 1px solid #d7dce3;
            }
            .wrong-review-group { margin-top: 16px; }
            .wrong-review-group-title {
                margin: 0 0 7px;
                color: #525866;
                font-size: 13px;
                font-weight: 800;
            }
            .wrong-review-list {
                overflow: hidden;
                border: 1px solid #e5e7eb;
                border-radius: 11px;
                background: white;
            }
            .wrong-review-row {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 12px;
                min-height: 48px;
                padding: 8px 11px;
                border-bottom: 1px solid #eceef1;
            }
            .wrong-review-row:last-child { border-bottom: 0; }
            .wrong-review-row-info {
                min-width: 0;
                display: flex;
                align-items: baseline;
                gap: 10px;
                flex-wrap: wrap;
            }
            .wrong-review-row-info strong {
                font-size: 13px;
                line-height: 1.4;
            }
            .wrong-review-row-info small {
                color: #7b8190;
                font-size: 11px;
            }
            @media (max-width: 680px) {
                .wrong-review-overview,
                .wrong-review-row {
                    align-items: stretch;
                    flex-direction: column;
                }
                .wrong-review-overview-actions,
                .wrong-review-row-actions {
                    width: 100%;
                }
                .wrong-review-overview-actions button,
                .wrong-review-row-actions button {
                    flex: 1;
                }
            }
        `;
        document.head.appendChild(style);
    }

    installWrongReviewStyles();
    window.renderWrongList = renderWrongList;
    renderWrongList();
})();
