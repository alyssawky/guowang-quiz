// 错题知识点复习区三级框架：大板块 → 子板块 → 具体薄弱知识点。
// 行测固定四板块；计算机按 studyPlan.module；国网必刷题按 question.topic。
(function () {
    if (window.__weakKnowledgeHierarchyInstalled) return;
    window.__weakKnowledgeHierarchyInstalled = true;

    const XINGCE_MODULES = ["资料分析", "判断推理", "言语理解", "数量关系"];
    const BANK_TOPICS = ["企业文化", "公司战略", "新型电力系统", "品牌建设", "形势政策"];

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
        const task = getTask(question);
        return normalize(question.topic) || normalize(task && task.module) || normalize(task && task.name) || "未分类知识点";
    }

    function isActiveWeak(question) {
        const record = typeof answerHistory !== "undefined" ? answerHistory[question.id] : null;
        if (!record || Number(record.wrong || 0) <= 0) return false;
        const wrong = Number(record.wrong || 0);
        const correct = Number(record.correct || 0);
        const blur = Number(record.memoryBlurred || 0);
        const score = wrong * 2 + blur - correct + (record.lastCorrect === false ? 1 : 0);
        return score > 0;
    }

    function metaForPoint(point) {
        const candidates = questions.filter(question => isActiveWeak(question) && getKnowledgePoint(question) === point);
        const question = candidates[0];
        if (!question) return { major: "其他", subgroup: "其他" };

        const task = getTask(question);
        if (isBankQuestion(question)) {
            return {
                major: "国网必刷题",
                subgroup: normalize(question.topic) || "未分类"
            };
        }
        if (task && task.category === "行测") {
            return {
                major: "行测",
                subgroup: normalize(task.module) || "未分类"
            };
        }
        if (task && task.category === "计算机") {
            return {
                major: "计算机",
                subgroup: normalize(task.module) || "未分类"
            };
        }
        return {
            major: normalize(task && task.category) || "其他",
            subgroup: normalize(task && task.module) || "未分类"
        };
    }

    function computerModuleOrder() {
        const result = [];
        studyPlan.forEach(task => {
            if (task.category !== "计算机") return;
            const module = normalize(task.module) || "未分类";
            if (!result.includes(module)) result.push(module);
        });
        return result;
    }

    function subgroupOrder(major, presentNames) {
        if (major === "行测") return XINGCE_MODULES;
        if (major === "国网必刷题") {
            return [...BANK_TOPICS, ...presentNames.filter(name => !BANK_TOPICS.includes(name))];
        }
        if (major === "计算机") {
            const planned = computerModuleOrder();
            return [...planned, ...presentNames.filter(name => !planned.includes(name))];
        }
        return presentNames;
    }

    function makeMajorShell(name, count) {
        const details = document.createElement("details");
        details.className = `weak-major-group weak-major-${name === "行测" ? "xingce" : name === "计算机" ? "computer" : name === "国网必刷题" ? "bank" : "other"}`;
        details.open = count > 0;
        details.innerHTML = `
            <summary class="weak-major-summary">
                <div>
                    <strong>${escapeHTML(name)}</strong>
                    <small>${count} 个薄弱知识点</small>
                </div>
                <span class="weak-major-arrow">⌄</span>
            </summary>
            <div class="weak-major-body"></div>
        `;
        return details;
    }

    function makeSubgroup(name, items, showEmpty) {
        const block = document.createElement("section");
        block.className = `weak-subgroup ${items.length ? "has-items" : "is-empty"}`;
        block.innerHTML = `
            <div class="weak-subgroup-heading">
                <strong>${escapeHTML(name)}</strong>
                <span>${items.length} 个</span>
            </div>
            <div class="weak-subgroup-list"></div>
        `;
        const list = block.querySelector(".weak-subgroup-list");
        if (items.length) {
            items.forEach(item => list.appendChild(item));
        } else if (showEmpty) {
            list.innerHTML = `<div class="weak-subgroup-empty">暂无薄弱知识点</div>`;
        }
        return block;
    }

    function applyHierarchy() {
        const section = document.querySelector("#wrong-list .weak-knowledge-section");
        if (!section || section.dataset.hierarchical === "true") return;
        const list = section.querySelector(":scope > .weak-knowledge-list");
        if (!list) return;

        const items = [...list.children].filter(node => node.classList.contains("weak-knowledge-item"));
        if (!items.length) return;

        const grouped = new Map();
        items.forEach(item => {
            const point = normalize(item.querySelector(".weak-summary-main strong")?.textContent);
            const meta = metaForPoint(point);
            if (!grouped.has(meta.major)) grouped.set(meta.major, new Map());
            const subMap = grouped.get(meta.major);
            if (!subMap.has(meta.subgroup)) subMap.set(meta.subgroup, []);
            subMap.get(meta.subgroup).push(item);
        });

        list.innerHTML = "";
        list.classList.add("weak-hierarchy-list");

        const majorOrder = ["行测", "计算机", "国网必刷题", ...[...grouped.keys()].filter(key => !["行测", "计算机", "国网必刷题"].includes(key))];
        majorOrder.forEach(major => {
            const subMap = grouped.get(major) || new Map();
            const count = [...subMap.values()].reduce((sum, arr) => sum + arr.length, 0);
            if (!count && major !== "行测") return;

            const shell = makeMajorShell(major, count);
            const body = shell.querySelector(".weak-major-body");
            const presentNames = [...subMap.keys()];
            const order = subgroupOrder(major, presentNames);

            order.forEach(subgroup => {
                const subgroupItems = subMap.get(subgroup) || [];
                const showEmpty = major === "行测";
                if (!subgroupItems.length && !showEmpty) return;
                body.appendChild(makeSubgroup(subgroup, subgroupItems, showEmpty));
            });

            list.appendChild(shell);
        });

        section.dataset.hierarchical = "true";
    }

    function installStyles() {
        if (document.getElementById("weak-knowledge-hierarchy-style")) return;
        const style = document.createElement("style");
        style.id = "weak-knowledge-hierarchy-style";
        style.textContent = `
            .weak-hierarchy-list { gap: 14px !important; }
            .weak-major-group {
                border: 1px solid #d7e5e1;
                border-radius: 14px;
                overflow: hidden;
                background: #fff;
            }
            .weak-major-summary {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 12px;
                padding: 14px 16px;
                cursor: pointer;
                list-style: none;
                background: #f3f9f7;
                border-left: 4px solid #168373;
            }
            .weak-major-summary::-webkit-details-marker { display: none; }
            .weak-major-summary > div { display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap; }
            .weak-major-summary strong { color: #154f47; font-size: 16px; font-weight: 850; }
            .weak-major-summary small { color: #75837f; font-size: 11px; }
            .weak-major-arrow { color: #168373; font-size: 18px; transition: transform .18s ease; }
            .weak-major-group[open] .weak-major-arrow { transform: rotate(180deg); }
            .weak-major-body { display: grid; gap: 14px; padding: 14px 16px 16px; }
            .weak-subgroup { min-width: 0; }
            .weak-subgroup-heading {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 10px;
                margin: 0 0 7px;
                padding: 0 2px 6px;
                border-bottom: 1px solid #dfe9e6;
            }
            .weak-subgroup-heading strong { color: #2c4943; font-size: 13px; font-weight: 800; }
            .weak-subgroup-heading span { color: #8a9692; font-size: 10px; }
            .weak-subgroup-list { display: grid; gap: 7px; }
            .weak-subgroup-empty { padding: 7px 2px; color: #a1aaa7; font-size: 11px; }
            .weak-hierarchy-list .weak-knowledge-item { border-radius: 9px; }
            .weak-hierarchy-list .weak-knowledge-item summary { padding: 9px 11px; }
            .weak-hierarchy-list .weak-rank { display: none; }
            .weak-hierarchy-list .weak-summary-main { gap: 0; }
            .weak-hierarchy-list .weak-summary-main strong { font-size: 12px; }
            .weak-hierarchy-list .weak-summary-main small { font-size: 10px; }
            .weak-major-bank .weak-major-summary { background: #f5f9f6; }
            .weak-major-computer .weak-major-summary { background: #f5f8f8; }
            @media (max-width: 680px) {
                .weak-major-summary { padding: 12px 13px; }
                .weak-major-body { padding: 12px 13px 14px; }
                .weak-major-summary strong { font-size: 15px; }
            }
        `;
        document.head.appendChild(style);
    }

    installStyles();

    const baseRenderWrongList = window.renderWrongList;
    if (typeof baseRenderWrongList === "function") {
        window.renderWrongList = function (...args) {
            const result = baseRenderWrongList.apply(this, args);
            applyHierarchy();
            return result;
        };
    }

    applyHierarchy();
})();
