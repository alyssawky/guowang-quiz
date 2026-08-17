// 统一“国网每日记忆与刷题”首页卡片与 memory-curve.js 的累计池口径。
// 解决：当天8/9题已完整刷完，但 daily-practice.js 仍按 unlockDate < today 显示“累计0题”的旧逻辑。
(function () {
    const VERSION = 1;
    if (Number(window.__dailyCurvePoolSyncVersion || 0) >= VERSION) return;
    window.__dailyCurvePoolSyncVersion = VERSION;

    function getSummary() {
        if (typeof window.getMemoryCurvePoolSummary !== "function") return null;
        try {
            return window.getMemoryCurvePoolSummary();
        } catch (error) {
            console.warn("累计旧题同步失败", error);
            return null;
        }
    }

    function syncDailyCardWithCurvePool() {
        const card = document.getElementById("daily-practice-card");
        const summary = getSummary();
        if (!card || !summary) return;

        const total = Number(summary.total || 0);
        const due = Number(summary.due || 0);

        // 1) 顶部“累计记忆 X题”数字改为记忆曲线真实累计池。
        const count = card.querySelector(".daily-practice-count");
        if (count) {
            count.textContent = count.textContent.replace(/累计记忆\s*\d+题/, `累计记忆 ${total}题`);
        }

        // 2) 描述文字不再沿用“只有往日题才累计”的旧文案。
        const description = card.querySelector(".daily-practice-copy > p");
        if (description) {
            const replacement = total
                ? `已完整刷过的国网题已累计${total}题，可按记忆曲线正式答题复习。`
                : "目前还没有完整刷过的国网题进入累计池。";

            description.textContent = description.textContent
                .replace(/目前还没有往日旧题进入累计卡池。|旧题已累计\d+题，可随时随机回忆。|已完整刷过的国网题已累计\d+题，可按记忆曲线正式答题复习。|目前还没有完整刷过的国网题进入累计池。/, replacement)
                .replace(/记忆卡不计正确率、不进入错题本。/, "明日预习卡不计正确率、不进入错题本；累计旧题采用正式答题模式。")
                .trim();
        }

        // 3) 累计按钮按真实曲线池启用，并明确这是答题模式，不再是旧“随机记忆卡”。
        const button = document.getElementById("start-cumulative-memory");
        if (button) {
            button.disabled = total <= 0;
            button.textContent = total <= 0
                ? "暂无累计旧题"
                : due > 0
                    ? `曲线答题 · 到期${due}题`
                    : `曲线答题 · 累计${total}题`;
            button.title = total > 0
                ? `累计池${total}题；当天8/9题完整刷完后立即进入。首次重点复习按学习后+1天到期。`
                : "当天国网题整组完成后会立即进入累计池。";
        }
    }

    // 即使旧 daily-practice 的普通 click 监听仍存在，也统一导向正式记忆曲线答题。
    if (typeof window.startCurveQuiz === "function") {
        window.openCumulativeMemoryCards = window.startCurveQuiz;
    }

    // 首页任何主动重绘后，都再次用曲线池覆盖旧口径。
    const baseRenderDailyPracticeCard = window.renderDailyPracticeCard;
    if (typeof baseRenderDailyPracticeCard === "function" && !window.__dailyCurveRenderWrapped) {
        window.__dailyCurveRenderWrapped = true;
        window.renderDailyPracticeCard = function (...args) {
            const result = baseRenderDailyPracticeCard.apply(this, args);
            syncDailyCardWithCurvePool();
            return result;
        };
    }

    // 答完当天最后一题时，answerHistory 已更新；异步同步一次即可立即从0变8/9。
    const baseRecordAnswer = window.recordAnswer;
    if (typeof baseRecordAnswer === "function" && !window.__dailyCurveRecordWrapped) {
        window.__dailyCurveRecordWrapped = true;
        window.recordAnswer = function (...args) {
            const result = baseRecordAnswer.apply(this, args);
            setTimeout(syncDailyCardWithCurvePool, 0);
            return result;
        };
    }

    window.syncDailyCardWithCurvePool = syncDailyCardWithCurvePool;
    syncDailyCardWithCurvePool();
})();
