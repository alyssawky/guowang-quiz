// 错题知识点复习区：计算机/国网必刷题改为“直接结论句”记忆模式。
// 行测保持 weak-knowledge-addon.js 原有的知识点解释与方法讲解。
(function () {
    if (window.__weakMemoryFactsInstalled) return;
    window.__weakMemoryFactsInstalled = true;

    function normalize(value) {
        return String(value == null ? "" : value).replace(/\s+/g, " ").trim();
    }

    function escapeHTML(value) {
        return String(value == null ? "" : value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
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

    function isMemoryQuestion(question) {
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

    function isWrong(question) {
        const record = answerHistory && answerHistory[question.id];
        return Boolean(record && Number(record.wrong || 0) > 0);
    }

    function fillMemoryStem(question) {
        let stem = normalize(question.question)
            .replace(/[？?]\s*$/, "")
            .replace(/\s*。\s*$/, "");
        const answer = correctOptionText(question);

        if (!answer) return stem;

        const blankPatterns = [
            /（\s*[　_＿—-]*\s*）/,
            /\(\s*[　_＿—-]*\s*\)/
        ];
        for (const pattern of blankPatterns) {
            if (pattern.test(stem)) {
                return `${stem.replace(pattern, `（${answer}）`)}。`;
            }
        }

        if (/(是|为|包括|组成|指|称为|属于|不属于|体现为|具体体现在|内容包括|核心是|标志是|源头是)$/.test(stem)) {
            return `${stem}（${answer}）。`;
        }

        if (question.type === "judge") {
            return `${stem} —— （${answer}）。`;
        }

        return `${stem}（${answer}）。`;
    }

    function memorySentenceHTML(question) {
        const sentence = fillMemoryStem(question);
        const answer = correctOptionText(question);
        let html = escapeHTML(sentence);
        if (!answer) return html;

        const wrapped = `（${answer}）`;
        const escapedWrapped = escapeHTML(wrapped);
        if (html.includes(escapedWrapped)) {
            html = html.replace(
                escapedWrapped,
                `<strong class="weak-memory-answer">${escapedWrapped}</strong>`
            );
        }
        return html;
    }

    function memoryFactHTML(question) {
        const record = answerHistory && answerHistory[question.id];
        const meta = [
            question.sourceId || "",
            Number(record?.memoryBlurred || 0) ? `模糊 ${Number(record.memoryBlurred)} 次` : "",
            Number(record?.wrong || 0) > 1 ? `错 ${Number(record.wrong)} 次` : ""
        ].filter(Boolean).join(" · ");

        return `
            <div class="weak-memory-fact">
                <span class="weak-memory-dot" aria-hidden="true"></span>
                <div class="weak-memory-fact-main">
                    <p>${memorySentenceHTML(question)}</p>
                    ${meta ? `<small>${escapeHTML(meta)}</small>` : ""}
                </div>
            </div>
        `;
    }

    function simplifyMemoryGroups() {
        const section = document.querySelector("#wrong-list .weak-knowledge-section");
        if (!section) return;

        section.querySelectorAll(".weak-knowledge-item").forEach(item => {
            const summary = item.querySelector("summary");
            const pointNode = summary && summary.querySelector(".weak-summary-main strong");
            const small = summary && summary.querySelector(".weak-summary-main small");
            const body = item.querySelector(".weak-knowledge-body");
            if (!pointNode || !body) return;

            const point = normalize(pointNode.textContent);
            const categoryText = normalize(small && small.textContent);
            const isMemoryGroup = categoryText.includes("计算机") || categoryText.includes("国网必刷题");
            if (!isMemoryGroup) return;

            const list = questions.filter(question =>
                isMemoryQuestion(question) &&
                isWrong(question) &&
                getKnowledgePoint(question) === point
            );
            if (!list.length) return;

            item.classList.add("weak-memory-group");
            body.classList.add("weak-memory-facts-body");
            body.innerHTML = `
                <div class="weak-memory-facts-intro">记忆清单</div>
                <div class="weak-memory-facts-list">${list.map(memoryFactHTML).join("")}</div>
            `;
        });
    }

    function installStyles() {
        if (document.getElementById("weak-memory-facts-style")) return;
        const style = document.createElement("style");
        style.id = "weak-memory-facts-style";
        style.textContent = `
            .weak-memory-group > summary {
                padding-top: 11px !important;
                padding-bottom: 11px !important;
                background: #f6fbf9;
                border-left: 3px solid #0b8073;
            }
            .weak-memory-group .weak-summary-main strong {
                color: #0b5f55;
                font-size: 15px;
                font-weight: 850;
            }
            .weak-memory-group .weak-summary-main small {
                color: #82908c;
                font-size: 10.5px;
            }
            .weak-memory-facts-body {
                display: block !important;
                padding: 8px 14px 10px !important;
            }
            .weak-memory-facts-intro {
                display: inline-flex;
                align-items: center;
                margin: 0 0 4px 2px;
                padding: 2px 7px;
                border-radius: 999px;
                background: #edf7f4;
                color: #39776e;
                font-size: 10px;
                font-weight: 750;
                letter-spacing: .02em;
            }
            .weak-memory-facts-list {
                border-top: 1px solid #e5eeeb;
            }
            .weak-memory-fact {
                display: flex;
                align-items: flex-start;
                gap: 9px;
                padding: 8px 3px;
                border: 0;
                border-bottom: 1px solid #edf2f0;
                border-radius: 0;
                background: transparent;
            }
            .weak-memory-fact:last-child {
                border-bottom: 0;
            }
            .weak-memory-dot {
                width: 5px;
                height: 5px;
                margin-top: 8px;
                border-radius: 50%;
                background: #76aaa1;
                flex: 0 0 auto;
            }
            .weak-memory-fact-main {
                min-width: 0;
                flex: 1;
            }
            .weak-memory-fact p {
                margin: 0;
                color: #31433f;
                font-size: 13px;
                font-weight: 500;
                line-height: 1.55;
            }
            .weak-memory-answer {
                display: inline;
                padding: 1px 4px;
                border-radius: 4px;
                background: #e6f4f0;
                color: #00695d;
                font-weight: 850;
                box-decoration-break: clone;
                -webkit-box-decoration-break: clone;
            }
            .weak-memory-fact small {
                display: block;
                margin-top: 3px;
                color: #a0aaa7;
                font-size: 9.5px;
                line-height: 1.35;
            }
            @media (max-width: 680px) {
                .weak-memory-facts-body {
                    padding: 7px 10px 9px !important;
                }
                .weak-memory-fact {
                    padding: 8px 1px;
                }
                .weak-memory-fact p {
                    font-size: 12.5px;
                    line-height: 1.55;
                }
            }
        `;
        document.head.appendChild(style);
    }

    installStyles();

    const baseRenderWrongList = window.renderWrongList;
    if (typeof baseRenderWrongList === "function") {
        window.renderWrongList = function (...args) {
            const result = baseRenderWrongList.apply(this, args);
            simplifyMemoryGroups();
            return result;
        };
    }

    simplifyMemoryGroups();
})();
