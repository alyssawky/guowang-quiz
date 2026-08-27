// 错题知识点复习区：所有层级默认闭合，用户点击后再展开。
(function () {
    if (window.__weakKnowledgeCollapseDefaultsInstalled) return;
    window.__weakKnowledgeCollapseDefaultsInstalled = true;

    function convertSubgroupsToDetails() {
        const section = document.querySelector("#wrong-list .weak-knowledge-section");
        if (!section) return;

        // 一级大板块默认闭合。
        section.querySelectorAll("details.weak-major-group").forEach(details => {
            details.open = false;
        });

        // 二级板块（资料分析/判断推理/硬件基础/企业文化等）也改为可折叠并默认闭合。
        section.querySelectorAll("section.weak-subgroup").forEach(block => {
            const heading = block.querySelector(":scope > .weak-subgroup-heading");
            const list = block.querySelector(":scope > .weak-subgroup-list");
            if (!heading || !list) return;

            const name = heading.querySelector("strong")?.textContent || "";
            const count = heading.querySelector("span")?.textContent || "";

            const details = document.createElement("details");
            details.className = `${block.className} weak-subgroup-details`;
            details.open = false;

            const summary = document.createElement("summary");
            summary.className = "weak-subgroup-heading weak-subgroup-summary";

            const title = document.createElement("strong");
            title.textContent = name;

            const meta = document.createElement("span");
            meta.className = "weak-subgroup-meta";

            const countNode = document.createElement("span");
            countNode.className = "weak-subgroup-count";
            countNode.textContent = count;

            const arrow = document.createElement("span");
            arrow.className = "weak-subgroup-arrow";
            arrow.textContent = "⌄";

            meta.appendChild(countNode);
            meta.appendChild(arrow);
            summary.appendChild(title);
            summary.appendChild(meta);

            details.appendChild(summary);
            details.appendChild(list);
            block.replaceWith(details);
        });

        // 三级具体知识点也不允许继承原来的“第一项默认 open”。
        section.querySelectorAll("details.weak-knowledge-item").forEach(details => {
            details.open = false;
        });
    }

    function installStyles() {
        if (document.getElementById("weak-knowledge-collapse-defaults-style")) return;
        const style = document.createElement("style");
        style.id = "weak-knowledge-collapse-defaults-style";
        style.textContent = `
            .weak-subgroup-details {
                min-width: 0;
                border: 1px solid #e2ebe8;
                border-radius: 10px;
                overflow: hidden;
                background: #fff;
            }
            .weak-subgroup-summary {
                margin: 0 !important;
                padding: 9px 11px !important;
                border-bottom: 0 !important;
                cursor: pointer;
                list-style: none;
                background: #fbfdfc;
            }
            .weak-subgroup-summary::-webkit-details-marker { display: none; }
            .weak-subgroup-meta {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                color: #8a9692;
                font-size: 10px;
            }
            .weak-subgroup-arrow {
                display: inline-block;
                color: #4f7d74;
                font-size: 14px;
                transition: transform .18s ease;
            }
            .weak-subgroup-details[open] > .weak-subgroup-summary {
                border-bottom: 1px solid #e2ebe8 !important;
            }
            .weak-subgroup-details[open] > .weak-subgroup-summary .weak-subgroup-arrow {
                transform: rotate(180deg);
            }
            .weak-subgroup-details > .weak-subgroup-list {
                padding: 8px 10px 10px;
            }
            .weak-major-group:not([open]) > .weak-major-body,
            .weak-subgroup-details:not([open]) > .weak-subgroup-list,
            .weak-knowledge-item:not([open]) > .weak-knowledge-body {
                display: none;
            }
        `;
        document.head.appendChild(style);
    }

    function forceFreshJudgeExplanations() {
        // 本文件由 question-bank-integrity.js 带 reload=Date.now() 动态加载，因此这里可作为可靠的运行时兜底。
        const old = document.querySelector("script[data-stategrid-judge-runtime-refresh]");
        if (old) old.remove();

        const script = document.createElement("script");
        script.dataset.stategridJudgeRuntimeRefresh = "true";
        script.src = `stategrid-judge-explanations.js?v=20260827-2&ts=${Date.now()}`;
        script.onload = () => {
            if (typeof window.applyStateGridJudgeExplanations === "function") {
                const report = window.applyStateGridJudgeExplanations();
                if (report?.missingFalseIds?.length) {
                    console.error("国网错误判断题仍有未补正确表述", report.missingFalseIds);
                }
            }
        };
        script.onerror = () => console.error("国网判断题解析强制刷新失败");
        document.body.appendChild(script);
    }

    installStyles();

    const baseRenderWrongList = window.renderWrongList;
    if (typeof baseRenderWrongList === "function") {
        window.renderWrongList = function (...args) {
            const result = baseRenderWrongList.apply(this, args);
            convertSubgroupsToDetails();
            return result;
        };
    }

    convertSubgroupsToDetails();
    forceFreshJudgeExplanations();
})();
