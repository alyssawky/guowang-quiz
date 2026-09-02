// 修复“国网每日预习/必刷题”中详细解析 HTML 被 escapeHTML 当成普通文字显示的问题。
// 只对本站内部生成、且带已知解析容器 class 的 HTML 生效；普通 note 仍保持文本转义。
(function () {
    if (window.__dailyPracticeExplanationHTMLFixInstalled) return;
    window.__dailyPracticeExplanationHTMLFixInstalled = true;

    const TRUSTED_ROOT_CLASSES = [
        "bank-plan-timeline-explanation",
        "bank-fixed-list-explanation"
    ];

    function looksLikeTrustedExplanationHTML(text) {
        const value = String(text || "").trim();
        return TRUSTED_ROOT_CLASSES.some(className =>
            value.startsWith(`<div class="${className}"`) ||
            value.startsWith(`<div class='${className}'`)
        );
    }

    function restoreExplanationHTML(root = document) {
        const notes = root.querySelectorAll
            ? root.querySelectorAll(".daily-memory-source-note p")
            : [];

        notes.forEach(note => {
            if (note.dataset.explanationHtmlRestored === "true") return;

            const raw = note.textContent || "";
            if (!looksLikeTrustedExplanationHTML(raw)) return;

            const template = document.createElement("template");
            template.innerHTML = raw.trim();
            const first = template.content.firstElementChild;
            if (!first || !TRUSTED_ROOT_CLASSES.some(className => first.classList.contains(className))) return;

            const wrapper = document.createElement("div");
            wrapper.className = "daily-memory-source-note-html";
            wrapper.dataset.explanationHtmlRestored = "true";
            wrapper.appendChild(template.content.cloneNode(true));
            note.replaceWith(wrapper);
        });
    }

    function installObserver() {
        restoreExplanationHTML(document);

        const observer = new MutationObserver(mutations => {
            for (const mutation of mutations) {
                mutation.addedNodes.forEach(node => {
                    if (!(node instanceof Element)) return;
                    if (node.matches?.(".daily-memory-source-note, .daily-memory-source-note p")) {
                        restoreExplanationHTML(node.parentElement || node);
                    } else if (node.querySelector?.(".daily-memory-source-note p")) {
                        restoreExplanationHTML(node);
                    }
                });
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });
        window.__dailyPracticeExplanationHTMLObserver = observer;
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", installObserver, { once: true });
    } else {
        installObserver();
    }
})();
