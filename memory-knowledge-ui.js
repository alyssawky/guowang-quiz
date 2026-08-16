// 给“明日预习”和“累计记忆曲线”卡片稳定注入知识点解析。
// 不改正式答题逻辑，不写入 answerHistory。
(function () {
    const UI_VERSION = 2;
    if (Number(window.__memoryKnowledgeUIVersion || 0) >= UI_VERSION) return;
    window.__memoryKnowledgeUIVersion = UI_VERSION;
    window.__memoryKnowledgeUIInstalled = true;

    function escapeHTML(value) {
        return String(value == null ? "" : value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/\"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function normalize(value) {
        return String(value == null ? "" : value).replace(/\s+/g, " ").trim();
    }

    function findActiveQuestion(panel) {
        if (!panel || !Array.isArray(window.questions || questions)) return null;

        const spans = [...panel.querySelectorAll(".daily-memory-meta span")];
        const sourceId = spans
            .map(span => normalize(span.textContent))
            .find(text => /^2026-Q\d+$/i.test(text));

        if (sourceId) {
            const bySource = questions.find(question => question.sourceId === sourceId);
            if (bySource) return bySource;
        }

        const title = panel.querySelector(".daily-memory-card-inner h3");
        const stem = normalize(title && title.textContent);
        if (!stem) return null;
        return questions.find(question => normalize(question.question) === stem) || null;
    }

    function removeUselessLegacyNote(panel) {
        panel.querySelectorAll(".daily-memory-source-note p").forEach(p => {
            const text = normalize(p.textContent);
            if (
                text.includes("旧版题库") ||
                text.includes("新版发布后") ||
                text.includes("按2026题库标准答案判定")
            ) {
                const wrap = p.closest(".daily-memory-source-note");
                p.remove();
                if (wrap && !wrap.querySelector("p")) wrap.remove();
            }
        });
    }

    function buildKnowledgeHTML(info) {
        return `
            <div class="bank-memory-knowledge-section">
                <div class="bank-memory-knowledge-label">知识点解析</div>
                <p>${escapeHTML(info.explanation || "")}</p>
            </div>
            ${info.distinction ? `
                <div class="bank-memory-knowledge-section bank-memory-distinction">
                    <div class="bank-memory-knowledge-label">易混辨析</div>
                    <p>${escapeHTML(info.distinction)}</p>
                </div>
            ` : ""}
            ${info.hook ? `
                <div class="bank-memory-hook">
                    <span>记忆钩子</span>
                    <strong>${escapeHTML(info.hook)}</strong>
                </div>
            ` : ""}
            ${info.source ? `<div class="bank-memory-source">${escapeHTML(info.source)}</div>` : ""}
        `;
    }

    function renderKnowledge(panel) {
        if (!panel || panel.hidden) return;
        removeUselessLegacyNote(panel);

        const answerBox = panel.querySelector(".daily-memory-answer:not(.daily-memory-answer-hidden)");
        const old = panel.querySelector(".bank-memory-knowledge");

        // 切回未显示答案状态时，只清掉上一题的知识块，不做其他 DOM 重绘。
        if (!answerBox) {
            if (old) old.remove();
            return;
        }

        const question = findActiveQuestion(panel);
        if (!question || typeof window.getBankMemoryKnowledge !== "function") return;
        const info = window.getBankMemoryKnowledge(question);
        if (!info) return;

        const signature = String(question.id || question.sourceId || normalize(question.question));

        // 已经是当前题的解析时不再删除/重建，避免 MutationObserver 自己触发自己。
        if (old && old.dataset.knowledgeFor === signature) return;
        if (old) old.remove();

        const block = document.createElement("section");
        block.className = "bank-memory-knowledge";
        block.dataset.knowledgeFor = signature;
        block.innerHTML = buildKnowledgeHTML(info);
        answerBox.insertAdjacentElement("afterend", block);
    }

    if (!document.getElementById("bank-memory-knowledge-style")) {
        const style = document.createElement("style");
        style.id = "bank-memory-knowledge-style";
        style.textContent = `
            .bank-memory-knowledge {
                margin-top: 14px;
                border: 1px solid #d9e9e5;
                border-radius: 14px;
                overflow: hidden;
                background: #fbfefd;
            }
            .bank-memory-knowledge-section { padding: 14px 16px; }
            .bank-memory-knowledge-section + .bank-memory-knowledge-section { border-top: 1px solid #e7efed; }
            .bank-memory-knowledge-label {
                margin-bottom: 6px;
                color: #006f60;
                font-size: 12px;
                font-weight: 850;
                letter-spacing: .04em;
            }
            .bank-memory-knowledge p {
                margin: 0;
                color: #334440;
                font-size: 14px;
                line-height: 1.8;
                white-space: pre-line;
            }
            .bank-memory-distinction { background: #f8fbfa; }
            .bank-memory-hook {
                display: grid;
                grid-template-columns: auto minmax(0, 1fr);
                align-items: start;
                gap: 10px;
                padding: 13px 16px;
                border-top: 1px solid #e7efed;
                background: #eef8f5;
            }
            .bank-memory-hook span {
                padding: 3px 7px;
                border-radius: 999px;
                background: #d7eee8;
                color: #007463;
                font-size: 11px;
                font-weight: 850;
                white-space: nowrap;
            }
            .bank-memory-hook strong {
                color: #145247;
                font-size: 13px;
                line-height: 1.7;
            }
            .bank-memory-source {
                padding: 9px 16px 11px;
                border-top: 1px solid #e7efed;
                color: #82908d;
                font-size: 11px;
                line-height: 1.5;
            }
            @media (max-width: 640px) {
                .bank-memory-hook { grid-template-columns: 1fr; gap: 6px; }
                .bank-memory-hook span { width: fit-content; }
            }
        `;
        document.head.appendChild(style);
    }

    let scheduled = false;
    const observer = new MutationObserver(() => {
        if (scheduled) return;
        scheduled = true;
        requestAnimationFrame(() => {
            scheduled = false;
            const panel = document.getElementById("daily-memory-panel");
            if (panel) renderKnowledge(panel);
        });
    });

    observer.observe(document.body, { childList: true, subtree: true });

    window.refreshBankMemoryKnowledge = function () {
        const panel = document.getElementById("daily-memory-panel");
        if (panel) renderKnowledge(panel);
    };

    const panel = document.getElementById("daily-memory-panel");
    if (panel) renderKnowledge(panel);
})();
