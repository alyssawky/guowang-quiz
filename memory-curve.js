// 国网累计记忆：按记忆曲线选题，但使用网站原生答题模式。
// 曲线复习会正常记录答题历史、错题和正确率；明日预习仍由 daily-practice.js 的卡片负责。
(function () {
    const VERSION = 2;
    if (Number(window.__memoryCurveVersion || 0) >= VERSION) return;
    window.__memoryCurveVersion = VERSION;

    const STORE_KEY = "guowang-memory-curve-v2";
    const CURVE_HISTORY_KEY = "guowang-memory-curve-answer-history-v1";
    const INTERVALS = [1, 2, 4, 7, 15, 30];
    const SESSION_LIMIT = 12;

    function safeParse(value, fallback) {
        try { return value ? JSON.parse(value) : fallback; }
        catch (error) { return fallback; }
    }

    function loadStore() {
        return safeParse(localStorage.getItem(STORE_KEY), {});
    }

    function saveStore(store) {
        localStorage.setItem(STORE_KEY, JSON.stringify(store || {}));
    }

    function loadCurveHistory() {
        return safeParse(localStorage.getItem(CURVE_HISTORY_KEY), {});
    }

    function saveCurveHistory(store) {
        localStorage.setItem(CURVE_HISTORY_KEY, JSON.stringify(store || {}));
    }

    function toLocalISO(value = new Date()) {
        const date = value instanceof Date ? value : new Date(value);
        if (Number.isNaN(date.getTime())) return "";
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, "0");
        const d = String(date.getDate()).padStart(2, "0");
        return `${y}-${m}-${d}`;
    }

    function parseDate(value) {
        if (typeof parseLocalDate === "function") return parseLocalDate(value);
        return new Date(`${value}T00:00:00`);
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

    function isBankQuestion(question) {
        return Boolean(
            question && question.unlockDate &&
            (question.sourceSet === "10月前必学300题" || String(question.taskId || "").startsWith("preoct300-w"))
        );
    }

    function getQuestion(id) {
        return questions.find(question => question.id === id);
    }

    function formallyAnswered(question) {
        const record = answerHistory && answerHistory[question.id];
        return Boolean(record && Number(record.attempts || 0) > 0);
    }

    function learnedPool() {
        const today = toLocalISO();
        return questions.filter(question =>
            isBankQuestion(question) && question.unlockDate < today && formallyAnswered(question)
        );
    }

    function scheduleFor(question) {
        const store = loadStore();
        if (store[question.id]) return store[question.id];

        const record = answerHistory && answerHistory[question.id];
        const baseDate = record && record.lastAnsweredAt ? toLocalISO(record.lastAnsweredAt) : question.unlockDate;
        return {
            level: 0,
            dueDate: addDays(baseDate, INTERVALS[0]),
            lastReviewedDate: baseDate,
            reviewCount: 0,
            source: "derived"
        };
    }

    function advanceSchedule(questionId, isCorrect, source) {
        const question = getQuestion(questionId);
        if (!question || !isBankQuestion(question)) return;

        const store = loadStore();
        const current = scheduleFor(question);
        let level = Number(current.level || 0);

        if (!isCorrect) {
            level = 0;
        } else if (source === "curve") {
            level = Math.min(level + 1, INTERVALS.length - 1);
        }

        const today = toLocalISO();
        store[questionId] = {
            level,
            dueDate: addDays(today, INTERVALS[level]),
            lastReviewedDate: today,
            reviewCount: Number(current.reviewCount || 0) + 1,
            source
        };
        saveStore(store);
    }

    function recordCurveAttempt(questionId, isCorrect) {
        const store = loadCurveHistory();
        const old = store[questionId] || { attempts: 0, correct: 0 };
        old.attempts = Number(old.attempts || 0) + 1;
        old.correct = Number(old.correct || 0) + (isCorrect ? 1 : 0);
        old.lastAnsweredAt = new Date().toISOString();
        store[questionId] = old;
        saveCurveHistory(store);
    }

    function scheduleInfo(question) {
        const schedule = scheduleFor(question);
        return { schedule, daysUntil: dayDiff(toLocalISO(), schedule.dueDate) };
    }

    function weight(question) {
        const { schedule, daysUntil } = scheduleInfo(question);
        const level = Number(schedule.level || 0);
        const earlyBoost = 1 + (INTERVALS.length - 1 - level) * 0.12;
        let urgency;
        if (daysUntil < 0) urgency = 12 + Math.min(18, Math.abs(daysUntil) * 2);
        else if (daysUntil === 0) urgency = 10;
        else if (daysUntil === 1) urgency = 3.5;
        else if (daysUntil <= 3) urgency = 1.8;
        else if (daysUntil <= 7) urgency = 0.8;
        else urgency = 0.28;
        return urgency * earlyBoost;
    }

    function weightedSample(list, count) {
        const pool = list.slice();
        const result = [];
        while (pool.length && result.length < count) {
            const weights = pool.map(weight);
            const total = weights.reduce((sum, item) => sum + item, 0);
            let cursor = Math.random() * total;
            let index = 0;
            for (; index < pool.length; index++) {
                cursor -= weights[index];
                if (cursor <= 0) break;
            }
            result.push(pool.splice(Math.min(index, pool.length - 1), 1)[0]);
        }
        return result;
    }

    function buildSession() {
        const pool = learnedPool();
        if (!pool.length) return [];
        const due = pool.filter(question => scheduleInfo(question).daysUntil <= 0);
        const future = pool.filter(question => scheduleInfo(question).daysUntil > 0);
        const target = Math.min(SESSION_LIMIT, pool.length);
        if (due.length >= target) return weightedSample(due, target);
        return [...weightedSample(due, due.length), ...weightedSample(future, target - due.length)];
    }

    function poolSummary() {
        const pool = learnedPool();
        const due = pool.filter(question => scheduleInfo(question).daysUntil <= 0);
        const overdue = due.filter(question => scheduleInfo(question).daysUntil < 0);
        return { total: pool.length, due: due.length, overdue: overdue.length };
    }

    function memoryExplanation(question) {
        if (typeof window.getBankMemoryKnowledge !== "function") return question.explanation || "";
        const info = window.getBankMemoryKnowledge(question);
        if (!info) return question.explanation || "";
        const parts = [];
        if (info.explanation) parts.push(`<strong>知识点解析：</strong>${info.explanation}`);
        if (info.distinction) parts.push(`<strong>易混辨析：</strong>${info.distinction}`);
        if (info.hook) parts.push(`<strong>记忆钩子：</strong>${info.hook}`);
        return parts.join("<br><br>");
    }

    function enrichBankExplanation(question) {
        if (!question || !isBankQuestion(question)) return question;
        const rich = memoryExplanation(question);
        if (rich) question.explanation = rich;
        return question;
    }

    function patchButton() {
        const button = document.getElementById("start-cumulative-memory");
        if (!button) return;
        const summary = poolSummary();
        const text = !summary.total
            ? "暂无累计旧题"
            : summary.due
                ? `曲线答题 · 到期${summary.due}题`
                : "曲线答题 · 巩固旧题";
        button.textContent = text;
        button.disabled = !summary.total;
        button.title = summary.total
            ? `累计已正式学习 ${summary.total} 题；每轮最多 ${Math.min(SESSION_LIMIT, summary.total)} 题，到期和逾期题优先。`
            : "";
    }

    function startCurveQuiz() {
        if (typeof window.closeDailyMemoryCards === "function") window.closeDailyMemoryCards();
        const session = buildSession().map(enrichBankExplanation);
        if (!session.length) return;

        window.__memoryCurveQuizActive = true;
        window.__memoryCurveQuizQuestionIds = new Set(session.map(question => question.id));

        const summary = poolSummary();
        const sequenceText = `记忆曲线：1→2→4→7→15→30天 · 本轮${session.length}题 · 到期${summary.due}题${summary.overdue ? ` · 其中逾期${summary.overdue}题` : ""}`;
        startQuestionSession(session, "国网必刷题 · 记忆曲线答题", sequenceText);

        const chooser = document.getElementById("review-section-chooser");
        if (chooser) chooser.hidden = true;
    }

    // 任意新答题会话都会更新“是否为曲线答题”状态。
    const baseStartQuestionSession = window.startQuestionSession;
    if (typeof baseStartQuestionSession === "function" && !window.__memoryCurveStartWrappedV2) {
        window.__memoryCurveStartWrappedV2 = true;
        window.startQuestionSession = function (list, title, sequenceText) {
            const isCurve = String(title || "").includes("记忆曲线答题");
            window.__memoryCurveQuizActive = isCurve;
            if (!isCurve) window.__memoryCurveQuizQuestionIds = null;
            return baseStartQuestionSession.call(this, list, title, sequenceText);
        };
    }

    const baseRecordAnswer = window.recordAnswer;
    if (typeof baseRecordAnswer === "function" && !window.__memoryCurveRecordWrappedV2) {
        window.__memoryCurveRecordWrappedV2 = true;
        window.recordAnswer = function (questionId, isCorrect, ...rest) {
            const result = baseRecordAnswer.call(this, questionId, isCorrect, ...rest);
            const question = getQuestion(questionId);
            if (question && isBankQuestion(question)) {
                const isCurve = Boolean(
                    window.__memoryCurveQuizActive &&
                    window.__memoryCurveQuizQuestionIds &&
                    window.__memoryCurveQuizQuestionIds.has(questionId)
                );
                advanceSchedule(questionId, Boolean(isCorrect), isCurve ? "curve" : "formal");
                if (isCurve) recordCurveAttempt(questionId, Boolean(isCorrect));
                setTimeout(patchButton, 0);
            }
            return result;
        };
    }

    document.addEventListener("click", event => {
        const curveButton = event.target && event.target.closest
            ? event.target.closest("#start-cumulative-memory")
            : null;
        if (curveButton && !curveButton.disabled) {
            event.preventDefault();
            event.stopImmediatePropagation();
            startCurveQuiz();
            return;
        }

        const exitButton = event.target && event.target.closest
            ? event.target.closest(".exit-review-button")
            : null;
        if (exitButton) {
            window.__memoryCurveQuizActive = false;
            window.__memoryCurveQuizQuestionIds = null;
        }
    }, true);

    // 已到日期的国网题在任何正常答题模式下也使用知识解析，而不是旧版题库备注。
    questions.filter(isBankQuestion).forEach(enrichBankExplanation);

    window.openCurveMemory = startCurveQuiz;
    window.startCurveQuiz = startCurveQuiz;
    window.getMemoryCurvePoolSummary = poolSummary;
    window.CURVE_HISTORY_KEY = CURVE_HISTORY_KEY;
    patchButton();
})();
