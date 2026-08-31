// 国网固定长期记忆曲线统一策略。
// 正常曲线：1 → 2 → 4 → 7 → 15 → 30 → 60 → 90 天，90天封顶循环。
// 错题/记忆模糊：继续执行“跨不同日期连续答对3次”重点巩固；完全恢复后，
// 原曲线已到30/60/90天档则回15天档，否则回7天档，再重新向30/60/90天推进。
(function () {
    const VERSION = 2;
    if (Number(window.__bankLongTermMemoryCurveVersion || 0) >= VERSION) return;
    window.__bankLongTermMemoryCurveVersion = VERSION;

    const STORE_KEY = "guowang-memory-curve-v2";
    const INTERVALS = [1, 2, 4, 7, 15, 30, 60, 90];
    const RECOVERY_SHORT_LEVEL = 3; // 7天
    const RECOVERY_LONG_LEVEL = 4;  // 15天
    const LONG_LEVEL_THRESHOLD = 5; // 原来已到30天及以上

    window.BANK_LONG_TERM_INTERVALS = INTERVALS.slice();

    function safeParse(value, fallback) {
        try { return value ? JSON.parse(value) : fallback; }
        catch (error) { return fallback; }
    }

    function localISO(value = new Date()) {
        const date = value instanceof Date ? new Date(value) : new Date(value);
        if (Number.isNaN(date.getTime())) return "";
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, "0");
        const d = String(date.getDate()).padStart(2, "0");
        return `${y}-${m}-${d}`;
    }

    function isoFromTimestamp(value) {
        return value ? localISO(new Date(value)) : "";
    }

    function addDaysISO(dateString, days) {
        const parts = String(dateString || localISO()).split("-").map(Number);
        const date = new Date(parts[0], parts[1] - 1, parts[2]);
        date.setDate(date.getDate() + Number(days || 0));
        return localISO(date);
    }

    function clampLevel(value) {
        const level = Number(value);
        if (!Number.isFinite(level)) return 0;
        return Math.max(0, Math.min(INTERVALS.length - 1, Math.trunc(level)));
    }

    function taskOf(question) {
        if (!question || typeof studyPlan === "undefined") return null;
        return studyPlan.find(task => task.id === question.taskId) || null;
    }

    function isBankQuestion(question) {
        const task = taskOf(question);
        return Boolean(question && (
            String(question.taskId || "").startsWith("preoct300-w") ||
            question.sourceSet === "10月前必学300题" ||
            (task && (task.questionBank || task.category === "国网题库"))
        ));
    }

    function questionById(questionId) {
        return Array.isArray(questions) ? questions.find(question => question.id === questionId) : null;
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

    function loadStore() {
        return safeParse(localStorage.getItem(STORE_KEY), {});
    }

    function saveStore(store) {
        localStorage.setItem(STORE_KEY, JSON.stringify(store || {}));
    }

    function curveLevelBefore(question, store) {
        const scheduled = store && store[question.id];
        if (scheduled && Number.isFinite(Number(scheduled.level))) return clampLevel(scheduled.level);
        return 0;
    }

    function isFocusRecord(record) {
        return Boolean(record && (
            record.wrongFocusActive === true ||
            record.memoryBlurFocusActive === true
        ));
    }

    function countedWrongToday(record, today) {
        return Boolean(record && (
            record.wrongFocusLastCountedDate === today ||
            isoFromTimestamp(record.wrongFocusLastCorrectAt) === today
        ));
    }

    function countedBlurToday(record, today) {
        return Boolean(record && (
            record.memoryBlurFocusLastCountedDate === today ||
            isoFromTimestamp(record.memoryBlurFocusLastCorrectAt) === today
        ));
    }

    function writeNormalSchedule(questionId, level, source) {
        const today = localISO();
        const store = loadStore();
        const old = store[questionId] || {};
        const safeLevel = clampLevel(level);
        store[questionId] = {
            ...old,
            level: safeLevel,
            dueDate: addDaysISO(today, INTERVALS[safeLevel]),
            lastReviewedDate: today,
            source,
            focus: false,
            wrongFocus: false,
            longTermCurve: true
        };
        saveStore(store);
    }

    function recoveryLevel(originLevel) {
        return clampLevel(originLevel) >= LONG_LEVEL_THRESHOLD
            ? RECOVERY_LONG_LEVEL
            : RECOVERY_SHORT_LEVEL;
    }

    function patchCurveButton() {
        const button = document.getElementById("start-cumulative-memory");
        if (!button) return;
        const marker = "长期曲线 1→2→4→7→15→30→60→90天";
        const title = String(button.title || "").replace(/\n?长期曲线 1→2→4→7→15→30→60→90天/g, "");
        button.title = `${title}${title ? "\n" : ""}${marker}`;
    }

    // 最后加载、最外层记录包装器：
    // 1) 把旧6档调度最终纠正为8档；
    // 2) 捕获进入重点复习前的原曲线等级；
    // 3) 同一重点题同一天的第二次正确不再累计“3次正确”；
    // 4) 完全退出重点状态时按7/15天档恢复。
    const baseRecordAnswer = window.recordAnswer;
    if (typeof baseRecordAnswer === "function" && !window.__bankLongTermRecordWrapped) {
        window.__bankLongTermRecordWrapped = true;
        window.recordAnswer = function (questionId, isCorrect, ...rest) {
            const question = questionById(questionId);
            if (!question || !isBankQuestion(question)) {
                return baseRecordAnswer.call(this, questionId, isCorrect, ...rest);
            }

            const today = localISO();
            const beforeRecord = recordOf(questionId);
            const beforeStore = loadStore();
            const beforeLevel = curveLevelBefore(question, beforeStore);
            const inCurve = Boolean(
                window.__memoryCurveQuizActive &&
                window.__memoryCurveQuizQuestionIds instanceof Set &&
                window.__memoryCurveQuizQuestionIds.has(questionId)
            );

            const wasWrongFocus = Boolean(beforeRecord?.wrongFocusActive === true);
            const wasBlurFocus = Boolean(beforeRecord?.memoryBlurFocusActive === true);
            const wasAnyFocus = wasWrongFocus || wasBlurFocus;

            // 第一次进入本轮重点状态前，保存真正的正常曲线档位。
            if (!Boolean(isCorrect) && !wasAnyFocus && beforeRecord) {
                if (!Number.isFinite(Number(beforeRecord.focusOriginCurveLevel))) {
                    beforeRecord.focusOriginCurveLevel = beforeLevel;
                }
            }

            // 跨日三连保护：同一天已经算过一次正确，就暂时隐藏对应重点状态，
            // 防止旧引擎把同日第二次正确从1/3推进到2/3。
            const suppressWrong = Boolean(isCorrect && wasWrongFocus && countedWrongToday(beforeRecord, today));
            const suppressBlur = Boolean(isCorrect && wasBlurFocus && countedBlurToday(beforeRecord, today));
            if (suppressWrong && beforeRecord) beforeRecord.wrongFocusActive = false;
            if (suppressBlur && beforeRecord) beforeRecord.memoryBlurFocusActive = false;

            const result = baseRecordAnswer.call(this, questionId, isCorrect, ...rest);
            const record = recordOf(questionId);
            if (!record) return result;

            if (suppressWrong) record.wrongFocusActive = true;
            if (suppressBlur) record.memoryBlurFocusActive = true;

            // 首次作答就是错误时，record对象是在base内部创建的，这里补存原档位0。
            if (!Boolean(isCorrect) && isFocusRecord(record) && !Number.isFinite(Number(record.focusOriginCurveLevel))) {
                record.focusOriginCurveLevel = beforeLevel;
            }

            if (Boolean(isCorrect)) {
                if (wasWrongFocus && !suppressWrong) record.wrongFocusLastCountedDate = today;
                if (wasBlurFocus && !suppressBlur) record.memoryBlurFocusLastCountedDate = today;
            }

            const stillFocus = isFocusRecord(record);
            const fullyRecovered = Boolean(isCorrect && wasAnyFocus && !stillFocus && !suppressWrong && !suppressBlur);

            if (fullyRecovered) {
                const origin = Number.isFinite(Number(record.focusOriginCurveLevel))
                    ? clampLevel(record.focusOriginCurveLevel)
                    : beforeLevel;
                const level = recoveryLevel(origin);
                writeNormalSchedule(questionId, level, "long-term-focus-recovered");
                record.lastFocusOriginCurveLevel = origin;
                record.focusRecoveryCurveLevel = level;
                delete record.focusOriginCurveLevel;
            } else if (Boolean(isCorrect) && !stillFocus && !wasAnyFocus) {
                // 正常曲线正确：曲线会话提升一级；正式学习/其他入口维持当前档位。
                // 即使旧memory-curve在6档处把level误压回5，这里也会根据beforeLevel重新覆盖。
                const level = inCurve
                    ? Math.min(beforeLevel + 1, INTERVALS.length - 1)
                    : beforeLevel;
                writeNormalSchedule(questionId, level, inCurve ? "long-term-curve" : "long-term-formal");
            }

            saveHistory();
            setTimeout(patchCurveButton, 80);
            if (typeof window.__refreshBankCurveDiagnostics === "function") {
                setTimeout(window.__refreshBankCurveDiagnostics, 100);
            }
            return result;
        };
    }

    // 统一把答题页上的曲线说明升级为8档长期模型。
    const baseStartQuestionSession = window.startQuestionSession;
    if (typeof baseStartQuestionSession === "function" && !window.__bankLongTermStartWrapped) {
        window.__bankLongTermStartWrapped = true;
        window.startQuestionSession = function (questionList, title, sequenceText = "") {
            let finalSequence = sequenceText;
            if (String(title || "").includes("记忆曲线答题")) {
                const curveText = "1→2→4→7→15→30→60→90天";
                finalSequence = String(sequenceText || "")
                    .replace(/1→2→4→7→15→30天/g, curveText)
                    .replace(/1→2→4→7→15→30(?!→60)/g, "1→2→4→7→15→30→60→90");
                if (!finalSequence.includes("60→90")) {
                    finalSequence = `${finalSequence}${finalSequence ? " · " : ""}长期曲线：${curveText}`;
                }
            }
            return baseStartQuestionSession.call(this, questionList, title, finalSequence);
        };
    }

    window.getBankLongTermMemoryCurvePolicy = function () {
        return {
            intervals: INTERVALS.slice(),
            ceilingDays: 90,
            recoveryFromShortLevelDays: INTERVALS[RECOVERY_SHORT_LEVEL],
            recoveryFromLongLevelDays: INTERVALS[RECOVERY_LONG_LEVEL],
            longLevelThresholdDays: INTERVALS[LONG_LEVEL_THRESHOLD]
        };
    };

    patchCurveButton();
    setTimeout(patchCurveButton, 0);
    setTimeout(patchCurveButton, 250);
})();