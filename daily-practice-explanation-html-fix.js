// 修复“国网每日预习/补预习”中详细解析 HTML 被 escapeHTML 当成普通文字显示的问题。
// daily-practice.js 会把 explanation 与 note 先转义为文本；本模块只恢复本站内部生成的解析 HTML，普通 note 仍保持纯文本。
(function () {
    const VERSION = 2;
    if (Number(window.__dailyPracticeExplanationHTMLFixVersion || 0) >= VERSION) return;
    window.__dailyPracticeExplanationHTMLFixVersion = VERSION;

    const TRUSTED_ROOT_CLASSES = [
        "bank-plan-timeline-explanation",
        "bank-fixed-list-explanation"
    ];

    const ALLOWED_TAGS = new Set([
        "STRONG", "B", "EM", "BR", "P", "DIV", "SPAN", "SMALL", "UL", "OL", "LI", "CODE"
    ]);

    function isTrustedJudgeExplanation(value) {
        const text = String(value || "").trim();
        if (!/^<strong>判断：(正确|错误)。?<\/strong>/u.test(text)) return false;
        return (
            text.includes("<strong>正确说法：</strong>") ||
            text.includes("<strong>为什么错误：</strong>") ||
            text.includes("<strong>为什么正确：</strong>")
        ) && text.includes("<strong>本题记忆：</strong>");
    }

    function isTrustedStructuredExplanation(value) {
        const text = String(value || "").trim();
        return TRUSTED_ROOT_CLASSES.some(className =>
            text.startsWith(`<div class="${className}"`) ||
            text.startsWith(`<div class='${className}'`)
        );
    }

    function looksLikeTrustedExplanationHTML(value) {
        return isTrustedJudgeExplanation(value) || isTrustedStructuredExplanation(value);
    }

    // 即使内容来自本站题库，也只保留解析需要的少量标签与 class，移除事件属性/脚本等。
    function buildSafeFragment(raw) {
        const template = document.createElement("template");
        template.innerHTML = String(raw || "").trim();

        template.content.querySelectorAll("*").forEach(node => {
            if (!ALLOWED_TAGS.has(node.tagName)) {
                node.replaceWith(document.createTextNode(node.textContent || ""));
                return;
            }
            [...node.attributes].forEach(attr => {
                if (attr.name !== "class") node.removeAttribute(attr.name);
            });
        });
        return template.content;
    }

    function restoreOne(note) {
        if (!note || note.dataset.explanationHtmlRestored === "true") return;
        const raw = note.textContent || "";
        if (!looksLikeTrustedExplanationHTML(raw)) return;

        const fragment = buildSafeFragment(raw);
        if (!fragment.childNodes.length) return;

        const wrapper = document.createElement("div");
        wrapper.className = "daily-memory-source-note-html";
        wrapper.dataset.explanationHtmlRestored = "true";
        wrapper.appendChild(fragment.cloneNode(true));
        note.replaceWith(wrapper);
    }

    function restoreExplanationHTML(root = document) {
        if (!root) return;
        if (root.matches?.(".daily-memory-source-note p")) restoreOne(root);
        const notes = root.querySelectorAll
            ? root.querySelectorAll(".daily-memory-source-note p")
            : [];
        notes.forEach(restoreOne);
    }

    function installObserver() {
        restoreExplanationHTML(document);

        const observer = new MutationObserver(mutations => {
            for (const mutation of mutations) {
                mutation.addedNodes.forEach(node => {
                    if (!(node instanceof Element)) return;
                    restoreExplanationHTML(node);
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
