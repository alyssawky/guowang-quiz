// 首页顶部：今日曲线 + 今日正式刷题 + 明日提前预习。
// v6：增加“正式答题前预习门槛”。如果昨天没有完整预习今天的新题，
// 今天点击必刷题时先补完未预习题，看过标准答案后自动进入正式答题。
(function () {
    const DAILY_PRACTICE_VERSION = 6;
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
        let memoryDate = null;
        let memoryMode = null; // tomorrow | today-gate

        function safeParse(value, fallback) {
            try { return value ? JSON.parse(value) : fallback; }
            catch (error) { return fallback; }
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
            return Array.isArray(questions)
                ? questions.filter(question => isRequiredBankQuestion(question) && question.unlockDate === dateString)
                : [];
        }

        function getQuestionById(id) {
            return Array.isArray(questions)
                ? questions.find(question => question.id === id) || null
                : null;
        }

        function hasBeenAnswered(question) {
            return Boolean(answerHistory?.[question.id] && Number(answerHistory[question.id].attempts || 0) > 0);
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
            if (!dateString || !questionId) return;
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
                (Array.isArray(questions) ? questions : [])
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

        function getCurveSummary() {
            if (typeof window.getBankTodayDuePool !== "function") return null;
            try { return window.getBankTodayDuePool(); }
            catch (error) { return null; }
        }

        function getDailyState() {
            const today = toLocalISO();
            const tomorrow = addLocalDays(today, 1);

            const practiceAll = getQuestionsForDate(today);
            const practiceCompleted = practiceAll.filter(hasBeenAnswered);
            const practiceRemaining = practiceAll.filter(question => !hasBeenAnswered(question));

            // 昨天的“明日预习”本质上已经写进今天这个日期的 seen 集合。
            // 因此今天只需检查 practiceAll 是否全部出现在 getRememberedIds(today) 中。
            const todayPreviewRememberedIds = getRememberedIds(today);
            const todayPreviewRemembered = practiceAll.filter(question => todayPreviewRememberedIds.has(question.id));
            const todayPreviewMissing = practiceAll.filter(question => !todayPreviewRememberedIds.has(question.id));

            const previewAll = getQuestionsForDate(tomorrow);
            const previewRememberedIds = getRememberedIds(tomorrow);
            const previewRemembered = previewAll.filter(question => previewRememberedIds.has(question.id));

            return {
                today,
                tomorrow,
                practiceAll,
                practiceCompleted,
                practiceRemaining,
                todayPreviewRemembered,
                todayPreviewRememberedIds,
                todayPreviewMissing,
                previewAll,
                previewRemembered,
                previewRememberedIds,
                curve: getCurveSummary(),
                next: getNextPlannedDay(today)
            };
        }

        function launchDailyPractice(state = getDailyState()) {
            if (!state.practiceAll.length) return;
            closeDailyMemoryCards();

            const sessionQuestions = state.practiceRemaining.length
                ? shuffleArray(state.practiceRemaining)
                : shuffleArray(state.practiceAll);
            const title = state.practiceRemaining.length
                ? "今日必刷题"
                : "今日必刷题 · 重刷";
            const sequenceText = state.practiceRemaining.length
                ? `${formatCNDate(state.today)} · 今日计划${state.practiceAll.length}题 · 剩余${state.practiceRemaining.length}题 · 已完成答题前预习`
                : `${formatCNDate(state.today)} · 今日${state.practiceAll.length}题已全部做过，本轮重新练习`;

            startQuestionSession(sessionQuestions, title, sequenceText);
            const chooser = document.getElementById("review-section-chooser");
            if (chooser) chooser.hidden = true;
        }

        function startDailyPractice() {
            const state = getDailyState();
            if (!state.practiceAll.length) return;

            // 只对“今天第一次正式完成这组题”设置预习门槛。
            // 如果仍有正式题未完成，且今天这组题还有任何一题没看过答案，先进入补预习。
            if (state.practiceRemaining.length && state.todayPreviewMissing.length) {
                openTodayPreviewGate(state);
                return;
            }

            launchDailyPractice(state);
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
            // 放在首页卡片之后；若曲线诊断条已经存在，预习面板会位于诊断条之前。
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
            memoryDate = null;
            memoryMode = null;
        }

        function getCorrectAnswerText(question) {
            const keys = String(question?.answer || "").split("").filter(Boolean);
            return keys.map(key => {
                const option = question.options && question.options[key];
                return option ? `${key}. ${option}` : key;
            }).join("；");
        }

        function renderMemoryOptions(question) {
            const entries = Object.entries(question.options || {});
            if (!entries.length) return "";
            return `<div class="daily-memory-options">${entries.map(([key, value]) => `
                <div class="daily-memory-option">
                    <span>${escapeHTML(key)}</span>
                    <p>${escapeHTML(value)}</p>
                </div>`).join("")}</div>`;
        }

        function memoryHeader() {
            if (memoryMode === "today-gate") {
                return {
                    kicker: "TODAY · PREVIEW GATE",
                    title: "今日补预习",
                    description: `${formatCNDate(memoryDate)} · 正式答题前先看完今天尚未预习的题干、选项和标准答案。完成后自动进入今日必刷题。`,
                    cardLabel: "补预习卡"
                };
            }
            return {
                kicker: "PREVIEW · ONE DAY EARLY",
                title: "明日提前预习",
                description: `${formatCNDate(memoryDate)} · 明天正式刷题，今天先记忆。`,
                cardLabel: "预习卡"
            };
        }

        function finishTodayPreviewGate() {
            const unseenIndex = memoryQuestionIds.findIndex(id => !getRememberedIds(memoryDate).has(id));
            if (unseenIndex >= 0) {
                memoryIndex = unseenIndex;
                memoryAnswerShown = false;
                renderDailyMemoryCard();
                return;
            }

            closeDailyMemoryCards();
            renderDailyPracticeCard();
            // 重新读取本地预习状态；此时 gate 已通过，直接进入正式答题。
            launchDailyPractice(getDailyState());
        }

        function renderDailyMemoryCard() {
            const panel = getMemoryPanel();
            if (!panel || !memoryQuestionIds.length) return;

            const question = getQuestionById(memoryQuestionIds[memoryIndex]);
            if (!question) return;

            const total = memoryQuestionIds.length;
            const header = memoryHeader();
            const seenSet = getRememberedIds(memoryDate);
            const seenCount = memoryQuestionIds.filter(id => seenSet.has(id)).length;
            const allSeen = memoryQuestionIds.every(id => seenSet.has(id));
            const correctAnswerText = getCorrectAnswerText(question);
            const sourceNotes = [
                question.explanation && !String(question.explanation).includes("按2026题库标准答案判定")
                    ? question.explanation
                    : "",
                question.note || ""
            ].filter(Boolean);

            const answerHTML = memoryAnswerShown
                ? `<div class="daily-memory-answer">
                    <div class="daily-memory-answer-label">标准答案</div>
                    <strong>${escapeHTML(correctAnswerText || question.answer || "")}</strong>
                    ${sourceNotes.length
                        ? `<div class="daily-memory-source-note">${sourceNotes.map(note => `<p>${escapeHTML(note)}</p>`).join("")}</div>`
                        : ""}
                   </div>`
                : `<div class="daily-memory-answer daily-memory-answer-hidden">先自己判断，再点击“显示答案”。预习阶段不计正确率，也不会进入错题本。</div>`;

            let finalActions = "";
            if (!memoryAnswerShown) {
                finalActions = `<button type="button" class="daily-memory-primary" id="memory-reveal">显示答案</button>`;
            } else if (memoryIndex < total - 1) {
                finalActions = `<button type="button" class="daily-memory-primary" id="memory-next">下一张</button>`;
            } else if (memoryMode === "today-gate") {
                finalActions = `<button type="button" class="daily-memory-primary" id="memory-close-finish">${allSeen ? "完成补预习并开始答题" : "继续完成预习"}</button>`;
            } else {
                finalActions = `<button type="button" class="daily-memory-secondary" id="memory-restart">从头再看</button><button type="button" class="daily-memory-primary" id="memory-close-finish">完成明日预习</button>`;
            }

            panel.hidden = false;
            panel.innerHTML = `
                <div class="daily-memory-head">
                    <div>
                        <div class="daily-practice-kicker">${header.kicker}</div>
                        <h2>${header.title}</h2>
                        <p>${header.description}</p>
                    </div>
                    <button type="button" class="daily-memory-close" id="close-daily-memory" aria-label="关闭预习卡">×</button>
                </div>
                <div class="daily-memory-status">
                    <span>${header.cardLabel} ${memoryIndex + 1}/${total}</span>
                    <span>已看答案 ${seenCount}/${total}</span>
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
                    <div class="daily-memory-right-actions">${finalActions}</div>
                </div>`;

            document.getElementById("close-daily-memory")?.addEventListener("click", () => {
                closeDailyMemoryCards();
                renderDailyPracticeCard();
            });

            const prev = document.getElementById("memory-prev");
            if (prev && !prev.disabled) {
                prev.addEventListener("click", () => {
                    memoryIndex -= 1;
                    memoryAnswerShown = false;
                    renderDailyMemoryCard();
                });
            }

            document.getElementById("memory-reveal")?.addEventListener("click", () => {
                markQuestionRemembered(memoryDate, question.id);
                memoryAnswerShown = true;
                renderDailyMemoryCard();
                renderDailyPracticeCard();
            });

            document.getElementById("memory-next")?.addEventListener("click", () => {
                memoryIndex += 1;
                memoryAnswerShown = false;
                renderDailyMemoryCard();
            });

            document.getElementById("memory-restart")?.addEventListener("click", () => {
                memoryIndex = 0;
                memoryAnswerShown = false;
                renderDailyMemoryCard();
            });

            document.getElementById("memory-close-finish")?.addEventListener("click", () => {
                if (memoryMode === "today-gate") {
                    finishTodayPreviewGate();
                } else {
                    closeDailyMemoryCards();
                    renderDailyPracticeCard();
                }
            });
        }

        function openPreviewMemoryCards() {
            const state = getDailyState();
            if (!state.previewAll.length) return;

            memoryMode = "tomorrow";
            memoryDate = state.tomorrow;
            memoryQuestionIds = state.previewAll.map(question => question.id);
            const firstUnseen = memoryQuestionIds.findIndex(id => !state.previewRememberedIds.has(id));
            memoryIndex = firstUnseen >= 0 ? firstUnseen : 0;
            memoryAnswerShown = false;
            renderDailyMemoryCard();
            document.getElementById("daily-memory-panel")?.scrollIntoView({ behavior: "smooth", block: "start" });
        }

        function openTodayPreviewGate(state = getDailyState()) {
            if (!state.practiceAll.length) return;

            // 只把“尚未预习”的题放进补预习会话；如果昨天完全没看，就是今天整组全部进入。
            const missing = state.todayPreviewMissing;
            if (!missing.length) {
                launchDailyPractice(state);
                return;
            }

            memoryMode = "today-gate";
            memoryDate = state.today;
            memoryQuestionIds = missing.map(question => question.id);
            memoryIndex = 0;
            memoryAnswerShown = false;
            renderDailyMemoryCard();
            document.getElementById("daily-memory-panel")?.scrollIntoView({ behavior: "smooth", block: "start" });
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
            const practiceRemaining = state.practiceRemaining.length;
            const todayPreviewDone = state.todayPreviewRemembered.length;
            const todayPreviewMissing = state.todayPreviewMissing.length;
            const previewTotal = state.previewAll.length;
            const previewDone = state.previewRemembered.length;
            const curveTotal = state.curve ? Number(state.curve.total || 0) : null;

            const practicePercent = practiceTotal ? Math.round((practiceDone / practiceTotal) * 100) : 0;
            const previewPercent = previewTotal ? Math.round((previewDone / previewTotal) * 100) : 0;

            const curveButtonText = curveTotal == null
                ? "今日曲线 · 计算中"
                : curveTotal > 0
                    ? `今日曲线 · 待刷${curveTotal}题`
                    : "今日曲线已完成";

            let practiceButtonText = "今日无新题";
            if (practiceTotal) {
                if (practiceRemaining && todayPreviewMissing) {
                    practiceButtonText = `先补预习 · ${todayPreviewMissing}题`;
                } else if (practiceRemaining) {
                    practiceButtonText = practiceDone
                        ? `继续今日任务 · ${practiceRemaining}题`
                        : `开始今日${practiceTotal}题`;
                } else {
                    practiceButtonText = `重刷今日${practiceTotal}题`;
                }
            }

            const previewButtonText = previewTotal
                ? (previewDone === previewTotal
                    ? `复习明日预习卡 · ${previewTotal}张`
                    : `预习明日${previewTotal}题`)
                : "明日无预习";

            const summaryBits = [
                curveTotal == null ? "今日曲线 计算中" : `今日曲线 ${curveTotal}题`,
                practiceTotal
                    ? `今日预习 ${todayPreviewDone}/${practiceTotal} · 刷题 ${practiceDone}/${practiceTotal}`
                    : "今日刷题 0",
                previewTotal ? `明日预习 ${previewDone}/${previewTotal}` : "明日预习 0"
            ];

            const curveDescription = curveTotal == null
                ? "今日曲线正在读取本地记忆计划。"
                : curveTotal > 0
                    ? `今天还有${curveTotal}道逾期、到期或重点复现题。`
                    : "今天的曲线任务已经完成。";

            const gateDescription = practiceTotal && practiceRemaining && todayPreviewMissing
                ? ` 今天的新题还有${todayPreviewMissing}道没有完成预习；点击必刷题后会先补预习，全部看过标准答案后再进入正式答题。`
                : practiceTotal
                    ? " 今天的新题预习门槛已通过。"
                    : " 今天没有新题任务。";

            const tomorrowDescription = previewTotal
                ? ` 明天${previewTotal}题可以提前预习。`
                : "";
            const nextText = !practiceTotal && !previewTotal && curveTotal === 0 && state.next
                ? ` 下一次正式刷题：${formatCNDate(state.next.date)} · ${state.next.count}题。`
                : "";

            card.innerHTML = `
                <div class="daily-practice-copy">
                    <div class="daily-practice-kicker">DAILY PRACTICE</div>
                    <div class="daily-practice-title-row">
                        <h2>国网每日记忆与刷题</h2>
                        <span class="daily-practice-count">${summaryBits.join(" · ")}</span>
                    </div>
                    <p>${curveDescription}${gateDescription}${tomorrowDescription}${nextText} 今日曲线和正式刷题计入答题记录；预习阶段不计正确率、不进入错题本。</p>
                    <div class="daily-dual-progress">
                        ${previewTotal ? `
                            <div>
                                <span class="daily-progress-label">明日提前预习</span>
                                <div class="daily-practice-progress daily-memory-progress"><span style="width:${previewPercent}%"></span></div>
                            </div>` : ""}
                        ${practiceTotal ? `
                            <div>
                                <span class="daily-progress-label">今日正式刷题</span>
                                <div class="daily-practice-progress"><span style="width:${practicePercent}%"></span></div>
                            </div>` : ""}
                    </div>
                </div>
                <div class="daily-practice-actions">
                    <button type="button" class="daily-practice-button daily-practice-button-secondary" id="start-cumulative-memory" ${curveTotal == null || curveTotal === 0 ? "disabled" : ""}>${curveButtonText}</button>
                    <button type="button" class="daily-practice-button daily-practice-button-secondary" id="start-daily-memory" ${previewTotal ? "" : "disabled"}>${previewButtonText}</button>
                    <button type="button" class="daily-practice-button" id="start-daily-practice" ${practiceTotal ? "" : "disabled"}>${practiceButtonText}</button>
                </div>`;

            // 今日曲线由唯一 bank-today-curve-controller.js 接管。
            const previewButton = document.getElementById("start-daily-memory");
            if (previewButton && !previewButton.disabled) {
                previewButton.addEventListener("click", openPreviewMemoryCards);
            }

            const practiceButton = document.getElementById("start-daily-practice");
            if (practiceButton && !practiceButton.disabled) {
                practiceButton.addEventListener("click", startDailyPractice);
            }

            if (typeof window.refreshBankTodayCurveButton === "function") {
                setTimeout(window.refreshBankTodayCurveButton, 0);
            }
            if (typeof window.__refreshBankCurveDiagnostics === "function") {
                setTimeout(window.__refreshBankCurveDiagnostics, 0);
            }
        }

        const originalRecordAnswer = window.recordAnswer;
        if (typeof originalRecordAnswer === "function" && !window.__dailyPracticeRecordWrappedV6) {
            window.__dailyPracticeRecordWrappedV6 = true;
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
        window.openTodayPreviewGate = openTodayPreviewGate;
        window.closeDailyMemoryCards = closeDailyMemoryCards;
        window.getDailyPracticeState = getDailyState;

        // 兼容旧调用名，但不再打开累计随机记忆卡；统一转入正式曲线。
        window.openCumulativeMemoryCards = function () {
            if (typeof window.startCurveQuiz === "function") window.startCurveQuiz();
        };

        renderDailyPracticeCard();
    }

    if (document.readyState === "loading") {
        window.addEventListener("DOMContentLoaded", initDailyPractice, { once: true });
    } else {
        initDailyPractice();
    }
})();
