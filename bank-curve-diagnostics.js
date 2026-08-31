// 国网曲线本地数据诊断：所有统计都在用户浏览器 localStorage 内计算，不上传个人答题记录。
(function () {
    const VERSION = 1;
    if (Number(window.__bankCurveDiagnosticsVersion || 0) >= VERSION) return;
    window.__bankCurveDiagnosticsVersion = VERSION;

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

    function recordOf(id) {
        return typeof answerHistory !== "undefined" && answerHistory ? answerHistory[id] || null : null;
    }

    function curveStore() {
        return safeParse(localStorage.getItem(CURVE_STORE_KEY), {});
    }

    function answeredCorrectToday(question) {
        const record = recordOf(question.id);
        if (!record) return false;
        const today = localISO();
        return record.bankLastCorrectDate === today ||
            Boolean(record.lastCorrect === true && isoFromTimestamp(record.lastAnsweredAt) === today);
    }

    function isFocus(record) {
        return Boolean(record && (record.wrongFocusActive === true || record.memoryBlurFocusActive === true));
    }

    function report() {
        const today = localISO();
        const store = curveStore();
        const bank = Array.isArray(questions) ? questions.filter(q => isBankQuestion(q) && q.unlockDate <= today) : [];
        const answered = bank.filter(q => Number(recordOf(q.id)?.attempts || 0) > 0);
        const correctToday = answered.filter(answeredCorrectToday);
        const focus = answered.filter(q => {
            const r = recordOf(q.id);
            if (!isFocus(r) || answeredCorrectToday(q)) return false;
            if (r.focusNextEligibleDate && r.focusNextEligibleDate > today) return false;
            const touchedToday = [
                r.focusLastCurveDate,
                r.wrongFocusLastCountedDate,
                r.memoryBlurFocusLastCountedDate,
                isoFromTimestamp(r.wrongFocusLastWrongAt),
                isoFromTimestamp(r.memoryBlurFocusLastMarkedAt),
                isoFromTimestamp(r.lastMemoryBlurredAt)
            ].filter(Boolean).includes(today);
            return !touchedToday;
        });
        const normal = answered.filter(q => !isFocus(recordOf(q.id)) && !answeredCorrectToday(q));
        const overdue = normal.filter(q => String(store[q.id]?.dueDate || "") < today && Boolean(store[q.id]?.dueDate));
        const dueToday = normal.filter(q => String(store[q.id]?.dueDate || "") === today);
        const future = normal.filter(q => String(store[q.id]?.dueDate || "") > today);
        const noExplicitSchedule = normal.filter(q => !store[q.id]?.dueDate);
        const legacyImported = answered.filter(q => recordOf(q.id)?.legacyFocusImported === true);
        const legacyEligibleToday = legacyImported.filter(q => {
            const r = recordOf(q.id);
            return !answeredCorrectToday(q) && (!r.focusNextEligibleDate || r.focusNextEligibleDate <= today);
        });

        const currentPool = typeof window.getBankTodayDuePool === "function"
            ? window.getBankTodayDuePool()
            : null;

        return {
            date: today,
            unlockedAnswered: answered.length,
            currentTodayPool: Number(currentPool?.total || 0),
            overdue: Number(currentPool?.overdue ?? overdue.length),
            dueToday: Number(currentPool?.dueToday ?? dueToday.length),
            focus: Number(currentPool?.focus ?? focus.length),
            correctTodayExcluded: correctToday.length,
            future: future.length,
            noExplicitSchedule: noExplicitSchedule.length,
            legacyImported: legacyImported.length,
            legacyEligibleToday: legacyEligibleToday.length
        };
    }

    function ensureUI() {
        const button = document.getElementById("start-cumulative-memory");
        if (!button || document.getElementById("bank-curve-diagnostic-line")) return;

        const line = document.createElement("div");
        line.id = "bank-curve-diagnostic-line";
        line.style.cssText = "margin-top:8px;font-size:12px;line-height:1.55;color:#667085;display:flex;gap:8px;align-items:center;flex-wrap:wrap;";
        button.insertAdjacentElement("afterend", line);

        const refresh = () => {
            const r = report();
            line.innerHTML = `<span>今日池 ${r.currentTodayPool}｜逾期 ${r.overdue}｜今日到期 ${r.dueToday}｜重点 ${r.focus}｜今日已排除 ${r.correctTodayExcluded}</span><button type="button" id="bank-curve-detail-btn" style="border:0;background:transparent;padding:0;color:#4969a8;font-size:12px;cursor:pointer;text-decoration:underline;">曲线详情</button>`;
            const detail = line.querySelector("#bank-curve-detail-btn");
            if (detail) detail.onclick = () => showModal(r);
        };
        refresh();
        window.__refreshBankCurveDiagnostics = refresh;
    }

    function showModal(data) {
        let modal = document.getElementById("bank-curve-diagnostic-modal");
        if (modal) modal.remove();
        modal = document.createElement("div");
        modal.id = "bank-curve-diagnostic-modal";
        modal.style.cssText = "position:fixed;inset:0;z-index:8000;background:rgba(0,0,0,.34);display:flex;align-items:center;justify-content:center;padding:20px;";
        modal.innerHTML = `
          <div style="width:min(520px,100%);max-height:85vh;overflow:auto;background:#fff;border-radius:18px;padding:22px;box-shadow:0 18px 50px rgba(0,0,0,.22);">
            <div style="display:flex;justify-content:space-between;gap:16px;align-items:center;"><strong style="font-size:18px;">国网曲线数据详情 · ${data.date}</strong><button type="button" data-close style="border:0;background:#f1f3f5;border-radius:9px;padding:6px 10px;cursor:pointer;">关闭</button></div>
            <div style="margin-top:16px;line-height:2;color:#344054;font-size:14px;">
              <div>已实际作答并解锁：<strong>${data.unlockedAnswered}</strong> 道</div>
              <div>今天真正应刷：<strong>${data.currentTodayPool}</strong> 道</div>
              <div>其中历史逾期：<strong>${data.overdue}</strong> 道</div>
              <div>其中今日到期：<strong>${data.dueToday}</strong> 道</div>
              <div>其中错题/记忆模糊重点复现：<strong>${data.focus}</strong> 道</div>
              <div>今天已答对、已从今日池排除：<strong>${data.correctTodayExcluded}</strong> 道</div>
              <div>未来尚未到期：<strong>${data.future}</strong> 道</div>
              <div>旧记录尚无明确曲线日：<strong>${data.noExplicitSchedule}</strong> 道</div>
              <div style="margin-top:10px;padding-top:10px;border-top:1px solid #eaecf0;">旧版批量迁移识别：<strong>${data.legacyImported}</strong> 道；今天实际释放：<strong>${data.legacyEligibleToday}</strong> 道。</div>
            </div>
            <p style="margin:14px 0 0;color:#667085;font-size:12px;line-height:1.6;">这些数字只在当前浏览器本地计算，不会上传你的个人答题记录。</p>
          </div>`;
        document.body.appendChild(modal);
        modal.querySelector("[data-close]").onclick = () => modal.remove();
        modal.addEventListener("click", e => { if (e.target === modal) modal.remove(); });
    }

    window.getBankCurveDiagnostics = report;
    ensureUI();
    setTimeout(ensureUI, 100);
    setTimeout(() => window.__refreshBankCurveDiagnostics?.(), 300);
})();
