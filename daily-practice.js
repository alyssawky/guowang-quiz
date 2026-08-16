// 首页顶部：今日必刷题 + 提前记忆卡片
// 记忆阶段只展示题库原始题干/选项/标准答案，不写入 answerHistory，不影响正确率和错题本。
(function () {
    const DAILY_PRACTICE_VERSION = 3;
    const MEMORY_STORE_KEY = "guowang-daily-memory-v1";

    let styleLink = document.querySelector('link[data-daily-practice-style]');
    if (!styleLink) {
        styleLink = document.createElement("link");
        styleLink.rel = "stylesheet";
        styleLink.dataset.dailyPracticeStyle = "true";
        document.head.appendChild(styleLink);
    }
    styleLink.href = "daily-practice.css?v=20260816-2";

    function initDailyPractice() {
        if (Number(window.__dailyPracticeVersion || 0) >= DAILY_PRACTICE_VERSION) return;
        window.__dailyPracticeVersion = DAILY_PRACTICE_VERSION;
        window.__dailyPracticeInstalled = true;

        let memoryQuestionIds = [];
        let memoryIndex = 0;
        let memoryAnswerShown = false;

        function safeParse(value, fallback) {
            try {
                return value ? JSON.parse(value) : fallback;
            } catch (error) {
                return fallback;
            }
        }

        function escapeHTML(value) {
            return String(value == null ? "" : value)
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");
        }

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

        function getQuestionById(id) {
            return questions.find(question => question.id === id);
        }

        function hasBeenAnswered(question) {
            return Boolean(answerHistory[question.id] && Number(answerHistory[question.id].attempts || 0) > 0);
        }

        function loadMemoryStore() {
            return safeParse(localStorage.getItem(MEMORY_STORE_KEY), {});
        }

        function saveMemoryStore(store) {
            localStorage.setItem(MEMORY_STORE_KEY, JSON.stringify(store || {}));
        }

        function getRememberedIds(dateString) {
            const store = loadMemoryStore();
            const entry = store[dateString];
            return new Set(entry && Array.isArray(entry.seen) ? entry.seen : []);
        }

        function markQuestionRemembered(dateString, questionId) {
            const store = loadMemoryStore();
            const current = store[dateString] && Array.isArray(store[dateString].seen)
                ? store[dateString].seen
                : [];
            const seen = new Set(current);
            seen.add(questionId);
            store[dateString] = {
                seen: [...seen],
                updatedAt: new Date().toISOString()
            };
            saveMemoryStore(store);
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
            const rememberedIds = getRememberedIds(today);
            const remembered = all.filter(question => rememberedIds.has(question.id));
            return {
                today,
                all,
                completed,
                remaining,
                remembered,
                rememberedIds,
                next: getNextPlannedDay(today)
            };
        }

        function startDailyPractice() {
            const state = getDailyState();
            if (!state.all.length) return;

            closeDailyMemoryCards();

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

        function getMemoryPanel() {
            let panel = document.getElementById("daily-memory-panel");
            if (panel) return panel;

            const dailyCard = document.getElementById("daily-practice-card");
            if (!dailyCard || !dailyCard.parentNode) return null;

            panel = document.createElement("section");
            panel.id = "daily-memory-panel";
            panel.className = "daily-memory-panel";
            panel.hidden = true;
            dailyCard.parentNode.insertBefore(panel, dailyCard.nextSibling);
            return panel;
        }

        function closeDailyMemoryCards() {
            const panel = document.getElementById("daily-memory-panel");
            if (panel) {
                panel.hidden = true;
                panel.innerHTML = "";
            }
            memoryQuestionIds = [];
            memoryIndex = 0;
            memoryAnswerShown = false;
        }

        function getCorrectAnswerText(question) {
            const keys = String(question.answer || "").split("").filter(Boolean);
            if (!keys.length) return "";
            return keys.map(key => {
                const option = question.options && question.options[key];
                return option ? `${key}. ${option}` : key;
            }).join("；");
        }

        function renderMemoryOptions(question) {
            const entries = Object.entries(question.options || {});
            if (!entries.length) return "";
            return `
                <div class="daily-memory-options">
                    ${entries.map(([key, value]) => `
                        <div class="daily-memory-option">
                            <span>${escapeHTML(key)}</span>
                            <p>${escapeHTML(value)}</p>
                        </div>
                    `).join("")}
                </div>
            `;
        }

        function renderDailyMemoryCard() {
            const panel = getMemoryPanel();
            if (!panel || !memoryQuestionIds.length) return;

            const state = getDailyState();
            const question = getQuestionById(memoryQuestionIds[memoryIndex]);
            if (!question) return;

            const total = memoryQuestionIds.length;
            const correctAnswerText = getCorrectAnswerText(question);
            const sourceNotes = [
                question.explanation && !String(question.explanation).includes("按2026题库标准答案判定")
                    ? question.explanation
                    : "",
                question.note || ""
            ].filter(Boolean);

            const answerHTML = memoryAnswerShown
                ? `
                    <div class="daily-memory-answer">
                        <div class="daily-memory-answer-label">标准答案</div>
                        <strong>${escapeHTML(correctAnswerText || question.answer || "")}</strong>
                        ${sourceNotes.length ? `
                            <div class="daily-memory-source-note">
                                ${sourceNotes.map(note => `<p>${escapeHTML(note)}</p>`).join("")}
                            </div>
                        ` : ""}
                    </div>
                `
                : `
                    <div class="daily-memory-answer daily-memory-answer-hidden">
                        先回忆答案，再点击下方“显示答案”。记忆阶段不会计入正确率。
                    </div>
                `;

            panel.hidden = false;
            panel.innerHTML = `
                <div class="daily-memory-head">
                    <div>
                        <div class="daily-practice-kicker">PREVIEW CARDS</div>
                        <h2>今日提前记忆</h2>
                        <p>先认识今天要考的记忆内容，再进入正式刷题。</p>
                    </div>
                    <button type="button" class="daily-memory-close" id="close-daily-memory" aria-label="关闭记忆卡">×</button>
                </div>

                <div class="daily-memory-status">
                    <span>记忆卡 ${memoryIndex + 1}/${total}</span>
                    <span>今日已看答案 ${state.remembered.length}/${state.all.length}</span>
                </div>

                <article class="daily-memory-card-inner">
                    <div class="daily-memory-meta">
                        ${question.topic ? `<span>${escapeHTML(question.topic)}</span>` : ""}
                        ${question.sourceId ? `<span>${escapeHTML(question.sourceId)}</span>` : ""}
                        <span>${question.type === "multiple" ? "多选题" : question.type === "judge" ? "判断题" : "单选题"}</span>
                    </div>
                    <h3>${escapeHTML(question.question)}</h3>
                    ${renderMemoryOptions(question)}
                    ${answerHTML}
                </article>

                <div class="daily-memory-footer">
                    <div class="daily-memory-left-actions">
                        <button type="button" class="daily-memory-secondary" id="memory-prev" ${memoryIndex === 0 ? "disabled" : ""}>上一张</button>
                    </div>
                    <div class="daily-memory-right-actions">
                        ${!memoryAnswerShown ? `
                            <button type="button" class="daily-memory-primary" id="memory-reveal">显示答案</button>
                        ` : memoryIndex < total - 1 ? `
                            <button type="button" class="daily-memory-primary" id="memory-next">下一张</button>
                        ` : `
                            <button type="button" class="daily-memory-secondary" id="memory-restart">从头再看</button>
                            <button type="button" class="daily-memory-primary" id="memory-start-practice">开始今日刷题</button>
                        `}
                    </div>
                </div>
            `;

            const closeButton = document.getElementById("close-daily-memory");
            if (closeButton) closeButton.addEventListener("click", closeDailyMemoryCards);

            const prev = document.getElementById("memory-prev");
            if (prev && !prev.disabled) {
                prev.addEventListener("click", () => {
                    memoryIndex -= 1;
                    memoryAnswerShown = state.rememberedIds.has(memoryQuestionIds[memoryIndex]);
                    renderDailyMemoryCard();
                });
            }

            const reveal = document.getElementById("memory-reveal");
            if (reveal) {
                reveal.addEventListener("click", () => {
                    markQuestionRemembered(state.today, question.id);
                    memoryAnswerShown = true;
                    renderDailyMemoryCard();
                    renderDailyPracticeCard();
                });
            }

            const next = document.getElementById("memory-next");
            if (next) {
                next.addEventListener("click", () => {
                    memoryIndex += 1;
                    const nextState = getDailyState();
                    memoryAnswerShown = nextState.rememberedIds.has(memoryQuestionIds[memoryIndex]);
                    renderDailyMemoryCard();
                });
            }

            const restart = document.getElementById("memory-restart");
            if (restart) {
                restart.addEventListener("click", () => {
                    memoryIndex = 0;
                    const restartState = getDailyState();
                    memoryAnswerShown = restartState.rememberedIds.has(memoryQuestionIds[0]);
                    renderDailyMemoryCard();
                });
            }

            const startPractice = document.getElementById("memory-start-practice");
            if (startPractice) startPractice.addEventListener("click", startDailyPractice);
        }

        function openDailyMemoryCards() {
            const state = getDailyState();
            if (!state.all.length) return;

            memoryQuestionIds = state.all.map(question => question.id);
            const firstUnseenIndex = memoryQuestionIds.findIndex(id => !state.rememberedIds.has(id));
            memoryIndex = firstUnseenIndex >= 0 ? firstUnseenIndex : 0;
            memoryAnswerShown = state.rememberedIds.has(memoryQuestionIds[memoryIndex]);
            renderDailyMemoryCard();

            const panel = document.getElementById("daily-memory-panel");
            if (panel) panel.scrollIntoView({ behavior: "smooth", block: "start" });
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
            const remembered = state.remembered.length;
            const practicePercent = Math.round((done / total) * 100);
            const memoryPercent = Math.round((remembered / total) * 100);
            const buttonText = state.remaining.length
                ? (done ? `继续今日任务 · ${state.remaining.length}题` : `开始今日${total}题`)
                : `重刷今日${total}题`;
            const memoryButtonText = remembered === total
                ? `复习今日记忆卡 · ${total}张`
                : `先记忆今日${total}题`;

            card.innerHTML = `
                <div class="daily-practice-copy">
                    <div class="daily-practice-kicker">DAILY PRACTICE</div>
                    <div class="daily-practice-title-row">
                        <h2>今日必刷题</h2>
                        <span class="daily-practice-count">刷题 ${done}/${total} · 记忆 ${remembered}/${total}</span>
                    </div>
                    <p>${formatCNDate(state.today)} · 先记忆，再正式作答；记忆卡不计正确率、不进入错题本。</p>
                    <div class="daily-dual-progress">
                        <div>
                            <span class="daily-progress-label">提前记忆</span>
                            <div class="daily-practice-progress daily-memory-progress"><span style="width:${memoryPercent}%"></span></div>
                        </div>
                        <div>
                            <span class="daily-progress-label">正式刷题</span>
                            <div class="daily-practice-progress"><span style="width:${practicePercent}%"></span></div>
                        </div>
                    </div>
                </div>
                <div class="daily-practice-actions">
                    <button type="button" class="daily-practice-button daily-practice-button-secondary" id="start-daily-memory">${memoryButtonText}</button>
                    <button type="button" class="daily-practice-button" id="start-daily-practice">${buttonText}</button>
                </div>
            `;

            const memoryButton = document.getElementById("start-daily-memory");
            if (memoryButton) memoryButton.addEventListener("click", openDailyMemoryCards);

            const practiceButton = document.getElementById("start-daily-practice");
            if (practiceButton) practiceButton.addEventListener("click", startDailyPractice);
        }

        // 每次正式答案记录后刷新今日刷题进度；记忆卡本身不会调用 recordAnswer。
        const originalRecordAnswer = window.recordAnswer;
        if (typeof originalRecordAnswer === "function" && !window.__dailyPracticeRecordWrappedV3) {
            window.__dailyPracticeRecordWrappedV3 = true;
            window.recordAnswer = function (...args) {
                const result = originalRecordAnswer.apply(this, args);
                renderDailyPracticeCard();
                return result;
            };
        }

        window.renderDailyPracticeCard = renderDailyPracticeCard;
        window.startDailyPractice = startDailyPractice;
        window.openDailyMemoryCards = openDailyMemoryCards;
        window.closeDailyMemoryCards = closeDailyMemoryCards;
        renderDailyPracticeCard();
    }

    if (document.readyState === "loading") {
        window.addEventListener("DOMContentLoaded", initDailyPractice, { once: true });
    } else {
        initDailyPractice();
    }
})();
