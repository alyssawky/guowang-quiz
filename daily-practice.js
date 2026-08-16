// 首页顶部：今日正式刷题 + 累计记忆卡 + 明日提前预习
// 记忆阶段只展示题库原始题干/选项/标准答案，不写入 answerHistory，不影响正确率和错题本。
(function () {
    const DAILY_PRACTICE_VERSION = 4;
    const MEMORY_STORE_KEY = "guowang-daily-memory-v1";

    let styleLink = document.querySelector('link[data-daily-practice-style]');
    if (!styleLink) {
        styleLink = document.createElement("link");
        styleLink.rel = "stylesheet";
        styleLink.dataset.dailyPracticeStyle = "true";
        document.head.appendChild(styleLink);
    }
    styleLink.href = "daily-practice.css?v=20260816-3";

    function initDailyPractice() {
        if (Number(window.__dailyPracticeVersion || 0) >= DAILY_PRACTICE_VERSION) return;
        window.__dailyPracticeVersion = DAILY_PRACTICE_VERSION;
        window.__dailyPracticeInstalled = true;

        let memoryQuestionIds = [];
        let memoryIndex = 0;
        let memoryAnswerShown = false;
        let memoryMode = null;
        let memoryDate = null;

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

        function addLocalDays(dateString, days) {
            const date = typeof parseLocalDate === "function"
                ? parseLocalDate(dateString)
                : new Date(`${dateString}T00:00:00`);
            if (!date || Number.isNaN(date.getTime())) return dateString;
            date.setDate(date.getDate() + days);
            return toLocalISO(date);
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

        function getCumulativeMemoryPool(todayString) {
            return questions.filter(question =>
                isRequiredBankQuestion(question) && question.unlockDate < todayString
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
            if (!dateString) return;
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
            const date = typeof parseLocalDate === "function"
                ? parseLocalDate(dateString)
                : new Date(`${dateString}T00:00:00`);
            if (!date || Number.isNaN(date.getTime())) return dateString;
            const weekdays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
            return `${date.getMonth() + 1}月${date.getDate()}日 · ${weekdays[date.getDay()]}`;
        }

        function getDailyState() {
            const today = toLocalISO();
            const tomorrow = addLocalDays(today, 1);

            const practiceAll = getQuestionsForDate(today);
            const practiceCompleted = practiceAll.filter(hasBeenAnswered);
            const practiceRemaining = practiceAll.filter(question => !hasBeenAnswered(question));
            const cumulativePool = getCumulativeMemoryPool(today);

            const previewAll = getQuestionsForDate(tomorrow);
            const previewRememberedIds = getRememberedIds(tomorrow);
            const previewRemembered = previewAll.filter(question => previewRememberedIds.has(question.id));

            return {
                today,
                tomorrow,
                practiceAll,
                practiceCompleted,
                practiceRemaining,
                cumulativePool,
                previewAll,
                previewRemembered,
                previewRememberedIds,
                next: getNextPlannedDay(today)
            };
        }

        function startDailyPractice() {
            const state = getDailyState();
            if (!state.practiceAll.length) return;

            closeDailyMemoryCards();

            const sessionQuestions = state.practiceRemaining.length
                ? shuffleArray(state.practiceRemaining)
                : shuffleArray(state.practiceAll);

            const title = state.practiceRemaining.length
                ? "今日必刷题"
                : "今日必刷题 · 重刷";

            const sequenceText = state.practiceRemaining.length
                ? `${formatCNDate(state.today)} · 今日计划${state.practiceAll.length}题 · 剩余${state.practiceRemaining.length}题`
                : `${formatCNDate(state.today)} · 今日${state.practiceAll.length}题已全部做过，本轮重新练习`;

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
            memoryMode = null;
            memoryDate = null;
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

        function getMemoryHeader() {
            if (memoryMode === "preview") {
                return {
                    kicker: "PREVIEW · ONE DAY EARLY",
                    title: "明日提前预习",
                    description: `${formatCNDate(memoryDate)} · 明天正式刷题，今天先记忆。`
                };
            }

            return {
                kicker: "CUMULATIVE MEMORY",
                title: "累计记忆复习",
                description: "以前已经学过的国网题会持续累积进卡池，每次打开都会随机换顺序。"
            };
        }

        function renderDailyMemoryCard() {
            const panel = getMemoryPanel();
            if (!panel || !memoryQuestionIds.length) return;

            const question = getQuestionById(memoryQuestionIds[memoryIndex]);
            if (!question) return;

            const total = memoryQuestionIds.length;
            const header = getMemoryHeader();
            const correctAnswerText = getCorrectAnswerText(question);
            const sourceNotes = [
                question.explanation && !String(question.explanation).includes("按2026题库标准答案判定")
                    ? question.explanation
                    : "",
                question.note || ""
            ].filter(Boolean);

            const previewRemembered = memoryMode === "preview"
                ? memoryQuestionIds.filter(id => getRememberedIds(memoryDate).has(id)).length
                : 0;

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
                        先自己回忆，再点击“显示答案”。记忆阶段不会计入正确率，也不会进入错题本。
                    </div>
                `;

            panel.hidden = false;
            panel.innerHTML = `
                <div class="daily-memory-head">
                    <div>
                        <div class="daily-practice-kicker">${header.kicker}</div>
                        <h2>${header.title}</h2>
                        <p>${header.description}</p>
                    </div>
                    <button type="button" class="daily-memory-close" id="close-daily-memory" aria-label="关闭记忆卡">×</button>
                </div>

                <div class="daily-memory-status">
                    <span>${memoryMode === "preview" ? "预习卡" : "随机卡"} ${memoryIndex + 1}/${total}</span>
                    <span>${memoryMode === "preview" ? `已看答案 ${previewRemembered}/${total}` : `累计卡池 ${total} 题`}</span>
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
                        ` : memoryMode === "cumulative" ? `
                            <button type="button" class="daily-memory-secondary" id="memory-close-finish">结束本轮</button>
                            <button type="button" class="daily-memory-primary" id="memory-reshuffle">再随机一轮</button>
                        ` : `
                            <button type="button" class="daily-memory-secondary" id="memory-restart">从头再看</button>
                            <button type="button" class="daily-memory-primary" id="memory-close-finish">完成明日预习</button>
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
                    memoryAnswerShown = false;
                    renderDailyMemoryCard();
                });
            }

            const reveal = document.getElementById("memory-reveal");
            if (reveal) {
                reveal.addEventListener("click", () => {
                    if (memoryMode === "preview") markQuestionRemembered(memoryDate, question.id);
                    memoryAnswerShown = true;
                    renderDailyMemoryCard();
                    renderDailyPracticeCard();
                });
            }

            const next = document.getElementById("memory-next");
            if (next) {
                next.addEventListener("click", () => {
                    memoryIndex += 1;
                    memoryAnswerShown = false;
                    renderDailyMemoryCard();
                });
            }

            const restart = document.getElementById("memory-restart");
            if (restart) {
                restart.addEventListener("click", () => {
                    memoryIndex = 0;
                    memoryAnswerShown = false;
                    renderDailyMemoryCard();
                });
            }

            const reshuffle = document.getElementById("memory-reshuffle");
            if (reshuffle) {
                reshuffle.addEventListener("click", () => {
                    const state = getDailyState();
                    memoryQuestionIds = shuffleArray(state.cumulativePool).map(question => question.id);
                    memoryIndex = 0;
                    memoryAnswerShown = false;
                    renderDailyMemoryCard();
                });
            }

            const finish = document.getElementById("memory-close-finish");
            if (finish) finish.addEventListener("click", closeDailyMemoryCards);
        }

        function openCumulativeMemoryCards() {
            const state = getDailyState();
            if (!state.cumulativePool.length) return;

            memoryMode = "cumulative";
            memoryDate = null;
            memoryQuestionIds = shuffleArray(state.cumulativePool).map(question => question.id);
            memoryIndex = 0;
            memoryAnswerShown = false;
            renderDailyMemoryCard();

            const panel = document.getElementById("daily-memory-panel");
            if (panel) panel.scrollIntoView({ behavior: "smooth", block: "start" });
        }

        function openPreviewMemoryCards() {
            const state = getDailyState();
            if (!state.previewAll.length) return;

            memoryMode = "preview";
            memoryDate = state.tomorrow;
            memoryQuestionIds = state.previewAll.map(question => question.id);

            const firstUnseen = memoryQuestionIds.findIndex(id => !state.previewRememberedIds.has(id));
            memoryIndex = firstUnseen >= 0 ? firstUnseen : 0;
            memoryAnswerShown = false;
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
            const practiceTotal = state.practiceAll.length;
            const practiceDone = state.practiceCompleted.length;
            const cumulativeTotal = state.cumulativePool.length;
            const previewTotal = state.previewAll.length;
            const previewDone = state.previewRemembered.length;
            const practicePercent = practiceTotal ? Math.round((practiceDone / practiceTotal) * 100) : 0;
            const previewPercent = previewTotal ? Math.round((previewDone / previewTotal) * 100) : 0;

            if (!practiceTotal && !cumulativeTotal && !previewTotal) {
                const nextText = state.next
                    ? `下一次正式刷题：${formatCNDate(state.next.date)} · ${state.next.count}题。预习卡只会提前1天开放。`
                    : "本阶段每日必刷题已经全部安排完毕。";

                card.innerHTML = `
                    <div class="daily-practice-copy">
                        <div class="daily-practice-kicker">DAILY PRACTICE</div>
                        <div class="daily-practice-title-row">
                            <h2>国网每日记忆与刷题</h2>
                            <span class="daily-practice-count">当前无任务</span>
                        </div>
                        <p>${nextText}</p>
                    </div>
                    <button type="button" class="daily-practice-button" disabled>当前无任务</button>
                `;
                return;
            }

            const practiceButtonText = practiceTotal
                ? (state.practiceRemaining.length
                    ? (practiceDone ? `继续今日任务 · ${state.practiceRemaining.length}题` : `开始今日${practiceTotal}题`)
                    : `重刷今日${practiceTotal}题`)
                : "今日无新题";

            const previewButtonText = previewTotal
                ? (previewDone === previewTotal
                    ? `复习明日预习卡 · ${previewTotal}张`
                    : `预习明日${previewTotal}题`)
                : "明日无预习";

            const cumulativeButtonText = cumulativeTotal
                ? `随机复习累计${cumulativeTotal}题`
                : "暂无累计旧题";

            const summaryBits = [
                `累计记忆 ${cumulativeTotal}题`,
                practiceTotal ? `今日刷题 ${practiceDone}/${practiceTotal}` : "今日刷题 0",
                previewTotal ? `明日预习 ${previewDone}/${previewTotal}` : "明日预习 0"
            ];

            const description = [
                cumulativeTotal ? `旧题已累计${cumulativeTotal}题，可随时随机回忆。` : "目前还没有往日旧题进入累计卡池。",
                practiceTotal ? `今天正式刷${practiceTotal}题。` : "今天没有正式刷题任务。",
                previewTotal ? `明天${previewTotal}题已提前开放预习。` : "明天没有安排新题。"
            ].join(" ");

            card.innerHTML = `
                <div class="daily-practice-copy">
                    <div class="daily-practice-kicker">DAILY PRACTICE</div>
                    <div class="daily-practice-title-row">
                        <h2>国网每日记忆与刷题</h2>
                        <span class="daily-practice-count">${summaryBits.join(" · ")}</span>
                    </div>
                    <p>${description} 记忆卡不计正确率、不进入错题本。</p>
                    <div class="daily-dual-progress">
                        ${previewTotal ? `
                            <div>
                                <span class="daily-progress-label">明日提前预习</span>
                                <div class="daily-practice-progress daily-memory-progress"><span style="width:${previewPercent}%"></span></div>
                            </div>
                        ` : ""}
                        ${practiceTotal ? `
                            <div>
                                <span class="daily-progress-label">今日正式刷题</span>
                                <div class="daily-practice-progress"><span style="width:${practicePercent}%"></span></div>
                            </div>
                        ` : ""}
                    </div>
                </div>
                <div class="daily-practice-actions">
                    <button type="button" class="daily-practice-button daily-practice-button-secondary" id="start-cumulative-memory" ${cumulativeTotal ? "" : "disabled"}>${cumulativeButtonText}</button>
                    <button type="button" class="daily-practice-button daily-practice-button-secondary" id="start-daily-memory" ${previewTotal ? "" : "disabled"}>${previewButtonText}</button>
                    <button type="button" class="daily-practice-button" id="start-daily-practice" ${practiceTotal ? "" : "disabled"}>${practiceButtonText}</button>
                </div>
            `;

            const cumulativeButton = document.getElementById("start-cumulative-memory");
            if (cumulativeButton && !cumulativeButton.disabled) cumulativeButton.addEventListener("click", openCumulativeMemoryCards);

            const previewButton = document.getElementById("start-daily-memory");
            if (previewButton && !previewButton.disabled) previewButton.addEventListener("click", openPreviewMemoryCards);

            const practiceButton = document.getElementById("start-daily-practice");
            if (practiceButton && !practiceButton.disabled) practiceButton.addEventListener("click", startDailyPractice);
        }

        const originalRecordAnswer = window.recordAnswer;
        if (typeof originalRecordAnswer === "function" && !window.__dailyPracticeRecordWrappedV4) {
            window.__dailyPracticeRecordWrappedV4 = true;
            window.recordAnswer = function (...args) {
                const result = originalRecordAnswer.apply(this, args);
                renderDailyPracticeCard();
                return result;
            };
        }

        window.renderDailyPracticeCard = renderDailyPracticeCard;
        window.startDailyPractice = startDailyPractice;
        window.openDailyMemoryCards = openPreviewMemoryCards;
        window.openPreviewMemoryCards = openPreviewMemoryCards;
        window.openCumulativeMemoryCards = openCumulativeMemoryCards;
        window.closeDailyMemoryCards = closeDailyMemoryCards;
        renderDailyPracticeCard();
    }

    if (document.readyState === "loading") {
        window.addEventListener("DOMContentLoaded", initDailyPractice, { once: true });
    } else {
        initDailyPractice();
    }
})();
