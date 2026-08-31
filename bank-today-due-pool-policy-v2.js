// 国网记忆曲线“今日应刷池”最终规则 v2。
// 今日应刷池 = 历史逾期题 + 今日到期题 + 今日符合条件的错题/记忆模糊题 - 今天已答对题。
// 逾期题明确纳入今日池；逾期越久，正常曲线抽取优先级越高。
// 任一国网题只要今天答对过一次，今天后续任何曲线回合都排除。
(function () {
    const VERSION = 2;
    if (Number(window.__bankTodayDuePoolV2Version || 0) >= VERSION) return;
    window.__bankTodayDuePoolV2Version = VERSION;

    const SESSION_LIMIT = 12;
    const FOCUS_LIMIT = 4;
    const CURVE_STORE_KEY = "guowang-memory-curve-v2";
    const SESSION_STORE_KEY = "guowang-review-session-store-v1";
    const INTERVALS = [1, 2, 4, 7, 15, 30];

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
        if (!value) return "";
        return localISO(new Date(value));
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
        if (!question || typeof studyPlan === "undefined") return null;
        return studyPlan.find(task => task.id === question.taskId) || null;
    }

    function isBankQuestion(question) {
        const task = taskOf(question);
        return Boolean(
            question && question.unlockDate &&
            (String(question.taskId || "").startsWith("preoct300-w") ||
                question.sourceSet === "10月前必学300题" ||
                (task && (task.questionBank || task.category === "国网题库")))
        );
    }

    function questionById(questionId) {
        return Array.isArray(questions) ? questions.find(q => q.id === questionId) : null;
    }

    function recordOf(questionId) {
        return (typeof answerHistory !== "undefined" && answerHistory)
            ? answerHistory[questionId] || null
            : null;
    }

    function saveHistory() {
        if (typeof window.saveAnswerHistory === "function") window.saveAnswerHistory();
        else if (typeof saveAnswerHistory === "function") saveAnswerHistory();
    }

    function formallyAnswered(question) {
        const record = recordOf(question.id);
        return Boolean(record && Number(record.attempts || 0) > 0);
    }

    function dailyGroup(dateString) {
        return questions.filter(question => isBankQuestion(question) && question.unlockDate === dateString);
    }

    function dailyGroupCompleted(dateString) {
        const today = localISO();
        if (!dateString || dateString > today) return false;
        const group = dailyGroup(dateString);
        return Boolean(group.length && group.every(formallyAnswered));
    }

    function learnedPool() {
        const today = localISO();
        const completedDates = new Set(
            [...new Set(
                questions
                    .filter(question => isBankQuestion(question) && question.unlockDate <= today)
                    .map(question => question.unlockDate)
            )].filter(dailyGroupCompleted)
        );

        return questions.filter(question =>
            isBankQuestion(question) &&
            completedDates.has(question.unlockDate) &&
            formallyAnswered(question)
        );
    }

    function loadCurveStore() {
        return safeParse(localStorage.getItem(CURVE_STORE_KEY), {});
    }

    function scheduleFor(question) {
        const store = loadCurveStore();
        if (store[question.id]) return store[question.id];
        const record = recordOf(question.id);
        const baseDate = record?.lastAnsweredAt ? isoFromTimestamp(record.lastAnsweredAt) : question.unlockDate;
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
        const dates = [
            record.focusLastCurveDate,
            record.wrongFocusLastCountedDate,
            record.memoryBlurFocusLastCountedDate,
            isoFromTimestamp(record.wrongFocusLastWrongAt),
            isoFromTimestamp(record.memoryBlurFocusLastMarkedAt),
            isoFromTimestamp(record.lastMemoryBlurredAt)
        ].filter(Boolean);
        return dates.includes(today);
    }

    function focusEligibleToday(question) {
        const record = recordOf(question.id);
        const today = localISO();
        if (!isFocusRecord(record)) return false;
        if (answeredCorrectToday(question)) return false;
        if (question.unlockDate > today) return false;
        if (record.focusNextEligibleDate && record.focusNextEligibleDate > today) return false;
        if (focusTouchedToday(record)) return false;
        return true;
    }

    function lifetimeWrong(record) {
        return Number(record?.archivedWrong || 0) + Number(record?.wrong || 0);
    }

    function focusScore(question) {
        const record = recordOf(question.id) || {};
        return (
            lifetimeWrong(record) * 1200 +
            Number(record.memoryBlurred || 0) * 1500 +
            (3 - Math.min(3, Number(record.wrongFocusStreak || 0))) * 20
        );
    }

    function normalClass(question) {
        const record = recordOf(question.id);
        if (isFocusRecord(record)) return "none";
        if (answeredCorrectToday(question)) return "none";
        const schedule = scheduleFor(question);
        const dueDate = String(schedule?.dueDate || "");
        const today = localISO();
        if (!dueDate) return "none";
        if (dueDate < today) return "overdue";
        if (dueDate === today) return "today";
        return "future";
    }

    function normalUrgency(question) {
        const schedule = scheduleFor(question);
        const dueDate = String(schedule?.dueDate || "");
        const today = localISO();
        const overdueDays = dueDate < today ? Math.max(1, dayDiff(dueDate, today)) : 0;
        const level = Math.max(0, Math.min(INTERVALS.length - 1, Number(schedule?.level || 0)));
        // 逾期越久越优先；今天到期仍保持较高基础权重。
        return 100 + overdueDays * 35 + (INTERVALS.length - level) * 2;
    }

    function weightedSample(list, count) {
        const pool = list.slice();
        const result = [];
        while (pool.length && result.length < count) {
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
        const pool = learnedPool();
        const focus = pool
            .filter(focusEligibleToday)
            .sort((a, b) => focusScore(b) - focusScore(a));
        const overdue = pool.filter(question => normalClass(question) === "overdue");
        const dueToday = pool.filter(question => normalClass(question) === "today");
        return { focus, overdue, dueToday };
    }

    function buildTodaySession() {
        const pools = todayPools();
        const focus = pools.focus.slice(0, FOCUS_LIMIT);
        const normalTarget = Math.max(0, SESSION_LIMIT - focus.length);
        const normalCandidates = [...pools.overdue, ...pools.dueToday];
        const normal = weightedSample(normalCandidates, normalTarget);
        const normalOverdueCount = normal.filter(q => normalClass(q) === "overdue").length;
        const normalTodayCount = normal.length - normalOverdueCount;

        return {
            list: [...focus, ...normal],
            focusCount: focus.length,
            normalCount: normal.length,
            normalOverdueCount,
            normalTodayCount,
            pendingTotal: pools.focus.length + pools.overdue.length + pools.dueToday.length,
            pendingFocus: pools.focus.length,
            pendingOverdue: pools.overdue.length,
            pendingDueToday: pools.dueToday.length
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

    function patchTodayButton() {
        const button = document.getElementById("start-cumulative-memory");
        if (!button) return;
        const pools = todayPools();
        const total = pools.focus.length + pools.overdue.length + pools.dueToday.length;
        button.disabled = total === 0;
        button.textContent = total > 0 ? `今日曲线 · 待刷${total}题` : "今日曲线已完成";
        button.title = total > 0
            ? `今日应刷 ${total} 题：历史逾期 ${pools.overdue.length} 题 + 今日到期 ${pools.dueToday.length} 题 + 错题/记忆模糊复现 ${pools.focus.length} 题。今天已答对的题全部排除；不会提前抽未来题。`
            : "今日没有剩余逾期、到期或重点复现题；不会提前抽未来题。";
    }

    function showFinishedToast() {
        let toast = document.getElementById("today-curve-finished-toast-v2");
        if (!toast) {
            toast = document.createElement("div");
            toast.id = "today-curve-finished-toast-v2";
            toast.style.cssText = "position:fixed;right:24px;bottom:24px;z-index:6000;padding:12px 16px;border:1px solid #b9d9c1;border-radius:12px;background:#f8fdf9;color:#286239;font-size:13px;font-weight:700;box-shadow:0 12px 34px rgba(30,80,45,.14);";
            document.body.appendChild(toast);
        }
        toast.textContent = "今日曲线已完成 · 逾期/到期/重点题均已清完";
        clearTimeout(window.__todayCurveFinishedToastV2Timer);
        window.__todayCurveFinishedToastV2Timer = setTimeout(() => toast.remove(), 2600);
    }

    // 最外层接管曲线会话：即使旧模块生成了别的题序，也最终恢复为 v2 今日池。
    const baseStartQuestionSession = window.startQuestionSession;
    if (typeof baseStartQuestionSession === "function" && !window.__bankTodayDueV2StartWrapped) {
        window.__bankTodayDueV2StartWrapped = true;
        window.startQuestionSession = function (questionList, title, sequenceText = "") {
            const isCurve = String(title || "").includes("记忆曲线答题");
            if (!isCurve) return baseStartQuestionSession.call(this, questionList, title, sequenceText);

            const todaySession = buildTodaySession();
            clearStoredCurveSessions();

            if (!todaySession.list.length) {
                window.__memoryCurveQuizActive = false;
                window.__memoryCurveQuizQuestionIds = new Set();
                patchTodayButton();
                showFinishedToast();
                return;
            }

            const todayText = `今日应刷池${todaySession.pendingTotal}题（逾期${todaySession.pendingOverdue} + 今日到期${todaySession.pendingDueToday} + 重点复现${todaySession.pendingFocus}） · 本轮逾期${todaySession.normalOverdueCount} + 今日到期${todaySession.normalTodayCount} + 重点${todaySession.focusCount} · 今日答对后当日不再出现`;
            const finalSequence = `${sequenceText || ""}${sequenceText ? " · " : ""}${todayText}`;

            const result = baseStartQuestionSession.call(this, todaySession.list, title, finalSequence);
            if (typeof currentReviewQuestions !== "undefined") {
                currentReviewQuestions = todaySession.list.slice();
                currentQuestionIndex = 0;
                window.__memoryCurveQuizActive = true;
                window.__memoryCurveQuizQuestionIds = new Set(todaySession.list.map(question => question.id));
                if (typeof renderQuestion === "function") renderQuestion();
            }
            setTimeout(patchTodayButton, 20);
            return result;
        };
    }

    // 今天答对一次就写独立日期；即使之后别的入口再答错，今天曲线仍保持排除。
    const baseRecordAnswer = window.recordAnswer;
    if (typeof baseRecordAnswer === "function" && !window.__bankTodayDueV2RecordWrapped) {
        window.__bankTodayDueV2RecordWrapped = true;
        window.recordAnswer = function (questionId, isCorrect, ...rest) {
            const result = baseRecordAnswer.call(this, questionId, isCorrect, ...rest);
            const question = questionById(questionId);
            const record = recordOf(questionId);
            if (question && record && isBankQuestion(question) && Boolean(isCorrect)) {
                record.bankLastCorrectDate = localISO();
                saveHistory();
            }
            setTimeout(patchTodayButton, 40);
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
            questionIds: [...pools.overdue, ...pools.dueToday, ...pools.focus].map(q => q.id)
        };
    };

    window.patchBankTodayDueButton = patchTodayButton;
    setTimeout(patchTodayButton, 0);
    setTimeout(patchTodayButton, 200);
})();
