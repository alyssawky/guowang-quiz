// 明日预习卡：只在用户点击“显示答案”后注入知识解析。
// 不使用 MutationObserver，避免全页面 DOM 监听导致卡顿/白屏。
(function () {
    if (window.__previewKnowledgeClickInstalled) return;
    window.__previewKnowledgeClickInstalled = true;

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

    function activeQuestion(panel) {
        if (!panel) return null;
        const sourceId = [...panel.querySelectorAll(".daily-memory-meta span")]
            .map(span => normalize(span.textContent))
            .find(text => /^2026-Q\d+$/i.test(text));
        if (sourceId) return questions.find(question => question.sourceId === sourceId) || null;

        const stem = normalize(panel.querySelector(".daily-memory-card-inner h3")?.textContent);
        return stem ? questions.find(question => normalize(question.question) === stem) || null : null;
    }

    function renderKnowledge() {
        const panel = document.getElementById("daily-memory-panel");
        if (!panel || panel.hidden) return;
        const answerBox = panel.querySelector(".daily-memory-answer:not(.daily-memory-answer-hidden)");
        if (!answerBox) return;

        const question = activeQuestion(panel);
        if (!question || typeof window.getBankMemoryKnowledge !== "function") return;
        const info = window.getBankMemoryKnowledge(question);
        if (!info) return;

        const signature = String(question.id || question.sourceId || "");
        const old = panel.querySelector(".bank-memory-knowledge");
        if (old && old.dataset.knowledgeFor === signature) return;
        if (old) old.remove();

        panel.querySelectorAll(".daily-memory-source-note p").forEach(p => {
            const text = normalize(p.textContent);
            if (text.includes("旧版题库") || text.includes("新版发布后") || text.includes("按2026题库标准答案判定")) {
                p.closest(".daily-memory-source-note")?.remove();
            }
        });

        const block = document.createElement("section");
        block.className = "bank-memory-knowledge";
        block.dataset.knowledgeFor = signature;
        block.innerHTML = `
            <div class="bank-memory-knowledge-section">
                <div class="bank-memory-knowledge-label">知识点解析</div>
                <p>${escapeHTML(info.explanation || "")}</p>
            </div>
            ${info.distinction ? `<div class="bank-memory-knowledge-section bank-memory-distinction"><div class="bank-memory-knowledge-label">易混辨析</div><p>${escapeHTML(info.distinction)}</p></div>` : ""}
            ${info.hook ? `<div class="bank-memory-hook"><span>记忆钩子</span><strong>${escapeHTML(info.hook)}</strong></div>` : ""}
            ${info.source ? `<div class="bank-memory-source">${escapeHTML(info.source)}</div>` : ""}
        `;
        answerBox.insertAdjacentElement("afterend", block);
    }

    if (!document.getElementById("bank-memory-knowledge-style")) {
        const style = document.createElement("style");
        style.id = "bank-memory-knowledge-style";
        style.textContent = `
            .bank-memory-knowledge{margin-top:14px;border:1px solid #d9e9e5;border-radius:14px;overflow:hidden;background:#fbfefd}
            .bank-memory-knowledge-section{padding:14px 16px}.bank-memory-knowledge-section+.bank-memory-knowledge-section{border-top:1px solid #e7efed}
            .bank-memory-knowledge-label{margin-bottom:6px;color:#006f60;font-size:12px;font-weight:850;letter-spacing:.04em}
            .bank-memory-knowledge p{margin:0;color:#334440;font-size:14px;line-height:1.8;white-space:pre-line}.bank-memory-distinction{background:#f8fbfa}
            .bank-memory-hook{display:grid;grid-template-columns:auto minmax(0,1fr);gap:10px;padding:13px 16px;border-top:1px solid #e7efed;background:#eef8f5}
            .bank-memory-hook span{padding:3px 7px;border-radius:999px;background:#d7eee8;color:#007463;font-size:11px;font-weight:850;white-space:nowrap}
            .bank-memory-hook strong{color:#145247;font-size:13px;line-height:1.7}.bank-memory-source{padding:9px 16px 11px;border-top:1px solid #e7efed;color:#82908d;font-size:11px;line-height:1.5}
        `;
        document.head.appendChild(style);
    }

    document.addEventListener("click", event => {
        if (!event.target?.closest?.("#memory-reveal")) return;
        // 先让 daily-practice.js 完成自己的答案展开，再注入知识块。
        setTimeout(renderKnowledge, 0);
    }, false);

    window.renderPreviewKnowledge = renderKnowledge;
})();
