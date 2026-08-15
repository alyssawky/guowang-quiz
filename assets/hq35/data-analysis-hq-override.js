(function () {
    const originalRenderQuestionImage = window.renderQuestionImage;
    const originalRenderQuestion = window.renderQuestion;

    function escapeAttr(value) {
        return String(value || "")
            .replace(/&/g, "&amp;")
            .replace(/"/g, "&quot;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
    }

    window.renderQuestionImage = function (question) {
        // 第一章正式题已经改为“文字题干 + 文字选项”为主。
        // textOnly 题目完全跳过旧 sprite，避免任何空白图片框影响作答。
        if (question && question.textOnly) {
            return "";
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
                ? Math.min(640, Math.round(w * 1.34))
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
                            style="image-rendering:auto;"
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
        if (!question || question.textOnly) return;

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
            const escapedId = window.CSS && CSS.escape
                ? CSS.escape(renderedQuestionId)
                : renderedQuestionId.replace(/"/g, "\\\"");
            const loading = document.querySelector(`.question-image-loading[data-hq-question="${escapedId}"]`);
            if (loading) {
                loading.textContent = "高清原题加载失败，请刷新页面重试。";
            }
        });
    };
})();
