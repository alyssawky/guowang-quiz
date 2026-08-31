// 国网记忆曲线最终“今日应刷池”策略 v4。
// 今日应刷池 = 历史逾期 + 今日到期 + 今日应复现的错题/记忆模糊题 - 今天已经答对过的题。
// v4：点击“今日曲线”时一次性装入今天全部剩余应刷题，不再限制12题，也不再限制重点题4题。
// 中途退出后再次进入，会按当前本地记录重新计算剩余今日池：已答对/今日已处理的题不再出现，未完成题继续刷。
(function () {
    const VERSION = 4;
    if (Number(window.__bankTodayDuePoolFinalVersion || 0) >= VERSION) return;
    window.__bankTodayDuePoolFinalVersion = VERSION;

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
        date.setDate(date.getDate() + days);
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

    function reviewablePool() {
        const today = localISO();
        return questions.filter(question => {
            if (!isBankQuestion(question) || question.unlockDate > today) return false;
            const record = recordOf(question.id);
            return Boolean(record && Number(record.attempts || 0) > 0);
        });
    }

    function loadCurveStore() {
        return safeParse(localStorage.getItem(CURVE_STORE_KEY), {});
    }

    function scheduleFor(question) {
        const store = loadCurveStore();
        if (store[question.id]) return store[question.id];
        const record = recordOf(question.id);
        const baseDate = record?.lastAnsweredAt
            ? isoFromTimestamp(record.lastAnsweredAt)
            : question.unlockDate;
        return {
            level: 0,
            dueDate: addDaysISO(baseDate, INTERVALS[0]),
            lastReviewedDate: baseDate
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
        if (!isFocusRecord(record) || answeredCorrectToday(question)) return false;
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
        const level = Math.max(
            0,
            Math.min(INTERVALS.length - 1, Number(schedule?.level || 0))
        );
        return 100 + overdueDays * 40 + (INTERVALS.length - level) * 2;
    }

    // 这里不再用于“截取若干题”，只用于给全部正常题生成一个“逾期越久越靠前”的随机顺序。
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

        // v4 核心：今日池有多少就一次装多少。
        // 重点题不再只取4道，正常题也不再只补到12道。
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

    // 今日曲线每次进入都按“此刻还剩什么”重新计算，所以旧的曲线断点题序应清掉。
    // 这样中途退出再进入时，今天已答对/已处理的题自然消失，只继续剩余题。
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
            ? `历史逾期 ${pools.overdue.length} + 今日到期 ${pools.dueToday.length} + 重点复现 ${pools.focus.length}。点击后一次刷完当前全部 ${total} 道；中途退出后再次进入只继续剩余题。`
            : "今天没有剩余逾期、到期或重点复现题。";
    }

    const baseStartQuestionSession = window.startQuestionSession;
    if (typeof baseStartQuestionSession === "function" && !window.__bankTodayDueV4StartWrapped) {
        window.__bankTodayDueV4StartWrapped = true;
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

            // 最终保证页面使用的是“完整今日剩余池”，而不是前面旧模块生成的4/12题小批次。
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

    const baseRecordAnswer = window.recordAnswer;
    if (typeof baseRecordAnswer === "function" && !window.__bankTodayDueV4RecordWrapped) {
        window.__bankTodayDueV4RecordWrapped = true;
        window.recordAnswer = function (questionId, isCorrect, ...rest) {
            const result = baseRecordAnswer.call(this, questionId, isCorrect, ...rest);
            const question = questions.find(q => q.id === questionId);
            const record = recordOf(questionId);
            if (question && record && isBankQuestion(question) && Boolean(isCorrect)) {
                record.bankLastCorrectDate = localISO();
                saveHistory();
            }
            setTimeout(patchButton, 40);
            if (typeof window.__refreshBankCurveDiagnostics === "function") {
                setTimeout(window.__refreshBankCurveDiagnostics, 60);
            }
            return result;
        };
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
            sessionMode: "all-today-at-once"
        };
    };

    patchButton();
    setTimeout(patchButton, 0);
    setTimeout(patchButton, 200);
})();
