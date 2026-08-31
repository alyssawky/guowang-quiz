// 国网累计记忆：底层记忆曲线入口。
// v4：入口只负责判断“今天是否存在真正应刷题”，不再要求某个正式学习日整组题全部完成。
// 真正的12题配比、逾期/到期/重点分类与当日答对排除，由最后加载的 bank-today-due-pool-policy-v3.js 接管。
(function () {
    const VERSION = 4;
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
        const date = value instanceof Date ? new Date(value) : new Date(value);
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

    function recordOf(questionId) {
        return answerHistory && answerHistory[questionId] ? answerHistory[questionId] : null;
    }

    function formallyAnswered(question) {
        const record = recordOf(question.id);
        return Boolean(record && Number(record.attempts || 0) > 0);
    }

    // 只要这道国网题已经真正作答过，就具备进入后续记忆计划的资格。
    // 不再要求它所属日期的整组8/9/10题全部做完，避免已有逾期题被整组条件挡掉。
    function learnedPool() {
        const today = toLocalISO();
        return questions.filter(question =>
            isBankQuestion(question) &&
            question.unlockDate <= today &&
            formallyAnswered(question)
        );
    }

    function scheduleFor(question) {
        const store = loadStore();
        if (store[question.id]) return store[question.id];

        const record = recordOf(question.id);
        const baseDate = record && record.lastAnsweredAt ? toLocalISO(record.lastAnsweredAt) : question.unlockDate;
        return {
            level: 0,
            dueDate: addDays(baseDate, INTERVALS[0]),
            lastReviewedDate: baseDate,
            reviewCount: 0,
            source: "derived"
        };
    }

    function answeredCorrectToday(question) {
        const record = recordOf(question.id);
        if (!record) return false;
        const today = toLocalISO();
        if (record.bankLastCorrectDate === today) return true;
        return Boolean(record.lastCorrect === true && record.lastAnsweredAt && toLocalISO(record.lastAnsweredAt) === today);
    }

    function isFocusRecord(record) {
        return Boolean(record && (record.wrongFocusActive === true || record.memoryBlurFocusActive === true));
    }

    function focusTouchedToday(record) {
        if (!record) return false;
        const today = toLocalISO();
        const dates = [
            record.focusLastCurveDate,
            record.wrongFocusLastCountedDate,
            record.memoryBlurFocusLastCountedDate,
            record.wrongFocusLastWrongAt ? toLocalISO(record.wrongFocusLastWrongAt) : "",
            record.memoryBlurFocusLastMarkedAt ? toLocalISO(record.memoryBlurFocusLastMarkedAt) : "",
            record.lastMemoryBlurredAt ? toLocalISO(record.lastMemoryBlurredAt) : ""
        ].filter(Boolean);
        return dates.includes(today);
    }

    // 底层入口必须同时认识“重点复现到期”，否则只有重点题而没有普通到期题时按钮会点不动。
    function focusReadyToday(question) {
        const record = recordOf(question.id);
        const today = toLocalISO();
        if (!isFocusRecord(record)) return false;
        if (answeredCorrectToday(question)) return false;
        if (record.focusNextEligibleDate && record.focusNextEligibleDate > today) return false;
        if (focusTouchedToday(record)) return false;
        return true;
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
        else urgency = 1;
        return Math.max(0.01, urgency * earlyBoost);
    }

    function weightedSample(list, count) {
        const pool = list.slice();
        const result = [];
        while (pool.length && result.length < count) {
            const weights = pool.map(weight);
            const total = weights.reduce((sum, item) => sum + item, 0);
            let cursor = Math.random() * Math.max(total, 1);
            let index = 0;
            for (; index < pool.length; index++) {
                cursor -= weights[index] || 1;
                if (cursor <= 0) break;
            }
            result.push(pool.splice(Math.min(index, pool.length - 1), 1)[0]);
        }
        return result;
    }

    function triggerPool() {
        const pool = learnedPool();
        const normalDue = pool.filter(question =>
            !isFocusRecord(recordOf(question.id)) &&
            !answeredCorrectToday(question) &&
            scheduleInfo(question).daysUntil <= 0
        );
        const focusDue = pool.filter(focusReadyToday);
        const map = new Map();
        [...normalDue, ...focusDue].forEach(question => map.set(question.id, question));
        return [...map.values()];
    }

    // 这里只要生成一个“可启动”的底层会话即可；最终题序会由 v3 今日应刷池重新计算。
    function buildSession() {
        const candidates = triggerPool();
        if (!candidates.length) return [];
        return weightedSample(candidates, Math.min(SESSION_LIMIT, candidates.length));
    }

    function poolSummary() {
        const pool = learnedPool();
        const trigger = triggerPool();
        const normalDue = pool.filter(question =>
            !isFocusRecord(recordOf(question.id)) &&
            !answeredCorrectToday(question) &&
            scheduleInfo(question).daysUntil <= 0
        );
        const overdue = normalDue.filter(question => scheduleInfo(question).daysUntil < 0);
        const focus = trigger.filter(question => isFocusRecord(recordOf(question.id)));
        return {
            total: pool.length,
            due: trigger.length,
            overdue: overdue.length,
            focus: focus.length
        };
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
        button.disabled = summary.due === 0;
        button.textContent = summary.due > 0 ? `今日曲线 · 待刷${summary.due}题` : "今日曲线已完成";
        button.title = summary.due > 0
            ? `今天有 ${summary.due} 道真正应刷题，其中历史逾期 ${summary.overdue} 道，重点复现 ${summary.focus} 道。不会提前抽取未来题。`
            : "今天没有剩余逾期、到期或重点复现题。";
    }

    function startCurveQuiz() {
        if (typeof window.closeDailyMemoryCards === "function") window.closeDailyMemoryCards();
        const session = buildSession().map(enrichBankExplanation);
        if (!session.length) {
            patchButton();
            return;
        }

        window.__memoryCurveQuizActive = true;
        window.__memoryCurveQuizQuestionIds = new Set(session.map(question => question.id));

        const summary = poolSummary();
        const sequenceText = `记忆曲线：1→2→4→7→15→30天 · 今日应刷${summary.due}题 · 其中逾期${summary.overdue}题 · 重点复现${summary.focus}题`;
        startQuestionSession(session, "国网必刷题 · 记忆曲线答题", sequenceText);

        const chooser = document.getElementById("review-section-chooser");
        if (chooser) chooser.hidden = true;
    }

    const baseStartQuestionSession = window.startQuestionSession;
    if (typeof baseStartQuestionSession === "function" && !window.__memoryCurveStartWrappedV4) {
        window.__memoryCurveStartWrappedV4 = true;
        window.startQuestionSession = function (list, title, sequenceText) {
            const isCurve = String(title || "").includes("记忆曲线答题");
            window.__memoryCurveQuizActive = isCurve;
            if (!isCurve) window.__memoryCurveQuizQuestionIds = null;
            return baseStartQuestionSession.call(this, list, title, sequenceText);
        };
    }

    const baseRecordAnswer = window.recordAnswer;
    if (typeof baseRecordAnswer === "function" && !window.__memoryCurveRecordWrappedV4) {
        window.__memoryCurveRecordWrappedV4 = true;
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

    questions.filter(isBankQuestion).forEach(enrichBankExplanation);

    window.openCurveMemory = startCurveQuiz;
    window.startCurveQuiz = startCurveQuiz;
    window.getMemoryCurvePoolSummary = poolSummary;
    window.CURVE_HISTORY_KEY = CURVE_HISTORY_KEY;
    patchButton();
})();
