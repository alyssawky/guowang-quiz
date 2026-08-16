// 首页顶部：今日必刷题
// 直接使用“10月前必学300题”每道题的 unlockDate，按原计划逐日给出8/9道。
(function () {
    if (!document.querySelector('link[data-daily-practice-style]')) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "daily-practice.css?v=20260816-1";
        link.dataset.dailyPracticeStyle = "true";
        document.head.appendChild(link);
    }

    function initDailyPractice() {
        if (window.__dailyPracticeInstalled) return;
        window.__dailyPracticeInstalled = true;

        function toLocalISO(date = new Date()) {
            const y = date.getFullYear();
            const m = String(date.getMonth() + 1).padStart(2, "0");
            const d = String(date.getDate()).padStart(2, "0");
            return `${y}-${m}-${d}`;
        }

        function isRequiredBankQuestion(question) {
            return Boolean(
                question &&
                question.unlockDate &&
                (question.sourceSet === "10月前必学300题" || String(question.taskId || "").startsWith("preoct300-w"))
            );
        }

        function getQuestionsForDate(dateString) {
            return questions.filter(question =>
                isRequiredBankQuestion(question) && question.unlockDate === dateString
            );
        }

        function hasBeenAnswered(question) {
            return Boolean(answerHistory[question.id] && Number(answerHistory[question.id].attempts || 0) > 0);
        }

        function getNextPlannedDay(afterDateString) {
            const futureDates = [...new Set(
                questions
                    .filter(isRequiredBankQuestion)
                    .map(question => question.unlockDate)
                    .filter(date => date > afterDateString)
            )].sort();

            if (!futureDates.length) return null;
            const date = futureDates[0];
            return { date, count: getQuestionsForDate(date).length };
        }

        function formatCNDate(dateString) {
            const date = parseLocalDate(dateString);
            if (!date) return dateString;
            const weekdays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
            return `${date.getMonth() + 1}月${date.getDate()}日 · ${weekdays[date.getDay()]}`;
        }

        function getDailyState() {
            const today = toLocalISO();
            const all = getQuestionsForDate(today);
            const completed = all.filter(hasBeenAnswered);
            const remaining = all.filter(question => !hasBeenAnswered(question));
            return { today, all, completed, remaining, next: getNextPlannedDay(today) };
        }

        function startDailyPractice() {
            const state = getDailyState();
            if (!state.all.length) return;

            const sessionQuestions = state.remaining.length
                ? shuffleArray(state.remaining)
                : shuffleArray(state.all);

            const title = state.remaining.length
                ? "今日必刷题"
                : "今日必刷题 · 重刷";

            const sequenceText = state.remaining.length
                ? `${formatCNDate(state.today)} · 今日计划${state.all.length}题 · 剩余${state.remaining.length}题`
                : `${formatCNDate(state.today)} · 今日${state.all.length}题已全部做过，本轮重新练习`;

            startQuestionSession(sessionQuestions, title, sequenceText);

            const chooser = document.getElementById("review-section-chooser");
            if (chooser) chooser.hidden = true;
        }

        function renderDailyPracticeCard() {
            let card = document.getElementById("daily-practice-card");
            const main = document.querySelector("main");
            if (!main) return;

            if (!card) {
                card = document.createElement("section");
                card.id = "daily-practice-card";
                card.className = "daily-practice-card";
                main.insertBefore(card, main.firstChild);
            }

            const state = getDailyState();

            if (!state.all.length) {
                const nextText = state.next
                    ? `下一次：${formatCNDate(state.next.date)} · ${state.next.count}题`
                    : "本阶段每日必刷题已经全部安排完毕";

                card.innerHTML = `
                    <div class="daily-practice-copy">
                        <div class="daily-practice-kicker">DAILY PRACTICE</div>
                        <div class="daily-practice-title-row">
                            <h2>今日必刷题</h2>
                            <span class="daily-practice-count">今日0题</span>
                        </div>
                        <p>今天没有安排新的国网必刷题。${nextText}</p>
                    </div>
                    <button type="button" class="daily-practice-button" disabled>今日无新题</button>
                `;
                return;
            }

            const done = state.completed.length;
            const total = state.all.length;
            const percent = Math.round((done / total) * 100);
            const buttonText = state.remaining.length
                ? (done ? `继续今日任务 · ${state.remaining.length}题` : `开始今日${total}题`)
                : `重刷今日${total}题`;

            card.innerHTML = `
                <div class="daily-practice-copy">
                    <div class="daily-practice-kicker">DAILY PRACTICE</div>
                    <div class="daily-practice-title-row">
                        <h2>今日必刷题</h2>
                        <span class="daily-practice-count">${done}/${total} 已完成</span>
                    </div>
                    <p>${formatCNDate(state.today)} · 原计划今日${total}题${state.remaining.length ? ` · 还剩${state.remaining.length}题` : " · 今日任务已完成"}</p>
                    <div class="daily-practice-progress" aria-label="今日刷题进度">
                        <span style="width:${percent}%"></span>
                    </div>
                </div>
                <button type="button" class="daily-practice-button" id="start-daily-practice">${buttonText}</button>
            `;

            const button = document.getElementById("start-daily-practice");
            if (button) button.addEventListener("click", startDailyPractice);
        }

        // 每次答案记录后刷新今日进度。
        const originalRecordAnswer = window.recordAnswer;
        if (typeof originalRecordAnswer === "function") {
            window.recordAnswer = function (...args) {
                const result = originalRecordAnswer.apply(this, args);
                renderDailyPracticeCard();
                return result;
            };
        }

        window.renderDailyPracticeCard = renderDailyPracticeCard;
        window.startDailyPractice = startDailyPractice;
        renderDailyPracticeCard();
    }

    if (document.readyState === "loading") {
        window.addEventListener("DOMContentLoaded", initDailyPractice, { once: true });
    } else {
        initDailyPractice();
    }
})();
