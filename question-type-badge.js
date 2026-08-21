// 刷题题型提示：把单选/多选从弱 metadata 升级为题干前的醒目标识。
(function () {
    if (window.__questionTypeBadgeInstalled) return;
    window.__questionTypeBadgeInstalled = true;

    function isMultiple(question) {
        if (!question || question.type === "short") return false;
        if (typeof questionIsMultiple === "function") return questionIsMultiple(question);
        return question.type === "multiple" || String(question.answer || "").length > 1;
    }

    function typeInfo(question) {
        if (!question) return null;
        if (question.type === "short") {
            return { key: "short", label: "填空题", hint: "请输入答案" };
        }
        if (question.type === "judge") {
            return { key: "judge", label: "判断题", hint: "请选择正确或错误" };
        }
        if (isMultiple(question)) {
            return { key: "multiple", label: "多选题", hint: "可选择多个选项" };
        }
        return { key: "single", label: "单选题", hint: "请选择 1 项" };
    }

    function decorate() {
        const question = Array.isArray(window.currentReviewQuestions)
            ? window.currentReviewQuestions[window.currentQuestionIndex]
            : (typeof currentReviewQuestions !== "undefined" ? currentReviewQuestions[currentQuestionIndex] : null);
        if (!question) return;

        const card = document.querySelector("#quiz-area .quiz-question-card");
        if (!card) return;

        // 原 metadata 里的题型文字不再重复显示。
        card.querySelectorAll(".question-meta span").forEach(node => {
            if (/^(单选题|多选题|判断题|填空题)$/.test((node.textContent || "").trim())) {
                node.classList.add("question-type-meta-hidden");
            }
        });

        card.querySelectorAll(".question-type-banner").forEach(node => node.remove());

        const info = typeInfo(question);
        if (!info) return;

        const banner = document.createElement("div");
        banner.className = `question-type-banner question-type-${info.key}`;
        banner.setAttribute("role", "note");
        banner.setAttribute("aria-label", `${info.label}，${info.hint}`);
        banner.innerHTML = `
            <span class="question-type-label">${info.label}</span>
            <span class="question-type-hint">${info.hint}</span>
        `;

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

            .question-type-banner {
                display: inline-flex;
                align-items: center;
                gap: 10px;
                margin: 2px 0 14px;
                padding: 7px 11px 7px 8px;
                border: 1px solid transparent;
                border-radius: 10px;
                line-height: 1;
            }

            .question-type-label {
                display: inline-flex;
                align-items: center;
                min-height: 27px;
                padding: 0 10px;
                border-radius: 7px;
                font-size: 14px;
                font-weight: 850;
                letter-spacing: .02em;
            }

            .question-type-hint {
                font-size: 12px;
                font-weight: 650;
            }

            .question-type-single {
                background: #eef6ff;
                border-color: #cddff2;
                color: #315d87;
            }
            .question-type-single .question-type-label {
                background: #dcecff;
                color: #174f83;
            }

            .question-type-multiple {
                background: #fff2e8;
                border-color: #f0c8aa;
                color: #8a4c1f;
            }
            .question-type-multiple .question-type-label {
                background: #ffd9bd;
                color: #7a3510;
            }

            .question-type-judge {
                background: #f2f0fb;
                border-color: #d8d2eb;
                color: #5c4d82;
            }
            .question-type-judge .question-type-label {
                background: #e4dff5;
                color: #4d3d78;
            }

            .question-type-short {
                background: #eef8f2;
                border-color: #cee4d5;
                color: #37694a;
            }
            .question-type-short .question-type-label {
                background: #dcefe3;
                color: #285c3b;
            }

            /* 多选题原来的普通文字提示保留功能但降低重复感。 */
            .question-type-multiple ~ .multiple-tip {
                margin-top: 8px;
            }

            @media (max-width: 600px) {
                .question-type-banner {
                    display: flex;
                    width: fit-content;
                    max-width: 100%;
                    gap: 8px;
                    margin-bottom: 12px;
                }
                .question-type-label {
                    font-size: 13px;
                }
                .question-type-hint {
                    font-size: 11.5px;
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
