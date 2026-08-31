// 国网记忆曲线最终“今日应刷池”策略。
// 核心规则：
// 1) 曲线答题只从“今天真正该刷”的题里出题：正常曲线仅 dueDate <= 今天；绝不拿未来题补满12题。
// 2) 错题/记忆模糊题必须满足自己的跨日复现条件；每轮最多4题，维持正常曲线为主。
// 3) 任一国网题今天只要已经答对过一次，今天后续所有曲线回合都排除，不得再次出现。
// 4) 今天答错/标记记忆模糊的重点题也不在当天反复出现，最早次日再复现。
// 5) 今日应刷池不足12题就少出；为0时显示“今日曲线已完成”，绝不借未来题凑数。
(function () {
    const VERSION = 1;
    if (Number(window.__bankTodayDuePoolVersion || 0) >= VERSION) return;
    window.__bankTodayDuePoolVersion = VERSION;

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

    // 新版会在每次答对时写 bankLastCorrectDate。
    // 为兼容升级前“今天最后一次作答就是正确”的记录，也用 lastCorrect + lastAnsweredAt 做一次推断。
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

    function normalDueToday(question) {
        const record = recordOf(question.id);
        if (isFocusRecord(record)) return false;
        if (answeredCorrectToday(question)) return false;
        const schedule = scheduleFor(question);
        return Boolean(schedule && schedule.dueDate && schedule.dueDate <= localISO());
    }

    function normalUrgency(question) {
        const schedule = scheduleFor(question);
        const due = String(schedule?.dueDate || "");
        const today = localISO();
        if (!due) return 0;
        const a = new Date(`${due}T00:00:00`);
        const b = new Date(`${today}T00:00:00`);
        const overdueDays = Math.max(0, Math.round((b - a) / 86400000));
        const level = Math.max(0, Math.min(INTERVALS.length - 1, Number(schedule.level || 0)));
        return 100 + overdueDays * 25 + (INTERVALS.length - level) * 2;
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
        const normal = pool.filter(normalDueToday);
        return { focus, normal };
    }

    function buildTodaySession() {
        const pools = todayPools();
        const focus = pools.focus.slice(0, FOCUS_LIMIT);
        const normalTarget = Math.max(0, SESSION_LIMIT - focus.length);
        const normal = weightedSample(pools.normal, normalTarget);
        return {
            list: [...focus, ...normal],
            focusCount: focus.length,
            normalCount: normal.length,
            pendingTotal: pools.focus.length + pools.normal.length,
            pendingFocus: pools.focus.length,
            pendingNormal: pools.normal.length
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
        const total = pools.focus.length + pools.normal.length;
        button.disabled = total === 0;
        button.textContent = total > 0 ? `今日曲线 · 待刷${total}题` : "今日曲线已完成";
        button.title = total > 0
            ? `今天真正到期/应复现 ${total} 题：正常曲线 ${pools.normal.length} 题，错题/记忆模糊 ${pools.focus.length} 题。每轮最多12题；今天已答对的题不会再次出现，也不会用未来题补满。`
            : "今天没有剩余到期题或重点复现题；不会提前抽取未来题。";
    }

    function showFinishedToast() {
        let toast = document.getElementById("today-curve-finished-toast");
        if (!toast) {
            toast = document.createElement("div");
            toast.id = "today-curve-finished-toast";
            toast.style.cssText = "position:fixed;right:24px;bottom:24px;z-index:6000;padding:12px 16px;border:1px solid #b9d9c1;border-radius:12px;background:#f8fdf9;color:#286239;font-size:13px;font-weight:700;box-shadow:0 12px 34px rgba(30,80,45,.14);";
            document.body.appendChild(toast);
        }
        toast.textContent = "今日曲线已完成 · 不提前抽取未来题";
        clearTimeout(window.__todayCurveFinishedToastTimer);
        window.__todayCurveFinishedToastTimer = setTimeout(() => toast.remove(), 2600);
    }

    // 最后加载：无论前面的 memory-curve / 错题引擎 / 8:4 策略传进来什么题，
    // 真正启动曲线会话时都重新按“今日应刷池”计算。
    const baseStartQuestionSession = window.startQuestionSession;
    if (typeof baseStartQuestionSession === "function" && !window.__bankTodayDueStartWrapped) {
        window.__bankTodayDueStartWrapped = true;
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

            const todayText = `今日应刷池${todaySession.pendingTotal}题（正常到期${todaySession.pendingNormal} + 重点复现${todaySession.pendingFocus}） · 本轮正常${todaySession.normalCount} + 重点${todaySession.focusCount} · 已答对题今日不再出现`;
            const finalSequence = `${sequenceText || ""}${sequenceText ? " · " : ""}${todayText}`;

            // 下层旧的8:4包装器可能会重新生成题序，因此调用后再强制恢复为严格今日题池。
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

    // 任意国网题只要今天答对，写入独立日期字段；这样即使之后别的入口又答错，
    // 系统仍知道“今天已经正确过”，不会在当天下一轮曲线重新抽到。
    const baseRecordAnswer = window.recordAnswer;
    if (typeof baseRecordAnswer === "function" && !window.__bankTodayDueRecordWrapped) {
        window.__bankTodayDueRecordWrapped = true;
        window.recordAnswer = function (questionId, isCorrect, ...rest) {
            const result = baseRecordAnswer.call(this, questionId, isCorrect, ...rest);
            const question = questionById(questionId);
            const record = recordOf(questionId);
            if (question && record && isBankQuestion(question) && Boolean(isCorrect)) {
                record.bankLastCorrectDate = localISO();
                saveHistory();
            }
            // memory-curve 的旧 patchButton 也会 setTimeout(0) 更新按钮，所以这里稍后再次覆盖为“今日剩余”。
            setTimeout(patchTodayButton, 30);
            return result;
        };
    }

    window.getBankTodayDuePool = function () {
        const pools = todayPools();
        return {
            date: localISO(),
            total: pools.focus.length + pools.normal.length,
            normal: pools.normal.length,
            focus: pools.focus.length,
            questionIds: [...pools.focus, ...pools.normal].map(question => question.id)
        };
    };

    window.buildBankTodayCurveSession = buildTodaySession;

    // DOM加载及旧模块刷新后都再覆盖一次按钮文案。
    patchTodayButton();
    setTimeout(patchTodayButton, 0);
    setTimeout(patchTodayButton, 200);
})();
