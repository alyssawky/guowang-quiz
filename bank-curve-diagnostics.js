// 国网曲线本地数据诊断 v2：所有统计都在用户浏览器 localStorage 内计算，不上传个人答题记录。
// v2 修复：国网首页卡片重绘后自动重新挂载；诊断条固定显示在整排曲线/预习/必刷按钮下方。
(function () {
    const VERSION = 2;
    if (Number(window.__bankCurveDiagnosticsVersion || 0) >= VERSION) return;
    window.__bankCurveDiagnosticsVersion = VERSION;

    const CURVE_STORE_KEY = "guowang-memory-curve-v2";
    const LINE_ID = "bank-curve-diagnostic-line";
    const MODAL_ID = "bank-curve-diagnostic-modal";

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
        const bank = Array.isArray(questions)
            ? questions.filter(q => isBankQuestion(q) && q.unlockDate <= today)
            : [];
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

    function installStyle() {
        if (document.getElementById("bank-curve-diagnostics-style")) return;
        const style = document.createElement("style");
        style.id = "bank-curve-diagnostics-style";
        style.textContent = `
            #${LINE_ID} {
                margin-top: 10px;
                padding: 9px 12px;
                border: 1px solid #e4e7ec;
                border-radius: 10px;
                background: #f8f9fb;
                color: #667085;
                font-size: 12px;
                line-height: 1.55;
                display: flex;
                gap: 8px;
                align-items: center;
                justify-content: space-between;
                flex-wrap: wrap;
                width: 100%;
                box-sizing: border-box;
            }
            #${LINE_ID} .bank-curve-diagnostic-summary { min-width: 0; }
            #${LINE_ID} .bank-curve-detail-btn {
                border: 0;
                background: transparent;
                padding: 2px 0;
                color: #4969a8;
                font-size: 12px;
                font-weight: 650;
                cursor: pointer;
                text-decoration: underline;
                white-space: nowrap;
            }
        `;
        document.head.appendChild(style);
    }

    function showModal(data) {
        let modal = document.getElementById(MODAL_ID);
        if (modal) modal.remove();

        modal = document.createElement("div");
        modal.id = MODAL_ID;
        modal.style.cssText = "position:fixed;inset:0;z-index:8000;background:rgba(0,0,0,.34);display:flex;align-items:center;justify-content:center;padding:20px;";
        modal.innerHTML = `
          <div style="width:min(540px,100%);max-height:85vh;overflow:auto;background:#fff;border-radius:18px;padding:22px;box-shadow:0 18px 50px rgba(0,0,0,.22);">
            <div style="display:flex;justify-content:space-between;gap:16px;align-items:center;">
              <strong style="font-size:18px;">国网曲线数据详情 · ${data.date}</strong>
              <button type="button" data-close style="border:0;background:#f1f3f5;border-radius:9px;padding:6px 10px;cursor:pointer;">关闭</button>
            </div>
            <div style="margin-top:16px;line-height:2;color:#344054;font-size:14px;">
              <div>已实际作答并解锁：<strong>${data.unlockedAnswered}</strong> 道</div>
              <div>今天真正应刷：<strong>${data.currentTodayPool}</strong> 道</div>
              <div>其中历史逾期：<strong>${data.overdue}</strong> 道</div>
              <div>其中今日到期：<strong>${data.dueToday}</strong> 道</div>
              <div>其中错题/记忆模糊重点复现：<strong>${data.focus}</strong> 道</div>
              <div>今天已答对、已从今日池排除：<strong>${data.correctTodayExcluded}</strong> 道</div>
              <div>未来尚未到期：<strong>${data.future}</strong> 道</div>
              <div>旧记录尚无明确曲线日：<strong>${data.noExplicitSchedule}</strong> 道</div>
              <div style="margin-top:10px;padding-top:10px;border-top:1px solid #eaecf0;">
                旧版批量迁移识别：<strong>${data.legacyImported}</strong> 道；今天实际释放：<strong>${data.legacyEligibleToday}</strong> 道。
              </div>
            </div>
            <p style="margin:14px 0 0;color:#667085;font-size:12px;line-height:1.6;">这些数字只在当前浏览器本地计算，不会上传你的个人答题记录。</p>
          </div>`;

        document.body.appendChild(modal);
        const close = modal.querySelector("[data-close]");
        if (close) close.onclick = () => modal.remove();
        modal.addEventListener("click", event => {
            if (event.target === modal) modal.remove();
        });
    }

    function getAnchor() {
        const button = document.getElementById("start-cumulative-memory");
        if (!button) return null;
        return button.closest(".daily-practice-actions") || button.parentElement || button;
    }

    function createLine() {
        installStyle();
        const line = document.createElement("div");
        line.id = LINE_ID;
        line.setAttribute("role", "status");
        line.setAttribute("aria-live", "polite");
        return line;
    }

    function renderLine(line) {
        if (!line) return;
        const r = report();
        line.innerHTML = `
            <span class="bank-curve-diagnostic-summary">今日池 <strong>${r.currentTodayPool}</strong>｜逾期 <strong>${r.overdue}</strong>｜今日到期 <strong>${r.dueToday}</strong>｜重点 <strong>${r.focus}</strong>｜今日已排除 <strong>${r.correctTodayExcluded}</strong></span>
            <button type="button" class="bank-curve-detail-btn">曲线详情</button>
        `;
        const detail = line.querySelector(".bank-curve-detail-btn");
        if (detail) detail.onclick = () => showModal(report());
    }

    function mountAndRefresh() {
        const anchor = getAnchor();
        if (!anchor || !anchor.parentNode) return false;

        let line = document.getElementById(LINE_ID);
        if (!line) line = createLine();

        if (!line.isConnected || line.previousElementSibling !== anchor) {
            anchor.insertAdjacentElement("afterend", line);
        }

        renderLine(line);
        return true;
    }

    window.getBankCurveDiagnostics = report;
    window.__refreshBankCurveDiagnostics = mountAndRefresh;

    // 直接接管首页国网卡片的重绘完成点：每次卡片 innerHTML 重建后，立即把诊断条重新挂回去。
    const baseRenderDailyPracticeCard = window.renderDailyPracticeCard;
    if (typeof baseRenderDailyPracticeCard === "function" && !window.__bankCurveDiagnosticsRenderWrapped) {
        window.__bankCurveDiagnosticsRenderWrapped = true;
        window.renderDailyPracticeCard = function (...args) {
            const result = baseRenderDailyPracticeCard.apply(this, args);
            setTimeout(mountAndRefresh, 0);
            return result;
        };
    }

    // 首次加载和异步模块加载后的兜底。
    mountAndRefresh();
    [0, 50, 150, 350, 800, 1600].forEach(delay => setTimeout(mountAndRefresh, delay));
})();
