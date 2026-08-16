// 免费版错题知识点复习 + “记忆模糊”按钮。
// 1) 计算机/国网必刷题可直接标记“记忆模糊”：按错误作答记录并立即进入错题本。
// 2) 错题本按题库已有 topic / 知识解析自动聚类，生成薄弱知识点复习区，不调用任何 AI/API。
(function () {
    if (window.__weakKnowledgeAddonInstalled) return;
    window.__weakKnowledgeAddonInstalled = true;

    function escapeHTML(value) {
        return String(value == null ? "" : value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function normalize(value) {
        return String(value == null ? "" : value).replace(/\s+/g, " ").trim();
    }

    function getTask(question) {
        return studyPlan.find(task => task.id === question.taskId) || null;
    }

    function isBankQuestion(question) {
        const task = getTask(question);
        return Boolean(
            question &&
            (String(question.taskId || "").startsWith("preoct300-w") ||
                (task && (task.questionBank || task.category === "国网题库")))
        );
    }

    function isComputerQuestion(question) {
        const task = getTask(question);
        return Boolean(task && task.category === "计算机");
    }

    function supportsMemoryBlur(question) {
        return Boolean(question && (isComputerQuestion(question) || isBankQuestion(question)));
    }

    function correctOptionText(question) {
        if (!question) return "";
        if (question.type === "short") return normalize(question.answerDisplay || question.answer);
        return String(question.answer || "")
            .split("")
            .filter(Boolean)
            .map(key => question.options && question.options[key] ? normalize(question.options[key]) : key)
            .join("；");
    }

    function currentCorrectDisplay(question) {
        if (!question) return "";
        if (question.type === "short") return normalize(question.answerDisplay || question.answer);
        const keys = String(question.answer || "").split("").sort().join("");
        if (typeof window.optionDisplayText === "function") {
            const display = window.optionDisplayText(keys);
            if (display) return display;
        }
        return String(question.answer || "")
            .split("")
            .filter(Boolean)
            .map(key => question.options && question.options[key] ? `${key}. ${question.options[key]}` : key)
            .join("；");
    }

    function bankKnowledge(question) {
        if (!question || typeof window.getBankMemoryKnowledge !== "function") return null;
        try {
            return window.getBankMemoryKnowledge(question) || null;
        } catch (error) {
            return null;
        }
    }

    function renderLearningExplanation(question) {
        const bank = bankKnowledge(question);
        if (bank) {
            return `
                <div class="blur-knowledge-block">
                    ${bank.explanation ? `<div><strong>知识点解析</strong><p>${escapeHTML(bank.explanation)}</p></div>` : ""}
                    ${bank.distinction ? `<div><strong>易混辨析</strong><p>${escapeHTML(bank.distinction)}</p></div>` : ""}
                    ${bank.hook ? `<div class="blur-hook"><strong>记忆钩子</strong><p>${escapeHTML(bank.hook)}</p></div>` : ""}
                </div>
            `;
        }
        return `<div class="answer-explanation">${question.explanation || ""}</div>${question.note ? `<p class="answer-note"><strong>口径提醒：</strong>${question.note}</p>` : ""}`;
    }

    function disableCurrentAnswerControls() {
        document.querySelectorAll(".option-btn").forEach(button => { button.disabled = true; });
        const multipleSubmit = document.getElementById("multiple-submit-btn");
        if (multipleSubmit) multipleSubmit.disabled = true;
        const shortInput = document.getElementById("short-answer-input");
        if (shortInput) shortInput.disabled = true;
        const shortSubmit = shortInput && shortInput.parentElement
            ? shortInput.parentElement.querySelector("button")
            : null;
        if (shortSubmit) shortSubmit.disabled = true;
        const blurButton = document.getElementById("memory-blur-btn");
        if (blurButton) blurButton.disabled = true;
    }

    function markMemoryBlurred() {
        const question = (typeof currentReviewQuestions !== "undefined" && typeof currentQuestionIndex !== "undefined") ? currentReviewQuestions[currentQuestionIndex] : null;
        const feedback = document.getElementById("answer-feedback");
        if (!question || !feedback || !supportsMemoryBlur(question)) return;
        if (feedback.querySelector(".answer-result")) return;

        // 记忆模糊视为一次真正的错误作答：进入错题本，也让后续正确率反映真实掌握程度。
        window.recordAnswer(question.id, false);
        const record = (typeof answerHistory !== "undefined") ? answerHistory[question.id] : null;
        if (record) {
            record.memoryBlurred = Number(record.memoryBlurred || 0) + 1;
            record.lastMistakeType = "memory-blur";
            record.lastMemoryBlurredAt = new Date().toISOString();
            if (typeof window.saveAnswerHistory === "function") window.saveAnswerHistory();
        }

        if (typeof window.renderWrongList === "function") window.renderWrongList();
        disableCurrentAnswerControls();

        feedback.innerHTML = `
            <div class="review-card answer-result wrong-result memory-blur-result">
                <strong>记忆模糊 · 已按错题记录</strong>
                <p class="memory-blur-note">这次不再继续猜答案，系统按一次错误记录，并直接加入错题本和薄弱知识点统计。</p>
                <p>正确答案：${escapeHTML(currentCorrectDisplay(question))}</p>
                ${renderLearningExplanation(question)}
                <button onclick="nextQuestion()">下一题</button>
            </div>
        `;
    }

    window.markMemoryBlurred = markMemoryBlurred;

    function injectMemoryBlurButton() {
        const question = (typeof currentReviewQuestions !== "undefined" && typeof currentQuestionIndex !== "undefined") ? currentReviewQuestions[currentQuestionIndex] : null;
        const card = document.querySelector("#quiz-area .quiz-question-card");
        if (!card || !supportsMemoryBlur(question)) return;
        if (card.querySelector("#memory-blur-btn")) return;

        const feedback = card.querySelector("#answer-feedback");
        if (!feedback) return;

        const row = document.createElement("div");
        row.className = "memory-blur-row";
        row.innerHTML = `
            <button type="button" id="memory-blur-btn" class="memory-blur-btn" onclick="markMemoryBlurred()">
                记忆模糊
            </button>
            <span>不确定知识点时直接标记，不必靠蒙题验证记忆。</span>
        `;
        feedback.parentNode.insertBefore(row, feedback);
    }

    const baseRenderQuestion = window.renderQuestion;
    if (typeof baseRenderQuestion === "function") {
        window.renderQuestion = function (...args) {
            const result = baseRenderQuestion.apply(this, args);
            injectMemoryBlurButton();
            return result;
        };
    }

    function deriveBankKnowledgePoint(question) {
        const text = `${normalize(question.question)} ${correctOptionText(question)} ${normalize(question.topic)}`;
        const rules = [
            [/两个结合/, "两个结合"],
            [/两个确立/, "两个确立"],
            [/中国式现代化/, "中国式现代化"],
            [/全过程人民民主/, "全过程人民民主"],
            [/新质生产力/, "新质生产力"],
            [/社会主义核心价值观|富强.*民主.*文明.*和谐|自由.*平等.*公正.*法治|爱国.*敬业.*诚信.*友善/, "社会主义核心价值观"],
            [/二十届三中全会|进一步全面深化改革/, "二十届三中全会"],
            [/企业宗旨|人民电业为人民/, "国家电网企业宗旨"],
            [/企业使命|为美好生活充电|为美丽中国赋能/, "国家电网企业使命"],
            [/企业精神|努力超越|追求卓越/, "国家电网企业精神"],
            [/核心价值观/, "国家电网核心价值观"],
            [/安全文化|核心安全理念|四不两直|两票三制|三管三必须|人民至上.*生命至上/, "国家电网安全文化"],
            [/十个不准|接待礼仪|接电话礼仪|客户.*业务|服务规范/, "供电服务规范与礼仪"],
            [/成立于|民族电力工业|特高压|厂网分开|电力体制改革|一带一路/, "国家电网发展历程"],
            [/党建|党的建设|根和魂|两个一以贯之/, "国有企业党的建设"],
            [/文化思想|七个着力|六个必须坚持|九个坚持/, "习近平文化思想"]
        ];
        for (const [pattern, label] of rules) {
            if (pattern.test(text)) return label;
        }
        return normalize(question.topic) || "国网知识点";
    }

    function getKnowledgePoint(question) {
        if (!question) return "未分类知识点";
        if (question.knowledgePoint) return normalize(question.knowledgePoint);
        if (isBankQuestion(question)) return deriveBankKnowledgePoint(question);
        return normalize(question.topic) || normalize(getTask(question)?.module) || normalize(getTask(question)?.name) || "未分类知识点";
    }

    function questionWeakScore(question) {
        const record = (typeof answerHistory !== "undefined") ? answerHistory[question.id] : null;
        if (!record || Number(record.wrong || 0) <= 0) return 0;
        const wrong = Number(record.wrong || 0);
        const correct = Number(record.correct || 0);
        const blur = Number(record.memoryBlurred || 0);
        const base = wrong * 2 + blur - correct;
        return record.lastCorrect === false ? Math.max(2, base + 1) : Math.max(0, base);
    }

    function getActiveWeakGroups() {
        const map = new Map();
        questions.forEach(question => {
            const score = questionWeakScore(question);
            if (score <= 0) return;
            const record = answerHistory[question.id];
            const task = getTask(question);
            const point = getKnowledgePoint(question);
            const category = isBankQuestion(question)
                ? "国网必刷题"
                : task?.category || "其他";
            const key = `${category}::${point}`;
            if (!map.has(key)) {
                map.set(key, {
                    key,
                    category,
                    point,
                    questions: [],
                    score: 0,
                    wrong: 0,
                    blurred: 0
                });
            }
            const group = map.get(key);
            group.questions.push(question);
            group.score += score;
            group.wrong += Number(record.wrong || 0);
            group.blurred += Number(record.memoryBlurred || 0);
        });
        return [...map.values()].sort((a, b) =>
            b.score - a.score ||
            b.wrong - a.wrong ||
            a.point.localeCompare(b.point, "zh-CN")
        );
    }

    function questionKnowledgeHTML(question) {
        const info = bankKnowledge(question);
        const answer = correctOptionText(question);
        const record = (typeof answerHistory !== "undefined") ? answerHistory[question.id] : null;
        const label = answer || question.sourceId || "相关知识";

        if (info) {
            return `
                <div class="weak-knowledge-note">
                    <div class="weak-note-head">
                        <strong>${escapeHTML(label)}</strong>
                        <span>错 ${Number(record?.wrong || 0)} 次${Number(record?.memoryBlurred || 0) ? ` · 模糊 ${Number(record.memoryBlurred)} 次` : ""}</span>
                    </div>
                    ${info.explanation ? `<p>${escapeHTML(info.explanation)}</p>` : ""}
                    ${info.distinction ? `<div class="weak-distinction"><b>易混辨析</b>${escapeHTML(info.distinction)}</div>` : ""}
                    ${info.hook ? `<div class="weak-hook"><b>记忆：</b>${escapeHTML(info.hook)}</div>` : ""}
                </div>
            `;
        }

        return `
            <div class="weak-knowledge-note">
                <div class="weak-note-head">
                    <strong>${escapeHTML(label)}</strong>
                    <span>错 ${Number(record?.wrong || 0)} 次${Number(record?.memoryBlurred || 0) ? ` · 模糊 ${Number(record.memoryBlurred)} 次` : ""}</span>
                </div>
                <div class="weak-explanation">${question.explanation || `<p>正确结论：${escapeHTML(label)}</p>`}</div>
                ${question.note ? `<div class="weak-distinction"><b>注意</b>${escapeHTML(question.note)}</div>` : ""}
            </div>
        `;
    }

    function buildWeakKnowledgeSection() {
        const groups = getActiveWeakGroups();
        if (!groups.length) return "";

        return `
            <section class="weak-knowledge-section">
                <div class="weak-knowledge-heading">
                    <div>
                        <strong>错题知识点复习区</strong>
                        <span>按当前薄弱程度排序；后续重新做对会自动降低优先级</span>
                    </div>
                    <span class="weak-count">${groups.length} 个薄弱点</span>
                </div>
                <div class="weak-knowledge-list">
                    ${groups.map((group, index) => `
                        <details class="weak-knowledge-item" ${index === 0 ? "open" : ""}>
                            <summary>
                                <div class="weak-summary-main">
                                    <span class="weak-rank">${String(index + 1).padStart(2, "0")}</span>
                                    <div>
                                        <strong>${escapeHTML(group.point)}</strong>
                                        <small>${escapeHTML(group.category)} · ${group.questions.length} 道关联错题 · 累计错 ${group.wrong} 次${group.blurred ? ` · 记忆模糊 ${group.blurred} 次` : ""}</small>
                                    </div>
                                </div>
                                <span class="weak-priority">${group.score >= 8 ? "重点补" : group.score >= 4 ? "需要巩固" : "轻度薄弱"}</span>
                            </summary>
                            <div class="weak-knowledge-body">
                                ${group.questions
                                    .slice()
                                    .sort((a, b) => questionWeakScore(b) - questionWeakScore(a))
                                    .map(questionKnowledgeHTML)
                                    .join("")}
                            </div>
                        </details>
                    `).join("")}
                </div>
            </section>
        `;
    }

    const baseRenderWrongList = window.renderWrongList;
    if (typeof baseRenderWrongList === "function") {
        window.renderWrongList = function (...args) {
            const result = baseRenderWrongList.apply(this, args);
            const container = document.getElementById("wrong-list");
            if (container) {
                const old = container.querySelector(".weak-knowledge-section");
                if (old) old.remove();
                const html = buildWeakKnowledgeSection();
                if (html) container.insertAdjacentHTML("beforeend", html);
            }
            return result;
        };
    }

    function installStyles() {
        if (document.getElementById("weak-knowledge-addon-styles")) return;
        const style = document.createElement("style");
        style.id = "weak-knowledge-addon-styles";
        style.textContent = `
            .memory-blur-row {
                display: flex;
                align-items: center;
                justify-content: flex-end;
                gap: 10px;
                margin: 14px 0 0;
                padding-top: 12px;
                border-top: 1px dashed #dce8e5;
            }
            .memory-blur-row span {
                color: #7b8582;
                font-size: 12px;
            }
            .memory-blur-btn {
                min-height: 36px;
                padding: 7px 14px;
                border: 1px solid #d9b78d !important;
                border-radius: 9px;
                background: #fffaf2 !important;
                color: #8a5521 !important;
                font-weight: 750;
            }
            .memory-blur-btn:hover { background: #fff3df !important; }
            .memory-blur-result { border-color: #ead5b9 !important; background: #fffdf8 !important; }
            .memory-blur-note { color: #7a644a; }
            .blur-knowledge-block { display: grid; gap: 10px; margin-top: 12px; }
            .blur-knowledge-block > div { padding: 11px 13px; border-radius: 10px; background: #f7fbfa; }
            .blur-knowledge-block strong { color: #087466; font-size: 12px; }
            .blur-knowledge-block p { margin: 5px 0 0; line-height: 1.75; }
            .blur-hook { background: #eef8f5 !important; }

            .weak-knowledge-section { margin-top: 22px; padding-top: 18px; border-top: 1px solid #e1ebe8; }
            .weak-knowledge-heading {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 14px;
                margin-bottom: 10px;
            }
            .weak-knowledge-heading > div { display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap; }
            .weak-knowledge-heading strong { color: #174f47; font-size: 16px; }
            .weak-knowledge-heading span { color: #77837f; font-size: 12px; }
            .weak-count { padding: 4px 8px; border-radius: 999px; background: #edf7f4; color: #087466 !important; font-weight: 700; }
            .weak-knowledge-list { display: grid; gap: 8px; }
            .weak-knowledge-item { border: 1px solid #dfe9e6; border-radius: 12px; overflow: hidden; background: #fff; }
            .weak-knowledge-item summary {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 12px;
                padding: 11px 13px;
                cursor: pointer;
                list-style: none;
                background: #fbfdfc;
            }
            .weak-knowledge-item summary::-webkit-details-marker { display: none; }
            .weak-summary-main { display: flex; align-items: center; gap: 11px; min-width: 0; }
            .weak-rank { color: #0a8171; font-size: 12px; font-weight: 800; }
            .weak-summary-main > div { display: grid; gap: 2px; min-width: 0; }
            .weak-summary-main strong { color: #263b37; font-size: 13px; }
            .weak-summary-main small { color: #7c8885; font-size: 11px; line-height: 1.45; }
            .weak-priority { flex-shrink: 0; padding: 4px 8px; border-radius: 999px; background: #eef7f4; color: #167667; font-size: 11px; font-weight: 700; }
            .weak-knowledge-body { display: grid; gap: 9px; padding: 10px 12px 12px; border-top: 1px solid #edf1f0; }
            .weak-knowledge-note { padding: 12px 13px; border-radius: 10px; background: #f8fbfa; }
            .weak-note-head { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; }
            .weak-note-head strong { color: #145d51; font-size: 13px; }
            .weak-note-head span { color: #87918e; font-size: 10px; white-space: nowrap; }
            .weak-knowledge-note p, .weak-explanation { margin: 7px 0 0; color: #3f4d49; font-size: 12px; line-height: 1.8; }
            .weak-distinction, .weak-hook { margin-top: 8px; padding-top: 8px; border-top: 1px dashed #dbe6e3; color: #53635f; font-size: 11px; line-height: 1.75; }
            .weak-distinction b, .weak-hook b { margin-right: 6px; color: #0b7465; }
            @media (max-width: 680px) {
                .memory-blur-row { align-items: stretch; flex-direction: column-reverse; }
                .memory-blur-btn { width: 100%; }
                .weak-knowledge-heading, .weak-knowledge-item summary, .weak-note-head { align-items: stretch; flex-direction: column; }
                .weak-priority { width: fit-content; }
                .weak-note-head span { white-space: normal; }
            }
        `;
        document.head.appendChild(style);
    }

    installStyles();
    if (typeof window.renderWrongList === "function") window.renderWrongList();
})();
