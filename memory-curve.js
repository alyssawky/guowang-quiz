// 国网累计记忆卡：按间隔复习曲线进行“到期优先 + 加权随机”抽卡。
// 明日预习保持原逻辑；本模块只接管累计旧题的抽卡。
(function () {
    const STORE_KEY = "guowang-memory-curve-v1";
    const INTERVALS = [1, 2, 4, 7, 15, 30];
    const SESSION_LIMIT = 12;

    let sessionIds = [];
    let sessionIndex = 0;
    let answerShown = false;
    let reviewedThisSession = new Set();

    function safeParse(value, fallback) {
        try {
            return value ? JSON.parse(value) : fallback;
        } catch (error) {
            return fallback;
        }
    }

    function loadStore() {
        return safeParse(localStorage.getItem(STORE_KEY), {});
    }

    function saveStore(store) {
        localStorage.setItem(STORE_KEY, JSON.stringify(store || {}));
    }

    function toLocalISO(value = new Date()) {
        const date = value instanceof Date ? value : new Date(value);
        if (Number.isNaN(date.getTime())) return "";
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, "0");
        const d = String(date.getDate()).padStart(2, "0");
        return `${y}-${m}-${d}`;
    }

    function parseDate(dateString) {
        if (typeof parseLocalDate === "function") return parseLocalDate(dateString);
        return new Date(`${dateString}T00:00:00`);
    }

    function addDays(dateString, days) {
        const date = parseDate(dateString);
        if (!date || Number.isNaN(date.getTime())) return dateString;
        date.setDate(date.getDate() + days);
        return toLocalISO(date);
    }

    function dayDiff(fromString, toString) {
        const from = parseDate(fromString);
        const to = parseDate(toString);
        if (!from || !to || Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return 0;
        return Math.round((to.getTime() - from.getTime()) / 86400000);
    }

    function escapeHTML(value) {
        return String(value == null ? "" : value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function isBankQuestion(question) {
        return Boolean(
            question &&
            question.unlockDate &&
            (question.sourceSet === "10月前必学300题" || String(question.taskId || "").startsWith("preoct300-w"))
        );
    }

    function hasBeenFormallyLearned(question) {
        const record = answerHistory && answerHistory[question.id];
        return Boolean(record && Number(record.attempts || 0) > 0);
    }

    function getLearnedPool() {
        const today = toLocalISO();
        return questions.filter(question =>
            isBankQuestion(question) &&
            question.unlockDate < today &&
            hasBeenFormallyLearned(question)
        );
    }

    function getQuestion(id) {
        return questions.find(question => question.id === id);
    }

    function getDerivedSchedule(question) {
        const store = loadStore();
        if (store[question.id]) return store[question.id];

        const record = answerHistory && answerHistory[question.id];
        const baseDate = record && record.lastAnsweredAt
            ? toLocalISO(record.lastAnsweredAt)
            : question.unlockDate;

        return {
            level: 0,
            dueDate: addDays(baseDate, INTERVALS[0]),
            lastReviewedDate: baseDate,
            reviewCount: 0,
            source: "derived"
        };
    }

    function writeSchedule(questionId, entry) {
        const store = loadStore();
        store[questionId] = entry;
        saveStore(store);
    }

    function advanceSchedule(questionId, isCorrect = true, source = "memory") {
        const question = getQuestion(questionId);
        if (!question || !isBankQuestion(question)) return;

        const today = toLocalISO();
        const current = getDerivedSchedule(question);
        let level;

        if (!isCorrect) {
            level = 0;
        } else if (current.source === "derived" && Number(current.reviewCount || 0) === 0) {
            level = source === "formal" ? 0 : 1;
        } else {
            level = Math.min(Number(current.level || 0) + 1, INTERVALS.length - 1);
        }

        writeSchedule(questionId, {
            level,
            dueDate: addDays(today, INTERVALS[level]),
            lastReviewedDate: today,
            reviewCount: Number(current.reviewCount || 0) + 1,
            source
        });
    }

    function getScheduleInfo(question) {
        const schedule = getDerivedSchedule(question);
        const today = toLocalISO();
        const daysUntil = dayDiff(today, schedule.dueDate);
        return { schedule, daysUntil };
    }

    function getWeight(question) {
        const { schedule, daysUntil } = getScheduleInfo(question);
        const level = Number(schedule.level || 0);
        const earlyStageBoost = 1 + (INTERVALS.length - 1 - level) * 0.12;

        let urgency;
        if (daysUntil < 0) urgency = 12 + Math.min(18, Math.abs(daysUntil) * 2);
        else if (daysUntil === 0) urgency = 10;
        else if (daysUntil === 1) urgency = 3.5;
        else if (daysUntil <= 3) urgency = 1.8;
        else if (daysUntil <= 7) urgency = 0.8;
        else urgency = 0.28;

        return urgency * earlyStageBoost;
    }

    function weightedSample(list, count) {
        const pool = list.slice();
        const picked = [];

        while (pool.length && picked.length < count) {
            const weights = pool.map(getWeight);
            const total = weights.reduce((sum, value) => sum + value, 0);
            let cursor = Math.random() * total;
            let index = 0;

            for (; index < pool.length; index++) {
                cursor -= weights[index];
                if (cursor <= 0) break;
            }

            const safeIndex = Math.min(index, pool.length - 1);
            picked.push(pool.splice(safeIndex, 1)[0]);
        }

        return picked;
    }

    function buildCurveSession() {
        const pool = getLearnedPool();
        if (!pool.length) return [];

        const due = pool.filter(question => getScheduleInfo(question).daysUntil <= 0);
        const future = pool.filter(question => getScheduleInfo(question).daysUntil > 0);
        const target = Math.min(SESSION_LIMIT, pool.length);

        if (due.length >= target) {
            return weightedSample(due, target);
        }

        const selected = weightedSample(due, due.length);
        const supplement = weightedSample(future, target - selected.length);
        return [...selected, ...supplement];
    }

    function getPoolSummary() {
        const pool = getLearnedPool();
        const due = pool.filter(question => getScheduleInfo(question).daysUntil <= 0);
        const overdue = due.filter(question => getScheduleInfo(question).daysUntil < 0);
        return { total: pool.length, due: due.length, overdue: overdue.length };
    }

    function getMemoryPanel() {
        let panel = document.getElementById("daily-memory-panel");
        if (panel) return panel;

        const card = document.getElementById("daily-practice-card");
        if (!card || !card.parentNode) return null;

        panel = document.createElement("section");
        panel.id = "daily-memory-panel";
        panel.className = "daily-memory-panel";
        panel.hidden = true;
        card.parentNode.insertBefore(panel, card.nextSibling);
        return panel;
    }

    function answerText(question) {
        return String(question.answer || "")
            .split("")
            .filter(Boolean)
            .map(key => question.options && question.options[key]
                ? `${key}. ${question.options[key]}`
                : key)
            .join("；");
    }

    function scheduleLabel(question) {
        const { schedule, daysUntil } = getScheduleInfo(question);
        if (daysUntil < 0) return `已逾期 ${Math.abs(daysUntil)} 天 · 当前间隔 ${INTERVALS[Number(schedule.level || 0)]} 天`;
        if (daysUntil === 0) return `今天到期 · 当前间隔 ${INTERVALS[Number(schedule.level || 0)]} 天`;
        return `提前巩固 · 距下次复习 ${daysUntil} 天`;
    }

    function renderOptions(question) {
        return `<div class="daily-memory-options">${Object.entries(question.options || {}).map(([key, value]) => `
            <div class="daily-memory-option">
                <span>${escapeHTML(key)}</span>
                <p>${escapeHTML(value)}</p>
            </div>
        `).join("")}</div>`;
    }

    function closeCurvePanel() {
        const panel = document.getElementById("daily-memory-panel");
        if (panel) {
            panel.hidden = true;
            panel.innerHTML = "";
        }
        sessionIds = [];
        sessionIndex = 0;
        answerShown = false;
        reviewedThisSession = new Set();
    }

    function renderCurveCard() {
        const panel = getMemoryPanel();
        if (!panel || !sessionIds.length) return;

        const question = getQuestion(sessionIds[sessionIndex]);
        if (!question) return;

        const summary = getPoolSummary();
        const answerHTML = answerShown
            ? `<div class="daily-memory-answer">
                <div class="daily-memory-answer-label">标准答案</div>
                <strong>${escapeHTML(answerText(question) || question.answer || "")}</strong>
            </div>`
            : `<div class="daily-memory-answer daily-memory-answer-hidden">先回忆，再显示答案。显示答案后，这张卡会沿记忆曲线安排下一次复习。</div>`;

        panel.hidden = false;
        panel.innerHTML = `
            <div class="daily-memory-head">
                <div>
                    <div class="daily-practice-kicker">SPACED REPETITION</div>
                    <h2>累计记忆 · 曲线复习</h2>
                    <p>到期题优先随机；逾期越久，抽中概率越高。未到期旧题只少量混入巩固。</p>
                </div>
                <button type="button" class="daily-memory-close" id="curve-close" aria-label="关闭记忆卡">×</button>
            </div>
            <div class="daily-memory-status">
                <span>曲线卡 ${sessionIndex + 1}/${sessionIds.length}</span>
                <span>累计 ${summary.total}题 · 今日到期 ${summary.due}题${summary.overdue ? ` · 逾期 ${summary.overdue}题` : ""}</span>
            </div>
            <article class="daily-memory-card-inner">
                <div class="daily-memory-meta">
                    ${question.topic ? `<span>${escapeHTML(question.topic)}</span>` : ""}
                    ${question.sourceId ? `<span>${escapeHTML(question.sourceId)}</span>` : ""}
                    <span>${escapeHTML(scheduleLabel(question))}</span>
                </div>
                <h3>${escapeHTML(question.question)}</h3>
                ${renderOptions(question)}
                ${answerHTML}
            </article>
            <div class="daily-memory-footer">
                <div class="daily-memory-left-actions">
                    <button type="button" class="daily-memory-secondary" id="curve-prev" ${sessionIndex === 0 ? "disabled" : ""}>上一张</button>
                </div>
                <div class="daily-memory-right-actions">
                    ${!answerShown ? `
                        <button type="button" class="daily-memory-primary" id="curve-reveal">显示答案</button>
                    ` : sessionIndex < sessionIds.length - 1 ? `
                        <button type="button" class="daily-memory-primary" id="curve-next">下一张</button>
                    ` : `
                        <button type="button" class="daily-memory-secondary" id="curve-finish">结束本轮</button>
                        <button type="button" class="daily-memory-primary" id="curve-again">再按记忆曲线出一轮</button>
                    `}
                </div>
            </div>
        `;

        document.getElementById("curve-close")?.addEventListener("click", closeCurvePanel);
        document.getElementById("curve-finish")?.addEventListener("click", closeCurvePanel);

        const prev = document.getElementById("curve-prev");
        if (prev && !prev.disabled) {
            prev.addEventListener("click", () => {
                sessionIndex -= 1;
                answerShown = reviewedThisSession.has(sessionIds[sessionIndex]);
                renderCurveCard();
            });
        }

        const reveal = document.getElementById("curve-reveal");
        if (reveal) {
            reveal.addEventListener("click", () => {
                if (!reviewedThisSession.has(question.id)) {
                    advanceSchedule(question.id, true, "memory");
                    reviewedThisSession.add(question.id);
                }
                answerShown = true;
                renderCurveCard();
                patchCumulativeButton();
            });
        }

        const next = document.getElementById("curve-next");
        if (next) {
            next.addEventListener("click", () => {
                sessionIndex += 1;
                answerShown = reviewedThisSession.has(sessionIds[sessionIndex]);
                renderCurveCard();
            });
        }

        const again = document.getElementById("curve-again");
        if (again) again.addEventListener("click", openCurveMemory);
    }

    function openCurveMemory() {
        if (typeof window.closeDailyMemoryCards === "function") window.closeDailyMemoryCards();
        const session = buildCurveSession();
        if (!session.length) return;

        sessionIds = session.map(question => question.id);
        sessionIndex = 0;
        answerShown = false;
        reviewedThisSession = new Set();
        renderCurveCard();

        const panel = document.getElementById("daily-memory-panel");
        if (panel) panel.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    function patchCumulativeButton() {
        const button = document.getElementById("start-cumulative-memory");
        if (!button) return;

        const summary = getPoolSummary();
        const desiredText = !summary.total
            ? "暂无累计旧题"
            : summary.due
                ? `记忆曲线复习 · 到期${summary.due}题`
                : `记忆曲线复习 · 巩固旧题`;
        const desiredDisabled = !summary.total;
        const desiredTitle = summary.total
            ? `累计已学习 ${summary.total} 题；每轮最多 ${Math.min(SESSION_LIMIT, summary.total)} 张，到期题优先。`
            : "";

        if (button.textContent !== desiredText) button.textContent = desiredText;
        if (button.disabled !== desiredDisabled) button.disabled = desiredDisabled;
        if (button.title !== desiredTitle) button.title = desiredTitle;
    }

    document.addEventListener("click", event => {
        const button = event.target && event.target.closest
            ? event.target.closest("#start-cumulative-memory")
            : null;
        if (!button || button.disabled) return;

        event.preventDefault();
        event.stopImmediatePropagation();
        openCurveMemory();
    }, true);

    const baseRecordAnswer = window.recordAnswer;
    if (typeof baseRecordAnswer === "function" && !window.__memoryCurveRecordWrapped) {
        window.__memoryCurveRecordWrapped = true;
        window.recordAnswer = function (questionId, isCorrect, ...rest) {
            const result = baseRecordAnswer.call(this, questionId, isCorrect, ...rest);
            const question = getQuestion(questionId);
            if (question && isBankQuestion(question)) {
                advanceSchedule(questionId, Boolean(isCorrect), "formal");
                patchCumulativeButton();
            }
            return result;
        };
    }

    const observer = new MutationObserver(() => patchCumulativeButton());
    observer.observe(document.body, { childList: true, subtree: true });

    window.openCurveMemory = openCurveMemory;
    window.getMemoryCurvePoolSummary = getPoolSummary;
    patchCumulativeButton();
})();
