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

        // 常见括号填空：将空白括号直接替换为正确项，保留用户熟悉的“（答案）”记忆形式。
        const blankPatterns = [
            /（\s*[　_＿—-]*\s*）/,
            /\(\s*[　_＿—-]*\s*\)/
        ];
        for (const pattern of blankPatterns) {
            if (pattern.test(stem)) {
                return `${stem.replace(pattern, `（${answer}）`)}。`;
            }
        }

        // 如果题干本身已经以“是/为/包括/组成”等知识句式结尾，直接补答案。
        if (/(是|为|包括|组成|指|称为|属于|不属于|体现为|具体体现在|内容包括|核心是|标志是|源头是)$/.test(stem)) {
            return `${stem}（${answer}）。`;
        }

        // 判断题或无法自然填空的题：保持原题表述，同时直接给出正确判断/正确项。
        if (question.type === "judge") {
            return `${stem} —— （${answer}）。`;
        }

        return `${stem}（${answer}）。`;
    }

    function memoryFactHTML(question) {
        const record = answerHistory && answerHistory[question.id];
        const meta = [
            question.sourceId || "",
            Number(record?.memoryBlurred || 0) ? `记忆模糊 ${Number(record.memoryBlurred)} 次` : "",
            Number(record?.wrong || 0) > 1 ? `累计错 ${Number(record.wrong)} 次` : ""
        ].filter(Boolean).join(" · ");

        return `
            <div class="weak-memory-fact">
                <p>${escapeHTML(fillMemoryStem(question))}</p>
                ${meta ? `<small>${escapeHTML(meta)}</small>` : ""}
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

            body.classList.add("weak-memory-facts-body");
            body.innerHTML = `
                <div class="weak-memory-facts-intro">直接记结论</div>
                ${list.map(memoryFactHTML).join("")}
            `;
        });
    }

    function installStyles() {
        if (document.getElementById("weak-memory-facts-style")) return;
        const style = document.createElement("style");
        style.id = "weak-memory-facts-style";
        style.textContent = `
            .weak-memory-facts-body {
                display: grid;
                gap: 9px;
            }
            .weak-memory-facts-intro {
                color: #7a8783;
                font-size: 11px;
                font-weight: 800;
                letter-spacing: .04em;
            }
            .weak-memory-fact {
                padding: 12px 14px;
                border: 1px solid #e1ebe8;
                border-radius: 11px;
                background: #fbfefd;
            }
            .weak-memory-fact p {
                margin: 0;
                color: #203b35;
                font-size: 14px;
                font-weight: 650;
                line-height: 1.75;
            }
            .weak-memory-fact small {
                display: block;
                margin-top: 6px;
                color: #909b98;
                font-size: 10px;
            }
        `;
        document.head.appendChild(style);
    }

    installStyles();

    // weak-knowledge-addon 已经包装了 renderWrongList；这里再在其完成后做一次轻量 DOM 整理。
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
