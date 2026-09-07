// 计算机学习计划展示优化：章节标题与小节目录分行显示。
// v2：不再按 DOM 数组下标猜任务；学习卡/本周任务/复习卡都按 taskId 或原始任务名精确匹配。
(function () {
    const VERSION = 2;
    if (Number(window.__computerTaskDisplayVersion || 0) >= VERSION) return;
    window.__computerTaskDisplayVersion = VERSION;
    window.__computerTaskDisplayInstalled = true;

    function escapeHTML(value) {
        return String(value == null ? "" : value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function getComputerTasks() {
        return (typeof studyPlan !== "undefined" && Array.isArray(studyPlan))
            ? studyPlan.filter(task => task.category === "计算机")
            : [];
    }

    function computerParts(task) {
        if (!task || task.category !== "计算机") return null;

        const module = String(task.module || "").trim();
        const name = String(task.name || "").trim();
        let subtitle = "";

        const first = name.indexOf("（");
        const last = name.lastIndexOf("）");
        if (first >= 0 && last > first) {
            subtitle = name.slice(first + 1, last)
                .replace(/；/g, " · ")
                .replace(/\s*\+\s*本章测验\s*$/g, " · 本章测验")
                .trim();
        }

        const completedSuffix = /｜已完成/.test(name);
        return {
            title: module || name.replace(/（.*$/, "").replace(/｜已完成/g, "").trim(),
            subtitle,
            completedSuffix
        };
    }

    function titleHTML(task, completed) {
        const parts = computerParts(task);
        if (!parts) return null;
        const check = completed ? "✓ " : "";
        return `
            <span class="computer-task-title">${check}${escapeHTML(parts.title)}</span>
            ${parts.subtitle ? `<span class="computer-task-subtitle">${escapeHTML(parts.subtitle)}</span>` : ""}
        `;
    }

    function taskById(taskId) {
        if (!taskId || typeof studyPlan === "undefined") return null;
        return studyPlan.find(task => task.id === taskId) || null;
    }

    function taskIdFromToggleCard(card) {
        const button = card?.querySelector('button[onclick*="toggleTask"]');
        const raw = button?.getAttribute("onclick") || "";
        const match = raw.match(/toggleTask\(['\"]([^'\"]+)['\"]\)/);
        return match ? match[1] : "";
    }

    function taskFromRenderedText(text) {
        const raw = String(text || "").replace(/^\s*✓\s*/, "").trim();
        if (!raw) return null;
        const tasks = getComputerTasks();

        // 本周任务原始文本通常是“计算机 · task.name”。先精确匹配，再做包含匹配。
        let task = tasks.find(item => raw === item.name || raw === `计算机 · ${item.name}`);
        if (task) return task;
        task = tasks.find(item => raw.endsWith(`· ${item.name}`) || raw.includes(item.name));
        return task || null;
    }

    function decorateTaskCards() {
        const cards = [...document.querySelectorAll("#task-list .task-card")];
        cards.forEach(card => {
            const taskId = taskIdFromToggleCard(card) || card.dataset.taskId || "";
            const task = taskById(taskId);
            if (!task || task.category !== "计算机") return;
            card.dataset.taskId = task.id;
            const node = card.querySelector(".task-name");
            if (!node) return;
            node.classList.add("computer-task-name");
            node.innerHTML = titleHTML(task, Boolean(progress && progress[task.id]));
        });
    }

    function decorateWeekTasks() {
        const items = [...document.querySelectorAll("#week-task-list .week-task-item")];
        items.forEach(item => {
            const spans = item.querySelectorAll(":scope > span");
            const textNode = spans[1];
            if (!textNode) return;

            // 每次 renderCalendar 都会重建原始文本，因此直接从该行自己的文本反查 task，绝不使用 index。
            const task = taskById(item.dataset.taskId) || taskFromRenderedText(textNode.textContent);
            if (!task || task.category !== "计算机") return;
            item.dataset.taskId = task.id;

            const parts = computerParts(task);
            textNode.classList.add("computer-week-task-text");
            textNode.innerHTML = `
                <span class="computer-week-task-title">${progress && progress[task.id] ? "✓ " : ""}计算机 · ${escapeHTML(parts.title)}</span>
                ${parts.subtitle ? `<span class="computer-week-task-subtitle">${escapeHTML(parts.subtitle)}</span>` : ""}
            `;
        });
    }

    function decorateReviewCards() {
        const cards = [...document.querySelectorAll("#review-list .review-card")];
        cards.forEach(card => {
            const strong = card.querySelector("strong");
            if (!strong) return;
            const task = taskById(card.dataset.taskId) || taskFromRenderedText(strong.textContent);
            if (!task || task.category !== "计算机") return;
            card.dataset.taskId = task.id;
            const parts = computerParts(task);
            strong.classList.add("computer-review-title");
            strong.textContent = parts.title;
            const oldSub = card.querySelector(".computer-review-subtitle");
            if (oldSub) oldSub.remove();
            if (parts.subtitle) {
                const sub = document.createElement("small");
                sub.className = "computer-review-subtitle";
                sub.textContent = parts.subtitle;
                strong.insertAdjacentElement("afterend", sub);
            }
        });
    }

    function decorateAll() {
        if (typeof window.applyComputerChapterLabels === "function") window.applyComputerChapterLabels();
        decorateTaskCards();
        decorateWeekTasks();
        decorateReviewCards();
    }

    function wrapRender(name) {
        const base = window[name];
        if (typeof base !== "function" || base.__computerDisplayWrappedV2) return;
        const wrapped = function (...args) {
            if (typeof window.applyComputerChapterLabels === "function") window.applyComputerChapterLabels();
            const result = base.apply(this, args);
            decorateAll();
            return result;
        };
        wrapped.__computerDisplayWrappedV2 = true;
        window[name] = wrapped;
    }

    function installStyles() {
        if (document.getElementById("computer-task-display-style")) return;
        const style = document.createElement("style");
        style.id = "computer-task-display-style";
        style.textContent = `
            .computer-task-name { display:block; min-width:0; }
            .computer-task-title { display:block; color:#1d1d1f; font-size:16px; font-weight:650; line-height:1.45; }
            .computer-task-subtitle { display:block; margin-top:5px; max-width:920px; color:#86868b; font-size:11.5px; font-weight:400; line-height:1.65; white-space:normal; overflow-wrap:anywhere; }
            .computer-week-task-text { display:block; min-width:0; }
            .computer-week-task-title { display:block; color:inherit; font-weight:600; line-height:1.45; }
            .computer-week-task-subtitle { display:block; margin-top:2px; color:#929297; font-size:10px; line-height:1.5; text-decoration:none; white-space:normal; overflow-wrap:anywhere; }
            .week-task-item.done .computer-week-task-subtitle { color:#aaaab0; }
            .computer-review-title { margin-bottom:3px !important; }
            .computer-review-subtitle { display:block; margin:0 0 6px; color:#86868b; font-size:11px; font-weight:400; line-height:1.55; }
            @media (max-width:600px) {
                .computer-task-title { font-size:15px; }
                .computer-task-subtitle { font-size:11px; line-height:1.6; }
            }
        `;
        document.head.appendChild(style);
    }

    installStyles();
    wrapRender("renderTasks");
    wrapRender("renderCalendar");
    wrapRender("renderReviewPool");
    decorateAll();
})();
