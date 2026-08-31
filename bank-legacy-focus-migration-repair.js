// 国网旧错题/旧记忆模糊迁移修复。
// 目的：旧版本曾把所有历史 wrong>0 / memoryBlurred>0 统一强制成“30天前逾期”的重点题，
// 会在升级当天制造巨大的假 backlog。本模块只修复“由迁移产生、且此后没有真实再次答错/再次标记模糊”的记录。
// 真正的新错题/新模糊题，以及已经开始 1/3、2/3 巩固的题，不会被重置。
(function () {
    const VERSION = 1;
    if (Number(window.__bankLegacyFocusMigrationRepairVersion || 0) >= VERSION) return;
    window.__bankLegacyFocusMigrationRepairVersion = VERSION;

    const DAILY_LEGACY_FOCUS_QUOTA = 4;
    const CURVE_STORE_KEY = "guowang-memory-curve-v2";

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

    function addDaysISO(dateString, days) {
        const [y, m, d] = String(dateString || localISO()).split("-").map(Number);
        const date = new Date(y, m - 1, d);
        date.setDate(date.getDate() + days);
        return localISO(date);
    }

    function isoFromTimestamp(value) {
        return value ? localISO(new Date(value)) : "";
    }

    function taskOf(question) {
        if (!question || typeof studyPlan === "undefined") return null;
        return studyPlan.find(task => task.id === question.taskId) || null;
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

    function saveCurveStore(store) {
        localStorage.setItem(CURVE_STORE_KEY, JSON.stringify(store || {}));
    }

    function lifetimeWrong(record) {
        return Number(record?.archivedWrong || 0) + Number(record?.wrong || 0);
    }

    function legacyWrongImported(record) {
        return Boolean(
            record &&
            record.wrongFocusActive === true &&
            Number(record.wrong || 0) > 0 &&
            !record.wrongFocusLastWrongAt
        );
    }

    function legacyBlurImported(record) {
        return Boolean(
            record &&
            record.memoryBlurFocusActive === true &&
            Number(record.memoryBlurred || 0) > 0 &&
            !record.memoryBlurFocusLastMarkedAt
        );
    }

    function hasStartedRemediation(record) {
        return Boolean(
            record?.wrongFocusLastCorrectAt ||
            record?.memoryBlurFocusLastCorrectAt ||
            Number(record?.wrongFocusStreak || 0) > 0 ||
            Number(record?.memoryBlurFocusStreak || 0) > 0
        );
    }

    function lastRemediationCorrectDate(record) {
        const dates = [
            isoFromTimestamp(record?.wrongFocusLastCorrectAt),
            isoFromTimestamp(record?.memoryBlurFocusLastCorrectAt)
        ].filter(Boolean).sort();
        return dates.length ? dates[dates.length - 1] : "";
    }

    function priority(question) {
        const record = recordOf(question.id) || {};
        return lifetimeWrong(record) * 1200 + Number(record.memoryBlurred || 0) * 1500;
    }

    if (!Array.isArray(questions) || typeof answerHistory === "undefined") return;

    const today = localISO();
    const candidates = questions
        .filter(isBankQuestion)
        .filter(question => {
            const record = recordOf(question.id);
            return legacyWrongImported(record) || legacyBlurImported(record);
        })
        .sort((a, b) => priority(b) - priority(a));

    let changed = false;
    let queueIndex = 0;
    const curveStore = loadCurveStore();

    candidates.forEach(question => {
        const record = recordOf(question.id);
        if (!record) return;

        record.legacyFocusImported = true;

        // 已经在这两天真正开始做 1/3、2/3 的题：保留进度，只确保下一次至少跨一天。
        if (hasStartedRemediation(record)) {
            const lastCorrectDate = lastRemediationCorrectDate(record);
            if (lastCorrectDate) {
                const next = addDaysISO(lastCorrectDate, 1);
                if (!record.focusNextEligibleDate || record.focusNextEligibleDate < next) {
                    record.focusNextEligibleDate = next;
                }
            }
            record.legacyFocusQueueAssigned = true;
            record.legacyFocusQueueDate = record.focusNextEligibleDate || today;
            changed = true;
            return;
        }

        // 纯粹由旧版迁移制造出来、此后从未真正进入新补救流程的题：
        // 不再全部视为“今天必须刷”，而是按错/模糊严重程度每天释放最多4道。
        if (!record.legacyFocusQueueAssigned) {
            const releaseDate = addDaysISO(today, Math.floor(queueIndex / DAILY_LEGACY_FOCUS_QUOTA));
            queueIndex += 1;
            record.focusNextEligibleDate = releaseDate;
            record.legacyFocusQueueAssigned = true;
            record.legacyFocusQueueDate = releaseDate;
            changed = true;
        }

        // 把“30天前逾期”标记改成队列来源。重点题是否今天出现由 focusNextEligibleDate 决定，
        // 不再依赖这个人为伪造的极端 dueDate。
        const old = curveStore[question.id];
        if (old && (old.source === "wrong-answer-focus" || old.source === "memory-blur-focus")) {
            curveStore[question.id] = {
                ...old,
                dueDate: record.focusNextEligibleDate || today,
                lastReviewedDate: record.lastAnsweredAt ? isoFromTimestamp(record.lastAnsweredAt) : old.lastReviewedDate,
                source: "legacy-focus-queued"
            };
            changed = true;
        }
    });

    if (changed) {
        saveHistory();
        saveCurveStore(curveStore);
    }

    window.getLegacyFocusMigrationRepairReport = function () {
        const bank = questions.filter(isBankQuestion);
        const legacy = bank.filter(question => recordOf(question.id)?.legacyFocusImported === true);
        const dueLegacy = legacy.filter(question => {
            const record = recordOf(question.id);
            return !record.focusNextEligibleDate || record.focusNextEligibleDate <= localISO();
        });
        return {
            totalLegacyImported: legacy.length,
            legacyEligibleToday: dueLegacy.length,
            dailyLegacyQuota: DAILY_LEGACY_FOCUS_QUOTA
        };
    };
})();
