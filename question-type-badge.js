// 刷题题型提示：只保留“单选题 / 多选题”醒目标识，并使用网站统一的黑灰色系。
(function () {
    if (window.__questionTypeBadgeInstalled) return;
    window.__questionTypeBadgeInstalled = true;

    function isMultiple(question) {
        if (!question || question.type === "short") return false;
        if (typeof questionIsMultiple === "function") return questionIsMultiple(question);
        return question.type === "multiple" || String(question.answer || "").length > 1;
    }

    function typeInfo(question) {
        if (!question || question.type === "short" || question.type === "judge") return null;
        return isMultiple(question)
            ? { key: "multiple", label: "多选题" }
            : { key: "single", label: "单选题" };
    }

    function decorate() {
        const question = Array.isArray(window.currentReviewQuestions)
            ? window.currentReviewQuestions[window.currentQuestionIndex]
            : (typeof currentReviewQuestions !== "undefined" ? currentReviewQuestions[currentQuestionIndex] : null);
        if (!question) return;

        const card = document.querySelector("#quiz-area .quiz-question-card");
        if (!card) return;

        // 单选/多选改由题干前的独立标签显示，metadata 中不重复。
        card.querySelectorAll(".question-meta span").forEach(node => {
            if (/^(单选题|多选题)$/.test((node.textContent || "").trim())) {
                node.classList.add("question-type-meta-hidden");
            }
        });

        card.querySelectorAll(".question-type-banner").forEach(node => node.remove());

        const info = typeInfo(question);
        if (!info) return;

        const banner = document.createElement("div");
        banner.className = `question-type-banner question-type-${info.key}`;
        banner.setAttribute("role", "note");
        banner.setAttribute("aria-label", info.label);
        banner.innerHTML = `<span class="question-type-label">${info.label}</span>`;

        const progress = card.querySelector(".question-progress");
        if (progress) {
            progress.insertAdjacentElement("afterend", banner);
        } else {
            const title = card.querySelector(".question-title");
            if (title) title.insertAdjacentElement("beforebegin", banner);
        }
    }

    function installStyles() {
        if (document.getElementById("question-type-badge-style")) return;
        const style = document.createElement("style");
        style.id = "question-type-badge-style";
        style.textContent = `
            .question-type-meta-hidden {
                display: none !important;
            }

            /* 原多选解释文字不再显示，避免在答题时形成额外视觉干扰。 */
            .multiple-tip {
                display: none !important;
            }

            .question-type-banner {
                display: inline-flex;
                align-items: center;
                width: fit-content;
                margin: 2px 0 13px;
                line-height: 1;
            }

            .question-type-label {
                display: inline-flex;
                align-items: center;
                min-height: 27px;
                padding: 0 10px;
                border: 1px solid #dedee2;
                border-radius: 7px;
                font-size: 13px;
                font-weight: 750;
                letter-spacing: .02em;
            }

            /* 单选：沿用网站浅灰状态标签。 */
            .question-type-single .question-type-label {
                background: #f0f0f2;
                border-color: #e2e2e5;
                color: #5f6065;
            }

            /* 多选：沿用网站主按钮的深色系，明显但不跳脱。 */
            .question-type-multiple .question-type-label {
                background: #1d1d1f;
                border-color: #1d1d1f;
                color: #ffffff;
            }

            @media (max-width: 600px) {
                .question-type-banner {
                    margin-bottom: 12px;
                }
                .question-type-label {
                    min-height: 26px;
                    padding: 0 9px;
                    font-size: 12.5px;
                }
            }
        `;
        document.head.appendChild(style);
    }

    installStyles();

    const baseRenderQuestion = window.renderQuestion;
    if (typeof baseRenderQuestion === "function") {
        window.renderQuestion = function (...args) {
            const result = baseRenderQuestion.apply(this, args);
            decorate();
            return result;
        };
    }

    decorate();
})();
