(function () {
    const originalRenderQuestionImage = window.renderQuestionImage;
    const originalRenderQuestion = window.renderQuestion;

    const directImages = {
        "da-ch1-009": "assets/da-original/image17.webp?v=20260816-1",
        "da-ch1-010": "assets/da-original/image17.webp?v=20260816-1"
    };

    function escapeAttr(value) {
        return String(value || "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }

    window.renderQuestionImage = function (question) {
        const direct = question && directImages[question.id];
        if (direct) {
            return `
                <div class="question-image-wrap question-image-wrap-hq question-image-wrap-direct">
                    <img
                        class="question-original-image question-original-image-hq"
                        src="${direct}"
                        alt="${escapeAttr(question.sourceId || question.question || "原题") }"
                    >
                </div>
            `;
        }

        const layout = window.DA_HQ_LAYOUT && window.DA_HQ_LAYOUT[question && question.id];

        if (layout) {
            const [spriteIndex, x, y, w, h, sheetW, sheetH] = layout;
            const sprite = window.DA_HQ_SPRITES && window.DA_HQ_SPRITES[String(spriteIndex)];

            if (!sprite) {
                return `
                    <div class="question-image-loading" data-hq-question="${escapeAttr(question.id)}">
                        高清原题加载中…
                    </div>
                `;
            }

            const displayWidth = String(spriteIndex) === "1"
                ? Math.round(w * 1.5)
                : Math.round(w);

            return `
                <div class="question-image-wrap question-image-wrap-hq">
                    <svg
                        class="question-original-svg question-original-svg-hq"
                        viewBox="${x} ${y} ${w} ${h}"
                        role="img"
                        aria-label="${escapeAttr(question.sourceId || question.question || "原题") }"
                        preserveAspectRatio="xMidYMid meet"
                        style="width:min(100%, ${displayWidth}px);height:auto;"
                    >
                        <image
                            href="${sprite}"
                            x="0"
                            y="0"
                            width="${sheetW}"
                            height="${sheetH}"
                            style="image-rendering:pixelated;"
                        ></image>
                    </svg>
                </div>
            `;
        }

        return typeof originalRenderQuestionImage === "function"
            ? originalRenderQuestionImage(question)
            : "";
    };

    window.renderQuestion = function () {
        if (typeof originalRenderQuestion !== "function") return;

        originalRenderQuestion();

        const question = window.currentReviewQuestions && window.currentReviewQuestions[window.currentQuestionIndex];
        if (!question || directImages[question.id]) return;

        const layout = window.DA_HQ_LAYOUT && window.DA_HQ_LAYOUT[question.id];
        if (!layout) return;

        const spriteIndex = String(layout[0]);
        const spriteReady = window.DA_HQ_SPRITES && window.DA_HQ_SPRITES[spriteIndex];
        if (spriteReady || !window.DA_HQ_READY) return;

        const renderedQuestionId = question.id;

        window.DA_HQ_READY.then(function () {
            const currentQuestion = window.currentReviewQuestions && window.currentReviewQuestions[window.currentQuestionIndex];
            if (currentQuestion && currentQuestion.id === renderedQuestionId) {
                window.renderQuestion();
            }
        }).catch(function (error) {
            console.error("高清资料分析题图加载失败：", error);
            const loading = document.querySelector(`.question-image-loading[data-hq-question="${CSS.escape(renderedQuestionId)}"]`);
            if (loading) {
                loading.textContent = "高清原题加载失败，请刷新页面重试。";
            }
        });
    };
})();