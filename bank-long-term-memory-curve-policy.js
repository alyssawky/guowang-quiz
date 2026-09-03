// 国网固定长期记忆曲线统一策略。
// 正常曲线：1 → 2 → 4 → 7 → 15 → 30 → 60 → 90 天，90天封顶循环。
// 错题/记忆模糊重点不再“每天必出”：
//   刚答错/再次模糊 → 次日复现；重点正确1/3 → 2天后；重点正确2/3 → 4天后；重点正确3/3 → 退出重点。
// 完全恢复后，原曲线已到30/60/90天档则回15天档，否则回7天档，再重新向30/60/90天推进。
(function () {
    const VERSION = 3;
    if (Number(window.__bankLongTermMemoryCurveVersion || 0) >= VERSION) return;
    window.__bankLongTermMemoryCurveVersion = VERSION;

    const STORE_KEY = "guowang-memory-curve-v2";
    const INTERVALS = [1, 2, 4, 7, 15, 30, 60, 90];
    const FOCUS_INTERVALS = { 0: 1, 1: 2, 2: 4 }; // 错/模糊后1天，1/3后2天，2/3后4天
    const RECOVERY_SHORT_LEVEL = 3; // 7天
    const RECOVERY_LONG_LEVEL = 4;  // 15天
    const LONG_LEVEL_THRESHOLD = 5; // 原来已到30天及以上

    window.BANK_LONG_TERM_INTERVALS = INTERVALS.slice();
    window.BANK_FOCUS_REMEDIATION_INTERVALS = { ...FOCUS_INTERVALS };

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

    function activeFocusProgress(record) {
        if (!record) return 0;
        const streaks = [];
        if (record.wrongFocusActive === true) streaks.push(Math.max(0, Number(record.wrongFocusStreak || 0)));
        if (record.memoryBlurFocusActive === true) streaks.push(Math.max(0, Number(record.memoryBlurFocusStreak || 0)));
        if (!streaks.length) return 0;
        // 如果同一道题同时是“错题重点”和“模糊重点”，按较低进度安排，避免过早解除验证。
        return Math.min(...streaks);
    }

    function focusIntervalDays(progress) {
        if (progress >= 2) return FOCUS_INTERVALS[2];
        if (progress >= 1) return FOCUS_INTERVALS[1];
        return FOCUS_INTERVALS[0];
    }

    function writeFocusSchedule(questionId, progress, source) {
        const today = localISO();
        const days = focusIntervalDays(progress);
        const nextDate = addDaysISO(today, days);
        const record = recordOf(questionId);
        if (record) {
            record.focusNextEligibleDate = nextDate;
            record.focusSpacingDays = days;
            record.focusSpacingProgress = progress;
        }

        const store = loadStore();
        const old = store[questionId] || {};
        store[questionId] = {
            ...old,
            level: clampLevel(old.level || 0),
            dueDate: nextDate,
            lastReviewedDate: today,
            source,
            focus: true,
            wrongFocus: Boolean(record?.wrongFocusActive === true),
            longTermCurve: true
        };
        saveStore(store);
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

        const record = recordOf(questionId);
        if (record) {
            delete record.focusNextEligibleDate;
            delete record.focusSpacingDays;
            delete record.focusSpacingProgress;
        }
    }

    function recoveryLevel(originLevel) {
        return clampLevel(originLevel) >= LONG_LEVEL_THRESHOLD
            ? RECOVERY_LONG_LEVEL
            : RECOVERY_SHORT_LEVEL;
    }

    function patchCurveButton() {
        const button = document.getElementById("start-cumulative-memory");
        if (!button) return;
        const marker = "长期曲线 1→2→4→7→15→30→60→90天；重点验证 1→2→4天";
        const title = String(button.title || "")
            .replace(/\n?长期曲线 1→2→4→7→15→30→60→90天；重点验证 1→2→4天/g, "")
            .replace(/\n?长期曲线 1→2→4→7→15→30→60→90天/g, "");
        button.title = `${title}${title ? "\n" : ""}${marker}`;
    }

    // 最外层记录包装器：统一长期曲线 + 重点题递增验证间隔。
    const baseRecordAnswer = window.recordAnswer;
    if (typeof baseRecordAnswer === "function" && !window.__bankLongTermRecordWrappedV3) {
        window.__bankLongTermRecordWrappedV3 = true;
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

            if (!Boolean(isCorrect) && !wasAnyFocus && beforeRecord) {
                if (!Number.isFinite(Number(beforeRecord.focusOriginCurveLevel))) {
                    beforeRecord.focusOriginCurveLevel = beforeLevel;
                }
            }

            const suppressWrong = Boolean(isCorrect && wasWrongFocus && countedWrongToday(beforeRecord, today));
            const suppressBlur = Boolean(isCorrect && wasBlurFocus && countedBlurToday(beforeRecord, today));
            if (suppressWrong && beforeRecord) beforeRecord.wrongFocusActive = false;
            if (suppressBlur && beforeRecord) beforeRecord.memoryBlurFocusActive = false;

            const result = baseRecordAnswer.call(this, questionId, isCorrect, ...rest);
            const record = recordOf(questionId);
            if (!record) return result;

            if (suppressWrong) record.wrongFocusActive = true;
            if (suppressBlur) record.memoryBlurFocusActive = true;

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
            } else if (stillFocus) {
                if (!Boolean(isCorrect)) {
                    // 新错误/再次模糊：进度被旧引擎重置为0，次日再验证。
                    writeFocusSchedule(questionId, 0, "focus-remediation-after-error");
                } else if (!suppressWrong && !suppressBlur) {
                    // 1/3正确后隔2天，2/3正确后隔4天；不再每天重复。
                    const progress = activeFocusProgress(record);
                    writeFocusSchedule(questionId, progress, "focus-remediation-spaced-correct");
                }
            } else if (Boolean(isCorrect) && !wasAnyFocus) {
                const level = inCurve
                    ? Math.min(beforeLevel + 1, INTERVALS.length - 1)
                    : beforeLevel;
                writeNormalSchedule(questionId, level, inCurve ? "long-term-curve" : "long-term-formal");
            }

            saveHistory();
            setTimeout(patchCurveButton, 80);
            if (typeof window.refreshBankTodayCurveButton === "function") {
                setTimeout(window.refreshBankTodayCurveButton, 90);
            }
            if (typeof window.__refreshBankCurveDiagnostics === "function") {
                setTimeout(window.__refreshBankCurveDiagnostics, 100);
            }
            return result;
        };
    }

    const baseStartQuestionSession = window.startQuestionSession;
    if (typeof baseStartQuestionSession === "function" && !window.__bankLongTermStartWrappedV3) {
        window.__bankLongTermStartWrappedV3 = true;
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
                if (!finalSequence.includes("重点验证：1→2→4天")) {
                    finalSequence = `${finalSequence}${finalSequence ? " · " : ""}重点验证：1→2→4天`;
                }
            }
            return baseStartQuestionSession.call(this, questionList, title, finalSequence);
        };
    }

    window.getBankLongTermMemoryCurvePolicy = function () {
        return {
            intervals: INTERVALS.slice(),
            ceilingDays: 90,
            focusIntervals: [1, 2, 4],
            focusRule: "错/模糊后1天；1/3正确后2天；2/3正确后4天；3/3退出重点",
            recoveryFromShortLevelDays: INTERVALS[RECOVERY_SHORT_LEVEL],
            recoveryFromLongLevelDays: INTERVALS[RECOVERY_LONG_LEVEL],
            longLevelThresholdDays: INTERVALS[LONG_LEVEL_THRESHOLD]
        };
    };

    patchCurveButton();
    setTimeout(patchCurveButton, 0);
    setTimeout(patchCurveButton, 250);
})();
