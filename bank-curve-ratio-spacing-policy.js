// 国网记忆曲线 12 题配比 + 错题/模糊题跨日间隔策略。
// 核心规则：
// 1) 每轮最多12题；重点错题/记忆模糊题最多4题（1/3），其余全部来自正常记忆曲线。
// 2) 重点题不足4题时不硬凑：例如2道重点 -> 10道正常；0道重点 -> 12道正常。
// 3) 同一道重点题同一天最多复现1次；当天答错/记忆模糊/重点复习后，最早次日再进入重点复现。
// 4) “连续3次正确”必须发生在3个不同日期；同一天重复答对只算1次。
// 5) 历史错题/模糊次数保留；只控制当前重点复习节奏。
(function () {
    const VERSION = 1;
    if (Number(window.__bankCurveRatioSpacingVersion || 0) >= VERSION) return;
    window.__bankCurveRatioSpacingVersion = VERSION;

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

    function parseDate(value) {
        if (typeof window.parseLocalDate === "function") return window.parseLocalDate(value);
        const [y, m, d] = String(value || "").split("-").map(Number);
        return new Date(y, m - 1, d);
    }

    function dayDiff(fromString, toString) {
        const from = parseDate(fromString);
        const to = parseDate(toString);
        if (!from || !to || Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return 0;
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

    function recordOf(questionId) {
        return (typeof answerHistory !== "undefined" && answerHistory)
            ? answerHistory[questionId] || null
            : null;
    }

    function saveHistory() {
        if (typeof window.saveAnswerHistory === "function") window.saveAnswerHistory();
        else if (typeof saveAnswerHistory === "function") saveAnswerHistory();
    }

    function isFocusRecord(record) {
        return Boolean(record && (
            record.wrongFocusActive === true ||
            record.memoryBlurFocusActive === true
        ));
    }

    function formallyAnswered(question) {
        const r = recordOf(question.id);
        return Boolean(r && Number(r.attempts || 0) > 0);
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

    function normalWeight(question) {
        const schedule = scheduleFor(question);
        const daysUntil = dayDiff(localISO(), schedule.dueDate);
        const level = Math.max(0, Math.min(INTERVALS.length - 1, Number(schedule.level || 0)));
        const earlyBoost = 1 + (INTERVALS.length - 1 - level) * 0.12;
        let urgency;
        if (daysUntil < 0) urgency = 12 + Math.min(18, Math.abs(daysUntil) * 2);
        else if (daysUntil === 0) urgency = 10;
        else if (daysUntil === 1) urgency = 3.5;
        else if (daysUntil <= 3) urgency = 1.8;
        else if (daysUntil <= 7) urgency = 0.8;
        else urgency = 0.28;
        return Math.max(0.01, urgency * earlyBoost);
    }

    function weightedSample(list, count) {
        const pool = list.slice();
        const result = [];
        while (pool.length && result.length < count) {
            const weights = pool.map(normalWeight);
            const total = weights.reduce((sum, value) => sum + value, 0);
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

    function focusWasTouchedToday(record) {
        const today = localISO();
        if (!record) return false;
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
        if (!isFocusRecord(record)) return false;
        const today = localISO();
        if (question.unlockDate && question.unlockDate > today) return false;
        if (record.focusNextEligibleDate && record.focusNextEligibleDate > today) return false;
        if (focusWasTouchedToday(record)) return false;
        return true;
    }

    function eligibleFocusPool(pool) {
        const learnedIds = new Set(pool.map(question => question.id));
        return questions
            .filter(question => learnedIds.has(question.id) && focusEligibleToday(question))
            .sort((a, b) => focusScore(b) - focusScore(a));
    }

    function buildRatioSession() {
        const pool = learnedPool();
        if (!pool.length) return { list: [], focusCount: 0, normalCount: 0 };

        const focusCandidates = eligibleFocusPool(pool);
        const focus = focusCandidates.slice(0, FOCUS_LIMIT);
        const focusIds = new Set(focus.map(question => question.id));

        // 所有仍处于重点状态的题都不进入“正常曲线”份额；避免一题既算重点又被正常份额重复抽中。
        const normalCandidates = pool.filter(question => {
            const record = recordOf(question.id);
            return !isFocusRecord(record) && !focusIds.has(question.id);
        });

        const normalTarget = Math.max(0, SESSION_LIMIT - focus.length);
        const normal = weightedSample(normalCandidates, normalTarget);

        // 极早期如果正常池不足，不用当天重复重点题来硬凑12道；宁可本轮少于12道。
        const list = [...focus, ...normal];
        return { list, focusCount: focus.length, normalCount: normal.length };
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

    // 最后加载，覆盖前面“所有重点题强制塞入本轮”的旧行为。
    // 先让旧会话逻辑执行，再把实际题序强制改回本策略的 8:4（重点最多4）结果。
    const baseStartQuestionSession = window.startQuestionSession;
    if (typeof baseStartQuestionSession === "function" && !window.__bankCurveRatioStartWrapped) {
        window.__bankCurveRatioStartWrapped = true;
        window.startQuestionSession = function (questionList, title, sequenceText = "") {
            const isCurve = String(title || "").includes("记忆曲线答题");
            if (!isCurve) return baseStartQuestionSession.call(this, questionList, title, sequenceText);

            const ratio = buildRatioSession();
            if (!ratio.list.length) return baseStartQuestionSession.call(this, questionList, title, sequenceText);

            clearStoredCurveSessions();
            const ratioText = `配比：正常曲线${ratio.normalCount}题 + 错题/模糊题${ratio.focusCount}题（重点上限4题，同题跨日复现）`;
            const finalSequence = `${sequenceText || ""}${sequenceText ? " · " : ""}${ratioText}`;
            const result = baseStartQuestionSession.call(this, ratio.list, title, finalSequence);

            // 前置旧模块可能再次把重点题塞满；这里以最终策略为准重置实际会话题序。
            if (typeof currentReviewQuestions !== "undefined") {
                currentReviewQuestions = ratio.list.slice();
                currentQuestionIndex = 0;
                window.__memoryCurveQuizActive = true;
                window.__memoryCurveQuizQuestionIds = new Set(ratio.list.map(question => question.id));
                if (typeof renderQuestion === "function") renderQuestion();
            }
            return result;
        };
    }

    // 跨日连续正确保护：在旧错题/记忆模糊引擎之前暂时关闭“今天已计数”的重点状态，
    // 防止同一天第二次答对把 1/3 误加成 2/3；普通 correct 统计仍正常记录。
    const baseRecordAnswer = window.recordAnswer;
    if (typeof baseRecordAnswer === "function" && !window.__bankCurveSpacingRecordWrapped) {
        window.__bankCurveSpacingRecordWrapped = true;
        window.recordAnswer = function (questionId, isCorrect, ...rest) {
            const record = recordOf(questionId);
            const today = localISO();
            const wasWrongFocus = Boolean(record?.wrongFocusActive === true);
            const wasBlurFocus = Boolean(record?.memoryBlurFocusActive === true);
            const suppressWrong = Boolean(isCorrect && wasWrongFocus && record?.wrongFocusLastCountedDate === today);
            const suppressBlur = Boolean(isCorrect && wasBlurFocus && record?.memoryBlurFocusLastCountedDate === today);

            if (suppressWrong) record.wrongFocusActive = false;
            if (suppressBlur) record.memoryBlurFocusActive = false;

            const result = baseRecordAnswer.call(this, questionId, isCorrect, ...rest);
            const latest = recordOf(questionId);
            if (!latest) return result;

            if (suppressWrong && latest.wrongFocusActive !== true) latest.wrongFocusActive = true;
            if (suppressBlur && latest.memoryBlurFocusActive !== true) latest.memoryBlurFocusActive = true;

            if (Boolean(isCorrect)) {
                if (wasWrongFocus && !suppressWrong) latest.wrongFocusLastCountedDate = today;
                if (wasBlurFocus && !suppressBlur) latest.memoryBlurFocusLastCountedDate = today;
            } else {
                // 任意错误（包括“记忆模糊”内部记录的错误）都最早次日再作为重点题出现。
                if (wasWrongFocus || wasBlurFocus || isFocusRecord(latest)) {
                    latest.focusNextEligibleDate = addDaysISO(today, 1);
                }
            }

            const inCurve = Boolean(
                window.__memoryCurveQuizActive &&
                window.__memoryCurveQuizQuestionIds instanceof Set &&
                window.__memoryCurveQuizQuestionIds.has(questionId)
            );
            if (inCurve && (wasWrongFocus || wasBlurFocus || isFocusRecord(latest))) {
                latest.focusLastCurveDate = today;
                latest.focusNextEligibleDate = addDaysISO(today, 1);
            }

            saveHistory();
            return result;
        };
    }

    window.getBankCurveRatioPolicy = function () {
        const ratio = buildRatioSession();
        return {
            sessionLimit: SESSION_LIMIT,
            focusLimit: FOCUS_LIMIT,
            normalCount: ratio.normalCount,
            focusCount: ratio.focusCount
        };
    };
})();
