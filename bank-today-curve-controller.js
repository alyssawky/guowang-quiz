// 国网“今日曲线”唯一控制器。
// 唯一口径：今日应刷池 = 历史逾期 + 今日到期 + 今日可复现的错题/记忆模糊题 - 今天已答对题。
// 点击后一次性刷完当前全部今日池；中途退出后再次进入时重新计算剩余题。
// 本文件是“今日曲线”按钮数字、今日池和会话题序的唯一最终来源。
(function () {
    const VERSION = 1;
    if (Number(window.__bankTodayCurveControllerVersion || 0) >= VERSION) return;
    window.__bankTodayCurveControllerVersion = VERSION;

    const CURVE_STORE_KEY = "guowang-memory-curve-v2";
    const SESSION_STORE_KEY = "guowang-review-session-store-v1";
    const INTERVALS = [1, 2, 4, 7, 15, 30, 60, 90];

    function safeParse(value, fallback) {
        try { return value ? JSON.parse(value) : fallback; }
        catch (error) { return fallback; }
    }

    function localISO(value = new Date()) {
        const d = value instanceof Date ? new Date(value) : new Date(value);
        if (Number.isNaN(d.getTime())) return "";
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${y}-${m}-${day}`;
    }

    function isoFromTimestamp(value) {
        return value ? localISO(new Date(value)) : "";
    }

    function addDaysISO(dateString, days) {
        const [y, m, d] = String(dateString || localISO()).split("-").map(Number);
        const date = new Date(y, m - 1, d);
        date.setDate(date.getDate() + Number(days || 0));
        return localISO(date);
    }

    function dayDiff(fromString, toString) {
        const [fy, fm, fd] = String(fromString || "").split("-").map(Number);
        const [ty, tm, td] = String(toString || "").split("-").map(Number);
        const from = new Date(fy, fm - 1, fd);
        const to = new Date(ty, tm - 1, td);
        if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return 0;
        return Math.round((to.getTime() - from.getTime()) / 86400000);
    }

    function taskOf(question) {
        return typeof studyPlan !== "undefined"
            ? studyPlan.find(task => task.id === question?.taskId) || null
            : null;
    }

    function isBankQuestion(question) {
        const task = taskOf(question);
        return Boolean(question && question.unlockDate && (
            String(question.taskId || "").startsWith("preoct300-w") ||
            question.sourceSet === "10月前必学300题" ||
            (task && (task.questionBank || task.category === "国网题库"))
        ));
    }

    function recordOf(questionId) {
        return typeof answerHistory !== "undefined" && answerHistory
            ? answerHistory[questionId] || null
            : null;
    }

    function saveHistory() {
        if (typeof window.saveAnswerHistory === "function") window.saveAnswerHistory();
        else if (typeof saveAnswerHistory === "function") saveAnswerHistory();
    }

    function loadCurveStore() {
        return safeParse(localStorage.getItem(CURVE_STORE_KEY), {});
    }

    function reviewablePool() {
        const today = localISO();
        return Array.isArray(questions) ? questions.filter(question => {
            if (!isBankQuestion(question) || question.unlockDate > today) return false;
            const record = recordOf(question.id);
            return Boolean(record && Number(record.attempts || 0) > 0);
        }) : [];
    }

    function scheduleFor(question) {
        const store = loadCurveStore();
        if (store[question.id] && store[question.id].dueDate) return store[question.id];
        const record = recordOf(question.id);
        const baseDate = record?.lastAnsweredAt
            ? isoFromTimestamp(record.lastAnsweredAt)
            : question.unlockDate;
        return {
            level: 0,
            dueDate: addDaysISO(baseDate, INTERVALS[0]),
            lastReviewedDate: baseDate,
            source: "derived"
        };
    }

    function answeredCorrectToday(question) {
        const record = recordOf(question.id);
        if (!record) return false;
        const today = localISO();
        if (record.bankLastCorrectDate === today) return true;
        return Boolean(record.lastCorrect === true && isoFromTimestamp(record.lastAnsweredAt) === today);
    }

    function isFocusRecord(record) {
        return Boolean(record && (
            record.wrongFocusActive === true ||
            record.memoryBlurFocusActive === true
        ));
    }

    function focusTouchedToday(record) {
        if (!record) return false;
        const today = localISO();
        return [
            record.focusLastCurveDate,
            record.wrongFocusLastCountedDate,
            record.memoryBlurFocusLastCountedDate,
            isoFromTimestamp(record.wrongFocusLastWrongAt),
            isoFromTimestamp(record.memoryBlurFocusLastMarkedAt),
            isoFromTimestamp(record.lastMemoryBlurredAt)
        ].filter(Boolean).includes(today);
    }

    function focusEligibleToday(question) {
        const record = recordOf(question.id);
        const today = localISO();
        if (!isFocusRecord(record)) return false;
        if (answeredCorrectToday(question)) return false;
        if (record.focusNextEligibleDate && record.focusNextEligibleDate > today) return false;
        if (focusTouchedToday(record)) return false;
        return true;
    }

    function lifetimeWrong(record) {
        return Number(record?.archivedWrong || 0) + Number(record?.wrong || 0);
    }

    function focusScore(question) {
        const r = recordOf(question.id) || {};
        return lifetimeWrong(r) * 1200 +
            Number(r.memoryBlurred || 0) * 1500 +
            (3 - Math.min(3, Number(r.wrongFocusStreak || 0))) * 20;
    }

    function normalClass(question) {
        const record = recordOf(question.id);
        if (isFocusRecord(record) || answeredCorrectToday(question)) return "none";
        const dueDate = String(scheduleFor(question)?.dueDate || "");
        const today = localISO();
        if (!dueDate) return "none";
        if (dueDate < today) return "overdue";
        if (dueDate === today) return "today";
        return "future";
    }

    function normalUrgency(question) {
        const schedule = scheduleFor(question);
        const dueDate = String(schedule?.dueDate || "");
        const overdueDays = dueDate < localISO()
            ? Math.max(1, dayDiff(dueDate, localISO()))
            : 0;
        const level = Math.max(0, Math.min(
            INTERVALS.length - 1,
            Number(schedule?.level || 0)
        ));
        return 100 + overdueDays * 40 + (INTERVALS.length - level) * 2;
    }

    function weightedOrder(list) {
        const pool = list.slice();
        const result = [];
        while (pool.length) {
            const weights = pool.map(normalUrgency);
            const total = weights.reduce((sum, value) => sum + value, 0);
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

    function todayPools() {
        const pool = reviewablePool();
        const focus = pool
            .filter(focusEligibleToday)
            .sort((a, b) => focusScore(b) - focusScore(a));
        const overdue = pool.filter(question => normalClass(question) === "overdue");
        const dueToday = pool.filter(question => normalClass(question) === "today");
        return { focus, overdue, dueToday };
    }

    function buildTodaySession() {
        const pools = todayPools();
        const focus = pools.focus.slice();
        const normal = weightedOrder([...pools.overdue, ...pools.dueToday]);
        const overdueCount = normal.filter(question => normalClass(question) === "overdue").length;
        return {
            list: [...focus, ...normal],
            focusCount: focus.length,
            overdueCount,
            dueTodayCount: normal.length - overdueCount,
            pendingFocus: pools.focus.length,
            pendingOverdue: pools.overdue.length,
            pendingDueToday: pools.dueToday.length,
            pendingTotal: pools.focus.length + pools.overdue.length + pools.dueToday.length
        };
    }

    function clearStoredCurveSessions() {
        const store = safeParse(localStorage.getItem(SESSION_STORE_KEY), {});
        let changed = false;
        Object.keys(store).forEach(key => {
            const session = store[key];
            if (session && String(session.title || "").includes("记忆曲线答题")) {
                delete store[key];
                changed = true;
            }
        });
        if (changed) localStorage.setItem(SESSION_STORE_KEY, JSON.stringify(store));
    }

    function patchButton() {
        const button = document.getElementById("start-cumulative-memory");
        if (!button) return;
        const pools = todayPools();
        const total = pools.focus.length + pools.overdue.length + pools.dueToday.length;
        button.disabled = total === 0;
        button.textContent = total > 0
            ? `今日曲线 · 待刷${total}题`
            : "今日曲线已完成";
        button.title = total > 0
            ? `历史逾期 ${pools.overdue.length} + 今日到期 ${pools.dueToday.length} + 重点复现 ${pools.focus.length}。点击后一次刷完当前全部 ${total} 道；今天答对过的题已排除。长期曲线：1→2→4→7→15→30→60→90天。`
            : "今天没有剩余逾期、到期或重点复现题。长期曲线：1→2→4→7→15→30→60→90天。";
    }

    // 最终接管曲线会话：无论底层 memory-curve 先生成多少题，真正进入页面前都换成完整今日池。
    const baseStartQuestionSession = window.startQuestionSession;
    if (typeof baseStartQuestionSession === "function" && !window.__bankTodayCurveControllerStartWrapped) {
        window.__bankTodayCurveControllerStartWrapped = true;
        window.startQuestionSession = function (questionList, title, sequenceText = "") {
            if (!String(title || "").includes("记忆曲线答题")) {
                return baseStartQuestionSession.call(this, questionList, title, sequenceText);
            }

            const session = buildTodaySession();
            clearStoredCurveSessions();

            if (!session.list.length) {
                window.__memoryCurveQuizActive = false;
                window.__memoryCurveQuizQuestionIds = new Set();
                patchButton();
                if (typeof window.__refreshBankCurveDiagnostics === "function") {
                    window.__refreshBankCurveDiagnostics();
                }
                return;
            }

            const text = `今日应刷池${session.pendingTotal}题（逾期${session.pendingOverdue} + 今日到期${session.pendingDueToday} + 重点复现${session.pendingFocus}） · 本次一次刷完全部${session.list.length}题 · 今日答对后当日不再出现`;
            const finalSequence = `${sequenceText || ""}${sequenceText ? " · " : ""}${text}`;
            const result = baseStartQuestionSession.call(this, session.list, title, finalSequence);

            if (typeof currentReviewQuestions !== "undefined") {
                currentReviewQuestions = session.list.slice();
                currentQuestionIndex = 0;
                window.__memoryCurveQuizActive = true;
                window.__memoryCurveQuizQuestionIds = new Set(session.list.map(question => question.id));
                if (typeof renderQuestion === "function") renderQuestion();
            }

            setTimeout(patchButton, 20);
            if (typeof window.__refreshBankCurveDiagnostics === "function") {
                setTimeout(window.__refreshBankCurveDiagnostics, 40);
            }
            return result;
        };
    }

    // 今天答对一次就写独立日期字段；下一次重算今日池时立即排除。
    const baseRecordAnswer = window.recordAnswer;
    if (typeof baseRecordAnswer === "function" && !window.__bankTodayCurveControllerRecordWrapped) {
        window.__bankTodayCurveControllerRecordWrapped = true;
        window.recordAnswer = function (questionId, isCorrect, ...rest) {
            const result = baseRecordAnswer.call(this, questionId, isCorrect, ...rest);
            const question = Array.isArray(questions)
                ? questions.find(q => q.id === questionId)
                : null;
            const record = recordOf(questionId);
            if (question && record && isBankQuestion(question) && Boolean(isCorrect)) {
                record.bankLastCorrectDate = localISO();
                saveHistory();
            }
            setTimeout(patchButton, 50);
            if (typeof window.__refreshBankCurveDiagnostics === "function") {
                setTimeout(window.__refreshBankCurveDiagnostics, 70);
            }
            return result;
        };
    }

    // daily-practice.js 会用 innerHTML 重绘整张首页卡片，并暂时写回旧“累计题数”。
    // 只观察卡片的直接子元素重建：一旦重绘，立刻恢复唯一的“今日曲线”数字。
    function installCardObserver() {
        const card = document.getElementById("daily-practice-card");
        if (!card || card.__bankTodayCurveObserved) return;
        card.__bankTodayCurveObserved = true;
        const observer = new MutationObserver(() => {
            setTimeout(patchButton, 0);
        });
        observer.observe(card, { childList: true, subtree: false });
        window.__bankTodayCurveCardObserver = observer;
    }

    window.getBankTodayDuePool = function () {
        const pools = todayPools();
        return {
            date: localISO(),
            total: pools.focus.length + pools.overdue.length + pools.dueToday.length,
            overdue: pools.overdue.length,
            dueToday: pools.dueToday.length,
            focus: pools.focus.length,
            questionIds: [...pools.focus, ...pools.overdue, ...pools.dueToday].map(q => q.id),
            sessionMode: "all-today-at-once",
            intervals: INTERVALS.slice()
        };
    };

    window.refreshBankTodayCurveButton = patchButton;
    patchButton();
    installCardObserver();
    [0, 50, 150, 350, 800].forEach(delay => setTimeout(() => {
        installCardObserver();
        patchButton();
    }, delay));
})();
