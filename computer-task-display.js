// 计算机学习计划展示优化：章节标题与小节目录分行显示。
(function () {
    if (window.__computerTaskDisplayInstalled) return;
    window.__computerTaskDisplayInstalled = true;

    function escapeHTML(value) {
        return String(value == null ? "" : value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function computerParts(task) {
        if (!task || task.category !== "计算机") return null;

        const module = String(task.module || "").trim();
        const name = String(task.name || "").trim();
        let subtitle = "";

        // 章节型任务：括号内是小节目录；后补充/复盘类也沿用相同的副标题逻辑。
        const first = name.indexOf("（");
        const last = name.lastIndexOf("）");
        if (first >= 0 && last > first) {
            subtitle = name.slice(first + 1, last)
                .replace(/；/g, " · ")
                .replace(/\s*\+\s*本章测验\s*$/g, " · 本章测验")
                .trim();
        }

        // 第一章的“已完成”不放进小节副标题里。
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

    function decorateTaskCards() {
        if (typeof getVisibleStudyTasks !== "function") return;
        const tasks = getVisibleStudyTasks();
        const cards = [...document.querySelectorAll("#task-list .task-card")];
        cards.forEach((card, index) => {
            const task = tasks[index];
            if (!task || task.category !== "计算机") return;
            const node = card.querySelector(".task-name");
            if (!node) return;
            node.classList.add("computer-task-name");
            node.innerHTML = titleHTML(task, Boolean(progress && progress[task.id]));
        });
    }

    function decorateWeekTasks() {
        if (typeof startOfDay !== "function" || typeof getMonday !== "function" || typeof addDays !== "function" || typeof taskOverlapsWeek !== "function") return;
        const today = startOfDay();
        const weekStart = getMonday(today);
        const weekEnd = addDays(weekStart, 6);
        const tasks = studyPlan.filter(task => taskOverlapsWeek(task, weekStart, weekEnd));
        const items = [...document.querySelectorAll("#week-task-list .week-task-item")];

        items.forEach((item, index) => {
            const task = tasks[index];
            if (!task || task.category !== "计算机") return;
            const spans = item.querySelectorAll(":scope > span");
            const textNode = spans[1];
            if (!textNode) return;
            const parts = computerParts(task);
            textNode.classList.add("computer-week-task-text");
            textNode.innerHTML = `
                <span class="computer-week-task-title">${progress && progress[task.id] ? "✓ " : ""}计算机 · ${escapeHTML(parts.title)}</span>
                ${parts.subtitle ? `<span class="computer-week-task-subtitle">${escapeHTML(parts.subtitle)}</span>` : ""}
            `;
        });
    }

    function decorateReviewCards() {
        const tasks = studyPlan.filter(task => Boolean(progress && progress[task.id]));
        const cards = [...document.querySelectorAll("#review-list .review-card")];
        cards.forEach((card, index) => {
            const task = tasks[index];
            if (!task || task.category !== "计算机") return;
            const strong = card.querySelector("strong");
            if (!strong) return;
            const parts = computerParts(task);
            strong.classList.add("computer-review-title");
            strong.textContent = parts.title;
            if (parts.subtitle && !card.querySelector(".computer-review-subtitle")) {
                const sub = document.createElement("small");
                sub.className = "computer-review-subtitle";
                sub.textContent = parts.subtitle;
                strong.insertAdjacentElement("afterend", sub);
            }
        });
    }

    function decorateAll() {
        decorateTaskCards();
        decorateWeekTasks();
        decorateReviewCards();
    }

    function wrapRender(name) {
        const base = window[name];
        if (typeof base !== "function" || base.__computerDisplayWrapped) return;
        const wrapped = function (...args) {
            const result = base.apply(this, args);
            decorateAll();
            return result;
        };
        wrapped.__computerDisplayWrapped = true;
        window[name] = wrapped;
    }

    function installStyles() {
        if (document.getElementById("computer-task-display-style")) return;
        const style = document.createElement("style");
        style.id = "computer-task-display-style";
        style.textContent = `
            .computer-task-name {
                display: block;
                min-width: 0;
            }
            .computer-task-title {
                display: block;
                color: #1d1d1f;
                font-size: 16px;
                font-weight: 650;
                line-height: 1.45;
            }
            .computer-task-subtitle {
                display: block;
                margin-top: 5px;
                max-width: 920px;
                color: #86868b;
                font-size: 11.5px;
                font-weight: 400;
                line-height: 1.65;
                white-space: normal;
                overflow-wrap: anywhere;
            }
            .computer-week-task-text {
                display: block;
                min-width: 0;
            }
            .computer-week-task-title {
                display: block;
                color: inherit;
                font-weight: 600;
                line-height: 1.45;
            }
            .computer-week-task-subtitle {
                display: block;
                margin-top: 2px;
                color: #929297;
                font-size: 10px;
                line-height: 1.5;
                text-decoration: none;
                white-space: normal;
                overflow-wrap: anywhere;
            }
            .week-task-item.done .computer-week-task-subtitle {
                color: #aaaab0;
            }
            .computer-review-title {
                margin-bottom: 3px !important;
            }
            .computer-review-subtitle {
                display: block;
                margin: 0 0 6px;
                color: #86868b;
                font-size: 11px;
                font-weight: 400;
                line-height: 1.55;
            }
            @media (max-width: 600px) {
                .computer-task-title { font-size: 15px; }
                .computer-task-subtitle { font-size: 11px; line-height: 1.6; }
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
